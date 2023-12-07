use crate::service::*;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

///获取单据显示字段
#[post("/fetch_inout_fields")]
pub async fn fetch_inout_fields(
    db: web::Data<Pool>,
    name: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name != "" {
        let fields = get_inout_fields(db.clone(), &name).await;
        HttpResponse::Ok().json(fields)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct Customer {
    pub rights: String,
    pub cate: String,
    pub id: i32,
}

///获取指定 id 的供应商和客户
#[post("/fetch_supplier")]
pub async fn fetch_supplier(
    db: web::Data<Pool>,
    supplier: web::Json<Customer>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let fields = get_inout_fields(db.clone(), &supplier.cate).await;

        let mut sql = "SELECT 信用评价,优惠折扣,".to_owned();
        for f in &fields {
            sql += &format!("{},", f.field_name);
        }

        sql = sql.trim_end_matches(",").to_owned();

        sql += &format!(r#" FROM customers WHERE id={}"#, supplier.id);
        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut supplier = "".to_owned();
        let mut trust = "".to_owned();
        let mut sale_cut = 1f32;
        for row in rows {
            supplier += &simple_string_from_base(row, &fields);
            trust = row.get("信用评价");
            sale_cut = row.get("优惠折扣");
        }
        HttpResponse::Ok().json((fields, supplier, trust, sale_cut))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///出入库获取客户供应商信息
#[post("/fetch_inout_customer")]
pub async fn fetch_inout_customer(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();

        let fields = get_inout_fields(db.clone(), &post_data.cate).await;

        let mut sql_fields = "SELECT id::text,".to_owned();

        for f in &fields {
            sql_fields += &format!("{},", f.field_name);
        }

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM customers WHERE 
            类别='{}' AND LOWER(名称) LIKE '%{}%' AND 停用=false ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields, post_data.sort, post_data.cate, name, post_data.sort, skip, post_data.rec
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let products = build_string_from_base(rows, fields);

        let count_sql = format!(
            r#"SELECT count(id) as 记录数 FROM customers WHERE 类别='{}' AND LOWER(名称) LIKE '%{}%' AND 停用=false"#,
            post_data.cate, name
        );

        let rows = &conn.query(count_sql.as_str(), &[]).await.unwrap();

        let mut count: i64 = 0;
        for row in rows {
            count = row.get("记录数");
        }
        let pages = (count as f64 / post_data.rec as f64).ceil() as i32;
        HttpResponse::Ok().json((products, count, pages))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//商品规格自动完成
#[get("/buyin_auto")]
pub async fn buyin_auto(
    db: web::Data<Pool>,
    search: web::Query<SearchCate>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let fields = get_inout_fields(db.clone(), "商品规格").await;
        let f_map = map_fields(db.clone(), "商品规格").await;
        let mut s: Vec<&str> = search.s.split(" ").collect();
        if s.len() == 1 {
            s.push("");
        }
        let mut cate_s = "".to_owned();
        if search.cate == "销售单据" {
            cate_s = format!("{}!='是' AND ", f_map["切完"]);
        }

        let mut sql_fields = "".to_owned();
        let mut sql_where = "".to_owned();
        for f in &fields {
            sql_fields += &format!("{} || '{}' ||", f.field_name, SPLITER);
            if f.data_type == "文本" {
                sql_where += &format!("LOWER({}) LIKE '%{}%' OR ", f.field_name, s[1])
            }
        }

        let str_match = format!(" || '{}' ||", SPLITER);
        sql_fields = sql_fields.trim_end_matches(&str_match).to_owned();
        sql_where = sql_where.trim_end_matches(" OR ").to_owned();

        let sql = &format!(
            r#"SELECT num as id, split_part(node_name,' ',2) || '{}' || split_part(node_name,' ',1) 
                || '{}' || {} || '{}' || {} || '{}' || ({}-COALESCE(长度合计,0))::integer || '{}'|| 
                round(({}-COALESCE(理重合计,0))::numeric,2)::real AS label FROM products
                JOIN tree ON products.商品id = tree.num
                LEFT JOIN 
                (select 物料号, sum(长度*数量) as 长度合计, sum(理重) as 理重合计 from pout_items group by 物料号) as foo
                ON products.文本字段1 = foo.物料号
                WHERE {} (pinyin LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%') AND ({}) LIMIT 10"#,
            SPLITER, SPLITER, sql_fields, SPLITER, f_map["售价"], SPLITER, f_map["库存长度"], SPLITER,
            f_map["理论重量"], cate_s, s[0].to_lowercase(), s[0].to_lowercase(), sql_where,
        );

        // println!("{}", sql);

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}


//获取指定 id 的产品
#[post("/fetch_one_product")]
pub async fn fetch_one_product(
    db: web::Data<Pool>,
    product_id: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let f_map = map_fields(db.clone(), "商品规格").await;

        let sql = format!("SELECT num || '{}' || split_part(node_name,' ',2) || '{}' || split_part(node_name,' ',1) 
                            || '{}' || {} || '{}' || {} || '{}' || {} as p from products
                            JOIN tree ON products.商品id = tree.num
                            WHERE {} = '{}'",
                          SPLITER, SPLITER, SPLITER, f_map["规格"], SPLITER, f_map["状态"], SPLITER, f_map["售价"], f_map["物料号"], product_id);

        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut data = "".to_owned();

        for row in rows {
            data = row.get("p");
        }

        HttpResponse::Ok().json(data)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//状态、执行标准、生产厂家、库位的自动输入, 类别通过 cate 传入
#[get("/get_status_auto")]
pub async fn get_status_auto(
    db: web::Data<Pool>,
    search: web::Query<SearchCate>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let f_map = map_fields(db.clone(), "商品规格").await;
        let sql = format!("select distinct {} label, '1' as id from products where lower({}) like '%{}%' order by {}",
                          f_map[&search.cate], f_map[&search.cate], search.s.to_lowercase(), f_map[&search.cate]);
        autocomplete(db, &sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct Document {
    pub rights: String,
    pub document: String,
    pub remember: String,
    pub items: Vec<String>,
}

///保存单据
#[post("/save_document")]
pub async fn save_document(
    db: web::Data<Pool>,
    data: web::Json<Document>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "".to_owned()).await;
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

        let fields_cate = if data.rights.contains("销售") {
            "销售单据"
        } else if data.rights.contains("采购") {
            "采购单据"
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
                doc_data[2], doc_data[0], f_map["经办人"], doc_data[3], f_map["区域"], user.area, dh
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
                    dh, value[0], value[1], value[2], value[3], value[4], value[5], value[6], value[7], value[8], n
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

#[derive(Deserialize, Serialize)]
pub struct History {
    pub cate: String,
    pub customer_id: i32,
    pub product_id: i32,
}

#[derive(Deserialize, Serialize)]
pub struct DocumentDh {
    pub cate: String,
    pub dh: String,
}

///获取单据字段
#[post("/fetch_document")]
pub async fn fetch_document(
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
            r#"{} 客商id, 名称, documents.{} as 审核, 经办人 FROM documents JOIN customers ON documents.客商id=customers.id WHERE 单号='{}'"#,
            sql_fields, f_map["审核"], data.dh
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document = "".to_owned();
        for row in rows {
            let id: i32 = row.get("客商id");
            let name: String = row.get("名称");
            let rem: &str = row.get("审核");
            let worker: &str = row.get("经办人");
            document += &format!(
                "{}{}{}{}{}{}{}{}{}",
                simple_string_from_base(row, &fields), SPLITER, id, SPLITER, name, SPLITER,
                rem, SPLITER, worker,
            );
        }

        HttpResponse::Ok().json(document)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取单据明细
#[post("/fetch_document_items")]
pub async fn fetch_document_items(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();

        let sql = format!(
            r#"select 商品id, split_part(node_name,' ',2) as 名称, split_part(node_name,' ',1) as 材质,
                规格, 状态, 单价, 重量, round((单价*重量)::numeric,2)::real as 金额, 备注 FROM document_items 
                JOIN tree ON 商品id=tree.num
                WHERE 单号id='{}' ORDER BY 顺序"#,
            data.dh
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document_items: Vec<String> = Vec::new();
        for row in rows {
            let m_id: String = row.get("商品id");
            let name: String = row.get("名称");
            let cz: String = row.get("材质");
            let gg: String = row.get("规格");
            let status: String = row.get("状态");
            let price: f32 = row.get("单价");
            let weight: f32 = row.get("重量");
            let money: f32 = row.get("金额");
            let note: String = row.get("备注");
            let item = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                name, SPLITER, cz, SPLITER, gg, SPLITER, status, SPLITER, price, SPLITER,
                weight, SPLITER, money, SPLITER, note, SPLITER, m_id,
            );

            document_items.push(item)
        }

        HttpResponse::Ok().json(document_items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//获取运输出库单明细
#[post("/fetch_trans_items")]
pub async fn fetch_trans_items(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();

        let sql = format!(
            r#"select 商品id, split_part(node_name,' ',2) as 名称, split_part(node_name,' ',1) as 材质,
                规格, 状态, 长度, 数量, 理重, 重量, 单价, round((单价*重量)::numeric,2)::real as 金额, 备注 FROM document_items
                JOIN tree ON 商品id=tree.num
                WHERE 单号id='{}' ORDER BY 顺序"#,
            data.dh
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document_items: Vec<String> = Vec::new();
        for row in rows {
            let m_id: String = row.get("商品id");
            let name: String = row.get("名称");
            let cz: String = row.get("材质");
            let gg: String = row.get("规格");
            let status: String = row.get("状态");
            let long: i32 = row.get("长度");
            let num: i32 = row.get("数量");
            let price: f32 = row.get("单价");
            let weight: f32 = row.get("重量");
            let theory: f32 = row.get("理重");
            let money: f32 = row.get("金额");
            let note: String = row.get("备注");
            let item = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                name, SPLITER, cz, SPLITER, gg, SPLITER, status, SPLITER, long, SPLITER, num, SPLITER,
                theory, SPLITER, weight, SPLITER, price, SPLITER, money, SPLITER, note, SPLITER, m_id,
            );

            document_items.push(item)
        }

        HttpResponse::Ok().json(document_items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取单据明细
#[post("/fetch_document_items_sales")]
pub async fn fetch_document_items_sales(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();

        let sql = format!(
            r#"select split_part(node_name,' ',2) as 名称, split_part(node_name,' ',1) as 材质,
                规格, 状态, 单价, 长度, 数量, 理重, 重量,
                case when 重量=0 and 理重=0 then round((单价*数量)::numeric,2)::real
                else round((单价*理重)::numeric,2)::real end as 金额, 备注, 商品id
                FROM document_items
                JOIN tree ON 商品id=tree.num
                WHERE 单号id='{}' ORDER BY 顺序"#,
            data.dh
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document_items: Vec<String> = Vec::new();
        for row in rows {
            let name: String = row.get("名称");
            let cz: String = row.get("材质");
            let gg: String = row.get("规格");
            let status: String = row.get("状态");
            let price: f32 = row.get("单价");
            let long: i32 = row.get("长度");
            let num: i32 = row.get("数量");
            let theary: f32 = row.get("理重");
            let weight: f32 = row.get("重量");
            let money: f32 = row.get("金额");
            let note: String = row.get("备注");
            let m_id: String = row.get("商品id");
            let item = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                name, SPLITER, cz, SPLITER, gg, SPLITER, status, SPLITER, price, SPLITER,
                long, SPLITER, num, SPLITER, theary, SPLITER, weight, SPLITER,
                money, SPLITER, note, SPLITER, m_id,
            );

            document_items.push(item)
        }

        HttpResponse::Ok().json(document_items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//获取相关单据
#[post("/fetch_other_documents")]
pub async fn fetch_other_documents(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();

        let sql = format!(
            r#"select 单号,日期,类别 from documents where 文本字段6 = '{}' order by 日期 desc"#,
            data
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document_items: Vec<String> = Vec::new();
        for row in rows {
            let dh: String = row.get("单号");
            let date: String = row.get("日期");
            let cate: String = row.get("类别");
            let item = format!("{}{}{}{}{}{}", cate, SPLITER, dh, SPLITER, date, SPLITER);

            document_items.push(item);
        }

        HttpResponse::Ok().json(document_items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/get_items_trans")]
pub async fn get_items_trans(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "商品规格").await;
        let sql = &format!(
            r#"SELECT num || '{}' || split_part(node_name,' ',2) || '　' || split_part(node_name,' ',1) || '　' ||
                {} || '　' || {} || '　' || {} || '　' || 长度 || '　' || 数量 || '　' || 理重 || '　' || 重量 as item from pout_items
            JOIN products ON 物料号 = 文本字段1
            JOIN tree ON 商品id = num
            WHERE pout_items.单号id = '{}'"#,
            SPLITER, f_map["规格"], f_map["状态"], f_map["炉号"], data
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

///保存运输发货单据
#[post("/save_stransport")]
pub async fn save_stransport(
    db: web::Data<Pool>,
    data: web::Json<crate::material::Document>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id.clone(), "".to_owned()).await;
    if user.name != "" {
        let mut conn = db.get().await.unwrap();
        let doc_data: Vec<&str> = data.document.split(SPLITER).collect();
        let mut doc_sql;

        let fields_cate = "发货单据";

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

        if dh_data != "新单据" {
            transaction
                .execute("DELETE FROM document_items WHERE 单号id=$1", &[&dh])
                .await
                .unwrap();
        }

        for item in &data.items {
            let value: Vec<&str> = item.split(SPLITER).collect();
            let items_sql = format!(
                r#"INSERT INTO document_items (单号id, 商品id, 规格, 状态, 长度, 数量, 理重, 重量, 单价, 备注, 顺序)
                     VALUES('{}', '{}', '{}', '{}', {}, {}, {}, {}, {}, '{}',{})"#,
                dh, value[9], value[1], value[2], value[3], value[4], value[5], value[6], value[7], value[8], value[0]
            );

            // println!("{}", items_sql);

            transaction.execute(items_sql.as_str(), &[]).await.unwrap();
        }

        let _result = transaction.commit().await;

        HttpResponse::Ok().json(dh)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///审核
#[post("/make_formal")]
pub async fn make_formal(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "单据审核".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), &data.cate).await;
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
