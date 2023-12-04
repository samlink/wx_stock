use crate::service::*;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
// use time::now;

///获取单据显示字段
#[post("/fetch_show_fields")]
pub async fn fetch_show_fields(
    db: web::Data<Pool>,
    name: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name != "" {
        let fields = get_fields(db.clone(), &name).await;
        HttpResponse::Ok().json(fields)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取全部单据
#[post("/fetch_all_documents")]
pub async fn fetch_all_documents(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    // let user = get_user(db.clone(), id, post_data.cate.clone()).await;
    let user = get_user(db.clone(), id, "出入库查询".to_owned()).await;

    if user.name != "" {
        let doc_cate;
        let doc_sql;

        if post_data.cate == "采购查询" {
            doc_cate = "采购单据";
            doc_sql = "documents.类别 = '材料采购'";
        } else if post_data.cate == "销售查询" {
            doc_cate = "销售单据";
            doc_sql = "documents.类别 = '商品销售' or documents.类别 = '销售退货'";
        } else if post_data.cate == "入库查询" {
            doc_cate = "入库单据";
            doc_sql = "documents.类别 = '采购入库'";
        } else if post_data.cate == "出库查询" {
            doc_cate = "出库单据";
            doc_sql = "documents.类别 = '销售出库'";
        } else if post_data.cate == "调入查询" {
            doc_cate = "库存调入";
            doc_sql = "documents.类别 = '调整入库'";
        } else if post_data.cate == "调出查询" {
            doc_cate = "库存调出";
            doc_sql = "documents.类别 = '调整出库'";
        } else {
            doc_cate = "发货单据";
            doc_sql = "documents.类别 = '运输发货'";
        }

        let f_map = map_fields(db.clone(), doc_cate).await;

        let mut limits = "".to_owned();
        if user.duty == "主管" || user.duty == "库管" {
            let area = format!("documents.{}", f_map["区域"]);
            limits = format!("{} = '{}' AND", area, user.area);
        } else if user.duty == "销售" {
            limits = format!("经办人 = '{}' AND", user.name);
        }

        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        // let name = post_data.name.to_lowercase();

        let fields = get_fields(db.clone(), doc_cate).await;

        let mut sql_fields = "SELECT 单号,documents.类别,".to_owned();
        let mut sql_where = "".to_owned();

        for f in &fields {
            sql_fields += &format!("documents.{},", f.field_name);
            if f.data_type == "文本" {
                sql_where += &format!(
                    "LOWER(documents.{}) LIKE '%{}%' OR ",
                    f.field_name, post_data.name
                )
            }
        }

        sql_where += &format!(
            "单号 LIKE '%{}%' OR 名称 LIKE '%{}%' OR documents.类别 LIKE '%{}%' OR 经办人 like '%{}%'",
            post_data.name, post_data.name, post_data.name, post_data.name
        );

        // sql_where = sql_where.trim_end_matches(" OR ").to_owned();

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号,customers.名称 FROM documents 
            JOIN customers ON documents.客商id=customers.id
            WHERE {} {} AND ({}) ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields, post_data.sort, limits, doc_sql, sql_where, post_data.sort, skip, post_data.rec
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut doc_rows: Vec<String> = Vec::new();
        for row in rows {
            let num: i64 = row.get("序号");
            let dh: String = row.get("单号");
            let cate: String = row.get("类别");
            let customer_name: String = row.get("名称");
            let row_str = format!(
                "{}{}{}{}{}{}{}{}{}",
                num, SPLITER, dh, SPLITER, cate, SPLITER, customer_name, SPLITER,
                simple_string_from_base(row, &fields),
            );

            doc_rows.push(row_str);
        }

        let count_sql = format!(
            r#"SELECT count(单号) as 记录数 FROM documents 
            JOIN customers ON documents.客商id=customers.id 
            WHERE {} {} AND ({})"#,
            limits, doc_sql, sql_where
        );

        let rows = &conn.query(count_sql.as_str(), &[]).await.unwrap();

        let mut count: i64 = 0;
        for row in rows {
            count = row.get("记录数");
        }
        let pages = (count as f64 / post_data.rec as f64).ceil() as i32;
        HttpResponse::Ok().json((doc_rows, count, pages))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct Rem {
    id: String,
    has: bool,
    rights: String,
}

#[post("/update_rem")]
pub async fn update_rem(db: web::Data<Pool>, rem: web::Json<Rem>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, rem.rights.clone()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();

        let sql = format!(
            r#"UPDATE documents SET 已记账={} WHERE 单号='{}'"#,
            rem.has, rem.id
        );

        let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct Del {
    id: String,
    rights: String,
    base: String,
}

#[post("/documents_del")]
pub async fn documents_del(db: web::Data<Pool>, del: web::Json<Del>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, del.rights.clone()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(r#"DELETE FROM {} WHERE 单号id='{}'"#, del.base, del.id);
        let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();

        let sql = format!(r#"DELETE FROM documents WHERE 单号='{}'"#, del.id);

        let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取库存超过库存下限的商品
#[post("/fetch_limit")]
pub async fn fetch_limit(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "库存检查".to_string()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();

        let sql = format!(
            r#"select node_name as 名称, 规格型号, 单位,name as 仓库, 库位, 库存下限, 库存, ROW_NUMBER () OVER (ORDER BY {}) as 序号 from products 
            join 
            (select 商品id,仓库id, sum(数量) as 库存 from document_items join documents on 单号=单号id where 直销=false and 已记账=true group by 仓库id,商品id) as foo
            on products.id=foo.商品id
            join tree on num=products.商品id 
            join warehouse on warehouse.id=foo.仓库id
            where (LOWER(node_name) LIKE '%{}%' OR LOWER(规格型号) LIKE '%{}%') AND 库存<=库存下限
            order by {} OFFSET {} LIMIT {};"#,
            post_data.sort, name, name, post_data.sort, skip, post_data.rec
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();

        for row in rows {
            let num: i64 = row.get("序号");
            let name: String = row.get("名称");
            let gg: String = row.get("规格型号");
            let dw: String = row.get("单位");
            let ck: String = row.get("仓库");
            let kw: String = row.get("库位");
            let limit: f32 = row.get("库存下限");
            let stock: f32 = row.get("库存");

            let product = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                num,
                SPLITER,
                name,
                SPLITER,
                gg,
                SPLITER,
                dw,
                SPLITER,
                ck,
                SPLITER,
                kw,
                SPLITER,
                limit,
                SPLITER,
                stock
            );

            products.push(product);
        }

        let count_sql = format!(
            r#"select count(products.id) as 记录数 from products 
            join 
            (select 商品id,仓库id, sum(数量) as 库存 from document_items join documents on 单号=单号id where 直销=false and 已记账=true group by 仓库id,商品id) as foo
            on products.id=foo.商品id
            join tree on num=products.商品id 
            join warehouse on warehouse.id=foo.仓库id
            where (LOWER(node_name) LIKE '%{}%' OR LOWER(规格型号) LIKE '%{}%') AND 库存<=库存下限;"#,
            name, name
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

///获取滞库的商品
#[post("/fetch_stay")]
pub async fn fetch_stay(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "库存检查".to_string()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.to_lowercase();

        let sql = format!(
            r#"select node_name as 名称, 规格型号, 单位,name as 仓库, 库位, 库存下限, 库存, B.日期, ROW_NUMBER () OVER (ORDER BY {}) as 序号 from products 
            join 
            (select 商品id,仓库id, sum(数量) as 库存 from document_items join documents on 单号=单号id where 直销=false and 已记账=true group by 仓库id,商品id) as foo
            on products.id=foo.商品id
            join 
            (
                SELECT 商品id, 日期, ROW_NUMBER() OVER (PARTITION BY 商品id ORDER BY 日期 DESC) RowIndex
                FROM document_items join documents on 单号=单号id WHERE 单号 like 'XS%' AND 直销=false AND 已记账=true
            ) B            
            on products.id=B.商品id
            join tree on num=products.商品id 
            join warehouse on warehouse.id=foo.仓库id
            where (LOWER(node_name) LIKE '%{}%' OR LOWER(规格型号) LIKE '%{}%') AND 库存>0 AND B.RowIndex = 1 and B.日期::date + interval '{} month' <= now()
            order by {} OFFSET {} LIMIT {};"#,
            post_data.sort, name, name, post_data.cate, post_data.sort, skip, post_data.rec
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();

        for row in rows {
            let num: i64 = row.get("序号");
            let name: String = row.get("名称");
            let gg: String = row.get("规格型号");
            let dw: String = row.get("单位");
            let ck: String = row.get("仓库");
            let kw: String = row.get("库位");
            let stock: f32 = row.get("库存");
            let date: String = row.get("日期");

            let product = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                num,
                SPLITER,
                name,
                SPLITER,
                gg,
                SPLITER,
                dw,
                SPLITER,
                ck,
                SPLITER,
                kw,
                SPLITER,
                stock,
                SPLITER,
                date,
            );

            products.push(product);
        }

        let count_sql = format!(
            r#"select count(products.id) as 记录数 from products 
            join 
            (select 商品id,仓库id, sum(数量) as 库存 from document_items join documents on 单号=单号id where 直销=false and 已记账=true group by 仓库id,商品id) as foo
            on products.id=foo.商品id
            join 
            (
                SELECT 商品id, 日期, ROW_NUMBER() OVER (PARTITION BY 商品id ORDER BY 日期 DESC) RowIndex
                FROM document_items join documents on 单号=单号id WHERE 单号 like 'XS%' AND 直销=false AND 已记账=true
            ) B            
            on products.id=B.商品id
            join tree on num=products.商品id 
            join warehouse on warehouse.id=foo.仓库id
            where (LOWER(node_name) LIKE '%{}%' OR LOWER(规格型号) LIKE '%{}%') AND 库存>0 AND B.RowIndex = 1 and B.日期::date + interval '{} month' <= now()"#,
            name, name, post_data.cate
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
