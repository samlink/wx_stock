use crate::service::*;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

//自动完成
#[get("/material_auto")]
pub async fn material_auto(
    db: web::Data<Pool>,
    search: web::Query<SearchCate>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let f_map = map_fields(db.clone(), "采购单据").await;
        let f_map2 = map_fields(db.clone(), "供应商").await;
        let s = search.s.to_uppercase();
        let cate_s = if search.cate != "" {
            format!("documents.类别='{}' AND ", search.cate)
        } else {
            "".to_string()
        };
        let sql = &format!(
            r#"SELECT 单号 as id, 单号 || ' ' || {} AS label FROM documents
            JOIN customers on 客商id = customers.id
            WHERE {} 单号 like '%{}%' AND {}=false  LIMIT 10"#,
            format!("customers.{}", f_map2["简称"]),
            cate_s,
            s,
            format!("documents.{}", f_map["入库完成"]),            
        );

        // println!("{}", sql);

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}
