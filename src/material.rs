use crate::service::*;
use std::fs as fs;
use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use crate::buyin::DocumentDh;

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
            r#"SELECT 单号 as id, 单号 || '　' || {} AS label FROM documents
            JOIN customers on 客商id = customers.id
            WHERE {} 单号 like '%{}%' AND {}=false  LIMIT 10"#,
            format!("customers.{}", f_map2["简称"]),
            cate_s,
            s,
            format!("documents.{}", f_map["发货完成"]),
        );

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
        let sql = &format!(
            r#"SELECT num as id, {} || '{}' || split_part(node_name,' ',2) || '{}' || split_part(node_name,' ',1)
                || '{}' || {} || '{}' || {} || '{}' || {} || '{}'|| {} || '{}' || 0 AS label FROM products
                JOIN tree ON products.商品id = tree.num
                WHERE LOWER({}) LIKE '%{}%' AND num='{}' AND {} != '是' LIMIT 10"#,
            f_map["物料号"], SPLITER, SPLITER, SPLITER, f_map["规格"], SPLITER, f_map["状态"], SPLITER,
            f_map["炉号"], SPLITER, f_map["库存长度"], SPLITER, f_map["物料号"], search.s, search.ss, f_map["切完"]
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
        let f_map = map_fields(db.clone(), "出库单据").await;
        let mut sql_fields = "SELECT ".to_owned();

        for f in &fields {
            sql_fields += &format!("documents.{},", f.field_name);
        }

        let sql = format!(
            r#"{} 客商id, 名称, 已记账, 经办人, documents.类别, documents.{} as 图片 FROM documents JOIN customers ON documents.客商id=customers.id WHERE 单号='{}'"#,
            sql_fields, f_map["图片"], data.dh
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document = "".to_owned();
        for row in rows {
            let id: i32 = row.get("客商id");
            let name: String = row.get("名称");
            let rem: bool = row.get("已记账");
            let pic: String = row.get("图片");
            let worker: String = row.get("经办人");
            let cate: String = row.get("类别");
            document += &format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}",
                simple_string_from_base(row, &fields), SPLITER, id, SPLITER, name, SPLITER,
                rem, SPLITER, worker, SPLITER, cate, SPLITER, pic,
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

#[post("/get_items_out")]
pub async fn get_items_out(db: web::Data<Pool>, data: web::Json<String>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let sql = &format!(
            r#"SELECT num || '{}' || split_part(node_name,' ',2) || '　' || split_part(node_name,' ',1) || '　' ||
                规格 || '　' || 状态 || '　' || 长度 || '　' || 数量 as item from document_items
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

#[post("/get_docs_out")]
pub async fn get_docs_out(db: web::Data<Pool>, data: web::Json<String>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "销售单据").await;
        let sql = &format!(
            r#"SELECT documents.{} as 合同编号,名称 from documents
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
            item = format!("{}{}{}", num, SPLITER, name);
        }
        HttpResponse::Ok().json(item)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//获取最近的单号
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
        let rem: Vec<&str> = data.remember.split(SPLITER).collect();
        if rem[0] == "已审核" {
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
            dh = get_dh(db.clone(), doc_data[0]).await;
            // println!("已进入程序，单号：{}", dh);

            let mut init = "INSERT INTO documents (单号, 客商id,".to_owned();
            for f in &fields {
                init += &format!("{},", &*f.field_name);
            }

            init += &format!(
                "类别,{},{}) VALUES('{}', {},",
                f_map["经办人"],
                f_map["区域"],
                dh,
                12 // 12 是本公司的 id
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

        let sql = if fields_cate == "入库单据" {
            format!("DELETE FROM products WHERE 单号id='{}'", dh)
        } else {
            format!("DELETE FROM pout_items WHERE 单号id='{}'", dh)
        };

        if dh_data != "新单据" {
            transaction.execute(sql.as_str(), &[]).await.unwrap();
        }

        let f_map = map_fields(db, "商品规格").await;

        for item in &data.items {
            let value: Vec<&str> = item.split(SPLITER).collect();
            let mut items_sql = "".to_owned();
            if fields_cate == "入库单据" {
                items_sql = format!(
                    r#"INSERT INTO products (单号id, 商品id, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {})
                     VALUES('{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', {}, {}, '{}', '{}', {})"#,
                    f_map["规格"], f_map["状态"], f_map["炉号"], f_map["执行标准"], f_map["生产厂家"], f_map["库位"],
                    f_map["物料号"], f_map["入库长度"], f_map["理论重量"], f_map["备注"], f_map["来源"], f_map["顺序"],
                    dh, value[11], value[1], value[2], value[3], value[4], value[5], value[6], value[7], value[8],
                    value[9], value[10], doc_data[2], value[0]
                );
            } else if fields_cate == "出库单据" {
                items_sql = format!(
                    r#"INSERT INTO pout_items (单号id, 物料号, 长度, 数量, 重量, 备注, 顺序)
                     VALUES('{}', '{}', {}, {}, {}, '{}', {})"#,
                    dh, value[7], value[4], value[5], value[8], value[9], value[0]
                );
            }

            // println!("{}", items_sql);

            transaction.execute(items_sql.as_str(), &[]).await.unwrap();
        }

        let _result = transaction.commit().await;

        HttpResponse::Ok().json(dh)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取入库单据明细
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
            r#"select split_part(node_name,' ',2) as 名称, split_part(node_name,' ',1) as 材质,
                {} as 规格, {} as 状态, {} as 炉号, {} as 执行标准, {} as 生产厂家, {} as 库位, {} as 物料号, {} as 入库长度,
                {} as 理论重量, {} as 备注, 商品id FROM products
                JOIN tree ON 商品id=tree.num
                WHERE 单号id='{}' ORDER BY {}"#,
            f_map["规格"], f_map["状态"], f_map["炉号"], f_map["执行标准"], f_map["生产厂家"], f_map["库位"],
            f_map["物料号"], f_map["入库长度"], f_map["理论重量"], f_map["备注"], data.dh, f_map["顺序"]
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
            let theary: f32 = row.get("理论重量");
            let note: String = row.get("备注");
            let m_id: String = row.get("商品id");
            // let from: String = row.get("来源");
            let item = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                name, SPLITER, cz, SPLITER, gg, SPLITER, status, SPLITER,
                lu, SPLITER, stand, SPLITER, factory, SPLITER, kw, SPLITER, num, SPLITER,
                long, SPLITER, theary, SPLITER, note, SPLITER, m_id
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
            r#"select split_part(node_name,' ',2) as 名称, split_part(node_name,' ',1) as 材质,
                {} as 规格, {} as 状态, {} as 炉号, 长度, 数量, (长度*数量)::integer as 总长度, 物料号, 重量, pout_items.备注, 商品id FROM pout_items
            JOIN products ON 文本字段1=物料号
            JOIN tree ON 商品id=tree.num
            WHERE pout_items.单号id='{}' ORDER BY {}"#,
            f_map["规格"], f_map["状态"], f_map["炉号"], data.dh, f_map["顺序"]
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
            let long: i32 = row.get("长度");
            let mount: i32 = row.get("数量");
            let allong: i32 = row.get("总长度");
            let num: String = row.get("物料号");
            let weight: f32 = row.get("重量");
            let note: String = row.get("备注");
            let m_id: String = row.get("商品id");
            let item = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                name, SPLITER, cz, SPLITER, gg, SPLITER, status, SPLITER, lu, SPLITER,
                long, SPLITER, mount, SPLITER, allong, SPLITER, num, SPLITER,
                weight, SPLITER, note, SPLITER, m_id
            );

            document_items.push(item)
        }

        HttpResponse::Ok().json(document_items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//质检
#[post("/check_in")]
pub async fn check_in(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "入库单据").await;
        let sql = format!(r#"update documents set {}='{}' WHERE 单号='{}'"#, f_map["质检"], user_name, data);
        let _rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/make_formal_in")]
pub async fn make_formal_in(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    // let user = get_user(db.clone(), id, "单据记账".to_owned()).await;
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "入库单据").await;
        let sql = format!(r#"update documents set {}='{}' WHERE 单号='{}'"#, f_map["审核"], user_name, data);
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
    let user_name = id.identity().unwrap_or("".to_owned());
    // let user = get_user(db.clone(), id, "单据记账".to_owned()).await;
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "出库单据").await;
        let sql = format!(r#"update documents set {}='{}' WHERE 单号='{}'"#, f_map["审核"], user_name, data);
        let _rows = &conn.query(sql.as_str(), &[]).await.unwrap();

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
            cate = "商品采购";
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

#[post("/fetch_check")]
pub async fn fetch_check(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    // let user = get_user(db.clone(), id, "单据记账".to_owned()).await;
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "入库单据").await;
        let sql = format!(r#"select {} as 审核,{} as 质检 from documents WHERE 单号='{}'"#, f_map["审核"], f_map["质检"], data);
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut check = "".to_owned();
        for row in rows {
            let chk: &str = row.get("审核");
            let chk2: &str = row.get("质检");
            check = format!("{}-{}", chk, chk2);
        }
        HttpResponse::Ok().json(check)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//上传图片
#[post("/pic_in")]
pub async fn pic_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "材料出库".to_owned()).await;
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

#[post("/pic_in_save")]
pub async fn pic_in_save(db: web::Data<Pool>, data: web::Json<String>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "材料出库".to_owned()).await;
    if user.name != "" {
        let da: Vec<&str> = data.split(SPLITER).collect();
        if da[1] == "/upload/pics/min.jpg" {
            let pic = format!("/upload/pics/pic_{}.jpg", da[0]);
            let min_pic = format!("/upload/pics/min_{}.jpg", da[0]);
            fs::rename("./upload/pics/coin.jpg", format!(".{}", pic)).unwrap();
            fs::rename(
                "./upload/pics/min.jpg",
                format!("./upload/pics/min_{}.jpg", da[0]),
            ).unwrap();

            let conn = db.get().await.unwrap();
            let f_map = map_fields(db.clone(), "出库单据").await;
            let sql = format!(r#"update documents set {}='{}' WHERE 单号='{}'"#, f_map["图片"], pic, da[0]);
            let _rows = &conn.query(sql.as_str(), &[]).await.unwrap();
            HttpResponse::Ok().json(min_pic)
        } else {
            HttpResponse::Ok().json(-2)
        }
    } else {
        HttpResponse::Ok().json(-1)
    }
}