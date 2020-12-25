use crate::service::*;
use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::{get, post, web, HttpResponse};
use calamine::{open_workbook, Reader, Xlsx};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use xlsxwriter::*;

#[derive(Deserialize, Serialize)]
pub struct Product {
    pub data: String,
}

///获取商品
#[post("/fetch_product")]
pub async fn fetch_product(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();

        let fields = get_fields(db.clone(), "商品规格").await;

        let mut sql_fields = r#"SELECT id,"#.to_owned();

        for f in &fields {
            sql_fields += &format!("{},", &*f.field_name);
        }

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号, COALESCE(库存, '0') as 库存 FROM products 
            left join (select 商品id, sum(数量) as 库存 from document_items group by 商品id) as foo
            on products.id=foo.商品id
            WHERE products.商品id='{}' AND 
            LOWER(规格型号) LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields, post_data.sort, post_data.id, name, post_data.sort, skip, post_data.rec
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        //这部分是取自 build_string_from_base（），但由于需加入库存，不能使用原函数
        let mut products = Vec::new();
        for row in rows {
            let mut product = "".to_owned();
            let num: i32 = row.get("id"); //字段顺序已与前端配合一致，后台不可自行更改
            product += &format!("{}{}", num, SPLITER);
            let num: i64 = row.get("序号");
            product += &format!("{}{}", num, SPLITER);
            product += &simple_string_from_base(row, &fields);
            let stock: f32 = row.get("库存");
            product += &format!("{}{}", stock, SPLITER);
            products.push(product);
        }

        let rows = &conn
            .query(
                r#"SELECT count(id) as 记录数 FROM products WHERE 商品id=$1 AND LOWER(规格型号) LIKE '%' || $2 || '%'"#,
                &[&post_data.id, &name],
            )
            .await
            .unwrap();

        let mut count: i64 = 0;
        for row in rows {
            count = row.get("记录数");
        }
        let pages = (count as f64 / post_data.rec as f64).ceil() as i32;
        HttpResponse::Ok().json((products, count, pages))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///编辑更新产品
#[post("/update_product")]
pub async fn update_product(
    db: web::Data<Pool>,
    p: web::Json<Product>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_fields(db.clone(), "商品规格").await;

        let product: Vec<&str> = p.data.split(SPLITER).collect();
        let init = r#"UPDATE products SET "#.to_owned();

        let mut sql = build_sql_for_update(product.clone(), init, fields, 2);

        sql += &format!(r#"商品id='{}' WHERE id={}"#, product[1], product[0]);

        &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///编辑更新产品
#[post("/add_product")]
pub async fn add_product(db: web::Data<Pool>, p: web::Json<Product>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_fields(db.clone(), "商品规格").await;
        let mut init = r#"INSERT INTO products ("#.to_owned();

        for f in &fields {
            init += &format!("{},", &*f.field_name);
        }

        init += r#"商品id) VALUES("#;

        let product: Vec<&str> = p.data.split(SPLITER).collect();
        let mut sql = build_sql_for_insert(product.clone(), init, fields, 2);

        sql += &format!("'{}')", product[1]);

        &conn.query(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct Message {
    id: i32,
    label: String,
}

//自动完成
#[get("/product_auto")]
pub async fn product_auto(
    db: web::Data<Pool>,
    search: web::Query<SearchCate>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let sql = &format!(
            r#"SELECT id, 规格型号 AS label FROM products 
               WHERE 商品id='{}' AND LOWER(规格型号) LIKE '%{}%' LIMIT 10"#,
            search.cate,
            search.s.to_lowercase()
        );

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct ProductName {
    id: String,
    name: String,
}

//导出数据
#[post("/product_out")]
pub async fn product_out(
    db: web::Data<Pool>,
    product: web::Json<ProductName>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "导出数据".to_owned()).await;
    if user.name != "" {
        let fields = get_fields(db.clone(), "商品规格").await;

        let file_name = format!("./download/{}.xlsx", product.name);
        let wb = Workbook::new(&file_name);
        let mut sheet = wb.add_worksheet(Some("数据")).unwrap();

        let format1 = wb
            .add_format()
            .set_align(FormatAlignment::CenterAcross)
            .set_bold(); //设置格式：居中，加粗

        let format2 = wb.add_format().set_align(FormatAlignment::CenterAcross);

        //设置列宽
        sheet.set_column(0, 0, 8.0, None).unwrap();
        sheet.set_column(1, 1, 12.0, None).unwrap();

        sheet.write_string(0, 0, "编号", Some(&format1)).unwrap();
        sheet.write_string(0, 1, "商品id", Some(&format1)).unwrap();

        let mut n = 2;
        for f in &fields {
            sheet
                .write_string(0, n, &f.show_name, Some(&format1))
                .unwrap();
            sheet
                .set_column(n, n, (f.show_width * 2.5).into(), None)
                .unwrap();

            n += 1;
        }

        let init = r#"SELECT id as 编号,"#.to_owned();
        let mut sql = build_sql_for_excel(init, &fields);

        sql += &format!(
            r#"商品id FROM products WHERE 商品id='{}' ORDER BY 规格型号"#,
            product.id
        );

        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut n = 1u32;
        for row in rows {
            let id: i32 = row.get("编号");
            sheet.write_number(n, 0, id as f64, Some(&format2)).unwrap();
            sheet
                .write_string(n, 1, row.get("商品id"), Some(&format2))
                .unwrap();

            let mut m = 2u16;
            for f in &fields {
                if f.data_type == "布尔" {
                    sheet
                        .write_string(n, m, row.get(&*f.field_name), Some(&format2))
                        .unwrap();
                } else {
                    sheet
                        .write_string(n, m, row.get(&*f.field_name), None)
                        .unwrap();
                }

                m += 1;
            }

            n += 1;
        }

        wb.close().unwrap();
        HttpResponse::Ok().json(product.name.clone())
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量导入、批量更新返回数据
#[post("/product_in")]
pub async fn product_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let path = save_file(payload).await.unwrap();

        let mut p_id = "".to_owned(); //商品ID
        let mut total_rows = 0;
        let fields = get_fields(db.clone(), "商品规格").await;
        let mut records = Vec::new();
        let mut excel: Xlsx<_> = open_workbook(path).unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let mut num = 1;
            let total_coloum = r.get_size().1;
            total_rows = r.get_size().0 - 1;

            if total_coloum - 2 != fields.len() {
                return HttpResponse::Ok().json(-2);
            }

            if total_rows > 0 {
                p_id = format!("{}", r[(1, 1)]); //r[] 实现了 Display trait, 可以通过 format! 将其转换成字符串

                //制作表头数据
                let mut rec = "".to_owned();
                rec += &format!("{}{}", "编号", SPLITER);
                rec += &format!("{}{}", "商品id", SPLITER);
                for f in &fields {
                    rec += &format!("{}{}", &*f.show_name, SPLITER);
                }

                records.push(rec);

                for j in 0..total_rows {
                    let mut rec = "".to_owned();
                    for i in 0..total_coloum {
                        rec += &format!("{}{}", r[(j + 1, i)], SPLITER);
                    }

                    records.push(rec);

                    num += 1;
                    if num == 50 {
                        break;
                    }
                }

                let conn = db.get().await.unwrap();
                let rows = &conn
                    .query(r#"SELECT node_name FROM tree WHERE num=$1"#, &[&p_id])
                    .await
                    .unwrap();

                for row in rows {
                    p_id = row.get("node_name");
                }
            }
        }
        HttpResponse::Ok().json((records, p_id, total_rows))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量导入数据写库
#[post("/product_datain")]
pub async fn product_datain(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let mut excel: Xlsx<_> = open_workbook("./upload/upload_in.xlsx").unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let fields = get_fields(db.clone(), "商品规格").await;
            let conn = db.get().await.unwrap();

            let total_rows = r.get_size().0 - 1;

            if total_rows > 0 {
                let mut init = r#"INSERT INTO products ("#.to_owned();

                for f in &fields {
                    init += &format!("{},", &*f.field_name);
                }

                init += r#"商品id) VALUES("#;

                for j in 0..total_rows {
                    let mut sql = init.clone();

                    for i in 0..fields.len() {
                        if fields[i].data_type == "文本" {
                            sql += &format!("'{}',", r[(j + 1, i + 2)]);
                        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数"
                        {
                            sql += &format!("{},", r[(j + 1, i + 2)]);
                        } else {
                            let op: Vec<&str> = fields[i].option_value.split("_").collect();
                            let val = if format!("{}", r[(j + 1, i + 2)]) == op[0] {
                                true
                            } else {
                                false
                            };
                            sql += &format!("{},", val);
                        }
                    }

                    sql += &format!("'{}')", r[(j + 1, 1)]);

                    &conn.query(sql.as_str(), &[]).await.unwrap();
                }
            }
        }
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量更新数据写库
#[post("/product_updatein")]
pub async fn product_updatein(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let mut excel: Xlsx<_> = open_workbook("./upload/upload_in.xlsx").unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let fields = get_fields(db.clone(), "商品规格").await;
            let conn = db.get().await.unwrap();
            let total_rows = r.get_size().0 - 1;

            if total_rows > 0 {
                for j in 0..total_rows {
                    let mut sql = r#"UPDATE products SET "#.to_owned();

                    for i in 0..fields.len() {
                        if fields[i].data_type == "文本" {
                            sql += &format!("{}='{}',", fields[i].field_name, r[(j + 1, i + 2)]);
                        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数"
                        {
                            sql += &format!("{}={},", fields[i].field_name, r[(j + 1, i + 2)]);
                        } else {
                            let op: Vec<&str> = fields[i].option_value.split("_").collect();
                            let val = if format!("{}", r[(j + 1, i + 2)]) == op[0] {
                                true
                            } else {
                                false
                            };
                            sql += &format!("{}={},", fields[i].field_name, val);
                        }
                    }

                    sql = sql.trim_end_matches(',').to_owned();
                    sql += &format!(r#" WHERE id={}"#, r[(j + 1, 0)]);

                    &conn.query(sql.as_str(), &[]).await.unwrap();
                }
            }
        }
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
