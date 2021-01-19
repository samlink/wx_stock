use crate::service::*;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Analys {
    date1: String,
    date2: String,
}

#[post("/fetch_analys")]
pub async fn fetch_analys(
    db: web::Data<Pool>,
    post_data: web::Json<Analys>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "综合分析".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let mut documents_record: Vec<String> = Vec::new();

        //处理小数位数
        let num_position = get_fraction(db).await;
        let num: Vec<&str> = num_position.split(",").collect();
        let num2 = num[1].parse::<usize>().unwrap();

        let document_names = vec![
            "商品采购-CG",
            "采购退货-CT",
            "商品销售-XS",
            "销售退货-XT",
            "库存调整-KT",
        ];

        for na in document_names {
            let name: Vec<&str> = na.split("-").collect();
            let mut doc_string = name[0].to_owned();

            let sql = format!(
                r#"select count(单号) as 数量, case when count(单号)=0 then 0 else sum(应结金额) end as 应结金额, 
                    case when count(单号)=0 then 0 else sum(已结金额) end as 已结金额,
                    case when count(单号)=0 then 0 else sum(其他费用) end as 其他费用 from documents
                    where 单号 like '{}%' and 已记账=true and 日期::date >= '{}'::date and 日期::date <= '{}'::date"#,
                name[1], post_data.date1, post_data.date2
            );

            let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

            let mut m1: i64 = 0;
            let mut m2: f32 = 0.0;
            let mut m3: f32 = 0.0;
            let mut m4: f32 = 0.0;

            for row in rows {
                m1 = row.get("数量");
                m2 = row.get("应结金额");
                m3 = row.get("已结金额");
                m4 = row.get("其他费用");
            }

            doc_string = format!(
                "{}{}{}{}{:.*}{}{:.*}{}",
                doc_string, SPLITER, m1, SPLITER, num2, m2, SPLITER, num2, m3, SPLITER
            );

            if name[1] != "KT" {
                let sql = format!(
                    r#"select count(单号) as 数量, case when count(单号)=0 then 0 else sum(应结金额) - sum(已结金额) end as 免除金额 from documents
                    where 单号 like '{}%' and 已记账=true and 是否欠款=false and 日期::date >= '{}'::date and 日期::date <= '{}'::date"#,
                    name[1], post_data.date1, post_data.date2
                );
                let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

                let mut c1: i64 = 0;
                let mut m1: f32 = 0.0;
                for row in rows {
                    c1 = row.get("数量"); //已结单据数量
                    m1 = row.get("免除金额");
                }

                doc_string = format!("{}{}{}{:.*}{}", doc_string, c1, SPLITER, num2, m1, SPLITER);

                let sql = format!(
                    r#"select count(单号) as 数量, case when count(单号)=0 then 0 else sum(应结金额) - sum(已结金额) end as 待结金额 from documents
                    where 单号 like '{}%' and 已记账=true and 是否欠款=true and 日期::date >= '{}'::date and 日期::date <= '{}'::date"#,
                    name[1], post_data.date1, post_data.date2
                );

                let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

                c1 = 0;
                m1 = 0.0;
                for row in rows {
                    c1 = row.get("数量"); //未结单据数量
                    m1 = row.get("待结金额");
                }

                doc_string = format!(
                    "{}{}{}{:.*}{}{:.*}",
                    doc_string, c1, SPLITER, num2, m1, SPLITER, 2, m4
                );
            } else {
                doc_string = format!(
                    "{}0{}0{}0{}0{}0",
                    doc_string, SPLITER, SPLITER, SPLITER, SPLITER
                );
            }

            documents_record.push(doc_string);
        }

        HttpResponse::Ok().json(documents_record)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize)]
pub struct StatisData {
    statis_cate: String,
    date1: String,
    date2: String,
}

#[post("/fetch_statis")]
pub async fn fetch_statis(
    db: web::Data<Pool>,
    post_data: web::Json<StatisData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "销售统计".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let mut num: Vec<i64> = Vec::new();
        let mut date_lables: Vec<String> = Vec::new();
        let mut sale_data: Vec<f32> = Vec::new();

        let date1: String;
        let date2: String;
        let date_sql: String;

        if post_data.statis_cate == "按月" {
            date1 = format!("{}-01", post_data.date1);
            date2 = format!("{}-01", post_data.date2);
            date_sql = format!(
                "日期::date >= '{}'::date and 日期::date < '{}'::date ",
                date1, date2
            );
        } else if post_data.statis_cate == "按年" {
            date1 = format!("{}-01-01", post_data.date1);
            date2 = format!("{}-12-31", post_data.date2);
            date_sql = format!(
                "日期::date >= '{}'::date and 日期::date <= '{}'::date ",
                date1, date2
            );
        } else {
            date_sql = format!("日期::date >= ''::date and 日期::date <= ''::date ");
        }

        let sql = format!(
            r#"select to_char(日期::date, 'YYYY-MM') as 日期, case when count(单号)=0 then 0 else sum(应结金额) end as 销售额, 
                ROW_NUMBER () OVER (order by to_char(日期::date, 'YYYY-MM')) as 序号 from documents
                where 单号 like 'X%' and 已记账=true and {}
                group by to_char(日期::date, 'YYYY-MM')
                order by to_char(日期::date, 'YYYY-MM')"#,
            date_sql
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        for row in rows {
            let date: String = row.get("日期");
            let sale: f32 = row.get("销售额");
            let n: i64 = row.get("序号");
            num.push(n);
            date_lables.push(date);
            sale_data.push(sale);
        }

        HttpResponse::Ok().json((num, date_lables, sale_data))
    } else {
        HttpResponse::Ok().json(-1)
    }
}
