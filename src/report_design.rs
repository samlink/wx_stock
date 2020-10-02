use crate::service::*;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct PrintDocument {
    pub id: i32,
    pub name: String,
}

///获取打印单据
#[get("/fetch_print_documents")]
pub async fn fetch_print_documents(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "报表设计".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let rows = &conn
            .query(r#"SELECT id, 打印单据 FROM print_documents"#, &[])
            .await
            .unwrap();

        let mut documents: Vec<PrintDocument> = Vec::new();

        for row in rows {
            let doc = PrintDocument {
                id: row.get("id"),
                name: row.get("打印单据"),
            };

            documents.push(doc);
        }

        HttpResponse::Ok().json(documents)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
