use crate::service::{get_user, r2s};
// use actix_web::http::header::ContentType;
use actix_web::{get, web, web::Path, HttpRequest, HttpResponse};
// use serde::Deserialize;
use actix_identity::Identity;
use deadpool_postgres::Pool;
use dotenv::dotenv;
use templates::statics::StaticFile;

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

pub async fn static_file(path: Path<String>) -> HttpResponse {
    let name = &path.into_inner();
    if let Some(data) = StaticFile::get(name) {
        HttpResponse::Ok()
            .body(data.content)
    } else {
        HttpResponse::NotFound()
            .reason("No such static file.")
            .finish()
    }
}

fn goto_login() -> HttpResponse {
    HttpResponse::Found()
        .append_header(("location", format!("/stock/{}", "login")))
        .finish()
}

///登录
#[get("/login")]
pub async fn login(_req: HttpRequest) -> HttpResponse {
    dotenv().ok();
    // let comany = dotenv::var("company").unwrap();
    let html = r2s(|o| login_html(o));
    HttpResponse::Ok().content_type("text/html").body(html)
}

///用户自己设置
#[get("/user_set")]
pub async fn user_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(&db, id).await;
    if user.username != "" {
        let html = r2s(|o| userset_html(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

#[get("/")]
pub async fn home(_req: HttpRequest, db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(&db, id).await;
    if user.username != "" {
        let html = r2s(|o| productset_html(o, user.id.to_string()));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///购物车页面
#[get("/cart")]
pub async fn cart(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(&db, id).await;
    if user.username != "" {
        let html = r2s(|o| cart_html(o, user.id.to_string()));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}