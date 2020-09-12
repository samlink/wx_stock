use crate::service::{get_user, save_file};
use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::{get, post, web, HttpResponse};
use calamine::{open_workbook, Reader, Xlsx};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use xlsxwriter::*;

#[derive(Deserialize, Serialize)]
pub struct FrontData {
    pub id: String,
    pub name: String,
    pub page: i32,
    pub sort: String,
    pub rec: i32,
}

#[derive(Deserialize, Serialize)]
pub struct Product {
    pub data: String,
}

///获取商品
#[post("/fetch_product")]
pub async fn fetch_product(
    db: web::Data<Pool>,
    post_data: web::Json<FrontData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();

        let fields = get_fields(db.clone()).await;

        let mut sql_fields = r#"SELECT "ID","#.to_owned();

        for f in &fields {
            sql_fields += &format!("{},", &*f.0);
        }

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM products WHERE "商品ID"='{}' AND 
            LOWER(规格型号) LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields, post_data.sort, post_data.id, name, post_data.sort, skip, post_data.rec
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();
        let split = "<`*_*`>";
        for row in rows {
            let mut product = "".to_owned();
            let num: i32 = row.get("ID");
            product += &format!("{}{}", num, split);
            let num: i64 = row.get("序号");
            product += &format!("{}{}", num, split);

            for f in &fields {
                if f.2 == "文本" {
                    let s: String = row.get(&*f.0);
                    product += &format!("{}{}", s, split);
                } else if f.2 == "整数" {
                    let num: i32 = row.get(&*f.0);
                    product += &format!("{}{}", num, split);
                } else if f.2 == "实数" {
                    let num: f32 = row.get(&*f.0);
                    product += &format!("{}{}", num, split);
                } else {
                    let op: Vec<&str> = f.3.split("_").collect();
                    let b: bool = row.get(&*f.0);
                    let val = if b == true { op[0] } else { op[1] };
                    product += &format!("{}{}", val, split);
                }
            }

            products.push(product);
        }

        let rows = &conn
            .query(
                r#"SELECT count("ID") as 记录数 FROM products WHERE "商品ID"=$1 AND LOWER(规格型号) LIKE '%' || $2 || '%'"#,
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
        let fields = get_fields(db.clone()).await;

        let product: Vec<&str> = p.data.split("<`*_*`>").collect();
        let mut sql = r#"UPDATE products SET "#.to_owned();

        for i in 0..fields.len() {
            if fields[i].2 == "文本" {
                sql += &format!("{}='{}',", fields[i].0, product[i + 2]);
            } else if fields[i].2 == "实数" || fields[i].2 == "整数" {
                sql += &format!("{}={},", fields[i].0, product[i + 2]);
            } else {
                let op: Vec<&str> = fields[i].3.split("_").collect();
                let val = if product[i + 2] == op[0] { true } else { false };
                sql += &format!("{}={},", fields[i].0, val);
            }
        }

        sql += &format!(r#""商品ID"='{}' WHERE "ID"={}"#, product[1], product[0]);

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
        let fields = get_fields(db.clone()).await;
        let mut sql = r#"INSERT INTO products ("#.to_owned();

        for f in &fields {
            sql += &format!("{},", &*f.0);
        }

        sql += r#""商品ID") VALUES("#;

        let product: Vec<&str> = p.data.split("<`*_*`>").collect();

        for i in 0..fields.len() {
            if fields[i].2 == "文本" {
                sql += &format!("'{}',", product[i + 2]);
            } else if fields[i].2 == "实数" || fields[i].2 == "整数" {
                sql += &format!("{},", product[i + 2]);
            } else {
                let op: Vec<&str> = fields[i].3.split("_").collect();
                let val = if product[i + 2] == op[0] { true } else { false };
                sql += &format!("{},", val);
            }
        }

        sql += &format!("'{}')", product[1]);

        &conn.query(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取一条空记录，用于无数据表格初始化
#[post("/fetch_blank")]
pub fn fetch_blank() -> HttpResponse {
    let v: Vec<i32> = Vec::new();
    HttpResponse::Ok().json((v, 0, 0))
}

#[derive(Deserialize)]
pub struct Search {
    s: String,
    cate: String,
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
    search: web::Query<Search>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let s = ("%".to_owned() + &search.s + "%").to_lowercase();
        let rows = &conn
            .query(
                r#"SELECT "ID" AS id, 规格型号 AS label FROM products WHERE "商品ID"=$2 AND LOWER(规格型号) LIKE $1 LIMIT 10"#, //查询字段名称与结构名称对应
                &[&s, &search.cate],
            )
            .await
            .unwrap();

        let mut data: Vec<Message> = vec![];
        for row in rows {
            let message = Message {
                id: row.get("id"),
                label: row.get("label"),
            };

            data.push(message);
        }

        HttpResponse::Ok().json(data)
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
        let fields = get_fields(db.clone()).await;

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
        sheet.write_string(0, 1, "商品ID", Some(&format1)).unwrap();

        let mut n = 2;
        for f in &fields {
            sheet.write_string(0, n, &f.1, Some(&format1)).unwrap();
            sheet.set_column(n, n, (f.4 * 2.5).into(), None).unwrap();

            n += 1;
        }

        let mut sql = r#"SELECT "ID"::float8 as 编号,"#.to_owned();
        for f in &fields {
            if f.2 == "文本" {
                let txt = format!("{},", f.0);
                sql += &txt;
            } else if f.2 == "整数" || f.2 == "实数" {
                let num = format!("{}::float8,", f.0);
                sql += &num;
            } else {
                let op: Vec<&str> = f.3.split("_").collect();
                let bl = format!(
                    "case when {} then '{}' else '{}' end as {},",
                    f.0, op[0], op[1], f.0
                );
                sql += &bl;
            }
        }

        let tail = format!(r#""商品ID" FROM products WHERE "商品ID"='{}'"#, product.id);
        sql += &tail;

        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut n = 1u32;
        for row in rows {
            sheet
                .write_number(n, 0, row.get("编号"), Some(&format2))
                .unwrap();
            sheet
                .write_string(n, 1, row.get("商品ID"), Some(&format2))
                .unwrap();

            let mut m = 2u16;
            for f in &fields {
                if f.2 == "整数" || f.2 == "实数" {
                    sheet.write_number(n, m, row.get(&*f.0), None).unwrap();
                } else if f.2 == "文本" {
                    sheet.write_string(n, m, row.get(&*f.0), None).unwrap();
                } else {
                    sheet
                        .write_string(n, m, row.get(&*f.0), Some(&format2))
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
        let fields = get_fields(db.clone()).await;
        let mut records = Vec::new();
        let mut excel: Xlsx<_> = open_workbook(path).unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let mut n = 0;
            let mut num = 1;
            let total_coloum = r.get_size().1;

            println!("列数：{}", total_coloum);
            println!("字段数：{}", fields.len());
            if total_coloum - 2 != fields.len() {
                return HttpResponse::Ok().json(-2);
            }

            for row in r.rows() {
                let mut rec = "".to_owned();
                let split = "<`*_*`>";
                if n == 0 {
                    rec += &format!("{}{}", row[0].get_string().unwrap(), split);
                    rec += &format!("{}{}", row[1].get_string().unwrap(), split);
                    for f in &fields {
                        rec += &format!("{}{}", &*f.1, split);
                    }

                    records.push(rec);
                    n = n + 1;
                    continue;
                }

                rec += &format!("{}{}", row[0].get_float().unwrap(), split);
                rec += &format!("{}{}", row[1].get_string().unwrap(), split);
                p_id = row[1].get_string().unwrap().to_owned();

                for i in 0..fields.len() {
                    if fields[i].2 == "实数" || fields[i].2 == "整数" {
                        rec += &format!("{}{}", row[i + 2].get_float().unwrap_or(0f64), split);
                    } else {
                        rec += &format!("{}{}", row[i + 2].get_string().unwrap_or(""), split);
                    }
                }

                records.push(rec);

                num += 1;
                if num == 50 {
                    break;
                }
            }

            total_rows = r.get_size().0 - 1;

            let conn = db.get().await.unwrap();
            let rows = &conn
                .query(r#"SELECT node_name FROM tree WHERE num=$1"#, &[&p_id])
                .await
                .unwrap();

            for row in rows {
                p_id = row.get("node_name");
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
        let mut excel: Xlsx<_> = open_workbook("./upload/product.xlsx").unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let fields = get_fields(db.clone()).await;
            let conn = db.get().await.unwrap();
            let mut init = r#"INSERT INTO products ("#.to_owned();

            for f in &fields {
                init += &format!("{},", &*f.0);
            }

            init += r#""商品ID") VALUES("#;

            let mut n = 0u8;
            for row in r.rows() {
                if n == 0 {
                    n = n + 1;
                    continue;
                }
                let mut sql = init.clone();

                for i in 0..fields.len() {
                    if fields[i].2 == "文本" {
                        sql += &format!("'{}',", row[i + 2].get_string().unwrap_or(""));
                    } else if fields[i].2 == "实数" || fields[i].2 == "整数" {
                        sql += &format!("{},", row[i + 2].get_float().unwrap_or(0f64));
                    } else {
                        let op: Vec<&str> = fields[i].3.split("_").collect();
                        let val = if row[i + 2].get_string().unwrap_or("") == op[0] {
                            true
                        } else {
                            false
                        };
                        sql += &format!("{},", val);
                    }
                }

                sql += &format!("'{}')", row[1].get_string().unwrap_or(""));

                &conn.query(sql.as_str(), &[]).await.unwrap();
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
        let mut excel: Xlsx<_> = open_workbook("./upload/product.xlsx").unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let fields = get_fields(db.clone()).await;
            let conn = db.get().await.unwrap();
            let mut n = 0u8;

            for row in r.rows() {
                if n == 0 {
                    n = n + 1;
                    continue;
                }
                let mut sql = r#"UPDATE products SET "#.to_owned();

                for i in 0..fields.len() {
                    if fields[i].2 == "文本" {
                        sql += &format!(
                            "{}='{}',",
                            fields[i].0,
                            row[i + 2].get_string().unwrap_or("")
                        );
                    } else if fields[i].2 == "实数" || fields[i].2 == "整数" {
                        sql += &format!(
                            "{}={},",
                            fields[i].0,
                            row[i + 2].get_float().unwrap_or(0f64)
                        );
                    } else {
                        let op: Vec<&str> = fields[i].3.split("_").collect();
                        let val = if row[i + 2].get_string().unwrap_or("") == op[0] {
                            true
                        } else {
                            false
                        };
                        sql += &format!("{}={},", fields[i].0, val);
                    }
                }

                sql = sql.trim_end_matches(',').to_owned();
                sql += &format!(r#" WHERE "ID"={}"#, row[0].get_float().unwrap());

                &conn.query(sql.as_str(), &[]).await.unwrap();
            }
        }
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//获取显示字段
async fn get_fields(db: web::Data<Pool>) -> Vec<(String, String, String, String, f32)> {
    let conn = db.get().await.unwrap();
    let rows = &conn
            .query(
                r#"SELECT field_name, show_name, data_type, option_value, show_width 
                    FROM tableset WHERE table_name='商品规格' AND is_show=true ORDER BY show_order"#,
                &[],
            )
            .await
            .unwrap();

    let mut fields: Vec<(String, String, String, String, f32)> = Vec::new();
    for row in rows {
        fields.push((
            row.get("field_name"),
            row.get("show_name"),
            row.get("data_type"),
            row.get("option_value"),
            row.get("show_width"),
        ));
    }

    fields
}
