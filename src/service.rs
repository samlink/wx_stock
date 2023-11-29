use actix_files as fs;
use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::Either;
use actix_web::{get, post, web, Error, HttpRequest, HttpResponse};
use deadpool_postgres::Pool;
use dotenv::dotenv;
use futures::{StreamExt, TryStreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{self, Write};
use time::now;

pub static SPLITER: &str = "<`*_*`>";

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

///静态文件服务
// pub fn serve_static(file: web::Path<File>) -> HttpResponse {
//     if let Some(data) = statics::StaticFile::get(&file.name) {
//         HttpResponse::Ok().body(data.content)
//     } else {
//         HttpResponse::NotFound().into()
//     }
// }

// 自动生成单号
pub async fn get_dh(db: web::Data<Pool>, doc_data: &str) -> String {
    let conn = db.get().await.unwrap();
    let dh_pre = if doc_data == "商品采购" {
        "CG"
    } else if doc_data == "采购退货" {
        "CT"
    } else if doc_data == "商品销售" {
        "XS"
    } else if doc_data == "销售退货" {
        "XT"
    } else if doc_data == "材料入库" {
        "RK"
    } else if doc_data == "材料出库" {
        "CK"
    } else {
        "KT"
    };

    let date_string = now().strftime("%Y-%m-%d").unwrap().to_string();
    let local: Vec<&str> = date_string.split("-").collect();

    let date = format!("{}{}{}-", dh_pre, local[0], local[1]);  //按月

    //获取尾号
    let sql = format!(
        "SELECT COALESCE(max(单号),'0') as 单号 FROM documents WHERE 单号 like '{}%'",
        dh_pre
    );

    let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

    let mut dh_first = "".to_owned();
    
    for row in rows {
        dh_first = row.get("单号");
    }

    let keep = 2usize;
    let len = dh_first.len();
    let mut num = 1i32;
    if dh_first != "0" {
        if let Some(n) = dh_first.get(len - keep..len) {
            if dh_first == format!("{}{}", date, n) {
                num = n.parse::<i32>().unwrap() + 1;
            }
        }
    }

    return format!("{}{:0pad$}", date, num, pad = keep);
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

//获取小数位数设置
pub async fn get_fraction(db: web::Data<Pool>) -> String {
    let conn = db.get().await.unwrap();
    let rows = &conn
        .query(r#"SELECT value FROM system WHERE id=1 OR id=2"#, &[])
        .await
        .unwrap();

    let mut num_position = "".to_owned();
    for row in rows {
        let s: String = row.get("value");
        num_position += &format!("{},", s);
    }

    num_position
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

//获取出入库用的显示字段 is_show
pub async fn get_inout_fields(db: web::Data<Pool>, table_name: &str) -> Vec<FieldsData> {
    let conn = db.get().await.unwrap();
    let rows = &conn
        .query(
            r#"SELECT field_name, show_name, data_type, ctr_type, option_value, default_value, show_width, all_edit 
                FROM tableset WHERE table_name=$1 AND inout_show=true ORDER BY inout_order"#,
            &[&table_name],
        )
        .await
        .unwrap();

    return_fields(rows)
}

//获取出入库用使用的全部字段 is_use
pub async fn get_used_fields(db: web::Data<Pool>, table_name: &str) -> Vec<FieldsData> {
    let conn = db.get().await.unwrap();
    let rows = &conn
        .query(
            r#"SELECT field_name, show_name, data_type, ctr_type, option_value, default_value, show_width, all_edit 
                FROM tableset WHERE table_name=$1 AND is_use=true ORDER BY show_order"#,
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

//从数据库读取数据后，按显示字段，组合成字符串数组。返回给前端
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
            let s1 = if s != "" { s } else { " ".to_owned() };
            product += &format!("{}{}", s1, SPLITER);
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

//从前端传过来字符串数组，按显示字段，组合成 insert 语句。供追加数据用
//参数：n 是字段名数组的偏移量，即从第 n 个元素算起，才是自定义字段
pub fn build_sql_for_insert(
    field_names: Vec<&str>,
    mut sql: String,
    fields: Vec<FieldsData>,
    n: usize,
) -> String {
    for i in 0..fields.len() {
        if fields[i].data_type == "文本" {
            sql += &format!("'{}',", field_names[i + n]);
        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数" {
            sql += &format!("{},", field_names[i + n]);
        } else {
            let op: Vec<&str> = fields[i].option_value.split("_").collect();
            let val = if field_names[i + n] == op[0] || field_names[i + n] == "true" {
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

#[post("/start_date")]
pub fn start_date() -> HttpResponse {
    dotenv().ok();
    HttpResponse::Ok().json(dotenv::var("start").unwrap())
}
