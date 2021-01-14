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
        let name = post_data.name.trim().to_lowercase();
        let cate = post_data.cate.to_lowercase();
        let data: Vec<&str> = cate.split(SPLITER).collect();

        let query_field = if name != "" {
            //注意前导空格
            format!(
                r#" AND (LOWER(单号) LIKE '%{}%' OR LOWER(documents.类别) LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%' 
                OR LOWER(规格型号) LIKE '%{}%' OR LOWER(documents.备注) LIKE '%{}%')"#,
                name, name, name, name, name
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
            r#"select 日期,单号,documents.类别,应结金额,node_name,规格型号,单位,单价,abs(数量) as 数量,documents.备注, ROW_NUMBER () OVER (ORDER BY {}) as 序号 from documents
            join document_items on documents.单号 = document_items.单号id 
            join customers on documents.客商id = customers.id
            join products on products.id = document_items.商品id
            join tree on tree.num = products.商品id
            where customers.名称 = '{}' and 已记账=true {}{} 
            ORDER BY {} OFFSET {} LIMIT {}"#,
            post_data.sort, data[0], query_field, query_date, post_data.sort, skip, post_data.rec
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();
        for row in rows {
            let f1: i64 = row.get("序号");
            let f2: String = row.get("日期");
            let f3: String = row.get("单号");
            let f4: String = row.get("类别");
            let f5: f32 = row.get("应结金额");
            let f6: String = row.get("node_name");
            let f7: String = row.get("规格型号");
            let f8: String = row.get("单位");
            let f9: f32 = row.get("单价");
            let f10: f32 = row.get("数量");
            let f11: String = row.get("备注");

            let product = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
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
                f11
            );

            products.push(product);
        }

        let count_sql = format!(
            r#"select count(单号) as 记录数, sum(数量*单价) as 金额 from documents 
            join document_items on documents.单号 = document_items.单号id 
            join customers on documents.客商id = customers.id
            join products on products.id = document_items.商品id
            join tree on tree.num = products.商品id
            where customers.名称 = '{}' and 已记账=true {}{}"#,
            data[0], query_field, query_date
        );

        let rows = &conn.query(count_sql.as_str(), &[]).await.unwrap();

        let mut count: i64 = 0;
        let mut money: f32 = 0f32;

        for row in rows {
            count = row.get("记录数");
            money = row.get("金额");
        }
        let pages = (count as f64 / post_data.rec as f64).ceil() as i32;

        //处理小数位数
        let num_position = get_fraction(db).await;
        let num: Vec<&str> = num_position.split(",").collect();
        let num2 = num[1].parse::<usize>().unwrap();
        let money2 = format!("{:.*}", num2, money);

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
            (select 客商id from documents where 已记账=true 日期::date > '{}'::date and 日期::date <= '{}'::date group by 客商id) as foo
            on customers.id = foo.客商id {}"#,
            post_data.date1, post_data.date2, cate
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut customers = Vec::new();
        for row in rows {
            let name: String = row.get("名称");
            customers.push(name);
        }
        HttpResponse::Ok().json(customers)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
