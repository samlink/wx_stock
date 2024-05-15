use crate::buyin::DocumentDh;
use crate::service::*;
use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use std::fs;
// use uuid::Uuid;
use time::now;

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
            r#"SELECT 单号 as id, 单号 || '　' || customers.{} AS label FROM documents
            JOIN customers on 客商id = customers.id
            WHERE {} 单号 like '%{}%' AND documents.{}=false AND documents.文本字段10 <> '' LIMIT 10"#,
            f_map2["简称"], cate_s, s, f_map["入库完成"],
        );

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[get("/materialout_auto")]
pub async fn materialout_auto(
    db: web::Data<Pool>,
    search: web::Query<SearchCate>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let f_map = map_fields(db.clone(), "销售单据").await;
        let f_map2 = map_fields(db.clone(), "客户").await;
        let s = search.s.to_uppercase();
        let cate_s = if search.cate != "" {
            format!("documents.类别='{}' AND ", search.cate)
        } else {
            "".to_string()
        };
        let sql = &format!(
            r#"SELECT 单号 as id, 单号 || '　' || customers.{} AS label FROM documents
            JOIN customers on 客商id = customers.id
            WHERE {} 单号 like '%{}%' AND documents.{}=false AND documents.{} <> '' LIMIT 10"#,
            f_map2["简称"], cate_s, s, f_map["发货完成"], f_map["审核"]
        );

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// 发货单获得销售单据
#[post("/materialout_docs")]
pub async fn materialout_docs(
    db: web::Data<Pool>,
    search: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "".to_owned()).await;
    if user.name != "" {
        let f_map = map_fields(db.clone(), "销售单据").await;
        let f_map2 = map_fields(db.clone(), "客户").await;
        let f_map3 = map_fields(db.clone(), "出库单据").await;

        let limit = get_limits(&user).await;
        let sql = &format!(
            r#"SELECT 单号 as id, 单号 || '　' || customers.{} AS label FROM documents
            join customers on 客商id = customers.id            
            WHERE {} documents.类别='{}' AND documents.{} <> '' AND documents.{} = false and 单号 in 
            (select {} from documents where {} <>'' and 类别='销售出库' and  {} <> '' and {} = false) and
            单号 not in (select 文本字段6 from documents where documents.类别='运输发货' and 文本字段10 = '')
            order by 单号 desc
            "#,
            f_map2["简称"],
            limit,
            search,
            f_map["审核"],
            f_map["发货完成"],
            f_map3["销售单号"],
            f_map3["销售单号"],
            f_map3["审核"],
            f_map3["发货完成"]
        );

        // println!("{}", sql);
        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// 发货单已保存未提交单据
#[post("/materialout_saved_docs")]
pub async fn materialout_saved_docs(
    db: web::Data<Pool>,
    search: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "".to_owned()).await;
    if user.name != "" {
        let f_map = map_fields(db.clone(), "销售单据").await;
        let f_map2 = map_fields(db.clone(), "客户").await;
        let f_map3 = map_fields(db.clone(), "出库单据").await;

        let limit = get_limits(&user).await;
        let sql = &format!(
            r#"SELECT 运输单号 as id, 单号 || '　' || customers.{} || '　' || 运输单.经办人 AS label FROM documents
            join customers on 客商id = customers.id
            join 
            (select 单号 运输单号, 文本字段6, 经办人 from documents where documents.类别='运输发货' and 
            布尔字段3 = false and 文本字段10 = '') as 运输单
            on 运输单.文本字段6 = documents.单号
            WHERE {} documents.类别='{}' AND documents.{} <> '' AND documents.{} = false and 单号 in 
            (select {} from documents where {} <>'' and 类别='销售出库' and  {} <> '')
            order by 单号 desc
            "#,
            f_map2["简称"],
            limit,
            search,
            f_map["审核"],
            f_map["发货完成"],
            f_map3["销售单号"],
            f_map3["销售单号"],
            f_map3["审核"],
        );

        // println!("{}", sql);
        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// 入库单获得采购单据
#[post("/materialin_docs")]
pub async fn materialin_docs(
    db: web::Data<Pool>,
    search: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "采购入库".to_owned()).await;
    if user.name != "" {
        let f_map = map_fields(db.clone(), "采购单据").await;
        let f_map2 = map_fields(db.clone(), "供应商").await;

        let sql = &format!(
            r#"SELECT 单号 as id, 单号 || '　' || customers.{} AS label FROM documents
            join customers on 客商id = customers.id
            WHERE documents.类别='{}' AND documents.{}=false AND documents.{} <> '' 
            and 单号 not in (select 文本字段6 from documents where documents.类别='采购入库' and 文本字段10 = '')
            order by 单号 desc"#,
            f_map2["简称"], search, f_map["入库完成"], f_map["审核"]
        );

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// 入库单保存未提交
#[post("/materialin_saved_docs")]
pub async fn materialin_saved_docs(
    db: web::Data<Pool>,
    search: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "采购入库".to_owned()).await;
    if user.name != "" {
        let f_map = map_fields(db.clone(), "采购单据").await;
        let f_map2 = map_fields(db.clone(), "供应商").await;

        let sql = &format!(
            r#"SELECT 入库单号 as id, 单号 || '　' || customers.{} || '　' || 入库单.经办人 AS label FROM documents
            join customers on 客商id = customers.id
            join 
            (select 单号 入库单号, 文本字段6, 经办人 from documents where documents.类别='采购入库' and 
            布尔字段3 = false and 文本字段10 = '') as 入库单
            on 入库单.文本字段6 = documents.单号
            WHERE documents.类别='{}' AND documents.{}=false AND documents.{} <> ''            
            order by 单号 desc"#,
            f_map2["简称"], search, f_map["入库完成"], f_map["审核"]
        );

        // println!("{}", sql);

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// 出库单获得销售单据
#[post("/materialsale_docs")]
pub async fn materialsale_docs(
    db: web::Data<Pool>,
    search: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "销售出库".to_owned()).await;
    if user.name != "" {
        let f_map = map_fields(db.clone(), "销售单据").await;
        // let f_map2 = map_fields(db.clone(), "出库单据").await;
        let f_map3 = map_fields(db.clone(), "客户").await;

        let sql = &format!(
            r#"SELECT 单号 as id, 单号 || '　' || customers.{} AS label FROM documents
            join customers on 客商id = customers.id
            WHERE documents.类别='{}' AND documents.{} <> '' AND documents.{} = false and
            单号 not in (select 文本字段6 from documents where documents.类别='销售出库' and 文本字段10 = '')
            order by 单号 desc"#,
            f_map3["简称"], search, f_map["审核"], f_map["出库完成"],
        );

        // println!("{}",sql);

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// 出库单获得销售单据
#[post("/materialsale_saved_docs")]
pub async fn materialsale_saved_docs(
    db: web::Data<Pool>,
    search: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "销售出库".to_owned()).await;
    if user.name != "" {
        let f_map = map_fields(db.clone(), "销售单据").await;
        // let f_map2 = map_fields(db.clone(), "出库单据").await;
        let f_map3 = map_fields(db.clone(), "客户").await;

        let sql = &format!(
            r#"SELECT 出库单号 as id, 单号 || '　' || customers.{} || '　' || 出库单.经办人 AS label FROM documents
            join customers on 客商id = customers.id
            join 
            (select 单号 出库单号, 文本字段6, 经办人 from documents where documents.类别='销售出库' and 
            布尔字段3 = false and 文本字段10 = '') as 出库单
            on 出库单.文本字段6 = documents.单号
            WHERE documents.类别='{}' AND documents.{} <> '' AND documents.{} = false
            order by 单号 desc"#,
            f_map3["简称"], search, f_map["审核"], f_map["出库完成"],
        );

        // println!("{}",sql);

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[get("/material_auto_out")]
pub async fn material_auto_out(
    db: web::Data<Pool>,
    search: web::Query<SearchPlus>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let f_map = map_fields(db.clone(), "商品规格").await;
        let ss: Vec<&str> = search.ss.split('　').collect();
        let ss2 = ss[2].replace(SPLITER, "+"); //加号传不过来

        let sql = &format!(
            r#"SELECT num as id, products.{} || '{}' || split_part(node_name,' ',2) || '{}' || split_part(node_name,' ',1)
                || '{}' || products.{} || '{}' || products.{} || '{}' || products.{} || '{}'||
                (products.{}-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer AS label
                FROM products
                JOIN tree ON products.商品id = tree.num
                JOIN documents ON 单号id = 单号
                LEFT JOIN cut_length() as foo
                ON products.文本字段1 = foo.物料号
                WHERE LOWER(products.{}) LIKE LOWER('%{}%') AND num='{}' AND 
                products.{} = '{}' and products.{} = '{}' and
                (products.{}-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer + 10 >= {} AND
                products.{} != '是' AND documents.文本字段10 <> '' 
                order by products.{}-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2"#,
            f_map["物料号"],
            SPLITER,
            SPLITER,
            SPLITER,
            f_map["规格"],
            SPLITER,
            f_map["状态"],
            SPLITER,
            f_map["炉号"],
            SPLITER,
            f_map["库存长度"],
            f_map["物料号"],
            search.s,
            ss[0],
            f_map["规格"],
            ss[1].trim(),
            f_map["状态"],
            ss2.trim(),
            f_map["库存长度"],
            ss[3],
            f_map["切完"],
            f_map["库存长度"],
        );

        // println!("{}", sql);

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[get("/material_auto_sotckout")]
pub async fn material_auto_sotckout(
    db: web::Data<Pool>,
    search: web::Query<Search>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let f_map = map_fields(db.clone(), "商品规格").await;
        let sql = &format!(
            r#"SELECT num as id, products.{} || '{}' || split_part(node_name,' ',2) || '{}' ||
                split_part(node_name,' ',1) || '{}' || products.{} || '{}' || products.{} || '{}' ||
                products.{} || '{}' || products.{} || '{}' || products.{} || '{}' ||
                case when (products.{}-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer <0 then
                 0 else (products.{}-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer end AS label
                FROM products
                JOIN tree ON products.商品id = tree.num
                JOIN documents ON 单号id = 单号
                LEFT JOIN cut_length() as foo
                    ON products.文本字段1 = foo.物料号
                WHERE LOWER(products.{}) LIKE '%{}%' AND documents.文本字段10 <> '' LIMIT 10"#,
            f_map["物料号"],
            SPLITER,
            SPLITER,
            SPLITER,
            f_map["规格"],
            SPLITER,
            f_map["状态"],
            SPLITER,
            f_map["执行标准"],
            SPLITER,
            f_map["炉号"],
            SPLITER,
            f_map["生产厂家"],
            SPLITER,
            f_map["库存长度"],
            f_map["库存长度"],
            f_map["物料号"],
            search.s
        );

        // println!("{}", sql);

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[get("/material_auto_kt")]
pub async fn material_auto_kt(
    db: web::Data<Pool>,
    search: web::Query<SearchCate>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let f_map = map_fields(db.clone(), "商品规格").await;
        let sql = &format!(
            r#"SELECT num as id, products.{} || '{}' || split_part(node_name,' ',2) || '{}' || split_part(node_name,' ',1)
                || '{}' || products.{} || '{}' || products.{} || '{}' ||
                (products.{}-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer AS label
                FROM products
                JOIN tree ON products.商品id = tree.num
                JOIN documents ON 单号id = 单号
                LEFT JOIN cut_length() as foo
                ON products.文本字段1 = foo.物料号
                WHERE LOWER(products.{}) LIKE '%{}%' AND products.{} != '是' AND 
                (products.{}-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer >0 AND                
                documents.文本字段10 !='' LIMIT 10"#,
            f_map["物料号"],
            SPLITER,
            SPLITER,
            SPLITER,
            f_map["规格"],
            SPLITER,
            f_map["状态"],
            SPLITER,
            f_map["库存长度"],
            f_map["物料号"],
            search.s.to_lowercase(),
            f_map["切完"],
            f_map["库存长度"],
        );

        // println!("{}", sql);

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取单据字段
#[post("/fetch_document_ck")]
pub async fn fetch_document_ck(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_inout_fields(db.clone(), &data.cate).await;
        let f_map = map_fields(db.clone(), &data.cate).await;
        let mut sql_fields = "SELECT ".to_owned();

        for f in &fields {
            sql_fields += &format!("documents.{},", f.field_name);
        }

        let sql = format!(
            r#"{} documents.{} as 审核, 经办人, customers.id, documents.{} as 图片, documents.{} as 提交审核 FROM documents
                JOIN customers ON documents.客商id=customers.id WHERE 单号='{}'"#,
            sql_fields, f_map["审核"], f_map["图片"], f_map["提交审核"], data.dh
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document = "".to_owned();
        for row in rows {
            let csid: i32 = row.get("id");
            let sumit_shen: bool = row.get("提交审核");
            let rem: String = row.get("审核");
            let pic: String = row.get("图片");
            let worker: String = row.get("经办人");
            document += &format!(
                "{}{}{}{}{}{}{}{}{}{}{}",
                simple_string_from_base(row, &fields),
                SPLITER,
                sumit_shen,
                SPLITER,
                csid, // 1 是占位置的, 为了共享前端函数
                SPLITER,
                pic,
                SPLITER,
                rem,
                SPLITER,
                worker
            );
        }

        HttpResponse::Ok().json(document)
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
                规格 || '　' || 状态 ||  '　' || customers.文本字段1 || '　' || 执行标准 || '{}' || document_items.id
                || '{}' || 出库完成 as item
            from document_items 
            JOIN tree ON 商品id = tree.num
            JOIN documents on 单号id = 单号
            JOIN customers on 客商id = customers.id
            WHERE 单号id = '{}' order by 顺序"#,
            SPLITER, SPLITER, SPLITER, data
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

#[post("/get_items_out")]
pub async fn get_items_out(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let sql = &format!(
            r#"SELECT num || '{}' || split_part(node_name,' ',2) || '　' || split_part(node_name,' ',1) || '　' ||
                规格 || '　' || 状态 || '　' || 长度 || '　' || 数量 || '　' || 备注 ||  '{}' || 单价 || '{}' || id || '{}' || 出库状态 as item 
            from document_items
            JOIN tree ON 商品id = tree.num
            WHERE 单号id = '{}' order by 顺序"#,
            SPLITER, SPLITER, SPLITER, SPLITER, data
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

#[post("/get_docs_out")]
pub async fn get_docs_out(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "销售单据").await;
        let sql = &format!(
            r#"SELECT documents.{} as 合同编号,名称, 客商id, documents.备注 from documents
            JOIN customers ON 客商id = customers.id
            WHERE 单号 = '{}'"#,
            f_map["合同编号"], data
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut item = "".to_owned();
        for row in rows {
            let num: &str = row.get("合同编号");
            let name: &str = row.get("名称");
            let custid: i32 = row.get("客商id");
            let note: &str = row.get("备注");
            item = format!(
                "{}{}{}{}{}{}{}",
                num, SPLITER, name, SPLITER, custid, SPLITER, note
            );
        }
        HttpResponse::Ok().json(item)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/get_trans_info")]
pub async fn get_trans_info(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "销售单据").await;
        let f_map2 = map_fields(db.clone(), "客户").await;
        let sql = &format!(
            r#"SELECT documents.{} as 合同编号, 名称, customers.{} 联系人, customers.{} 电话,
            customers.{} 公司地址, documents.{} 审核 from documents
            JOIN customers ON 客商id = customers.id
            WHERE 单号 = '{}'"#,
            f_map["合同编号"],
            f_map2["收货人"],
            f_map2["收货电话"],
            f_map2["收货地址"],
            f_map["审核"],
            data
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut item = "".to_owned();
        for row in rows {
            let num: &str = row.get("合同编号");
            let name: &str = row.get("名称");
            let contact: &str = row.get("联系人");
            let tel: &str = row.get("电话");
            let addr: &str = row.get("公司地址");
            let shen: &str = row.get("审核");
            item = format!(
                "{}{}{}{}{}{}{}{}{}{}{}",
                num, SPLITER, name, SPLITER, contact, SPLITER, tel, SPLITER, addr, SPLITER, shen
            );
        }
        HttpResponse::Ok().json(item)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//获取最近的单号
#[get("/fetch_max_num")]
async fn fetch_max_num(db: web::Data<Pool>, id: Identity) -> String {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "商品规格").await;
        let sql = &format!(
            r#"select max(cast(SUBSTRING({}, 2, 6) as integer))::text as num from products where {} like 'M%';"#,
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

//上传炉号质保书
#[get("/set_lu")]
async fn set_lu(db: web::Data<Pool>, lu: String, id: Identity) -> String {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let sql = &format!(
            r#"insert into lu (炉号, 质保书) values ('{}', '{}')"#,
            lu, lu
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

///保存入库单据
#[post("/save_material")]
pub async fn save_material(
    db: web::Data<Pool>,
    data: web::Json<Document>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "".to_owned()).await;
    if user.name != "" {
        let mut conn = db.get().await.unwrap();
        let doc_data: Vec<&str> = data.document.split(SPLITER).collect();
        let mut doc_sql;

        let fields_cate = if data.rights == "采购入库" {
            "入库单据"
        } else {
            "库存调入"
        };

        let f_map = map_fields(db.clone(), fields_cate).await;

        let fields = get_inout_fields(db.clone(), fields_cate).await;
        let dh_data = doc_data[1].to_owned();
        let mut dh = doc_data[1].to_owned();

        if dh_data == "新单据" {
            dh = get_dh(db.clone(), doc_data[0]).await;

            let mut init = "INSERT INTO documents (单号, 客商id,".to_owned();
            for f in &fields {
                init += &format!("{},", &*f.field_name);
            }

            init += &format!(
                "类别,{},{}) VALUES('{}', {},",
                f_map["经办人"],
                f_map["区域"],
                dh,
                0 // 0 是本公司的 id
            );

            doc_sql = build_sql_for_insert(doc_data.clone(), init, fields, 2);
            doc_sql += &format!("'{}','{}', '{}')", doc_data[0], user.name, user.area);
        } else {
            let init = "UPDATE documents SET ".to_owned();
            doc_sql = build_sql_for_update(doc_data.clone(), init, fields, 2);
            doc_sql += &format!(
                "类别='{}', {}='{}', {}='{}' WHERE 单号='{}'",
                doc_data[0], f_map["经办人"], user.name, f_map["区域"], user.area, dh
            );
        }

        // println!("{}", doc_sql);

        let transaction = conn.transaction().await.unwrap();
        transaction.execute(doc_sql.as_str(), &[]).await.unwrap();

        if dh_data != "新单据" {
            transaction
                .execute("DELETE FROM products WHERE 单号id=$1", &[&dh])
                .await
                .unwrap();
        }

        let f_map = map_fields(db, "商品规格").await;

        let mut rkid = "";
        for item in &data.items {
            let value: Vec<&str> = item.split(SPLITER).collect();

            let items_sql = if fields_cate != "库存调入" {
                format!(
                    r#"INSERT INTO products (单号id, 商品id, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},{}, {}, {}, {})
                     VALUES('{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', {}, {}, {}, '{}', '{}', '{}', '{}', {})"#,
                    f_map["规格"],
                    f_map["状态"],
                    f_map["炉号"],
                    f_map["执行标准"],
                    f_map["生产厂家"],
                    f_map["库位"],
                    f_map["物料号"],
                    f_map["入库长度"],
                    f_map["库存长度"],
                    f_map["理论重量"],
                    f_map["区域"],
                    f_map["合格"],
                    f_map["备注"],
                    f_map["质检书"],
                    f_map["顺序"],
                    dh,
                    value[12],
                    value[1],
                    value[2],
                    value[3],
                    value[4],
                    value[5],
                    value[6],
                    value[7],
                    value[8],
                    value[8],
                    value[9],
                    user.area,
                    value[10],
                    value[11],
                    value[14],
                    value[0]
                )
            } else {
                format!(
                    r#"INSERT INTO products (单号id, 商品id, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {})
                     VALUES('{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', {}, {}, {}, '{}', {}, '{}', '{}')"#,
                    f_map["规格"],
                    f_map["状态"],
                    f_map["执行标准"],
                    f_map["炉号"],
                    f_map["生产厂家"],
                    f_map["库位"],
                    f_map["物料号"],
                    f_map["入库长度"],
                    f_map["库存长度"],
                    f_map["理论重量"],
                    f_map["备注"],
                    f_map["顺序"],
                    f_map["区域"],
                    f_map["原物料号"],
                    dh,
                    value[11],
                    value[1],
                    value[2],
                    value[3],
                    value[4],
                    value[5],
                    value[6],
                    value[7],
                    value[8],
                    value[8],
                    value[9],
                    value[10],
                    value[0],
                    user.area,
                    value[12]
                ) // value[12] 是原物料号
            };

            // println!("{}", items_sql);

            if value.len() > 13 && value[13] != "" {
                if rkid != value[13] {
                    rkid = value[13];
                    let dh_sql = format!(
                        r#"update document_items set 出库完成 = true where id::text = '{}'"#, // 与销售单据共用出库完成
                        rkid
                    );
                    // let _ = conn2.query(dh_sql.as_str(), &[]).await;
                    transaction.execute(dh_sql.as_str(), &[]).await.unwrap();
                }
            }

            let re = transaction
                .execute(items_sql.as_str(), &[])
                .await
                .unwrap_or(0);
            if re == 0 {
                return HttpResponse::Ok().json(-2); //物料号重复时无法保存
            }
        }

        let _result = transaction.commit().await;

        HttpResponse::Ok().json(dh)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///保存出库单据
#[post("/save_material_ck")]
pub async fn save_material_ck(
    db: web::Data<Pool>,
    data: web::Json<Document>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "".to_owned()).await;
    if user.name != "" {
        let mut conn = db.get().await.unwrap();
        // let conn2 = db.get().await.unwrap();
        let doc_data: Vec<&str> = data.document.split(SPLITER).collect();
        let mut doc_sql;

        let fields_cate = if data.rights == "销售出库" {
            "出库单据"
        } else {
            "库存调出"
        };

        let f_map = map_fields(db.clone(), fields_cate).await;

        let fields = get_inout_fields(db.clone(), fields_cate).await;
        let dh_data = doc_data[1].to_owned();
        let mut dh = doc_data[1].to_owned();

        if dh_data == "新单据" {
            dh = get_dh(db.clone(), doc_data[0]).await;

            let mut init = "INSERT INTO documents (单号, 客商id,".to_owned();
            for f in &fields {
                init += &format!("{},", &*f.field_name);
            }

            init += &format!(
                "类别,{},{}) VALUES('{}', {},",
                f_map["经办人"], f_map["区域"], dh, doc_data[2]
            );

            doc_sql = build_sql_for_insert(doc_data.clone(), init, fields, 3);
            doc_sql += &format!("'{}','{}', '{}')", doc_data[0], user.name, user.area);
        } else {
            let init = "UPDATE documents SET ".to_owned();
            doc_sql = build_sql_for_update(doc_data.clone(), init, fields, 3);
            doc_sql += &format!(
                "客商id={}, 类别='{}', {}='{}', {}='{}' WHERE 单号='{}'",
                doc_data[2], doc_data[0], f_map["经办人"], user.name, f_map["区域"], user.area, dh
            );
        }

        // println!("{}", doc_sql);

        let transaction = conn.transaction().await.unwrap();
        transaction.execute(doc_sql.as_str(), &[]).await.unwrap();

        // 单据明细
        if dh_data != "新单据" {
            transaction
                .execute("DELETE FROM pout_items WHERE 单号id=$1", &[&dh])
                .await
                .unwrap();
        }

        for item in &data.items {
            let value: Vec<&str> = item.split(SPLITER).collect();
            let items_sql = if fields_cate == "出库单据" {
                format!(
                    r#"INSERT INTO pout_items (单号id, 长度, 数量, 物料号, 重量, 理重, 备注, 单价, 顺序, xsid)
                     VALUES('{}',  {}, {}, '{}', {}, {}, '{}', {}, {}, '{}')"#,
                    dh,
                    value[1],
                    value[2],
                    value[3],
                    value[4],
                    value[5],
                    value[6],
                    value[7],
                    value[0],
                    value[8],
                )
            } else {
                format!(
                    r#"INSERT INTO pout_items (单号id, 物料号, 长度, 数量, 重量, 理重, 备注, 顺序)
                     VALUES('{}', '{}', {}, {}, {}, {}, '{}', {})"#,
                    dh, value[1], value[2], 1, value[3], value[4], value[5], value[0]
                )
            };

            transaction.execute(items_sql.as_str(), &[]).await.unwrap();
        }

        // 更新出库状态
        if fields_cate == "出库单据" {
            let sale_dh = doc_data[3];

            let mut dh_sql = format!(
                r#"update document_items set 出库状态='已', 出库完成 = true from 
                (select xsid,sum(数量) from pout_items where 单号id in (select 单号 from documents where 文本字段6='{}' and 类别='销售出库') group by xsid) foo
                where document_items.id::text = foo.xsid and document_items.数量 = foo.sum"#,
                sale_dh
            );

            transaction.execute(dh_sql.as_str(), &[]).await.unwrap();

            dh_sql = format!(
                r#"update document_items set 出库状态='分', 出库完成 = false from 
                (select xsid,sum(数量) from pout_items where 单号id in (select 单号 from documents where 文本字段6='{}' and 类别='销售出库') group by xsid) foo
                where document_items.id::text = foo.xsid and document_items.数量 > foo.sum"#,
                sale_dh
            );

            transaction.execute(dh_sql.as_str(), &[]).await.unwrap();
        }

        let _result = transaction.commit().await;

        HttpResponse::Ok().json(dh)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/handle_not_pass")]
pub async fn handle_not_pass(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "".to_owned()).await;
    if user.name != "" {
        let f_map = map_fields(db.clone(), "商品规格").await;

        let mut conn = db.get().await.unwrap();
        let conn2 = db.get().await.unwrap();
        let sql = format!(r#"select 客商id from documents where 单号='{}'"#, data.cate);

        let rows = &conn2.query(sql.as_str(), &[]).await.unwrap();
        let mut cus_id: i32 = 0;
        for row in rows {
            cus_id = row.get("客商id");
        }

        let transaction = conn.transaction().await.unwrap();

        let dh = get_dh(db.clone(), "采购退货").await;
        let date = now().strftime("%Y-%m-%d").unwrap().to_string();
        let sql = format!(
            "insert into documents (单号, 客商id, 日期, 经办人, 类别, 备注, 文本字段7)
                            values ('{}', {}, '{}', '{}', '采购退货', '不合格品退货', '{}')",
            dh, cus_id, date, user.name, user.area
        );

        transaction.execute(sql.as_str(), &[]).await.unwrap();

        let sql = format!(
            r#"select 商品id, max({}) 规格, max({}) 状态, max({}) 炉号, sum({})::int4 长度, sum({}) 重量 from products
            where 单号id = '{}' and {} = '否' group by 商品id"#,
            f_map["规格"],
            f_map["状态"],
            f_map["炉号"],
            f_map["入库长度"],
            f_map["理论重量"],
            data.dh,
            f_map["合格"]
        );

        let rows = &conn2.query(sql.as_str(), &[]).await.unwrap();

        for row in rows {
            let 商品id: &str = row.get("商品id");
            let 规格: &str = row.get("规格");
            let 状态: &str = row.get("状态");
            let 炉号: &str = row.get("炉号");
            let 长度: i32 = row.get("长度");
            let 重量: f32 = row.get("重量");

            let sql = format!(
                "insert into document_items(单号id, 商品id, 规格, 状态, 炉号, 长度, 重量)
                             values('{}','{}','{}','{}','{}', {}, {})",
                dh, 商品id, 规格, 状态, 炉号, 长度, 重量
            );

            transaction.execute(sql.as_str(), &[]).await.unwrap();
        }

        let sql = format!(
            r#"delete from products where 单号id = '{}' and {} = '否'"#,
            data.dh, f_map["合格"],
        );

        transaction.execute(sql.as_str(), &[]).await.unwrap();
        let _result = transaction.commit().await.unwrap();

        HttpResponse::Ok().json(dh)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取入库单据字段
#[post("/fetch_document_rkd")]
pub async fn fetch_document_rkd(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_inout_fields(db.clone(), &data.cate).await;
        let f_map = map_fields(db.clone(), &data.cate).await;

        let mut sql_fields = "SELECT ".to_owned();

        for f in &fields {
            sql_fields += &format!("documents.{},", f.field_name);
        }

        let sql = format!(
            r#"{} documents.{} as 图片, documents.{} as 提交审核, 客商id, 名称, documents.{} as 审核, 经办人
            FROM documents
            JOIN customers ON documents.客商id=customers.id WHERE 单号='{}'"#,
            sql_fields, f_map["图片"], f_map["提交审核"], f_map["审核"], data.dh
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document = "".to_owned();
        for row in rows {
            let id: i32 = row.get("客商id");
            let name: String = row.get("名称");
            let sumit_shen: bool = row.get("提交审核");
            let rem: &str = row.get("审核");
            let worker: &str = row.get("经办人");
            let pic: &str = row.get("图片");
            document += &format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}",
                simple_string_from_base(row, &fields),
                SPLITER,
                pic,
                SPLITER,
                sumit_shen,
                SPLITER,
                id,
                SPLITER,
                name,
                SPLITER,
                rem,
                SPLITER,
                worker,
            );
        }

        HttpResponse::Ok().json(document)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取入库单据明细
#[post("/fetch_document_items_tr")]
pub async fn fetch_document_items_tr(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "商品规格").await;
        let sql = format!(
            r#"select {} 原物料号, split_part(node_name,' ', 2) as 名称, split_part(node_name,' ', 1) as 材质,
                {} as 规格, {} as 状态, {} as 炉号, {} as 执行标准, {} as 生产厂家, {} as 库位, {} as 物料号, {} as 入库长度,
                {} as 理论重量, {} as 备注, 商品id FROM products
                JOIN tree ON 商品id=tree.num
                WHERE 单号id='{}' ORDER BY {}"#,
            f_map["原物料号"],
            f_map["规格"],
            f_map["状态"],
            f_map["炉号"],
            f_map["执行标准"],
            f_map["生产厂家"],
            f_map["库位"],
            f_map["物料号"],
            f_map["入库长度"],
            f_map["理论重量"],
            f_map["备注"],
            data.dh,
            f_map["顺序"]
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document_items: Vec<String> = Vec::new();
        for row in rows {
            let origin: String = row.get("原物料号");
            let name: String = row.get("名称");
            let cz: String = row.get("材质");
            let gg: String = row.get("规格");
            let status: String = row.get("状态");
            let lu: String = row.get("炉号");
            let stand: String = row.get("执行标准");
            let factory: String = row.get("生产厂家");
            let kw: String = row.get("库位");
            let num: String = row.get("物料号");
            let long: i32 = row.get("入库长度");
            let theary: f32 = row.get("理论重量");
            let note: String = row.get("备注");
            let m_id: String = row.get("商品id");
            let item = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                origin,
                SPLITER,
                name,
                SPLITER,
                cz,
                SPLITER,
                gg,
                SPLITER,
                status,
                SPLITER,
                lu,
                SPLITER,
                stand,
                SPLITER,
                factory,
                SPLITER,
                kw,
                SPLITER,
                num,
                SPLITER,
                long,
                SPLITER,
                theary,
                SPLITER,
                note,
                SPLITER,
                m_id
            );

            document_items.push(item)
        }

        HttpResponse::Ok().json(document_items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取采购入库单据明细
#[post("/fetch_document_items_rk")]
pub async fn fetch_document_items_rk(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "商品规格").await;
        let sql = format!(
            r#"select split_part(node_name,' ', 2) as 名称, split_part(node_name,' ', 1) as 材质,
                {} as 规格, {} as 状态, {} as 炉号, {} as 执行标准, {} as 生产厂家, {} as 库位, {} as 物料号, {} as 入库长度,
                {} as 理论重量, {} 合格, {} as 备注, 商品id, {} as 质检书 FROM products
                JOIN tree ON 商品id=tree.num
                WHERE 单号id='{}' ORDER BY {}"#,
            f_map["规格"],
            f_map["状态"],
            f_map["炉号"],
            f_map["执行标准"],
            f_map["生产厂家"],
            f_map["库位"],
            f_map["物料号"],
            f_map["入库长度"],
            f_map["理论重量"],
            f_map["合格"],
            f_map["备注"],
            f_map["质检书"],
            data.dh,
            f_map["顺序"]
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document_items: Vec<String> = Vec::new();
        for row in rows {
            let name: String = row.get("名称");
            let cz: String = row.get("材质");
            let gg: String = row.get("规格");
            let status: String = row.get("状态");
            let lu: String = row.get("炉号");
            let stand: String = row.get("执行标准");
            let factory: String = row.get("生产厂家");
            let kw: String = row.get("库位");
            let num: String = row.get("物料号");
            let long: i32 = row.get("入库长度");
            let theary_1: f64 = row.get("理论重量");
            let theary: String = format!("{:.1}", theary_1);
            let note: String = row.get("备注");
            let m_id: String = row.get("商品id");
            let ok: String = row.get("合格");
            let lu_id: String = row.get("质检书");
            let pass = if ok == "是" { "checked" } else { "" };
            let item = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                name,
                SPLITER,
                cz,
                SPLITER,
                gg,
                SPLITER,
                status,
                SPLITER,
                lu,
                SPLITER,
                stand,
                SPLITER,
                factory,
                SPLITER,
                kw,
                SPLITER,
                num,
                SPLITER,
                long,
                SPLITER,
                theary,
                SPLITER,
                pass,
                SPLITER,
                note,
                SPLITER,
                m_id,
                SPLITER,
                "0",        //用作 d_id 填充补位
                SPLITER,
                lu_id
            );

            document_items.push(item)
        }

        HttpResponse::Ok().json(document_items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取出库单据明细
#[post("/fetch_document_items_ck")]
pub async fn fetch_document_items_ck(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "商品规格").await;
        let sql = format!(
            r#"select COALESCE(split_part(node_name,' ', 2),'') as 名称, COALESCE(split_part(node_name,' ', 1), '') as 材质,
                COALESCE({},'') as 规格, COALESCE({}, '') as 状态, COALESCE({}, '') as 炉号, 长度, 数量, (长度*数量)::integer as 总长度,
                物料号, 重量, 理重, pout_items.备注, COALESCE(商品id, '') 商品id, 单价, xsid FROM pout_items
                left JOIN products ON 文本字段1=物料号
                left JOIN tree ON 商品id=tree.num
                WHERE pout_items.单号id='{}' ORDER BY pout_items.顺序"#,
            f_map["规格"], f_map["状态"], f_map["炉号"], data.dh
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document_items: Vec<String> = Vec::new();
        if data.cate != "库存调出" {
            for row in rows {
                let name: String = row.get("名称");
                let cz: String = row.get("材质");
                let gg: String = row.get("规格");
                let status: String = row.get("状态");
                let lu: String = row.get("炉号");
                let long: i32 = row.get("长度");
                let mount: i32 = row.get("数量");
                let allong: i32 = row.get("总长度");
                let num: String = row.get("物料号");
                let weight: f32 = row.get("重量");
                let theory: f32 = row.get("理重");
                let note: String = row.get("备注");
                let m_id: String = row.get("商品id");
                let s_id: f32 = row.get("单价");
                let d_id: String = row.get("xsid");
                let item = format!(
                    "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                    name,
                    SPLITER,
                    cz,
                    SPLITER,
                    gg,
                    SPLITER,
                    status,
                    SPLITER,
                    lu,
                    SPLITER,
                    long,
                    SPLITER,
                    mount,
                    SPLITER,
                    allong,
                    SPLITER,
                    num,
                    SPLITER,
                    weight,
                    SPLITER,
                    theory,
                    SPLITER,
                    note,
                    SPLITER,
                    m_id,
                    SPLITER,
                    s_id,
                    SPLITER,
                    d_id
                );

                document_items.push(item);
            }
        } else {
            for row in rows {
                let name: String = row.get("名称");
                let cz: String = row.get("材质");
                let gg: String = row.get("规格");
                let status: String = row.get("状态");
                let long: i32 = row.get("长度");
                let num: String = row.get("物料号");
                let weight: f32 = row.get("重量");
                let theory: f32 = row.get("理重");
                let note: String = row.get("备注");
                let m_id: String = row.get("商品id");
                let item = format!(
                    "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                    num,
                    SPLITER,
                    name,
                    SPLITER,
                    cz,
                    SPLITER,
                    gg,
                    SPLITER,
                    status,
                    SPLITER,
                    long,
                    SPLITER,
                    weight,
                    SPLITER,
                    theory,
                    SPLITER,
                    note,
                    SPLITER,
                    m_id,
                    SPLITER
                );

                document_items.push(item);
            }
        }

        HttpResponse::Ok().json(document_items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/make_formal_in")]
pub async fn make_formal_in(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    // let user_name = id.identity().unwrap_or("".to_owned());
    let user = get_user(db.clone(), id, "单据审核".to_owned()).await;
    if user.name != "" {
        let table_name = if data.cate == "采购入库" {
            "入库单据"
        } else {
            "库存调入"
        };

        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), table_name).await;
        let sql = format!(
            r#"update documents set {}='{}' WHERE 单号='{}'"#,
            f_map["审核"], user.name, data.dh
        );
        let _rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/make_formal_out")]
pub async fn make_formal_out(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    // let user_name = id.identity().unwrap_or("".to_owned());
    let user = get_user(db.clone(), id, "单据审核".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "出库单据").await;
        let sql = format!(
            r#"update documents set {}='{}' WHERE 单号='{}'"#,
            f_map["审核"], user.name, data
        );
        let _rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// 实际重量填入销售单
#[post("/make_xs_wight")]
pub async fn make_xs_wight(
    db: web::Data<Pool>,
    dh: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();

        let sql = format!(
            r#"select xsid, sum(重量) as 重量 from pout_items where 单号id = '{}' group by xsid;"#,
            dh
        );

        let rows = conn.query(sql.as_str(), &[]).await.unwrap();
        for row in rows {
            let id: &str = row.get("xsid");
            let weight: f32 = row.get("重量");

            let sql = format!(
                r#"update document_items set 重量 = {} where id::text = '{}'"#,
                weight, id
            );

            let _ = conn.query(sql.as_str(), &[]).await;
        }
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// 确认销售单的出库完成
#[post("/make_ck_complete")]
pub async fn make_ck_complete(
    db: web::Data<Pool>,
    dh: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(
            r#"update documents set 布尔字段2 = true where 单号='{}' and false not in
            (select 出库完成 from document_items where 单号id='{}' and 商品id <> '4_111');"#,
            dh, dh
        );

        let _ = conn.query(sql.as_str(), &[]).await;

        let sql = format!(
            r#"update documents set 布尔字段2 = true where 单号 ='{}' and
                (select sum(数量) from document_items where 单号id ='{}' and 商品id <> '4_111') = 
                (select sum(数量) from pout_items where 单号id in
                (select 单号 from documents where 文本字段6='{}' and 类别='销售出库'))"#,
            dh, dh, dh
        );

        let _ = conn.query(sql.as_str(), &[]).await;

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// 确认销售单的发货完成
#[post("/make_fh_complete")]
pub async fn make_fh_complete(
    db: web::Data<Pool>,
    dh: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(
            r#"update documents set 布尔字段1 = true where 单号='{}' and 布尔字段2 = true 
             and false not in (select 布尔字段1 from documents where 文本字段6 ='{}' and 
             类别 = '销售出库' and 文本字段10 !='')"#,
            dh, dh
        );

        let _ = conn.query(sql.as_str(), &[]).await;

        let sql = format!(
            r#"update documents set 布尔字段1 = true where 单号 ='{}' and 布尔字段2 = true and
                (select sum(数量) from document_items where 单号id ='{}' and 商品id <> '4_111') = 
                (select sum(数量) from document_items where 商品id <> '4_111' and 单号id in
                (select 单号 from documents where 文本字段6='{}' and 类别='运输发货'))"#,
            dh, dh, dh
        );

        let _ = conn.query(sql.as_str(), &[]).await;

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取单据字段
#[post("/fetch_document_rk")]
pub async fn fetch_document_rk(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_inout_fields(db.clone(), "入库单据").await;
        let mut sql_fields = "SELECT ".to_owned();

        for f in &fields {
            sql_fields += &format!("documents.{},", f.field_name);
        }

        let sql = format!(
            r#"{} 客商id, 名称, 已记账 FROM documents JOIN customers ON documents.客商id=customers.id WHERE 单号='{}'"#,
            sql_fields, data.dh
        );

        // println!("{}", sql);

        let cate;
        if data.dh.starts_with("XS") {
            cate = "商品销售";
        } else if data.dh.starts_with("XT") {
            cate = "销售退货";
        } else if data.dh.starts_with("CG") {
            cate = "材料采购";
        } else if data.dh.starts_with("CT") {
            cate = "采购退货";
        } else {
            cate = "库存调整";
        }

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document = "".to_owned();
        for row in rows {
            let id: i32 = row.get("客商id");
            let name: String = row.get("名称");
            let rem: bool = row.get("已记账");
            document += &format!(
                "{}{}{}{}{}{}{}{}{}",
                simple_string_from_base(row, &fields),
                SPLITER,
                id,
                SPLITER,
                name,
                SPLITER,
                rem,
                SPLITER,
                cate,
            );
        }

        HttpResponse::Ok().json(document)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/fetch_check_stock")]
pub async fn fetch_check_stock(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();

        let f_map = map_fields(db.clone(), &data.cate).await;
        let sql = format!(
            r#"select {} as 审核 from documents WHERE 单号='{}'"#,
            f_map["审核"], data.dh
        );
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut check = "".to_owned();
        for row in rows {
            let chk: &str = row.get("审核");
            check = format!("{}", chk);
        }
        HttpResponse::Ok().json(check)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//上传图片
#[post("/pic_in")]
pub async fn pic_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let path = "./upload/pics/coin.jpg".to_owned();
        let path2 = "./upload/pics/".to_owned();
        save_pic(payload, path.clone()).await.unwrap();
        let path3 = smaller(path.clone(), path2);
        HttpResponse::Ok().json(path3)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// 保存图片
async fn save_pics(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
    cate: &str,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let da: Vec<&str> = data.split(SPLITER).collect();
        if da[1] == "/upload/pics/min.jpg" {
            let pic = format!("/upload/pics/pic_{}.jpg", da[0]);
            let min_pic = format!("/upload/pics/min_{}.jpg", da[0]);
            fs::rename("./upload/pics/coin.jpg", format!(".{}", pic)).unwrap();
            fs::rename(
                "./upload/pics/min.jpg",
                format!("./upload/pics/min_{}.jpg", da[0]),
            )
            .unwrap();

            let conn = db.get().await.unwrap();
            let f_map = map_fields(db.clone(), cate).await;
            let sql = format!(
                r#"update documents set {}='{}' WHERE 单号='{}'"#,
                f_map["图片"], pic, da[0]
            );
            let _rows = &conn.query(sql.as_str(), &[]).await.unwrap();
            HttpResponse::Ok().json(min_pic)
        } else {
            HttpResponse::Ok().json(-2)
        }
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//保存图片 - 出库单
#[post("/pic_in_save")]
pub async fn pic_in_save(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    save_pics(db, data, id, "出库单据").await
}

//保存图片 - 销售开票
#[post("/pic_kp_save")]
pub async fn pic_kp_save(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    save_pics(db, data, id, "销售开票").await
}

//保存图片 - 发货单
#[post("/pic_fh_save")]
pub async fn pic_fh_save(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    save_pics(db, data, id, "发货单据").await
}

//上传pdf
#[post("/pdf_in")]
pub async fn pdf_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let path = "./upload/pdf/lu.pdf".to_owned();
        save_pic(payload, path.clone()).await.unwrap();
        HttpResponse::Ok().json(path)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/pdf_in_save")]
pub async fn pdf_in_save(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        // let sql = format!("delete from lu where 炉号 = '{}'", data);
        // let _result = &conn.execute(sql.as_str(), &[]).await.unwrap();
        // let lu_id = Uuid::new_v4();
        let pdf = format!("/upload/pdf/{}.pdf", data);
        fs::rename("./upload/pdf/lu.pdf", format!(".{}", pdf)).unwrap();

        let sql = format!(
            r#"insert into lu (炉号, 质保书) values ('{}', '{}')"#,
            data, pdf
        );
        let _result = &conn.execute(sql.as_str(), &[]).await.unwrap_or(0);
        HttpResponse::Ok().json(data)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
