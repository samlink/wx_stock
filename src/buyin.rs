use crate::service::*;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

///获取采购进货单显示字段
#[post("/fetch_inout_fields")]
pub async fn fetch_inout_fields(
    db: web::Data<Pool>,
    name: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "采购进货".to_owned()).await;
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
    let user = get_user(db.clone(), id, "采购进货".to_owned()).await;
    if user.name != "" {
        let fields = get_inout_fields(db.clone(), "供应商").await;

        let mut sql = "SELECT ".to_owned();
        for f in &fields {
            sql += &format!("{},", f.field_name);
        }

        sql = sql.trim_end_matches(",").to_owned();

        sql += &format!(r#" FROM supplier WHERE id={}"#, supplier_id);
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
//     let user = get_user(db.clone(), id, "采购进货".to_owned()).await;
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
        let database = if post_data.cate == "客户" {
            "customers"
        } else {
            "supplier"
        };
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();

        let fields = get_inout_fields(db.clone(), &post_data.cate).await;

        let mut sql_fields = "SELECT id,".to_owned();

        for f in &fields {
            sql_fields += &format!("{},", f.field_name);
        }

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM {} WHERE 
            LOWER(名称) LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields, post_data.sort, database, name, post_data.sort, skip, post_data.rec
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let products = build_string_from_base(rows, fields);

        let count_sql = format!(
            r#"SELECT count(id) as 记录数 FROM {} WHERE LOWER(名称) LIKE '%{}%'"#,
            database, name
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
            sql_where += &format!("LOWER({}) LIKE '%{}%' OR ", f.field_name, s[1])
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

//库位自动完成
#[get("/position_auto")]
pub async fn position_auto(
    db: web::Data<Pool>,
    search: web::Query<SearchCate>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let s = search.s.to_lowercase();

        let sql = &format!(
            r#"SELECT position FROM warehouse WHERE id = {}"#,
            search.cate
        );
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut postion = "".to_owned();

        for row in rows {
            postion = row.get("position")
        }

        let mut p_arr: Vec<&str> = postion.split(",").collect();
        p_arr.retain(|&x| x.to_lowercase().contains(&s));

        let mut data = Vec::new();
        let mut n = 1;
        
        for p in p_arr {
            if n > 10 {
                break;
            } else {
                let message = Message {
                    id: 1,
                    label: p.to_string(),
                };
                data.push(message);
            }
            n += 1;
        }

        HttpResponse::Ok().json(data)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
