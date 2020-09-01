use crate::service::{get_user, UserData};
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use crypto::digest::Digest;
use crypto::md5::Md5;
use deadpool_postgres::{Client, Pool};
use rand::Rng;
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

///获取 md5 码
fn md5(password: String, salt: &str) -> String {
    let mut hasher = Md5::new(); //将密码转成 md5
    let salt_pass = password + salt;
    hasher.input_str(&salt_pass);
    hasher.result_str()
}

/// 用户注册
#[post("/logon")]
pub async fn logon(db: web::Data<Pool>, user: web::Json<User>, id: Identity) -> HttpResponse {
    let conn: Client = db.get().await.unwrap();
    let rows = &conn
        .query(r#"SELECT name FROM 用户 Where name=$1"#, &[&user.name])
        .await
        .unwrap();

    if !rows.is_empty() {
        HttpResponse::Ok().json(0)
    } else {
        let md5_pass = md5(user.password.clone(), SALT);

        &conn
            .execute(
                r#"INSERT INTO 用户 (name, password) VALUES($1,$2)"#,
                &[&user.name, &md5_pass],
            )
            .await
            .unwrap();

        id.remember(user.name.clone());
        HttpResponse::Ok().json(user.name.clone())
    }
}

/// 用户登录
#[post("/login")]
pub async fn login(db: web::Data<Pool>, user: web::Json<User>, id: Identity) -> HttpResponse {
    let conn: Client = db.get().await.unwrap();
    static MAX_FAILED: i32 = 6;

    let rows = &conn
        .query(
            r#"SELECT confirm, failed FROM 用户 Where name=$1"#,
            &[&user.name],
        )
        .await
        .unwrap();

    if !rows.is_empty() {
        let mut failed = -1i32;
        let mut confirmed = false;
        for row in rows {
            failed = row.get("failed");
            confirmed = row.get("confirm");
        }

        if !confirmed {
            HttpResponse::Ok().json(-2)
        } else if failed >= MAX_FAILED {
            HttpResponse::Ok().json(MAX_FAILED)
        } else {
            let md5_pass = md5(user.password.clone(), SALT);
            let mut name = "".to_owned();

            let rows = &conn
                .query(
                    r#"SELECT name FROM 用户 Where name=$1 AND password=$2"#,
                    &[&user.name, &md5_pass],
                )
                .await
                .unwrap();
            if !rows.is_empty() {
                for row in rows {
                    name = row.get("name");
                }

                // let encrypted_data = encrypt(name.as_bytes(), KEY, IV).ok().unwrap(); //将 name 用 aes 加密保存到前端存储
                &conn
                    .execute(r#"UPDATE 用户 SET failed=0 WHERE name=$1"#, &[&user.name])
                    .await
                    .unwrap();

                id.remember(name);

                HttpResponse::Ok().json("succeed")
            } else {
                failed += 1;
                &conn
                    .execute(
                        r#"UPDATE 用户 SET failed=$1 WHERE name=$2"#,
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
pub fn logout(id: Identity) -> HttpResponse {
    id.forget();
    HttpResponse::Found().header("location", "/login").finish()
}

///更改用户密码
#[post("/change_pass")]
pub async fn change_pass(
    db: web::Data<Pool>,
    user: web::Json<ChangePass>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    let user_get: UserData;

    if user_name == "" {
        return HttpResponse::Ok().json(0);
    } else {
        user_get = get_user(db.clone(), user_name.clone()).await;
    }

    if user_get.name == "" {
        return HttpResponse::Ok().json(0);
    }

    let conn = db.get().await.unwrap();
    let salt_pass = md5(user.old_pass.clone(), SALT);

    let rows = &conn
        .query(
            r#"SELECT name FROM 用户 Where name=$1 AND password=$2"#,
            &[&user_name.clone(), &salt_pass],
        )
        .await
        .unwrap();

    if rows.is_empty() {
        HttpResponse::Ok().json(0)
    } else {
        let new_pass = md5(user.new_pass.clone(), SALT);
        &conn
            .execute(
                r#"UPDATE 用户 SET password=$1 WHERE name=$2"#,
                &[&new_pass, &user_name],
            )
            .await
            .unwrap();

        HttpResponse::Ok().json(1)
    }
}

///设置手机号
#[post("/phone_number")]
pub async fn phone_number(
    db: web::Data<Pool>,
    user: web::Json<Phone>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    let user_get: UserData;

    if user_name == "" {
        return HttpResponse::Ok().json(0);
    } else {
        user_get = get_user(db.clone(), user_name.clone()).await;
    }

    if user_get.name == "" {
        return HttpResponse::Ok().json(0);
    }

    let conn = db.get().await.unwrap();

    &conn
        .execute(
            r#"UPDATE 用户 SET phone=$1 WHERE name=$2"#,
            &[&user.phone_number, &user_name],
        )
        .await
        .unwrap();

    HttpResponse::Ok().json(1)
}

///设置主题
pub async fn change_theme(
    db: web::Data<Pool>,
    theme: web::Json<Theme>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap();
    let conn = db.get().await.unwrap();
    &conn
        .execute(
            r#"UPDATE 用户 SET theme=$1 WHERE name=$2"#,
            &[&theme.name, &user_name],
        )
        .await
        .unwrap();

    HttpResponse::Ok().json(1)
}

///找回密码
#[post("/forget_pass")]
pub async fn forget_pass(db: web::Data<Pool>, user: web::Json<User>) -> HttpResponse {
    let conn = db.get().await.unwrap();
    static MAX_PASS: i32 = 6;

    let rows = &conn
        .query(
            r#"SELECT name, phone, get_pass FROM 用户 Where name=$1 AND confirm=true"#,
            &[&user.name],
        )
        .await
        .unwrap();

    if rows.is_empty() {
        HttpResponse::Ok().json(-1)
    } else {
        let mut user_name = "".to_owned();
        let mut phone = "".to_owned();
        let mut get_pass = 0i32;

        for row in rows {
            user_name = row.get("name");
            phone = row.get("phone");
            get_pass = row.get("get_pass");
        }

        if phone == "" {
            HttpResponse::Ok().json(-2)
        } else if get_pass >= MAX_PASS {
            HttpResponse::Ok().json(-3)
        } else {
            let words = "abcdefghijklmnpqrstuvwxyz123456789";
            let mut new_pass = "".to_owned();

            for _n in 1..5 {
                let num = rand::thread_rng().gen_range(0, 34);
                new_pass.push_str(&words[num..num + 1]);
            }

            let salt_pass = md5(new_pass.clone(), SALT);
            get_pass += 1;

            &conn
                .execute(
                    r#"UPDATE 用户 SET password=$1, get_pass=$3 WHERE name=$2"#,
                    &[&salt_pass, &user_name, &get_pass],
                )
                .await
                .unwrap();

            let send = SendMessage {
                apikey: "011a9a2b503aa72978bd77ec4577a675".to_owned(),
                mobile: phone,
                text: "【鼎传码行】密码已重置，新的密码为：".to_owned()
                    + &new_pass
                    + " ，请及时操作",
            };

            let client = reqwest::Client::new();
            let _res = client
                .post("https://sms.yunpian.com/v2/sms/single_send.json")
                .form(&send)
                .send()
                .unwrap();

            HttpResponse::Ok().json(MAX_PASS - get_pass)
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct PostData {
    pub name: String,
    pub page: i32,
    pub sort: String,
    pub rec: i32,
}

///获取用户
#[post("/fetch_users")]
pub async fn fetch_users(
    db: web::Data<Pool>,
    post_data: web::Json<PostData>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let user = get_user(db.clone(), user_name).await;
        if user.name != "" && user.rights.contains("用户设置") {
            let conn = db.get().await.unwrap();
            let skip = (post_data.page - 1) * post_data.rec;
            let sql = format!("SELECT name, phone, rights, confirm FROM 用户 WHERE name LIKE '{}%' ORDER BY {} OFFSET {} LIMIT {} ", 
            post_data.name, post_data.sort, skip, post_data.rec);
            let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

            let mut users: Vec<UserData> = Vec::new();

            for row in rows {
                let user = UserData {
                    name: row.get("name"),
                    phone: row.get("phone"),
                    rights: row.get("rights"),
                    confirm: row.get("confirm"),
                    get_pass: 0,
                };

                users.push(user);
            }

            let rows = &conn
                .query(
                    r#"SELECT count(name) as 记录数 FROM 用户 WHERE name LIKE $1 || '%'"#,
                    &[&post_data.name],
                )
                .await
                .unwrap();

            let mut count: i64 = 0;
            for row in rows {
                count = row.get("记录数");
            }
            let pages = (count as f64 / post_data.rec as f64).ceil() as i32;
            HttpResponse::Ok().json((users, count, pages))
        } else {
            HttpResponse::Ok().json(-1)
        }
    } else {
        HttpResponse::Ok().json(-1)
    }
}
