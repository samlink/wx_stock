use crate::service::*;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

///业务往来
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
        let name = post_data.name.trim().to_lowercase();
        let cate = post_data.cate.to_lowercase();
        let data: Vec<&str> = cate.split(SPLITER).collect();

        let f_map = map_fields(db.clone(), "销售单据").await;
        let limits = get_limits(user, f_map).await;

        let query_field = if name != "" {
            //注意前导空格
            format!(
                r#" AND (LOWER(单号) LIKE '%{}%' OR LOWER(documents.类别) LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%' 
                OR LOWER(规格) LIKE '%{}%' OR LOWER(状态) LIKE '%{}%' OR LOWER(documents.备注) LIKE '%{}%')"#,
                name, name, name, name, name, name
            )
        } else {
            "".to_owned()
        };

        let query_date = if data[1] != "" && data[2] != "" {
            format!(
                r#" AND 日期::date>='{}'::date AND 日期::date<='{}'::date"#,
                data[1], data[2]
            )
        } else {
            "".to_owned()
        };

        let sql = format!(
            r#"select 日期, 单号, documents.文本字段6 as 合同编号, documents.类别, 应结金额, split_part(node_name,' ',2) as 名称,
                 split_part(node_name,' ',1) as 材质, 规格, 状态, 长度, 数量, 单价, 重量, documents.备注,
                 ROW_NUMBER () OVER (ORDER BY {}) as 序号 from document_items
            join documents on documents.单号 = document_items.单号id
            join customers on documents.客商id = customers.id
            join tree on tree.num = document_items.商品id
            where {} customers.名称 = '{}' {}{}
            ORDER BY {} OFFSET {} LIMIT {}"#,
            post_data.sort, limits, data[0], query_field, query_date, post_data.sort, skip, post_data.rec
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();
        for row in rows {
            let f1: i64 = row.get("序号");
            let f2: String = row.get("日期");
            let f3: String = row.get("单号");
            let f4: String = row.get("合同编号");
            let f5: String = row.get("类别");
            let f6: f32 = row.get("应结金额");
            let f7: String = row.get("名称");
            let f8: String = row.get("材质");
            let f9: String = row.get("规格");
            let f10: String = row.get("状态");
            let f11: i32 = row.get("长度");
            let f12: i32 = row.get("数量");
            let f13: f32 = row.get("单价");
            let f14: f32 = row.get("重量");
            let f15: String = row.get("备注");

            let product = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                f1, SPLITER, f2, SPLITER, f3, SPLITER, f4, SPLITER, f5, SPLITER,
                f6, SPLITER, f7, SPLITER, f8, SPLITER, f9, SPLITER, f10, SPLITER,
                f11, SPLITER, f12, SPLITER, f13, SPLITER, f14, SPLITER, f15
            );

            products.push(product);
        }

        let count_sql = format!(
            r#"select count(单号) as 记录数, sum(case when 重量=0 and 理重=0 then 单价*数量
               else 单价*重量 end) as 金额 from document_items
            join documents on documents.单号 = document_items.单号id
            join customers on documents.客商id = customers.id
            join tree on tree.num = document_items.商品id
            where {} customers.名称 = '{}' {}{}"#,
            limits, data[0], query_field, query_date
        );

        let rows = &conn.query(count_sql.as_str(), &[]).await.unwrap();

        let mut count: i64 = 0;
        let mut money: f64 = 0f64;

        for row in rows {
            count = row.get("记录数");
            money = row.get("金额");
        }
        let pages = (count as f64 / post_data.rec as f64).ceil() as i32;

        let money2 = format!("{:.*}", 0, money);

        HttpResponse::Ok().json((products, count, pages, money2))
    } else {
        HttpResponse::Ok().json(-1)
    }
}
