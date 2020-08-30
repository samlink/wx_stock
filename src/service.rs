use actix_web::{web, HttpResponse};
use deadpool_postgres::Pool;
use serde::Deserialize;
use std::io::{self, Write};

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

#[derive(Deserialize)]
pub struct File {
    name: String,
}

#[derive(Deserialize)]
pub struct UserData {
    pub name: String,
    pub phone: String,
    pub get_pass: i32,
    pub rights: String,
    pub confirm: bool,
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

///获取用户信息
pub async fn get_user(db: web::Data<Pool>, name: String) -> UserData {
    let conn = db.get().await.unwrap();
    let rows = &conn
        .query(
            r#"SELECT name, phone, 6-get_pass as get_pass, rights, confirm FROM 用户 WHERE name=$1 AND confirm=true"#,
            &[&name],
        )
        .await
        .unwrap();

    let mut user = UserData {
        name: "".to_owned(),
        phone: "".to_owned(),
        get_pass: 0,
        rights: "".to_owned(),
        confirm: false,
    };

    if rows.is_empty() {
        user
    } else {
        for row in rows {
            user.name = row.get("name");
            user.phone = row.get("phone");
            user.get_pass = row.get("get_pass");
            user.rights = row.get("rights");
            user.confirm = row.get("confirm");
        }
        user
    }
}
