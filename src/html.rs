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
            let html = r2s(|o| help_say_html(o, user.name));
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
#[get("/user_set")]
pub async fn user_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let user = get_user(db, user_name).await;
        if user.name != "" {
            let html = r2s(|o| userset(o, user));
            HttpResponse::Ok().content_type("text/html").body(html)
        } else {
            HttpResponse::Found().header("location", "/login").finish()
        }
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///用户管理
#[get("/user_manage")]
pub async fn user_manage(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let user = get_user(db, user_name).await;
        if user.name != "" {
            let html = r2s(|o| usermanage(o, user));
            HttpResponse::Ok().content_type("text/html").body(html)
        } else {
            HttpResponse::Found().header("location", "/login").finish()
        }
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}
