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

    let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

    if rows.len() == 0 {
        return HttpResponse::Ok().json(-1);
    }

    let title: String = rows[0].get("标题");
    let content: String = rows[0].get("内容");

    let data = json!({
        "title": title,
        "content": content
    });

    HttpResponse::Ok().json(data)
}
