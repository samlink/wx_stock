use actix_files as fs;
use actix_identity::Identity;
use actix_web::{get, post, web, Error, HttpRequest, HttpResponse};
use deadpool_postgres::Pool;
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{self, Write};

pub static SPLITER: &str = "<`*_*`>";

#[derive(Deserialize, Serialize)]
pub struct UserData {
    pub id: i32,
    pub username: String,
    pub company: String,
    pub get_pass: i32,
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
    pub user: String,
}

//自动完成使用
#[derive(Deserialize, Serialize)]
pub struct Message {
    pub id: String,
    pub label: String,
}

//存放显示字段信息：字段名称，显示名称，数据类型，可选值，显示宽度
#[derive(Deserialize, Serialize, Debug)]
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
pub async fn get_user(db: web::Data<Pool>, id: Identity) -> UserData {
    let mut user = UserData {
        id: 0,
        username: "".to_owned(),
        company: "".to_owned(),
        get_pass: 0,
    };

    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let rows = &conn
            .query(
                r#"SELECT id, username, 名称, 6-get_pass as get_pass 
                FROM customers WHERE username=$1"#,
                &[&user_name],
            )
            .await
            .unwrap();

        if rows.is_empty() {
            user
        } else {
            for row in rows {
                user.id = row.get("id");
                user.username = row.get("username");
                user.company = row.get("名称");
                user.get_pass = row.get("get_pass");
            }
            user
        }
    } else {
        user
    }
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

//获取编辑用的显示字段 is_show
pub async fn get_fields(db: web::Data<Pool>, table_name: &str) -> Vec<FieldsData> {
    let conn = db.get().await.unwrap();
    let rows = &conn
        .query(
            r#"SELECT field_name, show_name, data_type, ctr_type, option_value, default_value, show_width, all_edit
                    FROM tableset WHERE table_name=$1 AND is_show=true ORDER BY show_order"#,
            &[&table_name],
        )
        .await
        .unwrap();

    return_fields(rows)
}

//返回字段数组，内部辅助函数
fn return_fields(rows: &Vec<tokio_postgres::Row>) -> Vec<FieldsData> {
    let mut fields: Vec<FieldsData> = Vec::new();
    for row in rows {
        let data = FieldsData {
            field_name: row.get("field_name"),
            show_name: row.get("show_name"),
            data_type: row.get("data_type"),
            ctr_type: row.get("ctr_type"),
            option_value: row.get("option_value"),
            default_value: row.get("default_value"),
            show_width: row.get("show_width"),
            all_edit: row.get("all_edit"),
        };

        fields.push(data);
    }

    fields
}

//将数据库查询结果字段组合成字符串，即是内部辅助函数，也可外部调用
pub fn simple_string_from_base(row: &tokio_postgres::Row, fields: &Vec<FieldsData>) -> String {
    let mut product = "".to_owned();
    for f in fields {
        if f.data_type == "文本" {
            let s: String = row.get(&*f.field_name);
            let s1 = if s != "" { s } else { " ".to_owned() };
            product += &format!("{}{}", s1, SPLITER);
        } else if f.data_type == "整数" {
            let num: i32 = row.get(&*f.field_name);
            product += &format!("{}{}", num, SPLITER);
        } else if f.data_type == "实数" {
            let num: f64 = row.get(&*f.field_name);
            product += &format!("{}{}", num, SPLITER);
        } else {
            let op: Vec<&str> = f.option_value.split("_").collect();
            let b: bool = row.get(&*f.field_name);
            let val = if b == true { op[0] } else { op[1] };
            product += &format!("{}{}", val, SPLITER);
        }
    }

    product
}

//将显示字段拼接成导出 excel 用的查询语句
pub fn build_sql_for_excel(mut sql: String, fields: &Vec<&FieldsData>, table: String) -> String {
    for f in fields {
        if f.data_type == "文本" {
            sql += &format!("{}.{},", table, f.field_name);
        } else if f.data_type == "整数" || f.data_type == "实数" {
            sql += &format!("cast({}.{} as VARCHAR),", table, f.field_name);
        } else {
            let op: Vec<&str> = f.option_value.split("_").collect();
            sql += &format!(
                "case when {}.{} then '{}' else '{}' end as {},",
                table, f.field_name, op[0], op[1], f.field_name
            );
        }
    }
    sql
}

///下载文件服务
#[get("/download/{filename:.*}")]
pub async fn serve_download(req: HttpRequest) -> Result<fs::NamedFile, Error> {
    let path = req.match_info().query("filename");
    Ok(fs::NamedFile::open(format!("./download/{}", path)).unwrap())
}

//获取环境文件中的起始日期
#[post("/start_date")]
pub async fn start_date() -> HttpResponse {
    dotenv().ok();
    HttpResponse::Ok().json(dotenv::var("start").unwrap())
}
