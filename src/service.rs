use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{self, Write};

pub static SPLITER: &str = "<`*_*`>";

#[derive(Deserialize)]
pub struct SearchCate {
    pub s: String,
    pub cate: String,
}

#[derive(Deserialize, Serialize)]
pub struct UserData {
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
pub async fn get_user(db: web::Data<Pool>, id: Identity) -> UserData {
    let mut user = UserData {
        username: "".to_owned(),
        company: "".to_owned(),
        get_pass: 0,
    };

    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let rows = &conn
            .query(
                r#"SELECT username, 名称, 6-get_pass as get_pass 
                FROM customers WHERE username=$1"#,
                &[&user_name],
            )
            .await
            .unwrap();

        if rows.is_empty() {
            user
        } else {
            for row in rows {
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

//从前端传过来字符串数组，按显示字段，组合成 update 语句。供更新数据用
//参数：n 是字段名数组的偏移量
pub fn build_sql_for_update(
    field_names: Vec<&str>,
    mut sql: String,
    fields: Vec<FieldsData>,
    n: usize,
) -> String {
    for i in 0..fields.len() {
        if fields[i].data_type == "文本" {
            sql += &format!("{}='{}',", fields[i].field_name, field_names[i + n]);
        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
            sql += &format!("{}={},", fields[i].field_name, field_names[i + n]);
        } else {
            let op: Vec<&str> = fields[i].option_value.split("_").collect();
            let val = if field_names[i + n] == op[0] || field_names[i + n] == "true" {
                true
            } else {
                false
            };
            sql += &format!("{}={},", fields[i].field_name, val);
        }
    }
    sql
}

//获取环境文件中的起始日期
#[post("/start_date")]
pub async fn start_date() -> HttpResponse {
    dotenv().ok();
    HttpResponse::Ok().json(dotenv::var("start").unwrap())
}
