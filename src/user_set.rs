use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use crypto::digest::Digest;
use crypto::md5::Md5;
use deadpool_postgres::{Client, Pool};
// use dotenv::dotenv;
use serde::{Deserialize, Serialize};

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
static MAX_FAILED: i32 = 6;

///获取 md5 码
fn md5(password: String, salt: &str) -> String {
    let mut hasher = Md5::new(); //将密码转成 md5
    let salt_pass = password + salt;
    hasher.input_str(&salt_pass);
    hasher.result_str()
}

/// 用户登录
#[post("/login")]
pub async fn login(db: web::Data<Pool>, user: web::Json<User>, id: Identity) -> HttpResponse {
    let conn: Client = db.get().await.unwrap();

    let rows = &conn
        .query(
            r#"SELECT failed FROM customers Where username=$1"#,
            &[&user.name],
        )
        .await
        .unwrap();

    if !rows.is_empty() {
        let mut failed = -1i32;
        for row in rows {
            failed = row.get("failed");
        }

        if failed >= MAX_FAILED {
            HttpResponse::Ok().json(MAX_FAILED)
        } else {
            let md5_pass = md5(user.password.clone(), SALT);
            let mut name = "".to_owned();

            let rows = &conn
                .query(
                    r#"SELECT username FROM customers Where username=$1 AND password=$2;"#,
                    &[&user.name, &md5_pass],
                )
                .await
                .unwrap();

            if !rows.is_empty() {
                for row in rows {
                    name = row.get("username");
                }

                // let encrypted_data = encrypt(name.as_bytes(), KEY, IV).ok().unwrap(); //将 name 用 aes 加密保存到前端存储
                let _ = &conn
                    .execute(
                        r#"UPDATE customers SET failed=0 WHERE username=$1"#,
                        &[&user.name],
                    )
                    .await
                    .unwrap();

                id.remember(name);

                HttpResponse::Ok().json("succeed")
            } else {
                failed += 1;
                let _ = &conn
                    .execute(
                        r#"UPDATE customers SET failed=$1 WHERE username=$2"#,
                        &[&failed, &user.name],
                    )
                    .await
                    .unwrap();

                HttpResponse::Ok().json(MAX_FAILED - failed)
            }
        }
    } else {
        HttpResponse::Ok().json(-1)
    }
}

/// 退出登录
#[get("/logout")]
pub async fn logout(id: Identity) -> HttpResponse {
    id.forget();
    HttpResponse::Found()
        .append_header(("location", "/stock/login"))
        .finish()
}

///更改用户密码
#[post("/change_pass")]
pub async fn change_pass(
    db: web::Data<Pool>,
    user: web::Json<ChangePass>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());    
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let salt_pass = md5(user.old_pass.clone(), SALT);

        let rows = &conn
            .query(
                r#"SELECT username FROM customers Where username=$1 AND password=$2"#,
                &[&user_name, &salt_pass],
            )
            .await
            .unwrap();

        if rows.is_empty() {
            HttpResponse::Ok().json(0)
        } else {
            let new_pass = md5(user.new_pass.clone(), SALT);
            let _ = &conn
                .execute(
                    r#"UPDATE customers SET password=$1 WHERE username=$2"#,
                    &[&new_pass, &user_name],
                )
                .await
                .unwrap();

            HttpResponse::Ok().json(1)
        }
    } else {
        return HttpResponse::Ok().json(0);
    }
}

