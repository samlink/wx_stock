use actix_files as fs;
use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::Either;
use actix_web::{get, post, web, Error, HttpRequest, HttpResponse};
use deadpool_postgres::Pool;
use futures::{StreamExt, TryStreamExt};
use serde::{Deserialize, Serialize};
use std::io::{self, Write};

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

pub static SPLITER: &str = "<`*_*`>";

#[derive(Deserialize)]
pub struct File {
    name: String,
}

//自动完成搜索字符串
#[derive(Deserialize)]
pub struct Search {
    pub s: String,
}

#[derive(Deserialize)]
pub struct SearchCate {
    pub s: String,
    pub cate: String,
}

#[derive(Deserialize, Serialize)]
pub struct UserData {
    pub name: String,
    pub phone: String,
    pub get_pass: i32,
    pub rights: String,
    pub confirm: bool,
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

//自动完成使用
#[derive(Deserialize, Serialize)]
pub struct Message {
    pub id: i32,
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

///静态文件服务
// pub fn serve_static(file: web::Path<File>) -> HttpResponse {
//     if let Some(data) = statics::StaticFile::get(&file.name) {
//         HttpResponse::Ok().body(data.content)
//     } else {
//         HttpResponse::NotFound().into()
//     }
// }

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
        Either::A(Ok(
            fs::NamedFile::open(format!("./download/{}", path)).unwrap()
        ))
    } else {
        Either::B(Ok("你没有权限下载该文件"))
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

///获取一条空记录，用于无数据表格初始化
#[post("/fetch_blank")]
pub fn fetch_blank() -> HttpResponse {
    let v: Vec<i32> = Vec::new();
    HttpResponse::Ok().json((v, 0, 0))
}

//上传文件保存
pub async fn save_file(mut payload: Multipart) -> Result<String, Error> {
    let path = "./upload/upload_in.xlsx".to_owned();
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

//获取编辑用的显示字段，非全部字段
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

//获取出入库用的显示字段，非全部字段
pub async fn get_inout_fields(db: web::Data<Pool>, table_name: &str) -> Vec<FieldsData> {
    let conn = db.get().await.unwrap();
    let rows = &conn
        .query(
            r#"SELECT field_name, show_name, data_type, ctr_type, option_value, default_value, show_width, all_edit 
                FROM tableset WHERE table_name=$1 AND is_show=true AND inout_show=true ORDER BY inout_order"#,
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

//从数据库读取数据后，按显示字段，组合成字符串数组。以返回给前端
pub fn build_string_from_base(
    rows: &Vec<tokio_postgres::Row>,
    fields: Vec<FieldsData>,
) -> Vec<String> {
    let mut products = Vec::new();
    for row in rows {
        let mut product = "".to_owned();
        let num: i32 = row.get("id"); //字段顺序已与前端配合一致，后台不可自行更改
        product += &format!("{}{}", num, SPLITER);
        let num: i64 = row.get("序号");
        product += &format!("{}{}", num, SPLITER);

        product += &simple_string_from_base(row, &fields);

        products.push(product);
    }
    products
}

//将数据库查询结果字段组合成字符串，即是内部辅助函数，也可外部调用
pub fn simple_string_from_base(row: &tokio_postgres::Row, fields: &Vec<FieldsData>) -> String {
    let mut product = "".to_owned();
    for f in fields {
        if f.data_type == "文本" {
            let s: String = row.get(&*f.field_name);
            product += &format!("{}{}", s, SPLITER);
        } else if f.data_type == "整数" {
            let num: i32 = row.get(&*f.field_name);
            product += &format!("{}{}", num, SPLITER);
        } else if f.data_type == "实数" {
            let num: f32 = row.get(&*f.field_name);
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
pub fn build_sql_for_update(
    field_names: Vec<&str>,
    mut sql: String,
    fields: Vec<FieldsData>,
) -> String {
    for i in 0..fields.len() {
        if fields[i].data_type == "文本" {
            sql += &format!("{}='{}',", fields[i].field_name, field_names[i + 2]);
        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
            sql += &format!("{}={},", fields[i].field_name, field_names[i + 2]);
        } else {
            let op: Vec<&str> = fields[i].option_value.split("_").collect();
            let val = if field_names[i + 2] == op[0] {
                true
            } else {
                false
            };
            sql += &format!("{}={},", fields[i].field_name, val);
        }
    }
    sql
}

//从前端传过来字符串数组，按显示字段，组合成 insert 语句。供追加数据用
pub fn build_sql_for_insert(
    field_names: Vec<&str>,
    mut sql: String,
    fields: Vec<FieldsData>,
) -> String {
    for i in 0..fields.len() {
        if fields[i].data_type == "文本" {
            sql += &format!("'{}',", field_names[i + 2]);
        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
            sql += &format!("{},", field_names[i + 2]);
        } else {
            let op: Vec<&str> = fields[i].option_value.split("_").collect();
            let val = if field_names[i + 2] == op[0] {
                true
            } else {
                false
            };
            sql += &format!("{},", val);
        }
    }
    sql
}

//将显示字段拼接成导出 excel 用的查询语句
pub fn build_sql_for_excel(mut sql: String, fields: &Vec<FieldsData>) -> String {
    for f in fields {
        if f.data_type == "文本" {
            sql += &format!("{},", f.field_name);
        } else if f.data_type == "整数" || f.data_type == "实数" {
            sql += &format!("cast({} as VARCHAR),", f.field_name);
        } else {
            let op: Vec<&str> = f.option_value.split("_").collect();
            sql += &format!(
                "case when {} then '{}' else '{}' end as {},",
                f.field_name, op[0], op[1], f.field_name
            );
        }
    }
    sql
}

//各个功能页面获取帮助信息
#[post("/fetch_help")]
pub async fn fetch_help(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let mut information: Vec<String> = Vec::new();

        let sql = format!(
            "SELECT tips FROM help WHERE page_name='{}' ORDER BY show_order",
            data
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        for row in rows {
            let info: String = row.get("tips");
            information.push(info);
        }

        HttpResponse::Ok().json(information)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
