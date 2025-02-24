use actix_files as fs;
use actix_identity::Identity;
use actix_web::{get, post, web, Error, HttpRequest, HttpResponse};
use deadpool_postgres::Pool;
use dotenv::dotenv;
use reqwest::Client;
use rust_xlsxwriter::{Format, FormatAlign, Workbook};
use serde::{Deserialize, Serialize};
use serde_json::json;
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
pub fn out_excel(
    name: &str,
    title: &Vec<Fields>,
    fields: &Vec<Fields>,
    rows: &Vec<Row>,
    lang: &str,
) {
    let file_name = format!("./download/{}.xlsx", name);
    let mut wb = Workbook::new();
    let sheet = wb.add_worksheet().set_name("数据").unwrap();

    let format = Format::new().set_align(FormatAlign::Center).set_bold();
    let format2 = Format::new().set_align(FormatAlign::Center);

    let mut n = 0;

    if lang == "zh" {
        for f in fields {
            sheet.write_with_format(0, n, f.name, &format).unwrap();
            sheet.set_column_width(n, f.width).unwrap();
            n += 1;
        }
    } else {
        for f in title {
            sheet.write_with_format(0, n, f.name, &format).unwrap();
            sheet.set_column_width(n, f.width).unwrap();
            n += 1;
        }
    }

    let mut n = 1u32;
    if lang == "zh" {
        for row in rows {
            let mut m = 0u16;
            for f in fields {
                let name: &str = row.get(&*f.name);
                sheet.write_with_format(n, m, name, &format2).unwrap();
                m += 1;
            }
            n += 1;
        }
    } else {
        for row in rows {
            let mut m = 0u16;
            for f in fields {
                let mut name: String = row.get(&*f.name);

                // println!("name: {}, fields: {}", name, f.name);

                name = if f.name == "状态" {
                    status_to_en(&name)
                } else if f.name == "生产厂家" {
                    factor_to_en(&name)
                } else if f.name == "名称" {
                    if name == "圆钢" {
                        "Bar".to_owned()
                    } else {
                        "Pipe".to_owned()
                    }
                } else if f.name == "备注" {
                    "".to_owned()
                } else {
                    name
                };

                // println!("{}", name);

                sheet.write_with_format(n, m, name, &format2).unwrap();

                m += 1;
            }
            n += 1;
        }
    }

    wb.save(file_name).unwrap();
}

fn status_to_en(status: &str) -> String {
    let pairs = vec![
        ("圆钢", "Bar"),
        ("无缝钢管", "Pipe"),
        ("套管接箍料", "Casing Coupling"),
        ("调质", "Q&T"),
        ("固溶", "Solution"),
        ("时效", "Aging"),
        ("热轧", "Hot Rolled"),
        ("锻造态", "As-Forged"),
        ("锻造", "Forged"),
        ("未正火", "Untreated"),
        ("正回火", "Double Tempering"),
        ("未调", "Non-Q&T"),
        ("挤压", "Extruded"),
        ("退火", "Annealed"),
        ("态", "State"),
        ("固熔酸洗", "Solution Treatment and Pickling"),
        ("号钢", "Steel"),
        ("双", "Double"),
        ("非标", "Non-standard"),
        ("其他", "Others"),
    ];

    let status_map: HashMap<_, _> = pairs.into_iter().collect();
    let mut st = status.to_owned();

    for (key, value) in &status_map {
        st = st.replace(key, value);
    }

    st
}

fn factor_to_en(status: &str) -> String {
    let pairs2 = vec![
        ("中航上大", "AVIC Shangda"),
        ("上大", "Shangda"),
        ("靖江特殊钢", "Jingjiang Special Steel"),
        ("烟台华新", "Yantai Huaxin"),
        ("江阴兴澄", "Jiangyin Xingcheng"),
        ("抚顺特钢", "Fushun Special Steel"),
        ("抚钢", "Fugang"),
        ("达利普", "Dalipu"),
        ("本钢钢铁", "Benxi Steel"),
        ("本钢", "Bengang"),
        ("中兴热处理", "Zhongxing Heat Treatment"),
        ("天津钢管制造", "Tianjin Pipe Manufacturing"),
        ("衡钢", "Hengyang Steel"),
        ("新兴铸管", "Xinxing Ductile Iron Pipes"),
        ("劝诚特钢", "Quancheng Special Steel"),
        ("劝诚", "Quancheng"),
        ("重庆重材", "Chongqing Heavy Materials"),
        ("取芯材", "Coring Material"),
        ("上海沪崎金属", "Shanghai Huzaki Metal"),
        ("湖北新冶钢", "Hubei Xinye"),
        ("冶钢", "Yegang"),
        ("浙江华东", "Zhejiang Huadong"),
        ("威亚塑料", "Weiya Plastics"),
        ("重庆钢铁", "Chongqing Steel"),
        ("宝山钢铁", "Baosteel"),
        ("宝钢特种", "Baosteel Special"),
        ("山东海鑫达", "Haixinda"),
        ("海鑫达", "Haixinda"),
        ("石钢", "Shigang"),
        ("东北轻合金", "Northeast Light Alloy"),
        ("大冶特殊钢", "Daye Special Steel"),
        ("大冶特殊", "Daye Special"),
        ("大冶特钢", "Daye Spec Steel"),
        ("青海国鑫铝业", "Qinghai Guoxin Aluminum"),
        ("山东中正钢管", "Shandong Zhongzheng Steel Pipe"),
        ("大无缝", "Da Wufeng"),
        ("莱钢", "Laiwu Steel"),
        ("上海朝展金属", "Shanghai Chaozhan Metal"),
        ("江苏常宝", "Jiangsu Changbao"),
        ("常宝", "Changbao"),
        ("衡阳华菱", "Hengyang Hualing"),
        ("威晟", "Weisheng"),
        ("鑫禹泽", "Xinyuze"),
        ("西宁特钢", "Xining Special Steel"),
        ("大钢", "Dagang"),
        ("上海祥巨金属", "Shanghai Xiangju Metal"),
        ("北满", "Beiman"),
        ("兴澄特钢+浩运", "Xingcheng Special Steel"),
        ("钢管", "Pipe"),
        ("圆钢", "Bar"),
    ];

    let factor_map: HashMap<_, _> = pairs2.into_iter().collect();

    let mut st = status.to_owned();

    for (key, value) in &factor_map {
        st = st.replace(key, value);
    }

    st
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

#[post("/translate")]
pub async fn translate(data: String) -> HttpResponse {
    HttpResponse::Ok().json(trans(&data).await)
}

// 翻译中文为英文
async fn trans(chinese_text: &str) -> String {
    dotenv().ok();
    let api_key = dotenv::var("api_key").unwrap();
    let client = Client::new();

    let request_body = json!({
        "model": "qwen-plus",
        "messages": [
            { "role": "system", "content": "You are a helpful assistant." },
            { "role": "user", "content": format!("请将以下中文翻译成英文，不作解释：{}", chinese_text) }
        ]
    });

    let response = client
        .post("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .unwrap();

    let response_json: serde_json::Value = response.json().await.unwrap();

    // println!("{:?}", response_json);

    let translated_text = response_json["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("翻译失败");

    translated_text.to_owned()
}
