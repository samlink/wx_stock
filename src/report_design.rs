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

#[derive(Deserialize, Serialize)]
pub struct PrintModel {
    pub id: i32,
    pub print_id: i32,
    pub name: String,
    pub model: String,
    pub default: bool,
    pub cate: String,
}

#[derive(Deserialize, Serialize)]
pub struct ModelData {
    pub id: i32,
    pub name: String,
    pub default: bool,
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

        HttpResponse::Ok().json(documents)
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

#[post("/save_model")]
pub async fn save_model(
    db: web::Data<Pool>,
    data: web::Json<PrintModel>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "报表设计".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let mut sql;
        if data.default == true {
            sql = format!(
                r#"UPDATE print_model SET 默认=false WHERE 打印单据id={}"#,
                data.print_id
            );
            let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();
        }

        if data.cate == "新增" {
            sql = format!(
                r#"INSERT INTO print_model (打印单据id, 名称, 模板, 默认) VALUES({},'{}','{}',{})"#,
                data.print_id, data.name, data.model, data.default
            );
        } else {
            if data.name != "" {
                sql = format!(
                    r#"UPDATE print_model SET 名称='{}', 模板='{}', 默认={} WHERE id={}"#,
                    data.name, data.model, data.default, data.id
                );
            } else {
                sql = format!(
                    r#"UPDATE print_model SET 模板='{}', 默认={} WHERE id={}"#,
                    data.model, data.default, data.id
                );
            }
        }

        let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/fetch_models")]
pub async fn fetch_models(
    db: web::Data<Pool>,
    print_id: web::Json<i32>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(
            r#"SELECT id, 名称, 默认 FROM print_model WHERE 打印单据id={} ORDER BY 默认 desc"#,
            print_id
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut models: Vec<ModelData> = Vec::new();

        for row in rows {
            let m = ModelData {
                id: row.get("id"),
                name: row.get("名称"),
                default: row.get("默认"),
            };

            models.push(m);
        }

        HttpResponse::Ok().json(models)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/fetch_one_model")]
pub async fn fetch_one_model(
    db: web::Data<Pool>,
    model_id: web::Json<i32>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(
            r#"SELECT 默认, 模板 FROM print_model WHERE id={}"#,
            model_id
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut default = false;
        let mut model = "".to_owned();

        for row in rows {
            default = row.get("默认");
            model = row.get("模板");
        }

        HttpResponse::Ok().json((default, model))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/fetch_provider_model")]
pub async fn fetch_provider_model(
    db: web::Data<Pool>,
    model_id: web::Json<i32>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(
            r#"SELECT 预定设置, 模板 FROM print_model 
                JOIN print_documents ON print_model.打印单据id = print_documents.id WHERE print_model.id={}"#,
            model_id
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut pre_set = "".to_owned();
        let mut model = "".to_owned();

        for row in rows {
            pre_set = row.get("预定设置");
            model = row.get("模板");
        }

        HttpResponse::Ok().json((pre_set, model))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/del_model")]
pub async fn del_model(
    db: web::Data<Pool>,
    model_id: web::Json<i32>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "报表设计".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(r#"DELETE FROM print_model WHERE id={}"#, model_id);

        let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
