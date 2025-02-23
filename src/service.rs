use actix_files as fs;
use actix_identity::Identity;
use actix_web::{get, web, Error, HttpRequest};
use deadpool_postgres::Pool;
// use dotenv::dotenv;
// use reqwest::Client;
use rust_xlsxwriter::{Format, FormatAlign, Workbook};
use serde::{Deserialize, Serialize};
// use serde_json::json;
use std::collections::HashMap;
use std::io::{self, Write};
use tokio_postgres::Row;

pub static SPLITER: &str = "<`*_*`>";
pub static NOT_DEL_SQL: &str = " and 作废 = false";

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
pub async fn get_user(db: &web::Data<Pool>, id: Identity) -> UserData {
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

#[derive(Deserialize, Serialize)]
pub struct Fields {
    pub name: &'static str,
    pub width: i32,
}

/// ### 导出到 Excel
/// ```
/// // sql 语句中的字段名称与 fields 中的 name 一致
/// let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
/// // 注意最后一句无逗号
/// let f_str = r#"[
///     {"name": "序号", "width": 6},
///     {"name": "名称", "width": 12},
///     {"name": "长度", "width": 10},
///     {"name": "备注", "width": 15}
/// ]"#;
/// let fields = serde_json::from_str(f_str).unwrap();
/// out_excel("入库明细表", fields, rows.as_ref());
/// ```
pub fn out_excel(name: &str, fields: Vec<Fields>, rows: &Vec<Row>) {
    let file_name = format!("./download/{}.xlsx", name);
    let mut wb = Workbook::new();
    let sheet = wb.add_worksheet().set_name("数据").unwrap();

    let format = Format::new().set_align(FormatAlign::Center).set_bold();
    let format2 = Format::new().set_align(FormatAlign::Center);

    let mut n = 0;
    for f in &fields {
        sheet.write_with_format(0, n, f.name, &format).unwrap();
        sheet.set_column_width(n, f.width).unwrap();
        n += 1;
    }

    let mut n = 1u32;
    for row in rows {
        let mut m = 0u16;
        for f in &fields {
            let name: &str = row.get(&*f.name);
            sheet.write_with_format(n, m, name, &format2).unwrap();
            m += 1;
        }
        n += 1;
    }

    wb.save(file_name).unwrap();
}

///下载文件服务
#[get("/download/{filename:.*}")]
pub async fn serve_download(req: HttpRequest) -> Result<fs::NamedFile, Error> {
    let path = req.match_info().query("filename");
    Ok(fs::NamedFile::open(format!("./download/{}", path)).unwrap())
}

///反馈
#[get("/answer")]
pub async fn answer() -> String {
    "ok".to_owned()
}

// #[post("/translate")]
// pub async fn translate(data: String) -> HttpResponse {
//     HttpResponse::Ok().json(trans(&data).await)
// }

// // 翻译中文为英文
// async fn trans(chinese_text: &str) -> String {
//     dotenv().ok();
//     let api_key = dotenv::var("api_key").unwrap();
//     let client = Client::new();

//     let request_body = json!({
//         "model": "google/gemini-2.0-flash-exp:free",
//         "messages": [
//             {
//                 "role": "system",
//                 "content": "你是一个翻译助手，请将输入的中文翻译成英文。只需返回英文即可，无需其他解释。遇到标点符号，请照原样翻译"
//             },
//             {
//                 "role": "user",
//                 "content": chinese_text
//             }
//         ]
//     });

//     let response = client
//         .post("https://openrouter.ai/api/v1/chat/completions")
//         .header("Authorization", format!("Bearer {}", api_key))
//         .header("Content-Type", "application/json")
//         .json(&request_body)
//         .send()
//         .await
//         .unwrap();

//     let response_json: serde_json::Value = response.json().await.unwrap();

//     let translated_text = response_json["choices"][0]["message"]["content"]
//         .as_str()
//         .unwrap_or("翻译失败");

//     translated_text.to_owned()
// }
