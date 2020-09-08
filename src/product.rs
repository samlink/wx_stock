use crate::service::{get_user, PostData};
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

///获取商品
#[post("/fetch_product")]
pub async fn fetch_product(
    db: web::Data<Pool>,
    post_data: web::Json<PostData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let rows = &conn
            .query(
                r#"SELECT field_name FROM tableset WHERE table_name='商品规格' AND is_show=true"#,
                &[],
            )
            .await
            .unwrap();

        let mut fields = "".to_owned();
        for row in rows {
            fields += row.get("field_name");
            fields += ",";
        }

        let skip = (post_data.page - 1) * post_data.rec;
        let sql = format!(
            "SELECT {} ROW_NUMBER () OVER (ORDER BY {}) as 序号
                    FROM 用户 WHERE name LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {} ",
            fields, post_data.sort, post_data.name, post_data.sort, skip, post_data.rec
        );
        
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut users: Vec<UsersReturn> = Vec::new();

        for row in rows {
            let user = UsersReturn {
                name: row.get("name"),
                phone: row.get("phone"),
                rights: row.get("rights"),
                confirm: row.get("confirm"),
                num: row.get("序号"),
            };

            users.push(user);
        }

        let rows = &conn
            .query(
                r#"SELECT count(name) as 记录数 FROM 用户 WHERE name LIKE '%' || $1 || '%'"#,
                &[&post_data.name],
            )
            .await
            .unwrap();

        let mut count: i64 = 0;
        for row in rows {
            count = row.get("记录数");
        }
        let pages = (count as f64 / post_data.rec as f64).ceil() as i32;
        HttpResponse::Ok().json((users, count, pages))
    } else {
        HttpResponse::Ok().json(-1)
    }
}
