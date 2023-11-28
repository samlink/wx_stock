use crate::service::*;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

//自动完成
#[get("/material_auto")]
pub async fn material_auto(
    db: web::Data<Pool>,
    search: web::Query<SearchCate>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let f_map = map_fields(db.clone(), "采购单据").await;
        let f_map2 = map_fields(db.clone(), "供应商").await;
        let s = search.s.to_uppercase();
        let cate_s = if search.cate != "" {
            format!("documents.类别='{}' AND ", search.cate)
        } else {
            "".to_string()
        };
        let sql = &format!(
            r#"SELECT 单号 as id, 单号 || '　' || {} AS label FROM documents
            JOIN customers on 客商id = customers.id
            WHERE {} 单号 like '%{}%' AND {}=false  LIMIT 10"#,
            format!("customers.{}", f_map2["简称"]),
            cate_s,
            s,
            format!("documents.{}", f_map["入库完成"]),
        );

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/get_items")]
pub async fn get_items(db: web::Data<Pool>, data: web::Json<String>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let sql = &format!(
            r#"SELECT num || '{}' || split_part(node_name,' ',2) || '　' || split_part(node_name,' ',1) || '　' ||
                规格 || '　' || 状态 as item from document_items 
            JOIN tree ON 商品id = tree.num
            WHERE 单号id = '{}'"#,
            SPLITER, data
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document_items: Vec<String> = Vec::new();
        for row in rows {
            let item = row.get("item");
            document_items.push(item);
        }
        HttpResponse::Ok().json(document_items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//自动完成
#[get("/fetch_max_num")]
pub async fn fetch_max_num(db: web::Data<Pool>, id: Identity) -> String {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "商品规格").await;
        let sql = &format!(
            r#"select max(cast(substr({}, 2) as integer))::text as num from products where {} like 'M%';"#,
            f_map["物料号"], f_map["物料号"]
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut num = "".to_owned();
        for row in rows {
            num = row.get("num");
        }
        num
    } else {
        "".to_owned()
    }
}

// buyin.rs 中相同，需整合
#[derive(Deserialize, Serialize)]
pub struct Document {
    pub rights: String,
    pub document: String,
    pub remember: String,
    pub items: Vec<String>,
}

///保存单据
#[post("/save_material")]
pub async fn save_material(
    db: web::Data<Pool>,
    data: web::Json<Document>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), data.rights.clone()).await;
    if user.name != "" {
        if data.remember == "已审核" {
            let user = get_user(db.clone(), id, "单据审核".to_owned()).await;
            if user.name == "" {
                return HttpResponse::Ok().json(-1);
            }
        }

        let mut conn = db.get().await.unwrap();
        let doc_data: Vec<&str> = data.document.split(SPLITER).collect();
        let mut doc_sql;

        let fields_cate = if data.rights.contains("入库") {
            "入库单据"
        } else if data.rights.contains("出库") {
            "出库单据"
        } else {
            "库存调整"
        };

        let f_map = map_fields(db.clone(), fields_cate).await;

        let fields = get_inout_fields(db.clone(), fields_cate).await;
        let dh_data = doc_data[1].to_owned();
        let mut dh = doc_data[1].to_owned();

        if dh_data == "新单据" {
            dh = get_dh(db, doc_data[0]).await;

            let mut init = "INSERT INTO documents (单号,".to_owned();
            for f in &fields {
                init += &format!("{},", &*f.field_name);
            }

            init += &format!(
                "客商id,类别,{},{}) VALUES('{}',",
                f_map["经办人"], f_map["区域"], dh
            );

            doc_sql = build_sql_for_insert(doc_data.clone(), init, fields, 4);
            doc_sql += &format!(
                "{},'{}','{}', '{}')",
                doc_data[2], doc_data[0], doc_data[3], user.area
            );
        } else {
            let init = "UPDATE documents SET ".to_owned();
            doc_sql = build_sql_for_update(doc_data.clone(), init, fields, 4);
            doc_sql += &format!(
                "客商id={}, 类别='{}', {}='{}', {}='{}' WHERE 单号='{}'",
                doc_data[2],
                doc_data[0],
                f_map["经办人"],
                doc_data[3],
                f_map["区域"],
                user.area,
                dh
            );
        }

        // println!("{}", doc_sql);

        let transaction = conn.transaction().await.unwrap();
        transaction.execute(doc_sql.as_str(), &[]).await.unwrap();

        if dh_data != "新单据" {
            transaction
                .execute("DELETE FROM document_items WHERE 单号id=$1", &[&dh])
                .await
                .unwrap();
        }

        let mut n = 1;
        for item in &data.items {
            let value: Vec<&str> = item.split(SPLITER).collect();
            let items_sql = if fields_cate == "销售单据" {
                format!(
                    r#"INSERT INTO document_items (单号id, 商品id, 规格, 状态, 单价, 长度, 数量, 理重, 重量, 备注, 顺序) 
                     VALUES('{}', '{}', '{}', '{}', {}, {}, {}, {}, {}, '{}',{})"#,
                    dh,
                    value[0],
                    value[1],
                    value[2],
                    value[3],
                    value[4],
                    value[5],
                    value[6],
                    value[7],
                    value[8],
                    n
                )
            } else {
                format!(
                    r#"INSERT INTO document_items (单号id, 商品id, 规格, 状态, 单价, 重量, 备注, 顺序) 
                     VALUES('{}', '{}', '{}', '{}', {}, {}, '{}', {})"#,
                    dh, value[0], value[1], value[2], value[3], value[4], value[5], n
                )
            };
            // println!("{}", items_sql);

            transaction.execute(items_sql.as_str(), &[]).await.unwrap();
            n += 1;
        }

        let _result = transaction.commit().await;

        HttpResponse::Ok().json(dh)
    } else {
        HttpResponse::Ok().json(-1)
    }
}