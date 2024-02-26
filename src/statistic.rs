#![allow(deprecated)]
use crate::service::*;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::Deserialize;
use time::Duration;
use xlsxwriter::{prelude::FormatAlignment, Workbook};

#[derive(Deserialize)]
pub struct StatisData {
    statis_cate: String,
    date1: String,
    date2: String,
}

#[post("/fetch_statis")]
pub async fn fetch_statis(
    db: web::Data<Pool>,
    post_data: web::Json<StatisData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let mut num: Vec<i64> = Vec::new();
        let mut date_lables: Vec<String> = Vec::new();
        let mut sale_data: Vec<f32> = Vec::new();
        let limits = get_limits(&user).await;

        let da_cate: String;

        let mut date_sql = format!(
            "日期::date >= '{}'::date and 日期::date <= '{}'::date ",
            post_data.date1, post_data.date2
        );

        if post_data.statis_cate == "按月" {
            da_cate = format!("to_char(日期::date, 'YYYY-MM')");
            date_sql = format!(
                "日期::date >= '{}'::date and 日期::date <= '{}'::date ",
                post_data.date1, post_data.date2
            );
        } else if post_data.statis_cate == "按年" {
            da_cate = format!("to_char(日期::date, 'YYYY')");
        } else if post_data.statis_cate == "按日" {
            da_cate = format!("to_char(日期::date, 'YYYY-MM-DD')");
        } else {
            da_cate = format!("to_char(日期::DATE-(extract(dow from 日期::TIMESTAMP)-1||'day')::interval, 'YYYY-mm-dd')");
        }

        let sql = format!(
            r#"
            select {} as date_cate, sum(单据金额) as 销售额, ROW_NUMBER () OVER (order by {}) as 序号
            from documents join (select 单号, 应结金额 as 单据金额 from documents where 单号 in 
            (select 文本字段6 from documents where documents.类别='运输发货' and 文本字段10 != '' and {}))
            as t on t.单号 = documents.文本字段6
            where {} 类别 = '销售出库' and 文本字段10 != '' and {}            
            group by date_cate
            order by date_cate
            "#,
            da_cate, da_cate, date_sql, limits, date_sql
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        for row in rows {
            let date: String = row.get("date_cate");
            let sale: f32 = row.get("销售额");
            let n: i64 = row.get("序号");
            num.push(n);
            date_lables.push(date);
            sale_data.push(sale);
        }

        let mut date_lables2: Vec<String> = Vec::new();
        let mut sale_data2: Vec<f32> = Vec::new();

        let sql = format!(
            r#"select {} as date_cate, sum(应结金额) as 销售额
                from documents
                where {} 类别 = '销售退货' and 文本字段10 != '' and {}
                group by date_cate
                "#,
            da_cate, limits, date_sql
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        for row in rows {
            let date: String = row.get("date_cate");
            let sale: f32 = row.get("销售额");
            date_lables2.push(date);
            sale_data2.push(sale);
        }

        for i in 0..date_lables2.len() {
            for n in 0..date_lables.len() {
                if date_lables2[i] == date_lables[n] {
                    sale_data[n] = sale_data[n] - sale_data2[i];
                    break;
                }
            }
        }

        HttpResponse::Ok().json((num, date_lables, sale_data))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize)]
pub struct CostData {
    statis_cate: String,
    num: i32,
}

#[post("/fetch_cost")]
pub async fn fetch_cost(
    db: web::Data<Pool>,
    post_data: web::Json<CostData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let mut num: Vec<i32> = Vec::new();
        let mut date_lables: Vec<String> = Vec::new();
        let mut sale_data: Vec<String> = Vec::new();

        let mut limit1 = "".to_owned();
        let mut limit2 = "".to_owned();
        if user.duty != "总经理" && user.duty != "销售" {
            limit1 = format!("documents.文本字段7 = '{}' and", user.area);
            limit2 = format!("products.文本字段6 = '{}' and", user.area);
        }

        let rows = &conn
            .query(r#"select max(日期) as 日期 from documents"#, &[])
            .await
            .unwrap();

        let mut date = "".to_owned();
        for row in rows {
            date = row.get("日期");
        }

        if date == "" {
            return HttpResponse::Ok().json(-1);
        }

        for i in 0..post_data.num {
            let sql = format!(
                r#"select COALESCE(sum(库存下限-COALESCE(理重合计,0)),0) as 库存重量 from products
                    LEFT JOIN
                        (select 物料号, sum(理重) as 理重合计 from pout_items
                            join documents on 单号id = 单号
                            where {} documents.日期::date <= '{}'::date and documents.文本字段10 != ''
                            group by 物料号
                        ) as foo
                    ON products.文本字段1 = foo.物料号
                    JOIN documents on 单号id = 单号
                    where {} products.文本字段7 <> '是' and
                    documents.日期::date <= '{}'::date and documents.文本字段10 != ''
                "#,
                limit1, date, limit2, date
            );

            // println!("{}", sql);

            let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

            let mut stocks = 0f32;

            for row in rows {
                stocks = row.get("库存重量");
            }

            let date_label: String;
            let get_time = time::strptime(&date, "%Y-%m-%d").unwrap();
            if post_data.statis_cate == "按月" {
                date_label = get_time.strftime("%Y-%m").unwrap().to_string();
                let new_date = get_time - Duration::days(30);
                date = new_date.strftime("%Y-%m-%d").unwrap().to_string();
            } else if post_data.statis_cate == "按年" {
                date_label = get_time.strftime("%Y").unwrap().to_string();
                let new_date = get_time - Duration::days(365);
                date = new_date.strftime("%Y-%m-%d").unwrap().to_string();
            } else if post_data.statis_cate == "按日" {
                date_label = get_time.strftime("%Y-%m-%d").unwrap().to_string();
                let new_date = get_time - Duration::days(1);
                date = new_date.strftime("%Y-%m-%d").unwrap().to_string();
            } else {
                date_label = get_time.strftime("%Y-%m-%d").unwrap().to_string();
                let new_date = get_time - Duration::days(7);
                date = new_date.strftime("%Y-%m-%d").unwrap().to_string();
            }

            //全是倒序，放到前端处理
            num.push(post_data.num - i);
            date_lables.push(date_label);
            sale_data.push(format!("{:.*}", 0, stocks / 1000.0));
        }

        HttpResponse::Ok().json((num, date_lables, sale_data))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[post("/home_statis")]
pub async fn home_statis(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        // let today = now().strftime("%Y-%m-%d").unwrap().to_string();
        let conn = db.get().await.unwrap();
        let f_map = map_fields(db.clone(), "销售单据").await;
        let f_map2 = map_fields(db.clone(), "客户").await;
        let f_map3 = map_fields(db.clone(), "供应商").await;
        let f_map4 = map_fields(db.clone(), "出库单据").await;
        let limits = get_limits(&user).await;
        let mut limit = limits.clone();

        // 对库管开放的条件限制
        if user.duty == "库管" {
            limit = format!(r#"documents.文本字段7 = '{}' and"#, user.area);
        }

        //销售未收款 ------------------------
        let sql = format!(
            r#"select 单号, customers.{} 简称, 经办人 from documents
            join customers on 客商id = customers.id
            where {} documents.类别='商品销售' and 是否欠款=true and 
            documents.文本字段10 != '' order by 单号 desc"#,
            f_map2["简称"], limits
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut sale1 = Vec::new();
        for row in rows {
            let dh: &str = row.get("单号");
            let worker: &str = row.get("经办人");
            let na: &str = row.get("简称");
            let item = format!("{} {:>4} {}", dh, na, worker);
            sale1.push(item);
        }

        //销售待开票 ------------------------
        let sql = format!(
            r#"select 单号, customers.{} 简称, 经办人 from documents
            join customers on 客商id = customers.id
            WHERE {} documents.类别='商品销售' AND documents.{} = true AND documents.{} = true AND
            名称 != '天津彩虹石油机械有限公司' order by 单号 desc"#,
            f_map2["简称"], limits, f_map["是否欠款"], f_map["发货完成"]
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut sale3 = Vec::new();
        for row in rows {
            let dh: &str = row.get("单号");
            let worker: &str = row.get("经办人");
            let na: &str = row.get("简称");
            let item = format!("{} {:>4} {}", dh, na, worker);
            sale3.push(item);
        }

        // 销售未发货
        let sql = format!(
            r#"select 单号, customers.{} 简称, 经办人 from documents
            join customers on 客商id = customers.id
            where {} documents.类别='商品销售' and documents.{} = false and documents.文本字段10 != ''
            and 单号 in (select documents.{} from documents where documents.{} <>''
            and documents.类别='销售出库' and documents.{} <> '') 
            and 单号 not in (select 文本字段6 from documents where documents.类别='运输发货' and 
            布尔字段3 = true and 文本字段10 = '')
            order by 单号 desc"#,
            f_map2["简称"],
            limits,
            f_map["发货完成"],
            f_map4["销售单号"],
            f_map4["销售单号"],
            f_map4["审核"]
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut sale2 = Vec::new();
        for row in rows {
            let dh: &str = row.get("单号");
            let worker: &str = row.get("经办人");
            let na: &str = row.get("简称");
            let item = format!("{} {:>4} {}", dh, na, worker);
            sale2.push(item);
        }

        //采购未入库 ------------------------
        //对库管开放
        let f_map5 = map_fields(db.clone(), "采购单据").await;
        let mut buy = Vec::new();

        let sql = format!(
            r#"select 单号, customers.{} 简称, 经办人 from documents
            join customers on 客商id = customers.id
            where documents.类别='材料采购' and documents.{} = false and 
            documents.文本字段10 != '' 
            and 单号 not in (select 文本字段6 from documents where documents.类别='采购入库' and 
            布尔字段3 = true and 文本字段10 = '')
            order by 单号 desc"#,
            f_map3["简称"], f_map5["入库完成"]
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        for row in rows {
            let dh: &str = row.get("单号");
            let worker: &str = row.get("经办人");
            let na: &str = row.get("简称");
            let item = format!("{} {:>4} {}", dh, na, worker);
            buy.push(item);
        }

        //销售待出库单据 ------------------------
        let mut pre_shen = Vec::new();
        let sql = format!(
            r#"select 单号, customers.{} 简称, 经办人 from documents
            join customers on 客商id = customers.id
            where {} documents.类别='商品销售' and documents.文本字段10 != '' and
            documents.{} = false and
            单号 not in (select 文本字段6 from documents where documents.类别='销售出库' and 
            布尔字段3 = true and 文本字段10 = '')
            order by 单号 desc"#,
            f_map2["简称"], limit, f_map["出库完成"],
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        for row in rows {
            let dh: &str = row.get("单号");
            let worker: &str = row.get("经办人");
            let na: &str = row.get("简称");
            let item = format!("{} {:>4} {}", dh, na, worker);
            pre_shen.push(item);
        }

        //已提交待审核单据 ------------------------

        let mut shen = Vec::new();

        let sql = format!(
            r#"select 类别, count(单号) 数量 from documents where {} 布尔字段3 = true and 文本字段10 = ''
                group by 类别"#,
            limits,
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        for row in rows {
            let cate: &str = row.get("类别");
            let num: i64 = row.get("数量");
            let item = format!("{}　{} 张", cate, num);
            shen.push(item);
        }

        // 以下是其他待办单据 ------------------------

        // 未提交审核单据 ------------------------
        let mut others = Vec::new();
        let sql = format!(
            r#"select count(单号) as 数量 from documents
            where {} 布尔字段3 = false and 已记账 = false and 类别 !='采购退货'"#,
            limits
        );

        let row = &conn.query_one(sql.as_str(), &[]).await.unwrap();
        let num: i64 = row.get("数量");

        if num > 0 {
            others.push(format!("{}　{} 张", "未提交审核单据", num));
        }

        //采购退货未完成 ------------------------
        let sql = format!(
            r#"select count(单号) as 数量 from documents
            where 类别='采购退货' and {} = false and 已记账 = false"#,
            f_map5["入库完成"]
        );

        let row = &conn.query_one(sql.as_str(), &[]).await.unwrap();
        let num: i64 = row.get("数量");

        if num > 0 {
            others.push(format!("{}　{} 张", "采购退货未完成", num));
        }

        //销售退货未完成 ------------------------
        let sql = format!(
            r#"select count(单号) as 数量 from documents
            where 类别='销售退货' and {} = false and 文本字段10 != '' and 已记账 = false"#,
            f_map5["入库完成"]
        );

        let row = &conn.query_one(sql.as_str(), &[]).await.unwrap();
        let num: i64 = row.get("数量");

        if num > 0 {
            others.push(format!("{}　{} 张", "销售退货待入库", num));
        }

        //反审单据 ------------------------
        let sql = format!(
            r#"select count(单号) as 数量 from documents
            where {} 文本字段10 = '' and 布尔字段3 = false and 已记账 = true"#,
            limits
        );

        let row = &conn.query_one(sql.as_str(), &[]).await.unwrap();
        let num: i64 = row.get("数量");

        if num > 0 {
            others.push(format!("{}　{} 张", "反审单据", num));
        }

        HttpResponse::Ok().json((sale1, sale2, buy, shen, sale3, pre_shen, others))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//入库明细
#[post("/get_stockin_items")]
pub async fn get_stockin_items(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "入库明细".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.trim().to_lowercase();
        let cate = post_data.cate.to_lowercase();
        let data: Vec<&str> = cate.split(SPLITER).collect();

        let f_map = map_fields(db.clone(), "入库单据").await;
        let f_map2 = map_fields(db.clone(), "商品规格").await;
        // let limits = get_limits(user, f_map).await;

        let query_field = if name != "" {
            //注意前导空格
            format!(
                r#" AND (LOWER(单号) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%'
                OR LOWER(规格型号) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%'
                OR LOWER(products.{}) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%'OR LOWER(documents.{}) LIKE '%{}%'
                 OR LOWER(documents.{}) LIKE '%{}%' OR LOWER(documents.备注) LIKE '%{}%')"#,
                name,
                f_map2["物料号"],
                name,
                name,
                name,
                f_map2["状态"],
                name,
                f_map2["执行标准"],
                name,
                f_map2["生产厂家"],
                name,
                f_map2["炉号"],
                name,
                f_map["到货日期"],
                name,
                f_map["入库日期"],
                name,
                name
            )
        } else {
            "".to_owned()
        };

        let query_date = if data[0] != "" && data[1] != "" {
            format!(
                r#"日期::date>='{}'::date AND 日期::date<='{}'::date"#,
                data[0], data[1]
            )
        } else {
            "".to_owned()
        };

        let sql = format!(
            r#"select documents.{} 到货日期, documents.{} 入库日期, 单号, split_part(node_name,' ',2) as 名称, products.{} 物料号,
                 split_part(node_name,' ',1) as 材质, 规格型号, products.{} 状态, products.{} 炉号, products.{} 入库长度,
                 products.{} 执行标准, products.{} 生产厂家, products.{} 理论重量, products.备注,
                 ROW_NUMBER () OVER (ORDER BY {}) as 序号 from products
            join documents on products.单号id = documents.单号
            join tree on tree.num = products.商品id
            where {}{} and documents.文本字段10 != ''
            ORDER BY {} OFFSET {} LIMIT {}"#,
            f_map["到货日期"],
            f_map["入库日期"],
            f_map2["物料号"],
            f_map2["状态"],
            f_map2["炉号"],
            f_map2["入库长度"],
            f_map2["执行标准"],
            f_map2["生产厂家"],
            f_map2["理论重量"],
            post_data.sort,
            query_date,
            query_field,
            post_data.sort,
            skip,
            post_data.rec
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();
        for row in rows {
            let f1: i64 = row.get("序号");
            let f2: &str = row.get("到货日期");
            let f3: &str = row.get("入库日期");
            let f4: &str = row.get("单号");
            let f5: &str = row.get("名称");
            let f6: &str = row.get("物料号");
            let f7: &str = row.get("材质");
            let f8: &str = row.get("规格型号");
            let f9: &str = row.get("状态");
            let f10: &str = row.get("炉号");
            let f11: i32 = row.get("入库长度");
            let f12: &str = row.get("执行标准");
            let f13: &str = row.get("生产厂家");
            let f14: f32 = row.get("理论重量");
            let f15: &str = row.get("备注");

            let product = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                f1,
                SPLITER,
                f2,
                SPLITER,
                f3,
                SPLITER,
                f4,
                SPLITER,
                f5,
                SPLITER,
                f6,
                SPLITER,
                f7,
                SPLITER,
                f8,
                SPLITER,
                f9,
                SPLITER,
                f10,
                SPLITER,
                f11,
                SPLITER,
                f12,
                SPLITER,
                f13,
                SPLITER,
                f14,
                SPLITER,
                f15
            );

            products.push(product);
        }

        let count_sql = format!(
            r#"select count(products.{}) as 记录数 from products
            join documents on products.单号id = documents.单号
            join tree on tree.num = products.商品id
            where {}{} and documents.文本字段10 != ''"#,
            f_map2["物料号"], query_date, query_field
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

//出库明细
#[post("/get_stockout_items")]
pub async fn get_stockout_items(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "出库明细".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.trim().to_lowercase();
        let cate = post_data.cate.to_lowercase();
        let data: Vec<&str> = cate.split(SPLITER).collect();
        let limit = get_limits(&user).await;

        let f_map = map_fields(db.clone(), "出库单据").await;
        let f_map2 = map_fields(db.clone(), "商品规格").await;
        // let limits = get_limits(user, f_map).await;

        let query_field = if name != "" {
            //注意前导空格
            format!(
                r#" AND (LOWER(单号) LIKE '%{}%' OR LOWER(物料号) LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%'
                OR LOWER(规格型号) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%'
                OR LOWER(documents.日期) LIKE '%{}%' OR LOWER(documents.{}) LIKE '%{}%' OR LOWER(documents.{}) LIKE '%{}%'
                OR LOWER(documents.备注) LIKE '%{}%')"#,
                name,
                name,
                name,
                name,
                f_map2["状态"],
                name,
                f_map2["炉号"],
                name,
                name,
                f_map["合同编号"],
                name,
                f_map["客户"],
                name,
                name
            )
        } else {
            "".to_owned()
        };

        let query_date = if data[0] != "" && data[1] != "" {
            format!(
                r#"日期::date>='{}'::date AND 日期::date<='{}'::date"#,
                data[0], data[1]
            )
        } else {
            "".to_owned()
        };

        let sql = format!(
            r#"select documents.日期, documents.{} 公司名称, documents.{} 合同号, 单号, documents.{} 销售单号,
                 split_part(node_name,' ',2) as 名称, 物料号, split_part(node_name,' ',1) as 材质, 
                 规格型号, products.{} 状态, products.{} 炉号, 长度, 数量, 重量,
                 pout_items.备注, ROW_NUMBER () OVER (ORDER BY {}) as 序号
            from pout_items
            join documents on pout_items.单号id = documents.单号
            join products on pout_items.物料号 = products.文本字段1
            join customers on documents.客商id = customers.id
            join tree on tree.num = products.商品id
            where {} {} {} and documents.文本字段10 != '' ORDER BY {} OFFSET {} LIMIT {}"#,
            f_map["客户"],
            f_map["合同编号"],
            f_map["销售单号"],
            f_map2["状态"],
            f_map2["炉号"],
            post_data.sort,
            limit,
            query_date,
            query_field,
            post_data.sort,
            skip,
            post_data.rec
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();
        for row in rows {
            let f1: i64 = row.get("序号");
            let f2: &str = row.get("日期");
            let f3: &str = row.get("公司名称");
            let f4: &str = row.get("合同号");
            let f5: &str = row.get("单号");
            let f6: &str = row.get("物料号");
            let f7: &str = row.get("名称");
            let f8: &str = row.get("材质");
            let f9: &str = row.get("规格型号");
            let f10: &str = row.get("状态");
            let f11: &str = row.get("炉号");
            let f12: i32 = row.get("长度");
            let f13: i32 = row.get("数量");
            let f14: f32 = row.get("重量");
            let f15: &str = row.get("备注");
            let f16: &str = row.get("销售单号");

            let product = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                f1,
                SPLITER,
                f2,
                SPLITER,
                f3,
                SPLITER,
                f4,
                SPLITER,
                f5,
                SPLITER,
                f16,
                SPLITER,
                f6,
                SPLITER,
                f7,
                SPLITER,
                f8,
                SPLITER,
                f9,
                SPLITER,
                f10,
                SPLITER,
                f11,
                SPLITER,
                f12,
                SPLITER,
                f13,
                SPLITER,
                f14,
                SPLITER,
                f15
            );

            products.push(product);
        }

        let count_sql = format!(
            r#"select count(物料号) as 记录数 from pout_items
            join documents on pout_items.单号id = documents.单号
            join products on pout_items.物料号 = products.文本字段1
            join customers on documents.客商id = customers.id
            join tree on tree.num = products.商品id
            where {} {}{} and documents.文本字段10 != ''"#,
            limit, query_date, query_field
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

struct Fields {
    name: &'static str,
    width: i32,
}

//入库明细导出到 excel
#[post("/stockin_excel")]
pub async fn stockin_excel(
    db: web::Data<Pool>,
    post_data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "入库明细".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let data: Vec<&str> = post_data.split(SPLITER).collect();
        let name = data[2].trim().to_lowercase();

        let f_map = map_fields(db.clone(), "入库单据").await;
        let f_map2 = map_fields(db.clone(), "商品规格").await;
        // let limits = get_limits(user, f_map).await;

        let query_field = if name != "" {
            //注意前导空格
            format!(
                r#" AND (LOWER(单号) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%'
                OR LOWER(规格型号) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%'
                OR LOWER(products.{}) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%'OR LOWER(documents.{}) LIKE '%{}%'
                 OR LOWER(documents.{}) LIKE '%{}%' OR LOWER(documents.备注) LIKE '%{}%')"#,
                name,
                f_map2["物料号"],
                name,
                name,
                name,
                f_map2["状态"],
                name,
                f_map2["执行标准"],
                name,
                f_map2["生产厂家"],
                name,
                f_map2["炉号"],
                name,
                f_map["到货日期"],
                name,
                f_map["入库日期"],
                name,
                name
            )
        } else {
            "".to_owned()
        };

        let query_date = if data[0] != "" && data[1] != "" {
            format!(
                r#"日期::date>='{}'::date AND 日期::date<='{}'::date"#,
                data[0], data[1]
            )
        } else {
            "".to_owned()
        };

        let sql = format!(
            r#"select documents.{} 到货日期, documents.{} 入库日期, 单号, split_part(node_name,' ',2) as 名称, products.{} 物料号,
                 split_part(node_name,' ',1) as 材质, 规格型号 规格, products.{} 状态, products.{} 炉号, products.{}::text 入库长度,
                 products.{} 执行标准, products.{} 生产厂家, products.{}::text 理论重量, products.备注,
                 ROW_NUMBER () OVER (ORDER BY documents.日期 DESC)::text as 序号 from products
            join documents on products.单号id = documents.单号
            join tree on tree.num = products.商品id
            where {}{} and documents.文本字段10 != ''
            ORDER BY documents.日期 DESC"#,
            f_map["到货日期"],
            f_map["入库日期"],
            f_map2["物料号"],
            f_map2["状态"],
            f_map2["炉号"],
            f_map2["入库长度"],
            f_map2["执行标准"],
            f_map2["生产厂家"],
            f_map2["理论重量"],
            query_date,
            query_field,
        );
        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        // 导出到 Excel
        let file_name = format!("./download/{}.xlsx", "入库明细表");
        let wb = Workbook::new(&file_name).unwrap();
        let mut sheet = wb.add_worksheet(Some("数据")).unwrap();

        let fields: Vec<Fields> = vec![
            Fields {
                name: "序号",
                width: 6,
            },
            Fields {
                name: "到货日期",
                width: 12,
            },
            Fields {
                name: "入库日期",
                width: 12,
            },
            Fields {
                name: "单号",
                width: 15,
            },
            Fields {
                name: "名称",
                width: 12,
            },
            Fields {
                name: "物料号",
                width: 12,
            },
            Fields {
                name: "材质",
                width: 12,
            },
            Fields {
                name: "规格",
                width: 12,
            },
            Fields {
                name: "状态",
                width: 18,
            },
            Fields {
                name: "炉号",
                width: 18,
            },
            Fields {
                name: "入库长度",
                width: 10,
            },
            Fields {
                name: "执行标准",
                width: 18,
            },
            Fields {
                name: "生产厂家",
                width: 15,
            },
            Fields {
                name: "理论重量",
                width: 12,
            },
            Fields {
                name: "备注",
                width: 15,
            },
        ];

        let mut n = 0;
        for f in &fields {
            sheet
                .write_string(
                    0,
                    n,
                    &f.name,
                    Some(
                        &wb.add_format()
                            .set_align(FormatAlignment::CenterAcross)
                            .set_bold(),
                    ),
                )
                .unwrap();
            sheet.set_column(n, n, f.width.into(), None).unwrap();
            n += 1;
        }

        let mut n = 1u32;
        for row in rows {
            let mut m = 0u16;
            for f in &fields {
                sheet
                    .write_string(
                        n,
                        m,
                        row.get(&*f.name),
                        Some(&wb.add_format().set_align(FormatAlignment::Center)),
                    )
                    .unwrap();
                m += 1;
            }
            n += 1;
        }

        wb.close().unwrap();
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//出库明细导出到 excel
#[post("/stockout_excel")]
pub async fn stockout_excel(
    db: web::Data<Pool>,
    post_data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "出库明细".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let data: Vec<&str> = post_data.split(SPLITER).collect();
        let name = data[2].trim().to_lowercase();

        let f_map = map_fields(db.clone(), "出库单据").await;
        let f_map2 = map_fields(db.clone(), "商品规格").await;
        // let limits = get_limits(user, f_map).await;

        let query_field = if name != "" {
            //注意前导空格
            format!(
                r#" AND (LOWER(单号) LIKE '%{}%' OR LOWER(物料号) LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%'
                OR LOWER(规格型号) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%'
                OR LOWER(documents.日期) LIKE '%{}%' OR LOWER(documents.{}) LIKE '%{}%' OR LOWER(documents.{}) LIKE '%{}%'
                OR LOWER(documents.备注) LIKE '%{}%')"#,
                name,
                name,
                name,
                name,
                f_map2["状态"],
                name,
                f_map2["炉号"],
                name,
                name,
                f_map["合同编号"],
                name,
                f_map["客户"],
                name,
                name
            )
        } else {
            "".to_owned()
        };

        let query_date = if data[0] != "" && data[1] != "" {
            format!(
                r#"日期::date>='{}'::date AND 日期::date<='{}'::date"#,
                data[0], data[1]
            )
        } else {
            "".to_owned()
        };

        let sql = format!(
            r#"select documents.日期, documents.{} 公司名称, documents.{} 合同号, 单号, split_part(node_name,' ',2) as 名称, 物料号,
                 split_part(node_name,' ',1) as 材质, 规格型号 规格, products.{} 状态, products.{} 炉号, 长度::text, 数量::text, 重量::text,
                 pout_items.备注, ROW_NUMBER () OVER (ORDER BY documents.日期 DESC)::text as 序号
            from pout_items
            join documents on pout_items.单号id = documents.单号
            join products on pout_items.物料号 = products.文本字段1
            join customers on documents.客商id = customers.id
            join tree on tree.num = products.商品id
            where {}{} and documents.文本字段10 != '' order by documents.日期 DESC"#,
            f_map["客户"],
            f_map["合同编号"],
            f_map2["状态"],
            f_map2["炉号"],
            query_date,
            query_field
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        // 导出到 Excel
        let file_name = format!("./download/{}.xlsx", "出库明细表");
        let wb = Workbook::new(&file_name).unwrap();
        let mut sheet = wb.add_worksheet(Some("数据")).unwrap();

        // //设置列宽
        // sheet.set_column(0, 0, 8.0, None).unwrap();
        // sheet.set_column(1, 1, 12.0, None).unwrap();

        let fields: Vec<Fields> = vec![
            Fields {
                name: "序号",
                width: 6,
            },
            Fields {
                name: "日期",
                width: 12,
            },
            Fields {
                name: "公司名称",
                width: 25,
            },
            Fields {
                name: "合同号",
                width: 15,
            },
            Fields {
                name: "单号",
                width: 15,
            },
            Fields {
                name: "物料号",
                width: 12,
            },
            Fields {
                name: "名称",
                width: 12,
            },
            Fields {
                name: "材质",
                width: 12,
            },
            Fields {
                name: "规格",
                width: 12,
            },
            Fields {
                name: "状态",
                width: 18,
            },
            Fields {
                name: "炉号",
                width: 15,
            },
            Fields {
                name: "长度",
                width: 10,
            },
            Fields {
                name: "数量",
                width: 10,
            },
            Fields {
                name: "重量",
                width: 10,
            },
            Fields {
                name: "备注",
                width: 15,
            },
        ];

        let mut n = 0;
        for f in &fields {
            sheet
                .write_string(
                    0,
                    n,
                    &f.name,
                    Some(
                        &wb.add_format()
                            .set_align(FormatAlignment::CenterAcross)
                            .set_bold(),
                    ),
                )
                .unwrap();
            sheet.set_column(n, n, f.width.into(), None).unwrap();
            n += 1;
        }

        let mut n = 1u32;
        for row in rows {
            let mut m = 0u16;
            for f in &fields {
                sheet
                    .write_string(
                        n,
                        m,
                        row.get(&*f.name),
                        Some(&wb.add_format().set_align(FormatAlignment::Center)),
                    )
                    .unwrap();
                m += 1;
            }
            n += 1;
        }

        wb.close().unwrap();
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///业务往来
#[post("/fetch_business")]
pub async fn fetch_business(
    db: web::Data<Pool>,
    post_data: web::Json<TablePager>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "业务往来".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.trim().to_lowercase();
        let cate = post_data.cate.to_lowercase();
        let data: Vec<&str> = cate.split(SPLITER).collect();

        let limits = get_limits(&user).await;

        let query_field = if name != "" {
            //注意前导空格
            format!(
                r#" AND (LOWER(单号) LIKE '%{}%' OR LOWER(documents.类别) LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%' OR
                LOWER(documents.文本字段6) LIKE '%{}%' OR LOWER(规格) LIKE '%{}%' OR LOWER(状态) LIKE '%{}%' OR
                LOWER(customers.名称) LIKE '%{}%' OR LOWER(documents.备注) LIKE '%{}%')"#,
                name, name, name, name, name, name, name, name
            )
        } else {
            "".to_owned()
        };

        let query_date = if data[0] != "" && data[1] != "" {
            format!(
                r#" AND 日期::date>='{}'::date AND 日期::date<='{}'::date"#,
                data[0], data[1]
            )
        } else {
            "".to_owned()
        };

        let sql = format!(
            r#"select 日期, 单号, customers.名称 客户名称, documents.文本字段6 as 合同编号, documents.类别, 应结金额, 
                 split_part(node_name,' ',2) as 名称, split_part(node_name,' ',1) as 材质, 
                 规格, 状态, 长度, 数量, 单价, 重量, documents.备注,
                 ROW_NUMBER () OVER (ORDER BY {}) as 序号 from document_items
            join documents on documents.单号 = document_items.单号id
            join customers on documents.客商id = customers.id
            join tree on tree.num = document_items.商品id
            where {} documents.文本字段10 != '' and customers.类别='客户' {}{}
            ORDER BY {} OFFSET {} LIMIT {}"#,
            post_data.sort, limits, query_field, query_date, post_data.sort, skip, post_data.rec
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();
        for row in rows {
            let f1: i64 = row.get("序号");
            let f2: String = row.get("日期");
            let f3: String = row.get("单号");
            let f31: String = row.get("客户名称");
            let f4: String = row.get("合同编号");
            let f5: String = row.get("类别");
            let f6: f32 = row.get("应结金额");
            let f7: String = row.get("名称");
            let f8: String = row.get("材质");
            let f9: String = row.get("规格");
            let f10: String = row.get("状态");
            let f11: i32 = row.get("长度");
            let f12: i32 = row.get("数量");
            let f13: f32 = row.get("单价");
            let f14: f32 = row.get("重量");
            let f15: String = row.get("备注");

            let product = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                f1,
                SPLITER,
                f2,
                SPLITER,
                f3,
                SPLITER,
                f31,
                SPLITER,
                f4,
                SPLITER,
                f5,
                SPLITER,
                f6,
                SPLITER,
                f7,
                SPLITER,
                f8,
                SPLITER,
                f9,
                SPLITER,
                f10,
                SPLITER,
                f11,
                SPLITER,
                f12,
                SPLITER,
                f13,
                SPLITER,
                f14,
                SPLITER,
                f15
            );

            products.push(product);
        }

        let count_sql = format!(
            r#"select count(单号) as 记录数, COALESCE(sum(case when 重量=0 and 理重=0 then 单价*数量
               else 单价*重量 end), 0) as 金额 from document_items
            join documents on documents.单号 = document_items.单号id
            join customers on documents.客商id = customers.id
            join tree on tree.num = document_items.商品id
            where {} documents.文本字段10 != '' and customers.类别='客户' {}{}"#,
            limits, query_field, query_date
        );

        let rows = &conn.query(count_sql.as_str(), &[]).await.unwrap();

        let mut count: i64 = 0;
        let mut money: f64 = 0f64;

        for row in rows {
            count = row.get("记录数");
            money = row.get("金额");
        }
        let pages = (count as f64 / post_data.rec as f64).ceil() as i32;

        let money2 = format!("{:.*}", 0, money);

        HttpResponse::Ok().json((products, count, pages, money2))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//业务往来导出到 excel
#[post("/business_excel")]
pub async fn business_excel(
    db: web::Data<Pool>,
    post_data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "业务往来".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let data: Vec<&str> = post_data.split(SPLITER).collect();
        let name = data[2].trim().to_lowercase();

        let limits = get_limits(&user).await;

        let query_field = if name != "" {
            //注意前导空格
            format!(
                r#" AND (LOWER(单号) LIKE '%{}%' OR LOWER(documents.类别) LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%' OR
                LOWER(documents.文本字段6) LIKE '%{}%' OR LOWER(规格) LIKE '%{}%' OR LOWER(状态) LIKE '%{}%' OR
                LOWER(customers.名称) LIKE '%{}%' OR LOWER(documents.备注) LIKE '%{}%')"#,
                name, name, name, name, name, name, name, name
            )
        } else {
            "".to_owned()
        };

        let query_date = if data[0] != "" && data[1] != "" {
            format!(
                r#" AND 日期::date>='{}'::date AND 日期::date<='{}'::date"#,
                data[0], data[1]
            )
        } else {
            "".to_owned()
        };

        let sql = format!(
            r#"select 日期, 单号, customers.名称 客户名称, documents.文本字段6 as 合同编号, documents.类别, 应结金额::text, split_part(node_name,' ',2) as 名称,
                 split_part(node_name,' ',1) as 材质, 规格, 状态, 长度::text, 数量::text, 单价::text, 重量::text, documents.备注,
                 ROW_NUMBER () OVER (ORDER BY documents.日期 DESC)::text as 序号 from document_items
            join documents on documents.单号 = document_items.单号id
            join customers on documents.客商id = customers.id
            join tree on tree.num = document_items.商品id
            where {} documents.文本字段10 != '' and customers.类别='客户' {}{}
            ORDER BY documents.日期 DESC"#,
            limits, query_field, query_date
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        // 导出到 Excel
        let file_name = format!("./download/{}.xlsx", "业务往来明细表");
        let wb = Workbook::new(&file_name).unwrap();
        let mut sheet = wb.add_worksheet(Some("数据")).unwrap();

        let fields: Vec<Fields> = vec![
            Fields {
                name: "序号",
                width: 6,
            },
            Fields {
                name: "日期",
                width: 12,
            },
            Fields {
                name: "单号",
                width: 15,
            },
            Fields {
                name: "客户名称",
                width: 25,
            },
            Fields {
                name: "合同编号",
                width: 15,
            },
            Fields {
                name: "类别",
                width: 12,
            },
            Fields {
                name: "应结金额",
                width: 12,
            },
            Fields {
                name: "名称",
                width: 12,
            },
            Fields {
                name: "材质",
                width: 12,
            },
            Fields {
                name: "规格",
                width: 12,
            },
            Fields {
                name: "状态",
                width: 18,
            },
            Fields {
                name: "长度",
                width: 10,
            },
            Fields {
                name: "数量",
                width: 10,
            },
            Fields {
                name: "单价",
                width: 10,
            },
            Fields {
                name: "重量",
                width: 10,
            },
            Fields {
                name: "备注",
                width: 15,
            },
        ];

        let mut n = 0;
        for f in &fields {
            sheet
                .write_string(
                    0,
                    n,
                    &f.name,
                    Some(
                        &wb.add_format()
                            .set_align(FormatAlignment::CenterAcross)
                            .set_bold(),
                    ),
                )
                .unwrap();
            sheet.set_column(n, n, f.width.into(), None).unwrap();
            n += 1;
        }

        let mut n = 1u32;
        for row in rows {
            let mut m = 0u16;
            for f in &fields {
                sheet
                    .write_string(
                        n,
                        m,
                        row.get(&*f.name),
                        Some(&wb.add_format().set_align(FormatAlignment::Center)),
                    )
                    .unwrap();
                m += 1;
            }
            n += 1;
        }

        wb.close().unwrap();
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
