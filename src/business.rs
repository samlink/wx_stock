use crate::service::*;
use actix_identity::Identity;
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

///获取业务
#[post("/fetch_business")]
pub async fn fetch_business(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "业务往来".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();
        let customer = post_data.cate.trim().to_lowercase();

        let sql = format!(
            r#"select 日期,单号,documents.类别,应结金额,node_name,单价,数量, ROW_NUMBER () OVER (ORDER BY {}) as 序号 from documents 
            join document_items on documents.单号 = document_items.单号id 
            join customers on documents.客商id = customers.id
            join products on products.id = document_items.商品id
            join tree on tree.num = products.商品id
            where customers.名称 = '{}' FROM customers
            LOWER(名称) LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {}"#,
            post_data.sort, customer, name, post_data.sort, skip, post_data.rec
        );

        println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let products = "".to_owned();
        for row in rows {
            let f1: String = row.get("序号");
            let f2: String = row.get("日期");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");
            let f1: String = row.get("序号");

        }

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