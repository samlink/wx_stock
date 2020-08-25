use crate::service::r2s; //各个子模块之间的互相引用
use crate::useraes::*;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use crypto::digest::Digest;
use crypto::md5::Md5;
// use r2d2::Pool;
// use r2d2_postgres::PostgresConnectionManager;
// use tokio_postgres::{NoTls, Error};
use deadpool_postgres::{Client, Pool};
use rand::Rng;
use serde::{Deserialize, Serialize};

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

#[derive(Deserialize, Serialize)]
pub struct User {
    name: String,
    password: String,
}

#[derive(Deserialize, Serialize)]
pub struct UserTheme {
    name: String,
    theme: String,
}

#[derive(Deserialize, Serialize)]
pub struct StoredUser {
    id: String,
}

#[derive(Deserialize, Serialize)]
pub struct ChangePass {
    old_pass: String,
    new_pass: String,
}

#[derive(Deserialize, Serialize)]
pub struct Phone {
    phone_number: String,
}

#[derive(Deserialize, Serialize)]
pub struct Theme {
    name: String,
}

#[derive(Deserialize, Serialize)]
pub struct SendMessage {
    apikey: String,
    mobile: String,
    text: String,
}

static SALT: &str = "samlink82";
static KEY: &[u8; 32] = b"Long time ago, I meet you, like!";
static IV: &[u8; 16] = b"stocksalesmanage";

///获取 md5 码
fn md5(password: String, salt: &str) -> String {
    let mut hasher = Md5::new(); //将密码转成 md5
    let salt_pass = password + salt;
    hasher.input_str(&salt_pass);
    hasher.result_str()
}

///获取用户信息
pub async fn get_user(
    db: web::Data<Pool>,
    user: web::Json<StoredUser>,
    id: Identity,
) -> HttpResponse {
    let mut user_name = id.identity().unwrap_or("0".to_owned());
    if user.id != "0" && user_name == "0" {
        let data: Vec<&str> = user.id.split(",").collect();
        let data_u8: Vec<u8> = data.iter().map(|c| c.parse::<u8>().unwrap()).collect();
        let decrypted_data = decrypt(&data_u8, KEY, IV).ok().unwrap();
        user_name = String::from_utf8(decrypted_data).unwrap();
        id.remember(user_name.clone());
    }

    let mut res_user = UserTheme {
        name: "".to_owned(),
        theme: "theme-dark".to_owned(),
    };

    if user_name != "0" {
        let conn = db.get().await.unwrap();
        let row = &conn
            .query_one(
                r#"SELECT name, theme FROM users Where name=$1"#,
                &[&user_name],
            )
            .await
            .unwrap();

        res_user.name = row.get("name");
        res_user.theme = match row.get("theme") {
            Some(t) => t,
            None => "".to_owned(),
        }
    }

    HttpResponse::Ok().json(res_user)
}

///用户设置页面
pub async fn user_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("0".to_owned());
    let mut phone = "".to_owned();

    if user_name != "0" {
        let conn = db.get().await.unwrap();
        let row = &conn
            .query_one(r#"SELECT phone FROM users Where name=$1"#, &[&user_name])
            .await
            .unwrap();

        phone = match row.get("phone") {
            Some(phone) => phone,
            None => "".to_owned(),
        }
    }

    let html = r2s(|o| userset(o, phone));
    HttpResponse::Ok().content_type("text/html").body(html)
}

/// 用户注册
#[post("/logon")]
pub async fn logon(db: web::Data<Pool>, user: web::Json<User>, id: Identity) -> HttpResponse {
    let conn: Client = db.get().await.unwrap();
    let rows = &conn
        .query(r#"SELECT name FROM users Where name=$1"#, &[&user.name])
        .await
        .unwrap();

    if !rows.is_empty() {
        HttpResponse::Ok().json(0)
    } else {
        let md5_pass = md5(user.password.clone(), SALT);

        &conn.execute(
            r#"INSERT INTO users (name, password) VALUES($1,$2)"#,
            &[&user.name, &md5_pass],
        );

        id.remember(user.name.clone());
        HttpResponse::Ok().json(user.name.clone())
    }
}

/// 用户登录
#[post("/login")]
pub async fn login(db: web::Data<Pool>, user: web::Json<User>, id: Identity) -> HttpResponse {
    let conn: Client = db.get().await.unwrap();
    static MAX_FAILED: i32 = 6;

    let row = &conn
        .query_one(r#"SELECT failed FROM users Where name=$1"#, &[&user.name])
        .await
        .unwrap();

    if let Some(one_row) = Some(row) {
        let mut failed: i32 = one_row.get("failed");

        if failed >= MAX_FAILED {
            HttpResponse::Ok().json(MAX_FAILED)
        } else {
            let md5_pass = md5(user.password.clone(), SALT);
            let rows = &conn
                .query(
                    r#"SELECT name FROM users Where name=$1 AND password=$2"#,
                    &[&user.name, &md5_pass],
                )
                .await
                .unwrap();

            if !rows.is_empty() {
                let mut name = "".to_owned();
                for row in rows {
                    name = row.get("name");
                }

                let encrypted_data = encrypt(name.as_bytes(), KEY, IV).ok().unwrap(); //将 name 用 aes 加密保存到前端存储
                &conn.execute(r#"UPDATE users SET failed=0 WHERE name=$1"#, &[&user.name]);

                id.remember(name);

                HttpResponse::Ok().json(encrypted_data)
            } else {
                failed += 1;
                &conn.execute(
                    r#"UPDATE users SET failed=$1 WHERE name=$2"#,
                    &[&failed, &user.name],
                );

                HttpResponse::Ok().json(MAX_FAILED - failed)
            }
        }
    } else {
        HttpResponse::Ok().json(-1)
    }
}

/// 退出登录
pub fn logout(id: Identity) -> HttpResponse {
    id.forget();
    HttpResponse::Found().json(1)
}

// 更改用户密码
// pub fn change_pass(
//     db: web::Data<Pool<PostgresConnectionManager<tokio_postgres::tls::NoTls>>>,
//     user: web::Json<ChangePass>,
//     id: Identity,
// ) -> HttpResponse {
//     let user_name = id.identity().unwrap_or("0".to_owned());

//     if user_name == "guest" || user_name == "0" {
//         return HttpResponse::Ok().json(0);
//     }

//     let mut conn = db.get().unwrap();
//     let salt_pass = md5(user.old_pass.clone(), SALT);

//     let rows = &conn
//         .query(
//             r#"SELECT name FROM users Where name=$1 AND password=$2"#,
//             &[&user_name, &salt_pass],
//         )
//         .unwrap();

//     if rows.is_empty() {
//         HttpResponse::Ok().json(0)
//     } else {
//         let new_pass = md5(user.new_pass.clone(), SALT);
//         &conn.execute(
//             r#"UPDATE users SET password=$1 WHERE name=$2"#,
//             &[&new_pass, &user_name],
//         );

//         HttpResponse::Ok().json(1)
//     }
// }

// ///设置手机号
// pub fn phone_number(
//     db: web::Data<Pool<PostgresConnectionManager<tokio_postgres::tls::NoTls>>>,
//     user: web::Json<Phone>,
//     id: Identity,
// ) -> HttpResponse {
//     let user_name = id.identity().unwrap_or("0".to_owned());
//     let mut conn = db.get().unwrap();

//     if user_name != "guest" && user_name != "0" {
//         &conn.execute(
//             r#"UPDATE users SET phone=$1 WHERE name=$2"#,
//             &[&user.phone_number, &user_name],
//         );
//     }

//     HttpResponse::Ok().json(1)
// }

// ///设置主题
// pub fn change_theme(
//     db: web::Data<Pool<PostgresConnectionManager<tokio_postgres::tls::NoTls>>>,
//     theme: web::Json<Theme>,
//     id: Identity,
// ) -> HttpResponse {
//     let user_name = id.identity().unwrap();
//     let mut conn = db.get().unwrap();
//     &conn.execute(
//         r#"UPDATE users SET theme=$1 WHERE name=$2"#,
//         &[&theme.name, &user_name],
//     );

//     HttpResponse::Ok().json(1)
// }

// ///找回密码
// pub fn forget_pass(
//     db: web::Data<Pool<PostgresConnectionManager<tokio_postgres::tls::NoTls>>>,
//     user: web::Json<User>,
// ) -> HttpResponse {
//     let mut conn = db.get().unwrap();
//     static MAX_PASS: i32 = 6;

//     let row = &conn
//         .query_one(
//             r#"SELECT name, phone, get_pass FROM users Where name=$1"#,
//             &[&user.name],
//         )
//         .unwrap();

//     if let Some(one_row) = Some(row) {
//         let user_name: String = one_row.get("name");
//         let phone: String = match one_row.get("phone") {
//             Some(phone) => phone,
//             None => "".to_owned(),
//         };
//         let mut get_pass: i32 = one_row.get("get_pass");

//         if phone == "" {
//             HttpResponse::Ok().json(-2)
//         } else if get_pass >= MAX_PASS {
//             HttpResponse::Ok().json(-3)
//         } else {
//             let words = "abcdefghijklmnpqrstuvwxyz123456789";
//             let mut new_pass = "".to_owned();

//             for _n in 1..5 {
//                 let num = rand::thread_rng().gen_range(0, 34);
//                 new_pass.push_str(&words[num..num + 1]);
//             }

//             let salt_pass = md5(new_pass.clone(), SALT);
//             get_pass += 1;

//             &conn.execute(
//                 r#"UPDATE users SET password=$1, get_pass=$3 WHERE name=$2"#,
//                 &[&salt_pass, &user_name, &get_pass],
//             );

//             let send = SendMessage {
//                 apikey: "011a9a2b503aa72978bd77ec4577a675".to_owned(),
//                 mobile: phone,
//                 text: "【鼎传码行】密码已重置，新的密码为：".to_owned()
//                     + &new_pass
//                     + " ，请及时操作",
//             };

//             let client = reqwest::Client::new();
//             let _res = client
//                 .post("https://sms.yunpian.com/v2/sms/single_send.json")
//                 .form(&send)
//                 .send()
//                 .unwrap();

//             HttpResponse::Ok().json(MAX_PASS - get_pass)
//         }
//     } else {
//         HttpResponse::Ok().json(-1)
//     }
// }
