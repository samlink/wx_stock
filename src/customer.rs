use crate::service::*;
use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::{get, post, web, HttpResponse};
use calamine::{open_workbook, Reader, Xlsx};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use xlsxwriter::*;

#[derive(Deserialize, Serialize)]
pub struct Customer {
    pub data: String,
    pub cate: String,
}

///获取客户
#[post("/fetch_customer")]
pub async fn fetch_customer(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, format!("{}管理", post_data.cate)).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();

        let fields = get_fields(db.clone(), &post_data.cate).await;

        let mut sql_fields = "SELECT id,".to_owned();

        for f in &fields {
            sql_fields += &format!("{},", f.field_name);
        }

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM customers WHERE 
            类别='{}' AND LOWER(名称) LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields, post_data.sort, post_data.cate, name, post_data.sort, skip, post_data.rec
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let products = build_string_from_base(rows, fields);

        let count_sql = format!(
            r#"SELECT count(id) as 记录数 FROM customers WHERE 类别='{}' AND LOWER(名称) LIKE '%{}%'"#,
            post_data.cate, name
        );

        let rows = &conn.query(count_sql.as_str(), &[]).await.unwrap();

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
    p: web::Json<Customer>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, format!("{}管理", p.cate)).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_fields(db.clone(), &p.cate).await;
        let field_names: Vec<&str> = p.data.split(SPLITER).collect();
        let py = rust_pinyin::get_pinyin(&field_names[2]); //[2] 是名称
        let init = "UPDATE customers SET ".to_owned();
        let mut sql = build_sql_for_update(field_names.clone(), init, fields, 2);
        sql += &format!(r#"助记码='{}' WHERE id={}"#, py, field_names[0]);

        let _ =  &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///编辑增加客户
#[post("/add_customer")]
pub async fn add_customer(
    db: web::Data<Pool>,
    p: web::Json<Customer>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, format!("{}管理", p.cate)).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_fields(db.clone(), &p.cate).await;
        let field_names: Vec<&str> = p.data.split(SPLITER).collect();
        let py = rust_pinyin::get_pinyin(&field_names[2]); //[2] 是名称

        let mut init = "INSERT INTO customers (".to_owned();

        for f in &fields {
            init += &format!("{},", &*f.field_name);
        }

        init += "助记码,类别) VALUES(";
        let mut sql = build_sql_for_insert(field_names.clone(), init, fields, 2);
        sql += &format!("'{}', '{}')", py, p.cate);

        let _ = &conn.query(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//自动完成
#[get("/customer_auto")]
pub async fn customer_auto(
    db: web::Data<Pool>,
    search: web::Query<SearchCate>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let s = search.s.to_lowercase();
        let cate_s = if search.cate != "" {
            format!("类别='{}' AND ", search.cate)
        } else {
            "".to_string()
        };
        let sql = &format!(
            r#"SELECT id::text, 名称 AS label FROM customers 
            WHERE {} (助记码 LIKE '%{}%' OR LOWER(名称) LIKE '%{}%') AND 停用=false LIMIT 10"#,
            cate_s, s, s
        );

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize)]
pub struct OutCate {
    cate: String,
}

//导出数据
#[post("/customer_out")]
pub async fn customer_out(
    db: web::Data<Pool>,
    out_data: web::Json<OutCate>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "导出数据".to_owned()).await;
    if user.name != "" {
        let fields = get_fields(db.clone(), &out_data.cate).await;

        let file_name = format!("./download/{}.xlsx", out_data.cate);
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

        let init = r#"SELECT id as 编号,"#.to_owned();
        let mut sql = build_sql_for_excel(init, &fields);
        sql = sql.trim_end_matches(",").to_owned();

        sql += &format!(" FROM customers WHERE 类别='{}'", out_data.cate);

        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut n = 1u32;
        for row in rows {
            let id: i32 = row.get("编号");
            sheet.write_number(n, 0, id as f64, Some(&format2)).unwrap();
            let mut m = 1u16;
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

        HttpResponse::Ok().json(&out_data.cate)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量导入、批量更新返回数据
#[post("/customer_in")]
pub async fn customer_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let (records, total_rows) = data_in(db, payload, "客户").await;
        if total_rows == -1 {
            HttpResponse::Ok().json(-2)
        } else {
            HttpResponse::Ok().json((records, total_rows))
        }
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量导入、批量更新返回数据
#[post("/supplier_in")]
pub async fn supplier_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let (records, total_rows) = data_in(db, payload, "供应商").await;
        if total_rows == -1 {
            HttpResponse::Ok().json(-2)
        } else {
            HttpResponse::Ok().json((records, total_rows))
        }
    } else {
        HttpResponse::Ok().json(-1)
    }
}

async fn data_in(db: web::Data<Pool>, payload: Multipart, cate: &str) -> (Vec<String>, i32) {
    let path = save_file(payload).await.unwrap();

    let mut total_rows = 0;
    let fields = get_fields(db.clone(), cate).await;
    let mut records = Vec::new();
    let mut excel: Xlsx<_> = open_workbook(path).unwrap();

    if let Some(Ok(r)) = excel.worksheet_range("数据") {
        let mut num = 0;
        let total_coloum = r.get_size().1;
        total_rows = r.get_size().0 - 1;

        if total_coloum - 1 != fields.len() {
            return (records, -1);
        }

        if total_rows > 0 {
            //制作表头数据
            let mut rec = "".to_owned();
            rec += &format!("{}{}", "编号", SPLITER);
            for f in &fields {
                rec += &format!("{}{}", &*f.show_name, SPLITER);
            }

            records.push(rec);

            for i in 0..total_rows {
                let mut rec = "".to_owned();
                for j in 0..total_coloum {
                    rec += &format!("{}{}", r[(i + 1, j)], SPLITER);
                }

                records.push(rec);

                num += 1;
                if num == 50 {
                    break;
                }
            }
        }
    }

    (records, total_rows as i32)
}

//批量导入数据写库
#[post("/customer_addin")]
pub async fn customer_addin(
    db: web::Data<Pool>,
    data_cate: web::Json<OutCate>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let mut excel: Xlsx<_> = open_workbook("./upload/upload_in.xlsx").unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let fields = get_fields(db.clone(), &data_cate.cate).await;
            let conn = db.get().await.unwrap();
            let total_rows = r.get_size().0 - 1;
            if total_rows > 0 {
                let mut init = "INSERT INTO customers (".to_owned();

                for f in &fields {
                    init += &format!("{},", &*f.field_name);
                }
                init += "助记码, 类别) VALUES(";

                for j in 0..total_rows {
                    let mut sql = init.clone();

                    for i in 0..fields.len() {
                        if fields[i].data_type == "文本" {
                            sql += &format!("'{}',", r[(j + 1, i + 1)]);
                        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数"
                        {
                            sql += &format!("{},", r[(j + 1, i + 1)]);
                        } else {
                            let op: Vec<&str> = fields[i].option_value.split("_").collect();
                            let value = format!("{}", r[(j + 1, i + 1)]);
                            let val = if value == op[0] { true } else { false };
                            sql += &format!("{},", val);
                        }
                    }

                    let name = &format!("{}", r[(j + 1, 1)]);
                    let py = rust_pinyin::get_pinyin(name);
                    sql += &format!("'{}','{}')", py, data_cate.cate);

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
#[post("/customer_updatein")]
pub async fn customer_updatein(
    db: web::Data<Pool>,
    data_cate: web::Json<OutCate>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let mut excel: Xlsx<_> = open_workbook("./upload/upload_in.xlsx").unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let fields = get_fields(db.clone(), &data_cate.cate).await;
            let conn = db.get().await.unwrap();
            let total_rows = r.get_size().0 - 1;

            if total_rows > 0 {
                for i in 0..total_rows {
                    let mut sql = "UPDATE customers SET ".to_owned();

                    for j in 0..fields.len() {
                        if fields[j].data_type == "文本" {
                            sql += &format!("{}='{}',", fields[j].field_name, r[(i + 1, j + 1)]);
                        } else if fields[j].data_type == "实数" || fields[j].data_type == "整数"
                        {
                            sql += &format!("{}={},", fields[j].field_name, r[(i + 1, j + 1)]);
                        } else {
                            let op: Vec<&str> = fields[j].option_value.split("_").collect();
                            let value = format!("{}", r[(i + 1, j + 1)]);
                            let val = if value == op[0] { true } else { false };
                            sql += &format!("{}={},", fields[j].field_name, val);
                        }
                    }
                    let name = &format!("{}", r[(i + 1, 1)]);
                    let id = format!("{}", r[(i + 1, 0)]);
                    let py = rust_pinyin::get_pinyin(name);
                    sql += &format!(r#"助记码='{}' WHERE id={}"#, py, id);

                    let _ = &conn.query(sql.as_str(), &[]).await.unwrap();
                }
            }
        }
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
