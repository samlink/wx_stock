use crate::service::*;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use time::now;

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
    let user = get_user(db.clone(), id, supplier.rights.to_owned()).await;
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
    let user = get_user(db.clone(), id, format!("{}管理", post_data.cate)).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();

        let fields = get_inout_fields(db.clone(), &post_data.cate).await;

        let mut sql_fields = "SELECT id,".to_owned();

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
    search: web::Query<Search>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let fields = get_inout_fields(db.clone(), "商品规格").await;
        let mut s: Vec<&str> = search.s.split(" ").collect();
        if s.len() == 1 {
            s.push("");
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
        let p_id = s[0].parse::<i32>().unwrap_or(-1);

        let sql = &format!(
            r#"SELECT id, node_name || '{}' || {} || '{}' || COALESCE(库存, '0') || '{}' || 出售价格 AS label FROM products 
            JOIN tree ON products.商品id = tree.num
            LEFT JOIN  
                (SELECT 商品id, SUM(数量) AS 库存 FROM document_items 
                JOIN documents ON document_items.单号id=documents.单号
                WHERE 直销=false AND 已记账=true GROUP BY 商品id) as foo
            ON products.id = foo.商品id 
            WHERE (products.id={} OR pinyin LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%') AND ({}) LIMIT 10"#,
            SPLITER,
            sql_fields,
            SPLITER,
            SPLITER,
            p_id,
            s[0].to_lowercase(),
            s[0].to_lowercase(),
            sql_where,
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
    product_id: web::Json<i32>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let fields = get_inout_fields(db.clone(), "商品规格").await;
        let mut sql = "SELECT 出售价格,".to_owned();
        for f in &fields {
            sql += &format!("{},", f.field_name);
        }

        sql = sql.trim_end_matches(",").to_owned();
        let sql = &format!(r#"{} FROM products WHERE id = {}"#, sql, product_id);
        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut data = "".to_owned();
        let mut field_str = "".to_owned();
        let mut price = 0f32;
        for row in rows {
            field_str = simple_string_from_base(row, &fields);
            price = row.get("出售价格");
        }

        data += &format!("{}{}{}{}", field_str, "", SPLITER, price);

        // data = data.trim_end_matches(SPLITER).to_owned();

        HttpResponse::Ok().json(data)
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
    let user = get_user(db.clone(), id.clone(), data.rights.clone()).await;
    if user.name != "" {
        if data.remember == "已记账" {
            let user = get_user(db.clone(), id, "单据记账".to_owned()).await;
            if user.name == "" {
                return HttpResponse::Ok().json(-1);
            }
        }

        let mut conn = db.get().await.unwrap();
        let doc_data: Vec<&str> = data.document.split(SPLITER).collect();
        let mut doc_sql;

        let fields_cate = if data.rights == "商品销售" {
            "销售单据"
        } else if data.rights == "商品采购" {
            "采购单据"
        } else {
            "库存调整"
        };

        let fields = get_inout_fields(db.clone(), fields_cate).await;
        let dh_data = doc_data[1].to_owned();
        let mut dh = doc_data[1].to_owned();

        if dh_data == "新单据" {
            let dh_pre = if doc_data[0] == "采购入库" {
                "CG"
            } else if doc_data[0] == "退货出库" {
                "CT"
            } else if doc_data[0] == "商品销售" {
                "XS"
            } else if doc_data[0] == "销售退货" {
                "XT"
            } else {
                "KT"
            };

            let rows = &conn
                .query("SELECT value FROM system WHERE cate='单号格式'", &[])
                .await
                .unwrap();
            let mut dh_format: Vec<String> = Vec::new();

            for row in rows {
                let v: String = row.get("value");
                dh_format.push(v);
            }

            let spliter = if dh_format[2] == "true" { "-" } else { "" };
            let date_string = now().strftime("%Y-%m-%d").unwrap().to_string();
            let local: Vec<&str> = date_string.split("-").collect();

            let date;
            if dh_format[0] == "日" {
                date = format!(
                    "{}{}{}{}{}{}{}",
                    dh_pre, local[0], spliter, local[1], spliter, local[2], spliter
                );
            } else if dh_format[0] == "月" {
                date = format!("{}{}{}{}{}", dh_pre, local[0], spliter, local[1], spliter);
            } else if dh_format[0] == "年" {
                date = format!("{}{}{}", dh_pre, local[0], spliter);
            } else {
                date = format!("{}{}", dh_pre, spliter);
            }

            //获取尾号
            let sql = format!(
                "SELECT 单号 FROM documents WHERE 单号 like '{}%' ORDER BY 单号 DESC LIMIT 1",
                dh_pre
            );

            let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

            let mut dh_first = "".to_owned();
            for row in rows {
                dh_first = row.get("单号");
            }

            let keep = dh_format[1].parse::<usize>().unwrap();
            let len = dh_first.len();
            let mut num = 1i32;
            if dh_first != "" {
                if let Some(n) = dh_first.get(len - keep..len) {
                    if dh_first == format!("{}{}", date, n) {
                        num = n.parse::<i32>().unwrap() + 1;
                    }
                }
            }

            dh = format!("{}{:0pad$}", date, num, pad = keep);

            let mut init = "INSERT INTO documents (单号,".to_owned();
            for f in &fields {
                init += &format!("{},", &*f.field_name);
            }

            init += &format!("客商id,类别,制单人) VALUES('{}',", dh);
            doc_sql = build_sql_for_insert(doc_data.clone(), init, fields, 4);
            doc_sql += &format!("{},'{}','{}')", doc_data[2], doc_data[0], doc_data[3]);
        } else {
            let init = "UPDATE documents SET ".to_owned();
            doc_sql = build_sql_for_update(doc_data.clone(), init, fields, 4);
            doc_sql += &format!(
                "客商id={}, 类别='{}', 制单人='{}' WHERE 单号='{}'",
                doc_data[2], doc_data[0], doc_data[3], dh
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
            let items_sql = format!(
                r#"INSERT INTO document_items (单号id, 直销, 商品id, 单价, 数量, 仓库id, 备注, 顺序) 
                VALUES('{}', {}, {}, {}, {}, {}, '{}', {})"#,
                dh, value[0], value[1], value[2], value[3], value[4], value[5], n
            );
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
pub struct HistoryData {
    pub date: String,
    pub price: f32,
    pub count: f32,
}

///获取历史交易记录
#[post("/fetch_history")]
pub async fn fetch_history(
    db: web::Data<Pool>,
    data: web::Json<History>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let cate;
        let count;
        if data.cate == "商品销售" {
            cate = "单号 LIKE 'XS%'";
            count = "ABS(数量) AS 数量";
        } else if data.cate == "商品采购" {
            cate = "单号 LIKE 'CG%'";
            count = "数量";
        } else {
            cate = "单号 LIKE 'KT%'";
            count = "数量";
        };
        let sql = format!("SELECT 日期, 单价, {} FROM documents JOIN document_items ON documents.单号=document_items.单号id 
                            WHERE {} AND 客商id={} AND 商品id={} ORDER BY 开单时间 DESC LIMIT 10", 
                            count, cate, data.customer_id, data.product_id);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut history: Vec<HistoryData> = Vec::new();

        for row in rows {
            let h = HistoryData {
                date: row.get("日期"),
                price: row.get("单价"),
                count: row.get("数量"),
            };
            history.push(h);
        }

        HttpResponse::Ok().json(history)
    } else {
        HttpResponse::Ok().json(-1)
    }
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
            cate = "采购入库";
        } else if data.dh.starts_with("CT") {
            cate = "退货出库";
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

///获取单据条目
#[post("/fetch_document_items")]
pub async fn fetch_document_items(
    db: web::Data<Pool>,
    data: web::Json<DocumentDh>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();

        let fields = get_inout_fields(db.clone(), "商品规格").await;

        let mut sql_fields = "SELECT ".to_owned();

        for f in &fields {
            sql_fields += &format!("products.{},", f.field_name);
        }

        let sql = format!(
            r#"{} 直销, document_items.商品id, node_name, 单价, 数量, 仓库id, name, document_items.备注 FROM document_items 
                JOIN products ON document_items.商品id=products.id
                JOIN warehouse ON document_items.仓库id=warehouse.id
                JOIN tree ON products.商品id=tree.num
                WHERE 单号id='{}' ORDER BY 顺序"#,
            sql_fields, data.dh
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut document_items: Vec<String> = Vec::new();
        for row in rows {
            let direct: bool = row.get("直销");
            let id: i32 = row.get("商品id");
            let name: String = row.get("node_name");
            let price: f32 = row.get("单价");
            let count: f32 = row.get("数量");
            let ware_id: i32 = row.get("仓库id");
            let ware_name: String = row.get("name");
            let note: String = row.get("备注");
            let item = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                simple_string_from_base(row, &fields),
                SPLITER,
                direct,
                SPLITER,
                id,
                SPLITER,
                name,
                SPLITER,
                price,
                SPLITER,
                count,
                SPLITER,
                ware_id,
                SPLITER,
                ware_name,
                SPLITER,
                note,
            );
            document_items.push(item)
        }

        HttpResponse::Ok().json(document_items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///记账
#[post("/make_formal")]
pub async fn make_formal(
    db: web::Data<Pool>,
    dh_id: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "单据记账".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let dh_id = format!("{}", dh_id); //这里转换一下，直接写入查询报错，说不支持Json<String>
        let _ = &conn
            .execute("UPDATE documents SET 已记账=true WHERE 单号=$1", &[&dh_id])
            .await
            .unwrap();
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
