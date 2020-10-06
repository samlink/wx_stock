use crate::service::*;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use time::now;

///获取商品采购单显示字段
#[post("/fetch_inout_fields")]
pub async fn fetch_inout_fields(
    db: web::Data<Pool>,
    name: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品采购".to_owned()).await;
    if user.name != "" {
        let fields = get_inout_fields(db.clone(), &name).await;
        HttpResponse::Ok().json(fields)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取指定 id 的供应商
#[post("/fetch_supplier")]
pub async fn fetch_supplier(
    db: web::Data<Pool>,
    supplier_id: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品采购".to_owned()).await;
    if user.name != "" {
        let fields = get_inout_fields(db.clone(), "供应商").await;

        let mut sql = "SELECT ".to_owned();
        for f in &fields {
            sql += &format!("{},", f.field_name);
        }

        sql = sql.trim_end_matches(",").to_owned();

        sql += &format!(r#" FROM customers WHERE id={}"#, supplier_id);
        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut supplier = "".to_owned();
        for row in rows {
            supplier += &simple_string_from_base(row, &fields);
        }
        HttpResponse::Ok().json((fields, supplier))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// ///获取供应商显示字段
// #[post("/fetch_supplier_fields")]
// pub async fn fetch_supplier_fields(db: web::Data<Pool>, id: Identity) -> HttpResponse {
//     let user = get_user(db.clone(), id, "商品采购".to_owned()).await;
//     if user.name != "" {
//         let fields = get_inout_fields(db.clone(), "供应商").await;
//         HttpResponse::Ok().json(fields)
//     } else {
//         HttpResponse::Ok().json(-1)
//     }
// }

///进出库获取客户供应商信息
#[post("/fetch_inout_customer")]
pub async fn fetch_inout_customer(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, format!("{}管理", post_data.cate)).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();

        let fields = get_inout_fields(db.clone(), &post_data.cate).await;

        let mut sql_fields = "SELECT id,".to_owned();

        for f in &fields {
            sql_fields += &format!("{},", f.field_name);
        }

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM customers WHERE 
            类别='{}' AND LOWER(名称) LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields, post_data.sort, post_data.cate, name, post_data.sort, skip, post_data.rec
        );

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

//商品规格自动完成
#[get("/buyin_auto")]
pub async fn buyin_auto(
    db: web::Data<Pool>,
    search: web::Query<Search>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let fields = get_inout_fields(db.clone(), "商品规格").await;
        let mut s: Vec<&str> = search.s.split(" ").collect();
        if s.len() == 1 {
            s.push("");
        }

        let mut sql_fields = "".to_owned();
        let mut sql_where = "".to_owned();
        for f in &fields {
            sql_fields += &format!("{} || '{}' ||", f.field_name, SPLITER);
            if f.data_type == "文本" {
                sql_where += &format!("LOWER({}) LIKE '%{}%' OR ", f.field_name, s[1])
            }
        }

        let str_match = format!(" || '{}' ||", SPLITER);
        sql_fields = sql_fields.trim_end_matches(&str_match).to_owned();
        sql_where = sql_where.trim_end_matches(" OR ").to_owned();

        let sql = &format!(
            r#"SELECT id, node_name || '{}' || {} AS label FROM products 
            JOIN tree ON products.商品id = tree.num
            WHERE (pinyin LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%') AND ({}) LIMIT 10"#,
            SPLITER,
            sql_fields,
            s[0].to_lowercase(),
            s[0].to_lowercase(),
            sql_where,
        );

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//获取指定 id 的产品
#[post("/fetch_one_product")]
pub async fn fetch_one_product(
    db: web::Data<Pool>,
    product_id: web::Json<i32>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let fields = get_inout_fields(db.clone(), "商品规格").await;
        let mut sql = "SELECT ".to_owned();
        for f in &fields {
            sql += &format!("{},", f.field_name);
        }

        sql = sql.trim_end_matches(",").to_owned();
        let sql = &format!(r#"{} FROM products WHERE id = {}"#, sql, product_id);
        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut data = "".to_owned();
        for row in rows {
            let field_str = simple_string_from_base(row, &fields);
            data += &field_str;
        }

        data = data.trim_end_matches(SPLITER).to_owned();

        HttpResponse::Ok().json(data)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct Document {
    pub rights: String,
    pub document: String,
    pub items: Vec<String>,
}

///保存单据
#[post("/save_document")]
pub async fn save_document(
    db: web::Data<Pool>,
    data: web::Json<Document>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, data.rights.clone()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let doc_data: Vec<&str> = data.document.split(SPLITER).collect();
        let dh = doc_data[1];
        if dh == "新单据" {
            let dh_pre: &str;

            if doc_data[0] == "采购入库" {
                dh_pre = "CG";
            } else if doc_data[0] == "采购退货" {
                dh_pre = "CT";
            } else if doc_data[0] == "销售出库" {
                dh_pre = "XS";
            } else if doc_data[0] == "销售退货" {
                dh_pre = "XT";
            } else {
                dh_pre = "KT";
            }

            let rows = &conn
                .query("SELECT value FROM system WHERE cate='单号格式'", &[])
                .await
                .unwrap();
            let mut dh_format: Vec<String> = Vec::new();

            for row in rows {
                let v: String = row.get("value");
                dh_format.push(v);
            }

            //获取尾号
            let mut num = 1i32;
            let sql = format!(
                "SELECT 单号 FROM documents WHERE 单号 like '{}%' ORDER BY 单号 DESC LIMIT 1",
                dh_pre
            );

            let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

            let mut dh_first = "".to_owned();
            for row in rows {
                dh_first = row.get("单号");
            }

            if dh_first != "" {
                if dh_format[2] == "true" {
                    let dh_arr: Vec<&str> = dh_first.split("-").collect();
                    let length = dh_arr.len();
                    if dh_format[0] == "日" && length == 4 {
                        let local = now().strftime("%Y-%m-%d").unwrap().to_string();
                        if dh_first == format!("{}{}-{}", dh_pre, local, dh_arr[3]) {
                            num = dh_arr[3].parse::<i32>().unwrap() + 1;
                        }

                    } else if dh_format[0] == "月" && length == 3 {
                        let local = now().strftime("%Y-%m").unwrap().to_string();
                        if dh_first == format!("{}{}-{}", dh_pre, local, dh_arr[2]) {
                            num = dh_arr[2].parse::<i32>().unwrap() + 1;
                        }

                    } else if dh_format[0] == "年" && length == 2 {
                        let local = now().strftime("%Y").unwrap().to_string();
                        if dh_first == format!("{}{}-{}", dh_pre, local, dh_arr[1]) {
                            num = dh_arr[1].parse::<i32>().unwrap() + 1;
                        }
                    } else if dh_format[0] == "无限" && length == 1 {
                        if dh_first == format!("{}{}", dh_pre, dh_arr[1]) {
                            num = dh_arr[1].parse::<i32>().unwrap() + 1;
                        }
                    } else {
                        //日期不再一致
                    }

                } else {
                    
                }

            } else {
            }
        }

        let mut sql = format!("INSERT INTO customers (");

        &conn.query(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}



// async fn get_num(dh_pre: &str, dh_format: Vec<String>) -> String {}
