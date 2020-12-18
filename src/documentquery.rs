use crate::service::*;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
// use serde::{Deserialize, Serialize};
// use time::now;

///获取全部单据
#[post("/fetch_all_documents")]
pub async fn fetch_all_documents(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, post_data.cate.clone()).await;
    if user.name != "" {
        let doc_cate;
        let doc_pre;

        if post_data.cate == "采购查询" {
            doc_cate = "采购单据";
            doc_pre = "C";
        } else if post_data.cate == "销售查询" {
            doc_cate = "销售单据";
            doc_pre = "X";
        } else {
            doc_cate = "库存调整";
            doc_pre = "K";
        }
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        // let name = post_data.name.to_lowercase();

        let fields = get_inout_fields(db.clone(), doc_cate).await;

        let mut sql_fields = "SELECT 单号,documents.类别,已记账,".to_owned();
        let mut sql_where = "".to_owned();

        for f in &fields {
            sql_fields += &format!("documents.{},", f.field_name);
            if f.data_type == "文本" {
                sql_where += &format!(
                    "LOWER(documents.{}) LIKE '%{}%' OR ",
                    f.field_name, post_data.name
                )
            }
        }

        sql_where += &format!(
            "单号 LIKE '%{}%' OR 名称 LIKE '%{}%' OR documents.类别 LIKE '%{}%' OR 制单人 LIKE '%{}%'",
            post_data.name, post_data.name, post_data.name, post_data.name
        );

        // sql_where = sql_where.trim_end_matches(" OR ").to_owned();

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号,customers.名称,制单人 FROM documents 
            JOIN customers ON documents.客商id=customers.id
            WHERE 单号 like '{}%' AND ({}) ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields, post_data.sort, doc_pre, sql_where, post_data.sort, skip, post_data.rec
        );

        println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut doc_rows: Vec<String> = Vec::new();
        for row in rows {
            let num: i64 = row.get("序号");
            let dh: String = row.get("单号");
            let cate: String = row.get("类别");
            let customer_name: String = row.get("名称");
            let rem: bool = row.get("已记账");
            let remembered = if rem == true { "是" } else { "否" };
            let maker: String = row.get("制单人");
            let row_str = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}",
                num,
                SPLITER,
                dh,
                SPLITER,
                cate,
                SPLITER,
                simple_string_from_base(row, &fields),
                customer_name,
                SPLITER,
                remembered,
                SPLITER,
                maker,
            );

            doc_rows.push(row_str);
        }

        let count_sql = format!(
            r#"SELECT count(单号) as 记录数 FROM documents 
            JOIN customers ON documents.客商id=customers.id 
            WHERE 单号 like '{}%' AND ({})"#,
            doc_pre, sql_where
        );

        let rows = &conn.query(count_sql.as_str(), &[]).await.unwrap();

        let mut count: i64 = 0;
        for row in rows {
            count = row.get("记录数");
        }
        let pages = (count as f64 / post_data.rec as f64).ceil() as i32;
        HttpResponse::Ok().json((doc_rows, count, pages))
    } else {
        HttpResponse::Ok().json(-1)
    }
}
