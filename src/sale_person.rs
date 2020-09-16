use crate::service::{PostData, get_user};
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
            r#"SELECT "ID", name, phone, note, ROW_NUMBER () OVER (ORDER BY {}) as 序号 
                    FROM salers WHERE name LIKE '%{}%' ORDER BY {} OFFSET {} LIMIT {}"#,
            post_data.sort, post_data.name, post_data.sort, skip, post_data.rec
        );
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut salers: Vec<UsersReturn> = Vec::new();

        for row in rows {
            let saler = UsersReturn {
                id: row.get("ID"),
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
