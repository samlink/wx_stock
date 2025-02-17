use actix_web::{get, web, HttpResponse};
use deadpool_postgres::Pool;
use serde_json::json;

///获取表头统计信息
#[get("/fetch_information")]
pub async fn fetch_information(db: web::Data<Pool>) -> HttpResponse {
    let conn = db.get().await.unwrap();
    let sql = format!(
        r#"select title as 标题, content as 内容 
            from information
            where show = true"#,
    );

    let row = &conn.query_one(sql.as_str(), &[]).await.unwrap();

    if row.is_empty() {
        return HttpResponse::Ok().json(-1);
    }

    let title: String = row.get("标题");
    let content: String = row.get("内容");

    let data = json!({
        "title": title,
        "content": content
    });

    HttpResponse::Ok().json(data)
}
