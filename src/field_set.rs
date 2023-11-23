use crate::service::get_user;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct FieldsReturn {
    pub id: i32,
    pub num: i64,
    pub field_name: String,
    pub data_type: String,
    pub show_name: String,
    pub show_width: f32,
    pub ctr_type: String,
    pub option_value: String,
    pub default_value: String,
    pub is_show: bool,
    pub show_order: i32,
    pub all_edit: bool,
    pub is_use: bool,
}

#[derive(Deserialize, Serialize)]
pub struct FieldsPost {
    name: String,
}

///获取表格全部字段
#[post("/fetch_fields")]
pub async fn fetch_fields(
    db: web::Data<Pool>,
    post_data: web::Json<FieldsPost>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(
            r#"SELECT id,field_name,data_type,show_name,show_width,ctr_type,option_value,default_value,
                is_show,show_order,all_edit,is_use, ROW_NUMBER () OVER (ORDER BY is_show desc, show_order) as 序号 
                FROM tableset WHERE table_name='{}' ORDER BY is_show desc, show_order"#,
            post_data.name
        );
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut fields: Vec<FieldsReturn> = Vec::new();

        for row in rows {
            let field = FieldsReturn {
                id: row.get("id"),
                num: row.get("序号"),
                field_name: row.get("field_name"),
                data_type: row.get("data_type"),
                show_name: row.get("show_name"),
                show_width: row.get("show_width"),
                ctr_type: row.get("ctr_type"),
                option_value: row.get("option_value"),
                default_value: row.get("default_value"),
                is_show: row.get("is_show"),
                show_order: row.get("show_order"),
                all_edit: row.get("all_edit"),
                is_use: row.get("is_use"),
            };

            fields.push(field);
        }

        let rows = &conn
            .query(
                r#"SELECT count(id) as 记录数 FROM tableset WHERE table_name=$1"#,
                &[&post_data.name],
            )
            .await
            .unwrap();

        let mut count: i64 = 0;
        for row in rows {
            count = row.get("记录数");
        }
        HttpResponse::Ok().json((fields, count))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct FieldsReturn2 {
    pub id: i32,
    pub num: i64,
    pub show_name: String,
    pub inout_show: bool,
    pub all_edit: bool,
}

///获取出入库显示字段
#[post("/fetch_fields2")]
pub async fn fetch_fields2(
    db: web::Data<Pool>,
    post_data: web::Json<FieldsPost>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(
            r#"SELECT id,show_name,inout_show,all_edit, ROW_NUMBER () OVER (ORDER BY all_edit, inout_show desc, inout_order) as 序号 
                FROM tableset WHERE table_name='{}' AND is_use=true ORDER BY all_edit, inout_show desc, inout_order"#,
            post_data.name
        );
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut fields: Vec<FieldsReturn2> = Vec::new();

        for row in rows {
            let field = FieldsReturn2 {
                id: row.get("id"),
                num: row.get("序号"),
                show_name: row.get("show_name"),
                inout_show: row.get("inout_show"),
                all_edit: row.get("all_edit"),
            };

            fields.push(field);
        }

        let rows = &conn
            .query(
                r#"SELECT count(id) as 记录数 FROM tableset WHERE table_name=$1 AND is_show=true"#,
                &[&post_data.name],
            )
            .await
            .unwrap();

        let mut count: i64 = 0;
        for row in rows {
            count = row.get("记录数");
        }
        HttpResponse::Ok().json((fields, count))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct FieldsData {
    pub id: i32,
    pub show_name: String,
    pub show_width: f32,
    pub ctr_type: String,
    pub option_value: String,
    pub default_value: String,
    pub is_show: bool,
    pub is_use: bool,
    pub show_order: i32,
}

///更新表格字段数据
#[post("/update_tableset")]
pub async fn update_tableset(
    db: web::Data<Pool>,
    post_data: web::Json<Vec<FieldsData>>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "字段设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        //加 into_inner() 方法，否则会出现错误：Cannot move out of dereference of ...
        let post_data = post_data.into_inner();
        for data in post_data {
            let sql = format!(
                r#"UPDATE tableset SET show_name='{}', show_width={}, ctr_type='{}', option_value='{}', 
                default_value='{}', is_show={}, is_use={}, show_order={} WHERE id={}"#,
                data.show_name,
                data.show_width,
                data.ctr_type,
                data.option_value,
                data.default_value,
                data.is_show,
                data.is_use,
                data.show_order,
                data.id
            );

            let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();
        }

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct FieldsData2 {
    pub id: i32,
    pub inout_show: bool,
    pub inout_order: i32,
}

///更新表格字段数据, 出入库相关
#[post("/update_tableset2")]
pub async fn update_tableset2(
    db: web::Data<Pool>,
    post_data: web::Json<Vec<FieldsData2>>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "字段设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        //加 into_inner() 方法，否则会出现错误：Cannot move out of dereference of ...
        let post_data = post_data.into_inner();
        for data in post_data {
            let sql = format!(
                r#"UPDATE tableset SET inout_show={}, inout_order={} WHERE id={}"#,
                data.inout_show, data.inout_order, data.id
            );

            let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();
        }

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
