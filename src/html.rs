use crate::service::{get_user, r2s};
use actix_identity::Identity;
use actix_web::{get, web, HttpRequest, HttpResponse};
use deadpool_postgres::Pool;
use dotenv::dotenv;

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

///主页
#[get("/")]
pub async fn index(_req: HttpRequest, db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| help_say_html(o, user.name));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///登录
#[get("/login")]
pub fn login(_req: HttpRequest) -> HttpResponse {
    dotenv().ok();
    let comany = dotenv::var("company").unwrap();
    let html = r2s(|o| login_html(o, comany));
    HttpResponse::Ok().content_type("text/html").body(html)
}

///用户自己设置
#[get("/user_set")]
pub async fn user_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| userset(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///用户管理
#[get("/user_manage")]
pub async fn user_manage(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "用户设置".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| usermanage(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///商品设置
#[get("/product_set")]
pub async fn product_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "商品设置".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| productset(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///系统设置
#[get("/field_set")]
pub async fn field_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "字段设置".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| fieldset(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///客户管理
#[get("/customer_manage")]
pub async fn customer_manage(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "客户管理".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| customer(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}
