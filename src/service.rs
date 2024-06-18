use actix_files as fs;
use actix_identity::Identity;
use actix_web::Either;
use actix_web::{get, post, web, Error, HttpRequest, HttpResponse};
use deadpool_postgres::Pool;
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{self, Write};

pub static SPLITER: &str = "<`*_*`>";
pub static NOT_DEL_SQL: &str =" and 作废 = false";

#[derive(Deserialize)]
pub struct SearchCate {
    pub s: String,
    pub cate: String,
}


#[derive(Deserialize, Serialize)]
pub struct UserData {
    pub name: String,
    pub duty: String,
    pub phone: String,
    pub area: String,
    pub get_pass: i32,
    pub rights: String,
    pub confirm: bool,
    pub theme: String,
    pub show: String,
}

//表格分页、搜索和分类参数
#[derive(Deserialize, Serialize)]
pub struct TablePager {
    pub id: String,
    pub name: String,
    pub page: i32,
    pub sort: String,
    pub rec: i32,
    pub cate: String,
}

#[derive(Deserialize, Serialize)]
pub struct TablePagerExt {
    pub id: String,
    pub name: String,
    pub page: i32,
    pub sort: String,
    pub rec: i32,
    pub cate: String,
    pub filter: String,
}

//自动完成使用
#[derive(Deserialize, Serialize)]
pub struct Message {
    pub id: String,
    pub label: String,
}

//存放显示字段信息：字段名称，显示名称，数据类型，可选值，显示宽度
#[derive(Deserialize, Serialize)]
pub struct FieldsData {
    pub field_name: String,
    pub show_name: String,
    pub data_type: String,
    pub ctr_type: String,
    pub option_value: String,
    pub default_value: String,
    pub show_width: f32,
    pub all_edit: bool,
}


///下载文件服务
#[get("/download/{filename:.*}")]
pub async fn serve_download(
    req: HttpRequest,
    db: web::Data<Pool>,
    id: Identity,
) -> Either<Result<fs::NamedFile, Error>, Result<&'static str, Error>> {
    let user = get_user(db, id, "导出数据".to_owned()).await;
    if user.name != "" {
        let path = req.match_info().query("filename");
        Either::Left(Ok(
            fs::NamedFile::open(format!("./download/{}", path)).unwrap()
        ))
    } else {
        Either::Right(Ok("你没有权限下载该文件"))
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
/// right 如果是空串 "", 则不检查权限
pub async fn get_user(db: web::Data<Pool>, id: Identity, right: String) -> UserData {
    let mut user = UserData {
        name: "".to_owned(),
        duty: "".to_owned(),
        phone: "".to_owned(),
        area: "".to_owned(),
        get_pass: 0,
        rights: "".to_owned(),
        confirm: false,
        theme: "".to_owned(),
        show: "".to_owned(),
    };

    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let right = format!("%{}%", right);
        let rows = &conn
            .query(
                r#"SELECT name, duty, phone, area, 6-get_pass as get_pass, rights, confirm, theme 
                FROM users WHERE name=$1 AND confirm=true AND rights LIKE $2"#,
                &[&user_name, &right],
            )
            .await
            .unwrap();

        if rows.is_empty() {
            user
        } else {
            for row in rows {
                user.name = row.get("name");
                user.duty = row.get("duty");
                user.phone = row.get("phone");
                user.area = row.get("area");
                user.get_pass = row.get("get_pass");
                user.rights = row.get("rights");
                user.confirm = row.get("confirm");
                user.theme = row.get("theme");
            }
            user
        }
    } else {
        user
    }
}

//自动完成
pub async fn autocomplete(db: web::Data<Pool>, sql: &str) -> HttpResponse {
    let conn = db.get().await.unwrap();
    let rows = &conn.query(sql, &[]).await.unwrap();

    let mut data = Vec::new();
    for row in rows {
        let message = Message {
            id: row.get("id"),
            label: row.get("label"),
        };

        data.push(message);
    }

    HttpResponse::Ok().json(data)
}


//映射使用的字段 is_use
pub async fn map_fields(db: web::Data<Pool>, table_name: &str) -> HashMap<String, String> {
    let conn = db.get().await.unwrap();
    let rows = &conn
        .query(
            r#"SELECT field_name, show_name, data_type, ctr_type, option_value, default_value, show_width, all_edit
                    FROM tableset WHERE table_name=$1 AND is_use=true ORDER BY show_order"#,
            &[&table_name],
        )
        .await
        .unwrap();

    let mut f_map: HashMap<String, String> = HashMap::new();

    for row in rows {
        f_map.insert(row.get("show_name"), row.get("field_name"));
    }

    f_map
}

//获取环境文件中的起始日期
#[post("/start_date")]
pub async fn start_date() -> HttpResponse {
    dotenv().ok();
    HttpResponse::Ok().json(dotenv::var("start").unwrap())
}
