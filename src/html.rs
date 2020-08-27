use crate::service::{get_user, r2s};
use actix_identity::Identity;
use actix_web::{get, web, HttpRequest, HttpResponse};
use deadpool_postgres::Pool;

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

///主页
#[get("/")]
pub async fn index(_req: HttpRequest, db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let user = get_user(db, user_name).await;
        if user.name != "" {
            let html = r2s(|o| help_say_html(o));
            HttpResponse::Ok().content_type("text/html").body(html)
        } else {
            HttpResponse::Found().header("location", "/login").finish()
        }
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///登录
#[get("/login")]
pub fn login(_req: HttpRequest) -> HttpResponse {
    let html = r2s(|o| login_html(o));
    HttpResponse::Ok().content_type("text/html").body(html)
}

///用户设置
pub async fn user_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("0".to_owned());
    let mut phone = "".to_owned();

    if user_name != "0" {
        let conn = db.get().await.unwrap();
        let row = &conn
            .query_one(r#"SELECT phone FROM 用户 Where name=$1"#, &[&user_name])
            .await
            .unwrap();

        phone = row.get("phone");
    }

    let html = r2s(|o| userset(o, phone));
    HttpResponse::Ok().content_type("text/html").body(html)
}
