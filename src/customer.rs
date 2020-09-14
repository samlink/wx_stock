use crate::service::*;
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

///编辑更新客户
#[post("/update_customer")]
pub async fn update_customer(
    db: web::Data<Pool>,
    p: web::Json<Product>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "客户管理".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_fields(db.clone(), "客户").await;
        let field_names: Vec<&str> = p.data.split(SPLITER).collect();
        let py = pinyin::get_pinyin(&field_names[2]); //[2] 是名称
        let init = r#"UPDATE customers SET "#.to_owned();
        let mut sql = build_sql_for_update(field_names.clone(), init, fields);
        sql += &format!(r#"助记码='{}' WHERE "ID"={}"#, py, field_names[0]);

        &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///编辑增加客户
#[post("/add_customer")]
pub async fn add_customer(
    db: web::Data<Pool>,
    p: web::Json<Product>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "客户管理".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_fields(db.clone(), "客户").await;
        let field_names: Vec<&str> = p.data.split(SPLITER).collect();
        let py = pinyin::get_pinyin(&field_names[2]); //[2] 是名称

        let mut init = r#"INSERT INTO customers ("#.to_owned();

        for f in &fields {
            init += &format!("{},", &*f.field_name);
        }

        init += "助记码) VALUES(";
        let mut sql = build_sql_for_insert(field_names.clone(), init, fields);
        sql += &format!("'{}')", py);

        &conn.query(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize)]
pub struct Search {
    s: String,
}

//自动完成
#[get("/customer_auto")]
pub async fn customer_auto(
    db: web::Data<Pool>,
    search: web::Query<Search>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let s = search.s.to_lowercase();
        let sql = &format!(
            r#"SELECT "ID" AS id, 名称 AS label FROM customers WHERE 助记码 LIKE '%{}%' OR LOWER(名称) LIKE '%{}%' LIMIT 10"#,
            s, s
        );

        autocomplete(db.clone(), sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//导出数据
#[post("/customer_out")]
pub async fn customer_out(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "导出数据".to_owned()).await;
    if user.name != "" {
        let fields = get_fields(db.clone(), "客户").await;

        let file_name = "./download/客户.xlsx";
        let wb = Workbook::new(&file_name);
        let mut sheet = wb.add_worksheet(Some("数据")).unwrap();

        let format1 = wb
            .add_format()
            .set_align(FormatAlignment::CenterAcross)
            .set_bold(); //设置格式：居中，加粗

        let format2 = wb.add_format().set_align(FormatAlignment::CenterAcross);

        sheet.write_string(0, 0, "编号", Some(&format1)).unwrap();
        sheet.set_column(0, 0, 10.0, Some(&format2)).unwrap();

        let mut n = 1;
        for f in &fields {
            sheet
                .write_string(0, n, &f.show_name, Some(&format1))
                .unwrap();
            sheet
                .set_column(n, n, (f.show_width * 2.5).into(), None)
                .unwrap();

            n += 1;
        }

        let init = r#"SELECT "ID"::float8 as 编号,"#.to_owned();
        let mut sql = build_sql_for_excel(init, &fields);
        sql = sql.trim_end_matches(",").to_owned();

        sql += " FROM customers";

        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut n = 1u32;
        for row in rows {
            sheet
                .write_number(n, 0, row.get("编号"), Some(&format2))
                .unwrap();
            let mut m = 1u16;
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

        HttpResponse::Ok().json("客户")
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量导入、批量更新返回数据
#[post("/customer_in")]
pub async fn customer_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let path = save_file(payload).await.unwrap();

        let mut total_rows = 0;
        let fields = get_fields(db.clone(), "客户").await;
        let mut records = Vec::new();
        let mut excel: Xlsx<_> = open_workbook(path).unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let mut n = 0;
            let mut num = 1;
            let total_coloum = r.get_size().1;

            if total_coloum - 1 != fields.len() {
                return HttpResponse::Ok().json(-2);
            }

            for row in r.rows() {
                let mut rec = "".to_owned();
                //制作表头数据
                if n == 0 {
                    rec += &format!("{}{}", "编号", SPLITER);
                    for f in &fields {
                        rec += &format!("{}{}", &*f.show_name, SPLITER);
                    }

                    records.push(rec);
                    n = n + 1;
                    continue;
                }

                rec += &format!("{}{}", row[0], SPLITER);
                for i in 0..fields.len() {
                    if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
                        rec += &format!("{}{}", row[i + 1].get_float().unwrap_or(0f64), SPLITER);
                    } else {
                        rec += &format!("{}{}", row[i + 1].get_string().unwrap_or(""), SPLITER);
                    }
                }

                records.push(rec);

                num += 1;
                if num == 50 {
                    break;
                }
            }

            total_rows = r.get_size().0 - 1;
        }
        HttpResponse::Ok().json((records, total_rows))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量导入数据写库
#[post("/customer_addin")]
pub async fn customer_addin(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let mut excel: Xlsx<_> = open_workbook("./upload/upload_in.xlsx").unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let fields = get_fields(db.clone(), "客户").await;
            let conn = db.get().await.unwrap();
            let mut init = "INSERT INTO customers (".to_owned();

            for f in &fields {
                init += &format!("{},", &*f.field_name);
            }
            init += "助记码) VALUES(";

            let mut n = 0u8;
            for row in r.rows() {
                if n == 0 {
                    n = n + 1;
                    continue;
                }
                let mut sql = init.clone();

                for i in 0..fields.len() {
                    if fields[i].data_type == "文本" {
                        sql += &format!("'{}',", row[i + 1].get_string().unwrap_or(""));
                    } else if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
                        sql += &format!("{},", row[i + 1].get_float().unwrap_or(0f64));
                    } else {
                        let op: Vec<&str> = fields[i].option_value.split("_").collect();
                        let val = if row[i + 1].get_string().unwrap_or("") == op[0] {
                            true
                        } else {
                            false
                        };
                        sql += &format!("{},", val);
                    }
                }

                let py = pinyin::get_pinyin(&row[1].get_string().unwrap_or(""));
                sql += &format!("'{}')", py);

                &conn.query(sql.as_str(), &[]).await.unwrap();
            }
        }
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量更新数据写库
#[post("/customer_updatein")]
pub async fn customer_updatein(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let mut excel: Xlsx<_> = open_workbook("./upload/upload_in.xlsx").unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let fields = get_fields(db.clone(), "客户").await;
            let conn = db.get().await.unwrap();
            let mut n = 0u8;

            for row in r.rows() {
                if n == 0 {
                    n = n + 1;
                    continue;
                }
                let mut sql = r#"UPDATE customers SET "#.to_owned();

                for i in 0..fields.len() {
                    if fields[i].data_type == "文本" {
                        sql += &format!(
                            "{}='{}',",
                            fields[i].field_name,
                            row[i + 1].get_string().unwrap_or("")
                        );
                    } else if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
                        sql += &format!(
                            "{}={},",
                            fields[i].field_name,
                            row[i + 1].get_float().unwrap_or(0f64)
                        );
                    } else {
                        let op: Vec<&str> = fields[i].option_value.split("_").collect();
                        let val = if row[i + 1].get_string().unwrap_or("") == op[0] {
                            true
                        } else {
                            false
                        };
                        sql += &format!("{}={},", fields[i].field_name, val);
                    }
                }

                let py = pinyin::get_pinyin(&row[1].get_string().unwrap_or(""));
                sql += &format!(
                    r#"助记码={} WHERE "ID"={}"#,
                    py,
                    row[0].get_float().unwrap()
                );

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
