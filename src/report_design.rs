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
            .query(
                r#"SELECT id, 打印单据 FROM print_documents ORDER BY id"#,
                &[],
            )
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

        let rows = &conn
            .query(r#"SELECT 示例模板 FROM print_documents WHERE id=1"#, &[])
            .await
            .unwrap();

        let mut example = "".to_owned();
        for row in rows {
            example = row.get("示例模板");
        }

        HttpResponse::Ok().json((documents, example))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/fetch_provider")]
pub async fn fetch_provider(
    db: web::Data<Pool>,
    data: web::Json<i32>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "报表设计".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(
            r#"SELECT 预定设置, 预定html, 示例模板 FROM print_documents WHERE id={}"#,
            data
        );
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut pre_set = "".to_owned();
        let mut pre_html = "".to_owned();
        let mut example = "".to_owned();

        for row in rows {
            pre_set = row.get("预定设置");
            pre_html = row.get("预定html");
            example = row.get("示例模板");
        }

        HttpResponse::Ok().json((pre_set, pre_html, example))
    } else {
        HttpResponse::Ok().json(-1)
    }
}
