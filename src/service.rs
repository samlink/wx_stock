use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::{post, web, Error, HttpResponse};
use deadpool_postgres::Pool;
use futures::{StreamExt, TryStreamExt};
use serde::{Deserialize, Serialize};
use std::io::{self, Write};

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

#[derive(Deserialize)]
pub struct File {
    name: String,
}

#[derive(Deserialize, Serialize)]
pub struct UserData {
    pub name: String,
    pub phone: String,
    pub get_pass: i32,
    pub rights: String,
    pub confirm: bool,
}

#[derive(Deserialize, Serialize)]
pub struct PostData {
    pub name: String,
    pub page: i32,
    pub sort: String,
    pub rec: i32,
}

///静态文件服务
pub fn serve_static(file: web::Path<File>) -> HttpResponse {
    if let Some(data) = statics::StaticFile::get(&file.name) {
        HttpResponse::Ok().body(data.content)
    } else {
        HttpResponse::NotFound().into()
    }
}

///模板转换成网页字符串
pub fn r2s<Call>(call: Call) -> String
where
    Call: FnOnce(&mut dyn Write) -> io::Result<()>,
{
    let mut buf = Vec::new();
    call(&mut buf).unwrap();
    String::from_utf8(buf).unwrap()
}

///获取用户信息
pub async fn get_user(db: web::Data<Pool>, id: Identity, right: String) -> UserData {
    let mut user = UserData {
        name: "".to_owned(),
        phone: "".to_owned(),
        get_pass: 0,
        rights: "".to_owned(),
        confirm: false,
    };

    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let right = format!("%{}%", right);
        let rows = &conn
        .query(
            r#"SELECT name, phone, 6-get_pass as get_pass, rights, confirm FROM users WHERE name=$1 AND confirm=true AND rights LIKE $2"#,
            &[&user_name, &right],
        )
        .await
        .unwrap();

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
    } else {
        user
    }
}

//上传文件保存
pub async fn save_file(mut payload: Multipart) -> Result<String, Error> {
    let path = "./upload/product.xlsx".to_owned();
    while let Ok(Some(mut field)) = payload.try_next().await {
        let filepath = path.clone();
        let mut f = web::block(|| std::fs::File::create(filepath))
            .await
            .unwrap();
        while let Some(chunk) = field.next().await {
            let data = chunk.unwrap();
            f = web::block(move || f.write_all(&data).map(|_| f)).await?;
        }
    }
    Ok(path)
}
