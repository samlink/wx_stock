use crate::service::*;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use time::{now, Duration};
use serde::{Deserialize, Serialize};

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
        let limits = get_limits(user).await;

        let da_cate: String;

        let mut date_sql = format!(
            "日期::date >= '{}'::date and 日期::date <= '{}'::date ", //注意：小于等于号
            post_data.date1, post_data.date2
        );

        if post_data.statis_cate == "按月" {
            da_cate = format!("to_char(日期::date, 'YYYY-MM')");
            date_sql = format!(
                "日期::date >= '{}'::date and 日期::date < '{}'::date ", //注意：小于号
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
            r#"select {} as date_cate, sum(应结金额) as 销售额, ROW_NUMBER () OVER (order by {}) as 序号
                from documents
                where {} 类别 = '商品销售' and 文本字段3 != '' and {}
                group by date_cate
                order by date_cate"#,
            da_cate, da_cate, limits, date_sql
        );

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
                where {} 类别 = '销售退货' and 文本字段3 != '' and {}
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

        let limits = if user.duty != "总经理" && user.duty != "销售" {
            format!("documents.文本字段7 = '{}' and", user.area)
        } else {
            "".to_owned()
        };

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
                            where {} documents.日期::date <= '{}'::date
                            group by 物料号
                        ) as foo
                    ON products.文本字段1 = foo.物料号
                    JOIN documents on 单号id = 单号
                    where {} products.文本字段7 <> '是' and documents.日期::date <= '{}'::date
                "#, limits, date, limits, date
            );

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
        let limits = get_limits(user).await;

        //销售完成 ------------------------
        let sql = format!(
            r#"select 单号, 经办人, {} as 区域 from documents where {} 类别='商品销售' and 是否欠款=true"#,
            f_map["区域"], limits
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut sale1 = Vec::new();
        for row in rows {
            let dh: &str = row.get("单号");
            let worker: &str = row.get("经办人");
            let area: &str = row.get("区域");
            let item = format!("{}　{:>4}　{}", dh, worker, area);
            sale1.push(item);
        }

        let mut sale2 = Vec::new();

        let sql = format!(
            r#"select 单号, 经办人, {} as 区域 from documents where {} 类别='商品销售' and {}=false"#,
            f_map["区域"], limits, f_map["发货完成"]
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        for row in rows {
            let dh: &str = row.get("单号");
            let worker: &str = row.get("经办人");
            let area: &str = row.get("区域");
            let item = format!("{}　{:>4}　{}", dh, worker, area);
            sale2.push(item);
        }

        //采购未出库 ------------------------

        let f_map = map_fields(db.clone(), "采购单据").await;
        let mut buy = Vec::new();

        let sql = format!(
            r#"select 单号, 经办人, {} as 区域 from documents where {} 类别='材料采购' and {} = false"#,
            f_map["区域"], limits, f_map["入库完成"]
        );

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        for row in rows {
            let dh: &str = row.get("单号");
            let worker: &str = row.get("经办人");
            let area: &str = row.get("区域");
            let item = format!("{}　{:>4}　{}", dh, worker, area);
            buy.push(item);
        }

        //待审核单据 ------------------------

        let f_map = map_fields(db.clone(), "入库单据").await;
        let mut shen = Vec::new();

        let sql = format!(
            r#"select 类别, count(单号) 数量 from documents where {} 布尔字段3 = true
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

        //待质检 ------------------------

        // let f_map = map_fields(db.clone(), "采购单据").await;
        let mut check = Vec::new();

        let sql = format!(
            r#"select 单号, 经办人, {} as 区域 from documents where {} 类别='采购入库' and {} = ''"#,
            f_map["区域"], limits, f_map["质检"]
        );

        // println!("{}",sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        for row in rows {
            let dh: &str = row.get("单号");
            let worker: &str = row.get("经办人");
            let area: &str = row.get("区域");
            let item = format!("{}　{:>4}　{}", dh, worker, area);
            check.push(item);
        }

        HttpResponse::Ok().json((sale1, sale2, buy, shen, check))

        // //今日采购单数
        // let sql = format!(
        //     r#"select count(单号) as 单数 from documents where 单号 like 'CG%' and 已记账=true and 日期::date='{}'::date"#,
        //     today
        // );
        //
        // let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        // let mut buy_num = 0i64;
        // for row in rows {
        //     buy_num = row.get("单数");
        // }
        //
        // //超过库存下限的商品数
        // let count_sql = format!(
        //     r#"select count(products.id) as 记录数 from products
        //     join
        //     (select 商品id, sum(数量) as 库存 from document_items join documents on 单号=单号id where 直销=false and 已记账=true group by 仓库id,商品id) as foo
        //     on products.id=foo.商品id
        //     join warehouse on warehouse.id=foo.仓库id
        //     where 库存<=库存下限;"#,
        // );
        //
        // let rows = &conn.query(count_sql.as_str(), &[]).await.unwrap();
        //
        // let mut limit_count: i64 = 0;
        // for row in rows {
        //     limit_count = row.get("记录数");
        // }
        //
        // //滞库3个月商品数
        // let count_sql = format!(
        //     r#"select count(products.id) as 记录数 from products
        //     join
        //     (select 商品id,仓库id, sum(数量) as 库存 from document_items join documents on 单号=单号id where 直销=false and 已记账=true group by 仓库id,商品id) as foo
        //     on products.id=foo.商品id
        //     join
        //     (
        //         SELECT 商品id, 日期, ROW_NUMBER() OVER (PARTITION BY 商品id ORDER BY 日期 DESC) RowIndex
        //         FROM document_items join documents on 单号=单号id WHERE 单号 like 'XS%' AND 直销=false AND 已记账=true
        //     ) B
        //     on products.id=B.商品id
        //     join warehouse on warehouse.id=foo.仓库id
        //     where 库存>0 AND B.RowIndex = 1 and B.日期::date + interval '3 month' <= now()"#
        // );
        //
        // let rows = &conn.query(count_sql.as_str(), &[]).await.unwrap();
        //
        // let mut stay_count: i64 = 0;
        // for row in rows {
        //     stay_count = row.get("记录数");
        // }

        // HttpResponse::Ok().json((sale_num, buy_num, stay_count, limit_count))
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
    let user = get_user(db.clone(), id, "业务往来".to_owned()).await;
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
                name, f_map2["物料号"], name, name, name, f_map2["状态"], name, f_map2["执行标准"], name, f_map2["生产厂家"],
                name, f_map2["炉号"], name, f_map["到货日期"], name, f_map["入库日期"], name, name
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
                 products.{} 执行标准, products.{} 生产厂家, products.{} 理论重量, documents.备注,
                 ROW_NUMBER () OVER (ORDER BY {}) as 序号 from products
            join documents on products.单号id = documents.单号
            join tree on tree.num = products.商品id
            where {}{}
            ORDER BY {} OFFSET {} LIMIT {}"#,
            f_map["到货日期"], f_map["入库日期"], f_map2["物料号"], f_map2["状态"], f_map2["炉号"], f_map2["入库长度"],
            f_map2["执行标准"], f_map2["生产厂家"], f_map2["理论重量"],
            post_data.sort, query_date, query_field, post_data.sort, skip, post_data.rec
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
                f1, SPLITER, f2, SPLITER, f3, SPLITER, f4, SPLITER, f5, SPLITER,
                f6, SPLITER, f7, SPLITER, f8, SPLITER, f9, SPLITER, f10, SPLITER,
                f11, SPLITER, f12, SPLITER, f13, SPLITER, f14, SPLITER, f15
            );

            products.push(product);
        }

        let count_sql = format!(
            r#"select count(products.{}) as 记录数 from products
            join documents on products.单号id = documents.单号
            join tree on tree.num = products.商品id
            where {}{}"#, f_map2["物料号"], query_date, query_field
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
    let user = get_user(db.clone(), id, "业务往来".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let skip = (post_data.page - 1) * post_data.rec;
        let name = post_data.name.trim().to_lowercase();
        let cate = post_data.cate.to_lowercase();
        let data: Vec<&str> = cate.split(SPLITER).collect();

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
                name, name, name, name, f_map2["状态"], name, f_map2["炉号"], name,
                name, f_map["合同编号"], name, f_map["客户"], name, name
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
                 split_part(node_name,' ',1) as 材质, 规格型号, products.{} 状态, products.{} 炉号, 长度, 数量, 重量,
                 pout_items.备注, ROW_NUMBER () OVER (ORDER BY {}) as 序号
            from pout_items
            join documents on pout_items.单号id = documents.单号
            join products on pout_items.物料号 = products.文本字段1
            join customers on documents.客商id = customers.id
            join tree on tree.num = products.商品id
            where {}{} ORDER BY {} OFFSET {} LIMIT {}"#,
            f_map["客户"], f_map["合同编号"], f_map2["状态"], f_map2["炉号"], post_data.sort, query_date, query_field, post_data.sort, skip, post_data.rec
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

            let product = format!(
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                f1, SPLITER, f2, SPLITER, f3, SPLITER, f4, SPLITER, f5, SPLITER,
                f6, SPLITER, f7, SPLITER, f8, SPLITER, f9, SPLITER, f10, SPLITER,
                f11, SPLITER, f12, SPLITER, f13, SPLITER, f14, SPLITER, f15
            );

            products.push(product);
        }

        let count_sql = format!(
            r#"select count(物料号) as 记录数 from pout_items
            join documents on pout_items.单号id = documents.单号
            join products on pout_items.物料号 = products.文本字段1
            join customers on documents.客商id = customers.id
            join tree on tree.num = products.商品id
            where {}{}"#, query_date, query_field
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

        let f_map = map_fields(db.clone(), "销售单据").await;
        let limits = get_limits(user).await;

        let query_field = if name != "" {
            //注意前导空格
            format!(
                r#" AND (LOWER(单号) LIKE '%{}%' OR LOWER(documents.类别) LIKE '%{}%' OR LOWER(node_name) LIKE '%{}%'
                OR LOWER(规格) LIKE '%{}%' OR LOWER(状态) LIKE '%{}%' OR LOWER(documents.备注) LIKE '%{}%')"#,
                name, name, name, name, name, name
            )
        } else {
            "".to_owned()
        };

        let query_date = if data[1] != "" && data[2] != "" {
            format!(
                r#" AND 日期::date>='{}'::date AND 日期::date<='{}'::date"#,
                data[1], data[2]
            )
        } else {
            "".to_owned()
        };

        let sql = format!(
            r#"select 日期, 单号, documents.文本字段6 as 合同编号, documents.类别, 应结金额, split_part(node_name,' ',2) as 名称,
                 split_part(node_name,' ',1) as 材质, 规格, 状态, 长度, 数量, 单价, 重量, documents.备注,
                 ROW_NUMBER () OVER (ORDER BY {}) as 序号 from document_items
            join documents on documents.单号 = document_items.单号id
            join customers on documents.客商id = customers.id
            join tree on tree.num = document_items.商品id
            where {} customers.名称 = '{}' {}{}
            ORDER BY {} OFFSET {} LIMIT {}"#,
            post_data.sort, limits, data[0], query_field, query_date, post_data.sort, skip, post_data.rec
        );

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();
        for row in rows {
            let f1: i64 = row.get("序号");
            let f2: String = row.get("日期");
            let f3: String = row.get("单号");
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
                "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
                f1, SPLITER, f2, SPLITER, f3, SPLITER, f4, SPLITER, f5, SPLITER,
                f6, SPLITER, f7, SPLITER, f8, SPLITER, f9, SPLITER, f10, SPLITER,
                f11, SPLITER, f12, SPLITER, f13, SPLITER, f14, SPLITER, f15
            );

            products.push(product);
        }

        let count_sql = format!(
            r#"select count(单号) as 记录数, sum(case when 重量=0 and 理重=0 then 单价*数量
               else 单价*重量 end) as 金额 from document_items
            join documents on documents.单号 = document_items.单号id
            join customers on documents.客商id = customers.id
            join tree on tree.num = document_items.商品id
            where {} customers.名称 = '{}' {}{}"#,
            limits, data[0], query_field, query_date
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
