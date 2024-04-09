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
    let user = get_user(db.clone(), id, "".to_owned()).await;

    if user.name != "" {
        let mut limits = get_limits(&user).await;

        let doc_cate;
        let doc_sql;

        let cate: Vec<&str> = post_data.cate.split(' ').collect();

        if cate[0] == "采购查询" {
            doc_cate = "采购单据";
            doc_sql = "documents.类别 = '材料采购' or documents.类别 = '采购退货'";
            if user.duty == "销售" {
                limits = "".to_owned();
            } else if user.duty == "库管" {
                limits = format!("documents.文本字段7 = '{}' AND", user.area);
            }
        } else if cate[0] == "销售查询" {
            doc_cate = "销售单据";
            doc_sql = "documents.类别 = '商品销售' or documents.类别 = '销售退货'";
        } else if cate[0] == "入库查询" {
            doc_cate = "入库单据";
            doc_sql = "documents.类别 = '采购入库'";
        } else if cate[0] == "出库查询" {
            doc_cate = "出库单据";
            doc_sql = "documents.类别 = '销售出库'";
        } else if cate[0] == "调入查询" {
            doc_cate = "库存调入";
            doc_sql = "documents.类别 = '调整入库'";
        } else if cate[0] == "调出查询" {
            doc_cate = "库存调出";
            doc_sql = "documents.类别 = '调整出库'";
        } else if cate[0] == "开票查询" {
            doc_cate = "销售开票";
            doc_sql = "documents.类别 = '销售开票'";
        } else {
            doc_cate = "发货单据";
            doc_sql = "documents.类别 = '运输发货'";
        }

        let mut query_limit = "".to_owned();
        if cate.len() > 1 {
            query_limit = if cate[1] == "wait_out" {
                r#"documents.类别='商品销售' and documents.文本字段10 != '' and documents.布尔字段2 = false and 单号 not in
                (select 文本字段6 from documents where documents.类别='销售出库' and 布尔字段3 = true and 文本字段10 = '') and"#.to_string()
            } else if cate[1] == "wait_shen" {
                format!("documents.布尔字段3 = true and documents.文本字段10 = '' and documents.类别 = '{}' and", &cate[2])
            } else if cate[1] == "wait_trans" {
                "documents.类别 = '商品销售' and documents.布尔字段1 = false and documents.文本字段10 != ''
                and 单号 in (select documents.文本字段6 from documents where documents.文本字段6 <>''
                and documents.类别='销售出库' and documents.文本字段10 != '') 
                and 单号 not in (select 文本字段6 from documents where documents.类别='运输发货' and 
                布尔字段3 = true and 文本字段10 = '') and".to_owned()
            } else if cate[1] == "wait_money" {
                "documents.类别 = '商品销售' and documents.是否欠款 = true and documents.文本字段10 != '' and 名称 != '实验室' and".to_owned()
            } else if cate[1] == "wait_kp" {
                "documents.类别='商品销售' AND documents.是否欠款 = true AND documents.布尔字段1 = true AND
                单号 not in (select 文本字段6 from documents where documents.类别='销售开票' and 布尔字段3 = true) AND 
                名称 != '天津彩虹石油机械有限公司' AND 名称 != '实验室' and".to_owned()
            } else if cate[1] == "wait_in" {
                "documents.类别 = '材料采购' and documents.布尔字段2 = false and documents.文本字段10 != '' 
                and 单号 not in (select 文本字段6 from documents where documents.类别='采购入库' and 
                布尔字段3 = true and 文本字段10 = '') and".to_owned()
            } else if cate[1] == "wait_buy_back" {
                "documents.类别 = '采购退货' and documents.布尔字段2 = false and documents.文本字段10 != '' and".to_owned()
            } else {
                "".to_owned()
            };
        }

        if user.duty == "库管" && cate[1] == "wait_out" {
            limits = format!("documents.文本字段7 = '{}' AND", user.area);
        }

        // println!("{},{}",cate[1], query_limit);

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
            WHERE {} {} ({}) AND ({}) ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields,
            post_data.sort,
            limits,
            query_limit,
            doc_sql,
            sql_where,
            post_data.sort,
            skip,
            post_data.rec
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
                num,
                SPLITER,
                dh,
                SPLITER,
                cate,
                SPLITER,
                customer_name,
                SPLITER,
                simple_string_from_base(row, &fields),
            );

            doc_rows.push(row_str);
        }

        let count_sql = format!(
            r#"SELECT count(单号) as 记录数 FROM documents 
            JOIN customers ON documents.客商id=customers.id 
            WHERE {} {} ({}) AND ({})"#,
            limits, query_limit, doc_sql, sql_where
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

///获取其他单据
///
#[post("/fetch_a_documents")]
pub async fn fetch_a_documents(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;

    if user.name != "" {
        let mut limits = get_limits(&user).await;
        let mut doc_sql = "";

        if post_data.cate == "未提交审核单据" {
            doc_sql =
                "documents.布尔字段3 = false and 已记账 = false and documents.类别 != '采购退货'";
        } else if post_data.cate == "采购退货未完成" {
            doc_sql =
                "documents.类别='采购退货' and documents.布尔字段2 = false and 已记账 = false";
        } else if post_data.cate == "反审单据" {
            doc_sql = "documents.文本字段10 = '' and documents.布尔字段3 = false and 已记账 = true";
        } else if post_data.cate == "销售退货待入库" {
            doc_sql = "documents.类别='销售退货' and documents.文本字段10 != '' and documents.布尔字段2 = false and 已记账 = false";

            if user.duty == "库管" {
                limits = format!("documents.文本字段7 = '{}' AND", user.area,); // 文本字段7 为 区域
            }
        }

        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let mut sql_where = "".to_owned();

        sql_where += &format!(
            "单号 LIKE '%{}%' OR 名称 LIKE '%{}%' OR documents.类别 LIKE '%{}%' OR 经办人 like '%{}%'",
            post_data.name, post_data.name, post_data.name, post_data.name
        );

        // sql_where = sql_where.trim_end_matches(" OR ").to_owned();

        let sql = format!(
            r#"SELECT 单号, documents.类别, documents.日期, ROW_NUMBER () OVER (ORDER BY {}) as 序号,
            经办人, customers.备注 FROM documents 
            JOIN customers ON documents.客商id=customers.id
            WHERE {} ({}) AND ({}) ORDER BY {} OFFSET {} LIMIT {}"#,
            post_data.sort, limits, doc_sql, sql_where, post_data.sort, skip, post_data.rec
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut doc_rows: Vec<String> = Vec::new();
        for row in rows {
            let num: i64 = row.get("序号");
            let dh: String = row.get("单号");
            let cate: String = row.get("类别");
            let date: String = row.get("日期");
            let worker: String = row.get("经办人");
            let note: String = row.get("备注");
            let row_str = format!(
                "{}{}{}{}{}{}{}{}{}{}{}",
                num, SPLITER, dh, SPLITER, cate, SPLITER, date, SPLITER, worker, SPLITER, note
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

#[derive(Deserialize, Serialize)]
pub struct Del {
    id: String,
    rights: String,
    base: String,
}

#[post("/documents_del")]
pub async fn documents_del(db: web::Data<Pool>, del: web::Json<Del>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "删除单据".to_owned()).await;
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
