use crate::service::{get_user, get_inout_fields, SPLITER};
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

///获取出入库显示字段
#[post("/fetch_buyin_fields")]
pub async fn fetch_buyin_fields(
    db: web::Data<Pool>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "采购进货".to_owned()).await;

    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_inout_fields(db.clone(), "采购单据").await;
       
        HttpResponse::Ok().json(fields)
    } else {
        HttpResponse::Ok().json(-1)
    }
}