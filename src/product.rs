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
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let f_map = map_fields(db.clone(), "商品规格").await;
        // 区域限制
        let mut area = "".to_owned();
        let mut done = "".to_owned();
        if !user.rights.contains("跨区查库存") {
            area = format!(r#"AND {}='{}'"#, f_map["区域"], user.area);
        }
        if post_data.cate == "销售单据" {
            done = format!("AND {}='否'", f_map["切完"]);
        }
        // 构建搜索字符串
        let mut conditions = "".to_owned();
        if post_data.name != "" {
            let post = post_data.name.to_lowercase();
            let name: Vec<&str> = post.split(" ").collect();
            for na in name {
                conditions += &format!(
                    r#"AND (LOWER({}) LIKE '%{}%' OR LOWER({}) LIKE '%{}%' OR LOWER({}) LIKE '%{}%' OR LOWER({}) LIKE '%{}%'
                       OR LOWER({}) LIKE '%{}%' OR LOWER({}) LIKE '%{}%' OR LOWER({}) LIKE '%{}%' OR LOWER({}) LIKE '%{}%'
                       OR LOWER({}) LIKE '%{}%' OR LOWER({}) LIKE '%{}%')
                    "#,
                    f_map["物料号"], na, f_map["规格"], na, f_map["状态"], na, f_map["执行标准"], na, f_map["生产厂家"], na,
                    f_map["炉号"], na, f_map["库位"], na, f_map["区域"], na, f_map["切完"], na, f_map["备注"], na,
                );
            }
        }

        let fields = get_fields(db.clone(), "商品规格").await;

        let sql_fields = "SELECT 文本字段1 as id, 文本字段1, 规格型号,文本字段2,文本字段3,文本字段5,文本字段4,出售价格,整数字段1, 
                            (COALESCE(切分次数,0) + 整数字段2)::integer as 整数字段2,
                            (整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*3)::integer as 整数字段3,
                            round((库存下限-COALESCE(理重合计,0))::numeric,2)::real as 库存下限,
                            文本字段8,库位,文本字段6,文本字段7,备注,".to_owned();

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM products             
            LEFT JOIN cut_length() as foo
            ON products.文本字段1 = foo.物料号
            WHERE products.商品id='{}' {} {} {} 
            ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields, post_data.sort, post_data.id, done, area, conditions, post_data.sort, skip, post_data.rec
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let products = build_string_from_base(rows, fields);

        let sql2 = format!(
            r#"SELECT count(文本字段1) as 记录数 FROM products WHERE 商品id='{}' {} {}"#,
            post_data.id, area, conditions
        );

        let rows = &conn.query(sql2.as_str(), &[]).await.unwrap();

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
    let user = get_user(db.clone(), id, "库存设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_fields(db.clone(), "商品规格").await;

        let product: Vec<&str> = p.data.split(SPLITER).collect();
        let init = r#"UPDATE products SET "#.to_owned();

        let mut sql = build_sql_for_update(product.clone(), init, fields, 2);

        sql += &format!(
            r#"商品id='{}' WHERE 文本字段1='{}'"#,
            product[1], product[0]
        );

        let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///编辑更新产品
#[post("/add_product")]
pub async fn add_product(db: web::Data<Pool>, p: web::Json<Product>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "库存设置".to_owned()).await;
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

        let _ = &conn.query(sql.as_str(), &[]).await.unwrap();

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

        // sheet.write_string(0, 0, "商品id", Some(&format1)).unwrap();

        let mut n = 0;
        for f in &fields {
            sheet
                .write_string(0, n, &f.show_name, Some(&format1))
                .unwrap();
            sheet
                .set_column(n, n, (f.show_width * 2.5).into(), None)
                .unwrap();

            n += 1;
        }

        let init = r#"SELECT "#.to_owned();
        let mut sql = build_sql_for_excel(init, &fields);

        sql += &format!(
            r#"1 FROM products WHERE 商品id='{}' ORDER BY 规格型号"#,     //此处的 1 仅为配合前面自动生成最后的逗号, 无其他意义
            product.id
        );

        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut n = 1u32;
        for row in rows {
            let mut m = 0u16;
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

//批量导入、批量更新返回数据表，展示给用户确认
#[post("/product_in")]
pub async fn product_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let path = save_file(payload).await.unwrap();

        let mut total_rows = 0;
        let fields = get_fields(db.clone(), "商品规格").await;
        let mut records = Vec::new();
        let mut excel: Xlsx<_> = open_workbook(path).unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let mut num = 1;
            let total_coloum = r.get_size().1;
            total_rows = r.get_size().0 - 1;
            if total_coloum != fields.len() {
                return HttpResponse::Ok().json(-2);
            }

            if total_rows > 0 {
                //制作表头数据
                let mut rec = "".to_owned();
                // rec += &format!("{}{}", "商品id", SPLITER);
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
            }
        }
        HttpResponse::Ok().json((records, total_rows))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量导入数据写库。在用户确认提交后，将数据写入数据库
#[post("/product_datain")]
pub async fn product_datain(db: web::Data<Pool>, p_id: String, id: Identity) -> HttpResponse {
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

                init += r#"商品id, 单号id) VALUES("#;         // 单号id 是与 documents 单据库的“单号”关联的外键，需有值。这里的值是初始建库时，
                // 手工 insert into 的单号，所有的数据导入，均以此单号为键
                for j in 0..total_rows {
                    let mut sql = init.clone();

                    for i in 0..fields.len() {
                        if fields[i].data_type == "文本" {
                            sql += &format!("'{}',", r[(j + 1, i)]);
                        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数"
                        {
                            let num = format!("{}", r[(j + 1, i)]);
                            if num != "" {
                                sql += &format!("{},", num);
                            } else {
                                sql += &format!("{},", "0");
                            }
                        } else {
                            let op: Vec<&str> = fields[i].option_value.split("_").collect();
                            let val = if format!("{}", r[(j + 1, i)]) == op[0] {
                                true
                            } else {
                                false
                            };
                            sql += &format!("{},", val);
                        }
                    }

                    sql += &format!("'{}','{}')", p_id, "KT202312-01");    // 这个单号id 是初始建库时手动 insert into documents 中的，
                    let _ = &conn.query(sql.as_str(), &[]).await.unwrap();
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
                            sql += &format!("{}='{}',", fields[i].field_name, r[(j + 1, i)]);
                            // 把第一列 商品id 略过, 所以 i + 1
                        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数"
                        {
                            sql += &format!("{}={},", fields[i].field_name, r[(j + 1, i)]);
                        } else {
                            let op: Vec<&str> = fields[i].option_value.split("_").collect();
                            let val = if format!("{}", r[(j + 1, i)]) == op[0] {
                                true
                            } else {
                                false
                            };
                            sql += &format!("{}={},", fields[i].field_name, val);
                        }
                    }

                    sql = sql.trim_end_matches(',').to_owned();
                    sql += &format!(r#" WHERE 文本字段1='{}'"#, r[(j + 1, 0)]);

                    let _ = &conn.query(sql.as_str(), &[]).await.unwrap();
                }
            }
        }
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
struct PoutItem {
    dh: String,
    cate: String,
    date: String,
    long: i32,
    all_long: i32,
    num: i32,
    weight: f32,
    note: String,
}

///获取物料出库明细
#[post("/fetch_pout_items")]
pub async fn fetch_pout_items(db: web::Data<Pool>, data: String, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();


        let sql = format!("select 单号id, 类别, 日期, 长度, 数量, 长度*数量 as 总长, 重量, pout_items.备注 from pout_items
                                join documents on 单号 = 单号id
                                where 物料号 = '{}' order by 单号id desc", data);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut date = Vec::new();
        for row in rows {
            let da = PoutItem {
                dh: row.get("单号id"),
                cate: row.get("类别"),
                date: row.get("日期"),
                long: row.get("长度"),
                all_long: row.get("总长"),
                num: row.get("数量"),
                weight: row.get("重量"),
                note: row.get("备注"),
            };
            date.push(da);
        }

        HttpResponse::Ok().json(date)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
