use crate::service::get_user;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct FrontData {
    pub id: String,
    pub name: String,
    pub page: i32,
    pub sort: String,
    pub rec: i32,
}

//结构中的变量名与数据库中字段 rust_name 一致，便于前端操作
#[derive(Deserialize, Serialize)]
pub struct Product {
    pub num: i64,
    pub id: i32,
    pub p_type: String,
    pub price: f32,
    pub p_limit: i32,
    pub not_use: bool,
    pub note: String,
    pub unit: String,
    pub text1: String,
    pub text2: String,
    pub text3: String,
    pub text4: String,
    pub text5: String,
    pub text6: String,
    pub text7: String,
    pub text8: String,
    pub text9: String,
    pub text10: String,
    pub integer1: i32,
    pub integer2: i32,
    pub integer3: i32,
    pub integer4: i32,
    pub integer5: i32,
    pub integer6: i32,
    pub real1: f32,
    pub real2: f32,
    pub real3: f32,
    pub real4: f32,
    pub real5: f32,
    pub real6: f32,
    pub bool1: bool,
    pub bool2: bool,
    pub bool3: bool,
}

///获取商品
#[post("/fetch_product")]
pub async fn fetch_product(
    db: web::Data<Pool>,
    post_data: web::Json<FrontData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let sql = format!(
            r#"SELECT "ID",规格型号,出售价格,库存下限,停用,备注,单位,文本字段1,文本字段2,文本字段3,
                    文本字段4,文本字段5,文本字段6,文本字段7,文本字段8,文本字段9,文本字段10,
                    整数字段1,整数字段2,整数字段3,整数字段4,整数字段5,整数字段6,
                    实数字段1,实数字段2,实数字段3,实数字段4,实数字段5,实数字段6,
                    布尔字段1,布尔字段2,布尔字段3,
                    ROW_NUMBER () OVER (ORDER BY {}) as 序号
                    FROM products WHERE "商品ID"='{}' AND 规格型号 LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {}"#,
            post_data.sort, post_data.id, post_data.name, post_data.sort, skip, post_data.rec
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();

        for row in rows {
            let product = Product {
                num: row.get("序号"),
                id: row.get("ID"),
                p_type: row.get("规格型号"),
                price: row.get("出售价格"),
                p_limit: row.get("库存下限"),
                not_use: row.get("停用"),
                note: row.get("备注"),
                unit: row.get("单位"),
                text1: row.get("文本字段1"),
                text2: row.get("文本字段2"),
                text3: row.get("文本字段3"),
                text4: row.get("文本字段4"),
                text5: row.get("文本字段5"),
                text6: row.get("文本字段6"),
                text7: row.get("文本字段7"),
                text8: row.get("文本字段8"),
                text9: row.get("文本字段9"),
                text10: row.get("文本字段10"),
                integer1: row.get("整数字段1"),
                integer2: row.get("整数字段2"),
                integer3: row.get("整数字段3"),
                integer4: row.get("整数字段4"),
                integer5: row.get("整数字段5"),
                integer6: row.get("整数字段6"),
                real1: row.get("实数字段1"),
                real2: row.get("实数字段2"),
                real3: row.get("实数字段3"),
                real4: row.get("实数字段4"),
                real5: row.get("实数字段5"),
                real6: row.get("实数字段6"),
                bool1: row.get("布尔字段1"),
                bool2: row.get("布尔字段2"),
                bool3: row.get("布尔字段3"),
            };
            products.push(product);
        }

        let rows = &conn
            .query(
                r#"SELECT count("ID") as 记录数 FROM products WHERE "商品ID"=$1 AND 规格型号 LIKE '%' || $2 || '%'"#,
                &[&post_data.id, &post_data.name],
            )
            .await
            .unwrap();

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
