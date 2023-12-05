use crate::service::*;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

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
                f1,
                SPLITER,
                f2,
                SPLITER,
                f3,
                SPLITER,
                f4,
                SPLITER,
                f5,
                SPLITER,
                f6,
                SPLITER,
                f7,
                SPLITER,
                f8,
                SPLITER,
                f9,
                SPLITER,
                f10,
                SPLITER,
                f11,
                SPLITER,
                f12,
                SPLITER,
                f13,
                SPLITER,
                f14,
                SPLITER,
                f15
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

#[derive(Deserialize)]
pub struct Debt {
    cate: String,
    customer: String,
    date1: String,
    date2: String,
}

#[post("/fetch_debt")]
pub async fn fetch_debt(
    db: web::Data<Pool>,
    post_data: web::Json<Debt>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "债务结算".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let cate = if post_data.cate == "全部" {
            " where 类别<>''".to_owned()
        } else {
            format!(" where 类别='{}'", post_data.cate)
        };

        let sql = format!(
            r#"select 名称 from customers 
            join 
            (select 客商id from documents where 已记账=true and 日期::date >= '{}'::date and 日期::date <= '{}'::date group by 客商id) as foo
            on customers.id = foo.客商id {} 
            order by 名称"#,
            post_data.date1, post_data.date2, cate
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut customers = Vec::new();
        for row in rows {
            let name: String = row.get("名称");
            customers.push(name);
        }

        let mut debt_record: Vec<String> = Vec::new();

        //处理小数位数
        let num2 = 2;

        if post_data.customer != "" {
            let debt_names = vec!["材料采购-CG", "采购退货-CT", "商品销售-XS", "销售退货-XT"];

            for na in debt_names {
                let name: Vec<&str> = na.split("-").collect();
                let mut debt_string = name[0].to_owned();

                let sql = format!(
                    r#"select 客商id, count(单号) as 数量, sum(应结金额) as 应结金额, sum(已结金额) as 已结金额 from documents
                        join customers on 
                        documents.客商id = customers.id
                        where trim(名称)='{}' and 单号 like '{}%' and 已记账=true and 日期::date >= '{}'::date and 日期::date <= '{}'::date
                        group by 客商id;"#,
                    post_data.customer, name[1], post_data.date1, post_data.date2
                );

                let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

                let mut m1: i64 = 0;
                let mut m2: f32 = 0.0;
                let mut m3: f32 = 0.0;

                for row in rows {
                    m1 = row.get("数量");
                    m2 = row.get("应结金额");
                    m3 = row.get("已结金额");
                }

                debt_string = format!(
                    "{}{}{}{}{:.*}{}{:.*}{}",
                    debt_string, SPLITER, m1, SPLITER, num2, m2, SPLITER, num2, m3, SPLITER
                );

                let sql = format!(
                    r#"select 客商id, sum(应结金额) - sum(已结金额) as 免除金额  from documents 
                        join customers on 
                        documents.客商id = customers.id
                        where 名称='{}' and 单号 like '{}%' and 已记账=true and 是否欠款=false and 日期::date >= '{}'::date and 日期::date <= '{}'::date
                        group by 客商id;"#,
                    post_data.customer, name[1], post_data.date1, post_data.date2
                );

                let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

                let mut m1: f32 = 0.0;
                for row in rows {
                    m1 = row.get("免除金额");
                }

                debt_string = format!("{}{:.*}{}", debt_string, num2, m1, SPLITER);

                let sql = format!(
                    r#"select 客商id, sum(应结金额) - sum(已结金额) as 待结金额  from documents 
                        join customers on 
                        documents.客商id = customers.id
                        where 名称='{}' and 单号 like '{}%' and 已记账=true and 是否欠款=true and 日期::date >= '{}'::date and 日期::date <= '{}'::date
                        group by 客商id;"#,
                    post_data.customer, name[1], post_data.date1, post_data.date2
                );

                let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

                m1 = 0.0;
                for row in rows {
                    m1 = row.get("待结金额");
                }

                debt_string = format!("{}{:.*}", debt_string, num2, m1);

                debt_record.push(debt_string);
            }
        }

        HttpResponse::Ok().json((customers, debt_record))
    } else {
        HttpResponse::Ok().json(-1)
    }
}
