use crate::service::{get_user, PostData, SPLITER};
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct UsersReturn {
    pub id: i32,
    pub name: String,
    pub phone: String,
    pub note: String,
    pub num: i64,
}

///获取用户
#[post("/pull_salers")]
pub async fn pull_salers(
    db: web::Data<Pool>,
    post_data: web::Json<PostData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "销售人员".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let sql = format!(
            r#"SELECT id, name, phone, note, ROW_NUMBER () OVER (ORDER BY {}) as 序号 
                    FROM salers WHERE name LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {}"#,
            post_data.sort, post_data.name, post_data.sort, skip, post_data.rec
        );
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut salers: Vec<UsersReturn> = Vec::new();

        for row in rows {
            let saler = UsersReturn {
                id: row.get("id"),
                name: row.get("name"),
                phone: row.get("phone"),
                note: row.get("note"),
                num: row.get("序号"),
            };

            salers.push(saler);
        }

        let rows = &conn
            .query(
                r#"SELECT count(name) as 记录数 FROM salers WHERE name LIKE '%' || $1 || '%'"#,
                &[&post_data.name],
            )
            .await
            .unwrap();

        let mut count: i64 = 0;
        for row in rows {
            count = row.get("记录数");
        }
        let pages = (count as f64 / post_data.rec as f64).ceil() as i32;
        HttpResponse::Ok().json((salers, count, pages))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct SalerEdit {
    pub saler: String,
    pub cate: String,
}

///用户编辑
#[post("/edit_saler")]
pub async fn edit_saler(
    db: web::Data<Pool>,
    post_data: web::Json<SalerEdit>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "销售人员".to_owned()).await;
    if user.name != "" {
        let saler: Vec<&str> = post_data.saler.split(SPLITER).collect();
        let conn = db.get().await.unwrap();
        let sql = if post_data.cate == "add" {
            format!(
                r#"INSERT INTO salers (name, phone, note) VALUES('{}','{}','{}')"#,
                saler[0], saler[1], saler[2]
            )
        } else if post_data.cate == "edit" {
            format!(
                r#"UPDATE salers SET name='{}', phone='{}', note='{}' WHERE id={}"#,
                saler[0], saler[1], saler[2], saler[3]
            )
        } else {
            format!(
                r#"DELETE FROM salers WHERE id={}"#,
                saler[0]
            )
        };
        &conn.execute(sql.as_str(), &[]).await.unwrap();
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

