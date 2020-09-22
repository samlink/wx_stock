use crate::service::{get_inout_fields, get_user, simple_string_from_base, SPLITER};
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

///获取出入库显示字段
#[post("/fetch_buyin_fields")]
pub async fn fetch_buyin_fields(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "采购进货".to_owned()).await;
    if user.name != "" {
        let fields = get_inout_fields(db.clone(), "采购单据").await;
        HttpResponse::Ok().json(fields)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取出入库显示字段
#[post("/fetch_supplier")]
pub async fn fetch_supplier(
    db: web::Data<Pool>,
    supplier_id: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "采购进货".to_owned()).await;
    if user.name != "" {
        let fields = get_inout_fields(db.clone(), "供应商").await;

        let mut sql = "SELECT ".to_owned();
        for f in &fields {
            sql += &format!("{},", f.field_name);
        }

        sql = sql.trim_end_matches(",").to_owned();

        sql += &format!(r#" FROM supplier WHERE "ID"={}"#, supplier_id);
        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut supplier = "".to_owned();
        for row in rows {
            supplier += &simple_string_from_base(row, &fields);
        }
        HttpResponse::Ok().json((fields, supplier))
    } else {
        HttpResponse::Ok().json(-1)
    }
}
