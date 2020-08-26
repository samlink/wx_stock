use crate::service::r2s;
// use actix_identity::Identity;
use actix_web::{get, HttpRequest, HttpResponse};
// use serde::{Deserialize, Serialize};

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

///主页面
#[get("/")]
pub fn index(_req: HttpRequest) -> HttpResponse {
    let html = r2s(|o| help_say_html(o));
    HttpResponse::Ok().content_type("text/html").body(html)
}

///登录页
#[get("/login")]
pub fn login(_req: HttpRequest) -> HttpResponse {
    let html = r2s(|o| login_html(o));
    HttpResponse::Ok().content_type("text/html").body(html)
}