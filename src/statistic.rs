use crate::service::*;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

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
            (select 客商id from documents where 已记账=true and 日期::date > '{}'::date and 日期::date <= '{}'::date group by 客商id) as foo
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
        let num_position = get_fraction(db).await;
        let num: Vec<&str> = num_position.split(",").collect();
        let num2 = num[1].parse::<usize>().unwrap();

        if post_data.customer != "" {
            let debt_names = vec!["商品采购-CG", "采购退货-CT", "商品销售-XS", "销售退货-XT"];

            for na in debt_names {
                let name: Vec<&str> = na.split("-").collect();
                let mut debt_string = name[0].to_owned();

                let sql = format!(
                    r#"select 客商id, count(单号) as 数量, sum(应结金额) as 应结金额, sum(已结金额) as 已结金额 from documents
                        join customers on 
                        documents.客商id = customers.id
                        where 名称='{}' and 单号 like '{}%' and 已记账=true and 日期::date > '{}'::date and 日期::date <= '{}'::date
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
                        where 名称='{}' and 单号 like '{}%' and 已记账=true and 是否欠款=false and 日期::date > '{}'::date and 日期::date <= '{}'::date
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
                        where 名称='{}' and 单号 like '{}%' and 已记账=true and 是否欠款=true and 日期::date > '{}'::date and 日期::date <= '{}'::date
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
