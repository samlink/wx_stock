use crate::service::r2s;
use actix_web::http::header::ContentType;
use actix_web::{get, web::Path, HttpResponse};
// use serde::Deserialize;
use templates::statics::StaticFile;

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

pub async fn static_file(path: Path<String>) -> HttpResponse {
    let name = &path.into_inner();
    if let Some(data) = StaticFile::get(name) {
        HttpResponse::Ok()
            .insert_header(ContentType(data.mime.clone()))
            .body(data.content)
    } else {
        HttpResponse::NotFound()
            .reason("No such static file.")
            .finish()
    }
}

///商品设置
#[get("/")]
pub async fn home() -> HttpResponse {
        let html = r2s(|o| productset_html(o));
        HttpResponse::Ok().content_type("text/html").body(html)
}