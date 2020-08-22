use actix_web::{web, HttpResponse};
use serde::Deserialize;
use std::io::{self, Write};

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

#[derive(Deserialize)]
pub struct File {
    name: String,
}

pub fn serve_static(file: web::Path<File>) -> HttpResponse {
    if let Some(data) = statics::StaticFile::get(&file.name) {
        HttpResponse::Ok().body(data.content)
    } else {
        HttpResponse::NotFound().into()
    }
}

pub fn r2s<Call>(call: Call) -> String
where
    Call: FnOnce(&mut dyn Write) -> io::Result<()>,
{
    let mut buf = Vec::new();
    call(&mut buf).unwrap();
    String::from_utf8(buf).unwrap()
}
