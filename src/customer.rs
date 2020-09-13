use crate::service::{get_user, save_file, SPLITER};
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

//存放显示字段信息：字段名称，显示名称，数据类型，可选值，显示宽度
pub struct FieldsData {
    field_name: String,
    show_name: String,
    data_type: String,
    option_value: String,
    show_width: f32,
}

///获取客户
#[post("/fetch_customer")]
pub async fn fetch_customer(
    db: web::Data<Pool>,
    post_data: web::Json<FrontData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "客户管理".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();

        let fields = get_fields(db.clone(), "客户").await;

        let mut sql_fields = r#"SELECT "ID","#.to_owned();

        for f in &fields {
            sql_fields += &format!("{},", f.field_name);
        }

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM customers WHERE 
            LOWER(名称) LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields, post_data.sort, name, post_data.sort, skip, post_data.rec
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let products = build_string_from_base(rows, fields);

        let rows = &conn
            .query(
                r#"SELECT count("ID") as 记录数 FROM customers WHERE LOWER(名称) LIKE '%' || $1 || '%'"#,
                &[&name],
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

//从数据库读取数据后，按显示字段，组合成字符串数组。以返回给前端
fn build_string_from_base(rows: &Vec<tokio_postgres::Row>, fields: Vec<FieldsData>) -> Vec<String> {
    let mut products = Vec::new();
    for row in rows {
        let mut product = "".to_owned();
        let num: i32 = row.get("ID");       //字段顺序已与前端配合一致，后台不可自行更改
        product += &format!("{}{}", num, SPLITER);
        let num: i64 = row.get("序号");
        product += &format!("{}{}", num, SPLITER);

        for f in &fields {
            if f.data_type == "文本" {
                let s: String = row.get(&*f.field_name);
                product += &format!("{}{}", s, SPLITER);
            } else if f.data_type == "整数" {
                let num: i32 = row.get(&*f.field_name);
                product += &format!("{}{}", num, SPLITER);
            } else if f.data_type == "实数" {
                let num: f32 = row.get(&*f.field_name);
                product += &format!("{}{}", num, SPLITER);
            } else {
                let op: Vec<&str> = f.option_value.split("_").collect();
                let b: bool = row.get(&*f.field_name);
                let val = if b == true { op[0] } else { op[1] };
                product += &format!("{}{}", val, SPLITER);
            }
        }

        products.push(product);
    }
    products
}

///编辑更新产品
#[post("/update_product")]
pub async fn update_product(
    db: web::Data<Pool>,
    p: web::Json<Product>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "客户管理".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_fields(db.clone(), "客户").await;
        let field_names: Vec<&str> = p.data.split(SPLITER).collect();
        let mut sql = r#"UPDATE products SET "#.to_owned();

        sql = build_sql_for_update(field_names.clone(), sql, fields);

        sql += &format!(
            r#""商品ID"='{}' WHERE "ID"={}"#,
            field_names[1], field_names[0]
        );

        &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//从前端传过来字符串数组，按显示字段，组合成 update 语句。供更新数据用
fn build_sql_for_update(
    field_names: Vec<&str>,
    mut sql: String,
    fields: Vec<FieldsData>,
) -> String {
    for i in 0..fields.len() {
        if fields[i].data_type == "文本" {
            sql += &format!("{}='{}',", fields[i].field_name, field_names[i + 2]);
        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
            sql += &format!("{}={},", fields[i].field_name, field_names[i + 2]);
        } else {
            let op: Vec<&str> = fields[i].option_value.split("_").collect();
            let val = if field_names[i + 2] == op[0] {
                true
            } else {
                false
            };
            sql += &format!("{}={},", fields[i].field_name, val);
        }
    }
    sql
}

//从前端传过来字符串数组，按显示字段，组合成 insert 语句。供追加数据用
fn build_sql_for_insert(
    field_names: Vec<&str>,
    mut sql: String,
    fields: Vec<FieldsData>,
) -> String {
    for i in 0..fields.len() {
        if fields[i].data_type == "文本" {
            sql += &format!("'{}',", field_names[i + 2]);
        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
            sql += &format!("{},", field_names[i + 2]);
        } else {
            let op: Vec<&str> = fields[i].option_value.split("_").collect();
            let val = if field_names[i + 2] == op[0] {
                true
            } else {
                false
            };
            sql += &format!("{},", val);
        }
    }
    sql
}

///编辑增加产品
#[post("/add_product")]
pub async fn add_product(db: web::Data<Pool>, p: web::Json<Product>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_fields(db.clone(), "客户").await;
        let field_names: Vec<&str> = p.data.split(SPLITER).collect();
        let mut sql = r#"INSERT INTO products ("#.to_owned();

        for f in &fields {
            sql += &format!("{},", &*f.field_name);
        }

        sql += r#""商品ID") VALUES("#;

        sql = build_sql_for_insert(field_names.clone(), sql, fields);
        sql += &format!("'{}')", field_names[1]);

        &conn.query(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
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
        let fields = get_fields(db.clone(), "客户").await;

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
            sheet
                .write_string(0, n, &f.show_name, Some(&format1))
                .unwrap();
            sheet
                .set_column(n, n, (f.show_width * 2.5).into(), None)
                .unwrap();

            n += 1;
        }

        let mut sql = r#"SELECT "ID"::float8 as 编号,"#.to_owned();

        sql = build_sql_for_excel(sql, &fields);

        sql += &format!(r#""商品ID" FROM products WHERE "商品ID"='{}'"#, product.id);

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
                if f.data_type == "整数" || f.data_type == "实数" {
                    sheet
                        .write_number(n, m, row.get(&*f.field_name), None)
                        .unwrap();
                } else if f.data_type == "文本" {
                    sheet
                        .write_string(n, m, row.get(&*f.field_name), None)
                        .unwrap();
                } else {
                    sheet
                        .write_string(n, m, row.get(&*f.field_name), Some(&format2))
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

//将显示字段拼接成导出 excel 用的查询语句
fn build_sql_for_excel(mut sql: String, fields: &Vec<FieldsData>) -> String {
    for f in fields {
        if f.data_type == "文本" {
            let txt = format!("{},", f.field_name);
            sql += &txt;
        } else if f.data_type == "整数" || f.data_type == "实数" {
            let num = format!("{}::float8,", f.field_name);
            sql += &num;
        } else {
            let op: Vec<&str> = f.option_value.split("_").collect();
            let bl = format!(
                "case when {} then '{}' else '{}' end as {},",
                f.field_name, op[0], op[1], f.field_name
            );
            sql += &bl;
        }
    }
    sql
}

//批量导入、批量更新返回数据
#[post("/product_in")]
pub async fn product_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let path = save_file(payload).await.unwrap();

        let mut p_id = "".to_owned(); //商品ID
        let mut total_rows = 0;
        let fields = get_fields(db.clone(), "客户").await;
        let mut records = Vec::new();
        let mut excel: Xlsx<_> = open_workbook(path).unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let mut n = 0;
            let mut num = 1;
            let total_coloum = r.get_size().1;

            if total_coloum - 2 != fields.len() {
                return HttpResponse::Ok().json(-2);
            }

            for row in r.rows() {
                let mut rec = "".to_owned();
                if n == 0 {
                    rec += &format!("{}{}", row[0].get_string().unwrap(), SPLITER);
                    rec += &format!("{}{}", row[1].get_string().unwrap(), SPLITER);
                    for f in &fields {
                        rec += &format!("{}{}", &*f.show_name, SPLITER);
                    }

                    records.push(rec);
                    n = n + 1;
                    continue;
                }

                rec += &format!("{}{}", row[0].get_float().unwrap(), SPLITER);
                rec += &format!("{}{}", row[1].get_string().unwrap(), SPLITER);
                p_id = row[1].get_string().unwrap().to_owned();

                for i in 0..fields.len() {
                    if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
                        rec += &format!("{}{}", row[i + 2].get_float().unwrap_or(0f64), SPLITER);
                    } else {
                        rec += &format!("{}{}", row[i + 2].get_string().unwrap_or(""), SPLITER);
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
            let fields = get_fields(db.clone(), "客户").await;
            let conn = db.get().await.unwrap();
            let mut init = r#"INSERT INTO products ("#.to_owned();

            for f in &fields {
                init += &format!("{},", &*f.field_name);
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
                    if fields[i].data_type == "文本" {
                        sql += &format!("'{}',", row[i + 2].get_string().unwrap_or(""));
                    } else if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
                        sql += &format!("{},", row[i + 2].get_float().unwrap_or(0f64));
                    } else {
                        let op: Vec<&str> = fields[i].option_value.split("_").collect();
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
            let fields = get_fields(db.clone(), "客户").await;
            let conn = db.get().await.unwrap();
            let mut n = 0u8;

            for row in r.rows() {
                if n == 0 {
                    n = n + 1;
                    continue;
                }
                let mut sql = r#"UPDATE products SET "#.to_owned();

                for i in 0..fields.len() {
                    if fields[i].data_type == "文本" {
                        sql += &format!(
                            "{}='{}',",
                            fields[i].field_name,
                            row[i + 2].get_string().unwrap_or("")
                        );
                    } else if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
                        sql += &format!(
                            "{}={},",
                            fields[i].field_name,
                            row[i + 2].get_float().unwrap_or(0f64)
                        );
                    } else {
                        let op: Vec<&str> = fields[i].option_value.split("_").collect();
                        let val = if row[i + 2].get_string().unwrap_or("") == op[0] {
                            true
                        } else {
                            false
                        };
                        sql += &format!("{}={},", fields[i].field_name, val);
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
async fn get_fields(db: web::Data<Pool>, table_name: &str) -> Vec<FieldsData> {
    let conn = db.get().await.unwrap();
    let rows = &conn
            .query(
                r#"SELECT field_name, show_name, data_type, option_value, show_width 
                    FROM tableset WHERE table_name=$1 AND is_show=true ORDER BY show_order"#,
                &[&table_name],
            )
            .await
            .unwrap();

    let mut fields: Vec<FieldsData> = Vec::new();
    for row in rows {
        let data = FieldsData {
            field_name: row.get("field_name"),
            show_name: row.get("show_name"),
            data_type: row.get("data_type"),
            option_value: row.get("option_value"),
            show_width: row.get("show_width"),
        };

        fields.push(data);
    }

    fields
}
