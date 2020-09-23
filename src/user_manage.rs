use crate::service::{TablePager, get_user};
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct UsersReturn {
    pub name: String,
    pub phone: String,
    pub rights: String,
    pub confirm: bool,
    pub num: i64,
}

///获取用户
#[post("/pull_users")]
pub async fn pull_users(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "用户设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let sql = format!(
            "SELECT name, phone, rights, confirm, ROW_NUMBER () OVER (ORDER BY {}) as 序号 
                    FROM users WHERE name LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {} ",
            post_data.sort, post_data.name, post_data.sort, skip, post_data.rec
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
                r#"SELECT count(name) as 记录数 FROM users WHERE name LIKE '%' || $1 || '%'"#,
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

#[derive(Deserialize, Serialize)]
pub struct UserEdit {
    pub name: String,
    pub confirm: bool,
    pub rights: String,
}

///用户编辑
#[post("/edit_user")]
pub async fn edit_user(
    db: web::Data<Pool>,
    post_data: web::Json<UserEdit>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "用户设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        &conn
            .execute(
                r#"UPDATE users SET confirm=$1, rights=$2 WHERE name=$3"#,
                &[&post_data.confirm, &post_data.rights, &post_data.name],
            )
            .await
            .unwrap();
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct UserDel {
    pub name: String,
}

///用户删除
#[post("/del_user")]
pub async fn del_user(
    db: web::Data<Pool>,
    post_data: web::Json<UserDel>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "用户设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        &conn
            .execute(r#"DELETE FROM users WHERE name=$1"#, &[&post_data.name])
            .await
            .unwrap();
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
