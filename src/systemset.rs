use crate::service::get_user;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

///获取参数
#[get("/fetch_system")]
pub async fn fetch_system(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "系统参数".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let mut values = "".to_owned();

        let rows = &conn
            .query("SELECT value FROM system ORDER BY id", &[])
            .await
            .unwrap();

        for row in rows {
            let v: String = row.get("value");
            values += &format!("{},", v);
        }

        HttpResponse::Ok().json(values.trim_end_matches(","))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//修改参数
#[get("/update_system")]
pub async fn update_system(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "系统参数".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();

        let rows = &conn
            .query("SELECT value FROM system ORDER BY id", &[])
            .await
            .unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
