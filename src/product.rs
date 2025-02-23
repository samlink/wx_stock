#![allow(deprecated)]
use crate::service::*;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize, Serialize)]
pub struct Product {
    pub data: String,
}

///获取商品
#[post("/fetch_product")]
pub async fn fetch_product(
    db: web::Data<Pool>,
    post_data: web::Json<TablePagerExt>,
) -> HttpResponse {
    let conn = db.get().await.unwrap();
    let f_data = FilterData {
        id: post_data.id.clone(),
        name: post_data.name.clone(),
        cate: post_data.cate.clone(),
        filter: post_data.filter.clone(),
        filter_name: "".to_owned(),
    };

    let (product_sql, conditions, now_sql, filter_sql, lock_join_sql) =
        build_sql_search(db.clone(), f_data).await;

    let skip = (post_data.page - 1) * post_data.rec;
    // 区域限制
    let area = "".to_owned();
    let done = "".to_owned();

    let sql_fields = "SELECT node_name, products.物料号, 规格型号, products.文本字段2 状态,
            products.物料号, products.文本字段3 执行标准, products.文本字段5 生产厂家, products.文本字段4 炉号,
            COALESCE(foo.库存长度,0) 库存长度, COALESCE(foo.理论重量,0) 库存重量, products.备注,".to_owned();

    let sql = format!(
        r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM products
            {}
            JOIN documents on 单号id = 单号
            JOIN tree on tree.num = products.商品id
            LEFT JOIN lu on lu.炉号 = products.文本字段10
            LEFT JOIN length_weight() as foo
            ON products.物料号 = foo.物料号
            WHERE {} {} {} {} {} {} {} and products.物料号 <> '锯口费'
            ORDER BY {} OFFSET {} LIMIT {}"#,
        sql_fields,
        post_data.sort,
        lock_join_sql,
        product_sql,
        done,
        area,
        conditions,
        now_sql,
        filter_sql,
        NOT_DEL_SQL,
        post_data.sort,
        skip,
        post_data.rec
    );

    // println!("{}\n", sql);

    let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

    let mut products = Vec::new();
    for row in rows {
        let product = format!(
            "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
            row.get::<&str, i64>("序号"),
            SPLITER,
            row.get::<&str, &str>("node_name"),
            SPLITER,
            row.get::<&str, &str>("物料号"),
            SPLITER,
            row.get::<&str, &str>("规格型号"),
            SPLITER,
            row.get::<&str, &str>("状态"),
            SPLITER,
            row.get::<&str, &str>("执行标准"),
            SPLITER,
            row.get::<&str, &str>("生产厂家"),
            SPLITER,
            row.get::<&str, &str>("炉号"),
            SPLITER,
            row.get::<&str, i32>("库存长度"),
            SPLITER,
            row.get::<&str, f64>("库存重量"),
            SPLITER,
            row.get::<&str, &str>("备注"),
            SPLITER
        );

        products.push(product);
    }

    let sql2 = format!(
        r#"SELECT count(products.物料号) as 记录数, COALESCE(sum(库存长度)/1000, 0) 库存长度,
                COALESCE(sum(理论重量),0) 库存重量
                FROM products
                {}
                JOIN documents on 单号id = 单号
                LEFT JOIN length_weight() as foo
                ON products.物料号 = foo.物料号
                WHERE {} {} {} {} {} {}"#,
        lock_join_sql, product_sql, area, conditions, now_sql, filter_sql, NOT_DEL_SQL
    );

    let row = &conn.query_one(sql2.as_str(), &[]).await.unwrap();

    let count: i64 = row.get("记录数");
    let long: i64 = row.get("库存长度");
    let w: f64 = row.get("库存重量");
    let weight = format!("{:.0}", w);
    let pages = (count as f64 / post_data.rec as f64).ceil() as i32;

    let sql3 = format!(
        r#"
            INSERT INTO visits (user_id, visit_date, num)
            VALUES ({}, to_char(now(), 'YYYY-MM-DD'), 1)
            ON CONFLICT (user_id, visit_date)
            DO UPDATE SET num = visits.num + 1, last_visit = now();
    "#,
        post_data.user
    );

    conn.execute(sql3.as_str(), &[]).await.unwrap();

    HttpResponse::Ok().json((products, count, pages, long, weight))
}

async fn build_sql_search(
    db: web::Data<Pool>,
    post_data: FilterData,
) -> (String, String, String, String, String) {
    let f_map = map_fields(db.clone(), "商品规格").await;

    // where 条件第一个 sql, 其他 sql 跟在其后
    let product_sql = if post_data.id == "" {
        "true".to_owned()
    } else {
        format!("products.商品id = '{}'", post_data.id)
    };

    let now_sql = if post_data.cate == "正常销售" {
        " AND (库存状态='' and 库存长度 > 10 OR products.物料号 = '锯口费')"
    } else if post_data.cate == "已切完" {
        " AND (库存状态='已切完' OR 库存状态 = '' and 库存长度 <= 10 and products.物料号 <> '锯口费')"
    } else if post_data.cate == "自用库" {
        " AND 库存状态='自用'"
    } else if post_data.cate == "不合格品" {
        " AND 库存状态='不合格'"
    } else {
        ""
    };

    // 构建搜索字符串
    let mut conditions = "".to_owned();
    if post_data.name != "" {
        let post = post_data.name.to_lowercase();
        let name: Vec<&str> = post.split(" ").collect();
        for na in name {
            conditions += &format!(
                r#"AND (LOWER(products.{}) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%')
                "#,
                f_map["规格"], na, f_map["状态"], na,
            );
        }
    }

    // 构建 filter 字符串
    let mut filter_sql = "".to_owned();
    if post_data.filter != "" {
        filter_sql = post_data
            .filter
            .replace("规格", "规格型号")
            .replace("状态", "products.文本字段2")
            .replace("执行标准", "products.文本字段3")
            .replace("生产厂家", "products.文本字段5")
            .replace("炉号", "products.文本字段4")
            .replace("区域", "products.文本字段6")
            .replace("(空白)", "");
    }

    // join 语句，非 where 条件
    let lock_join_sql = if now_sql == "" {
        "join sale_records() sale on products.物料号 = sale.物料号".to_owned()
    } else {
        "".to_owned()
    };

    (
        product_sql,
        conditions,
        now_sql.to_owned(),
        filter_sql,
        lock_join_sql,
    )
}

///获取表头统计信息
#[post("/fetch_statistic")]
pub async fn fetch_statistic(db: web::Data<Pool>, cate: String, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();

        let cate_sql = if cate == "all" {
            "true".to_owned()
        } else {
            format!("tree.num like '{}%'", cate)
        };

        let sql = format!(
            r#"select COALESCE(sum(库存长度)/1000, 0) 库存长度, COALESCE(sum(理论重量),0) 库存重量 
            from products p
            join tree on tree.num = p.商品id
            left join length_weight() foo on foo.物料号 = p.物料号  
            where {} and 库存状态='' and COALESCE(库存长度,0) > 10"#,
            cate_sql
        );

        let row = &conn.query_one(sql.as_str(), &[]).await.unwrap();

        let long: i64 = row.get("库存长度");
        let w: f64 = row.get("库存重量");
        let weight = format!("{:.0}", w);

        let data = json!({
            "库存长度": long,
            "库存重量": weight
        });

        HttpResponse::Ok().json(data)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize)]
pub struct FilterData {
    id: String,
    filter_name: String,
    name: String,
    cate: String,
    filter: String,
}

///获取 filter items
#[post("/fetch_filter_items")]
pub async fn fetch_filter_items(
    db: web::Data<Pool>,
    post_data: web::Json<FilterData>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let f_map = map_fields(db.clone(), "商品规格").await;
        let conn = db.get().await.unwrap();
        let f_data = FilterData {
            id: post_data.id.clone(),
            name: post_data.name.clone(),
            cate: post_data.cate.clone(),
            filter: post_data.filter.clone(),
            filter_name: "".to_owned(),
        };
        let (product_sql, conditions, now_sql, filter_sql, lock_join_sql) =
            build_sql_search(db.clone(), f_data).await;

        let mut items: Vec<String> = Vec::new();

        if post_data.filter_name == "库存长度" {
            let sql = format!(
                r#"SELECT DISTINCT 库存长度 FROM products 
                    {}
                    LEFT JOIN length_weight() as foo
                    ON products.物料号 = foo.物料号
                    where {} {} {} {}
                    ORDER BY 库存长度"#,
                lock_join_sql, product_sql, conditions, now_sql, filter_sql,
            );

            let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

            for row in rows {
                let v: i32 = row.get(0);
                let va = format!("{}", v);
                items.push(va);
            }
        } else {
            let sql = format!(
                r#"SELECT DISTINCT {} FROM products
                    {}
                    LEFT JOIN length_weight() as foo
                    ON products.物料号 = foo.物料号
                    where {} {} {} {}
                    ORDER BY {}"#,
                f_map[post_data.filter_name.as_str()],
                lock_join_sql,
                product_sql,
                conditions,
                now_sql,
                filter_sql,
                f_map[post_data.filter_name.as_str()]
            );

            let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
            for row in rows {
                items.push(row.get(0));
            }
        }

        HttpResponse::Ok().json(items)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct ProductName {
    id: String,
    name: String,
    cate: String,
    filter: String,
    search: String,
    lang: String,
}

//导出数据
#[post("/product_out")]
pub async fn product_out(db: web::Data<Pool>, product: web::Json<ProductName>) -> HttpResponse {
    let f_data = FilterData {
        id: product.id.clone(),
        name: product.search.clone(),
        cate: product.cate.clone(),
        filter: product.filter.clone(),
        filter_name: "".to_owned(),
    };

    let (product_sql, conditions, now_sql, filter_sql, lock_join_sql) =
        build_sql_search(db.clone(), f_data).await;

    let sql = format!(
        r#"select products.物料号, split_part(node_name,' ',2) as 名称, split_part(node_name,' ',1) as 材质,
                规格型号 规格, products.文本字段2 状态, products.文本字段3 执行标准, products.文本字段4 炉号, 
                products.文本字段5 生产厂家, COALESCE(foo.库存长度,0)::text 库存长度, COALESCE(foo.理论重量,0)::text 库存重量,
                (ROW_NUMBER () OVER (ORDER BY 规格型号))::text as 序号, products.备注 from products
            {} JOIN tree ON products.商品id = tree.num
            join documents d on d.单号 = products.单号id
            LEFT JOIN length_weight() as foo
            ON products.物料号 = foo.物料号
            where {} {} {} {} {}"#,
        lock_join_sql, product_sql, conditions, now_sql, filter_sql, NOT_DEL_SQL
    );

    // println!("{}\n", sql);

    let conn = db.get().await.unwrap();
    let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

    let f_str = r#"[
        {"name": "序号", "width": 6},
        {"name": "名称", "width": 15},
        {"name": "材质", "width": 15},
        {"name": "物料号", "width": 15},
        {"name": "规格", "width": 15},
        {"name": "状态", "width": 20},
        {"name": "执行标准", "width": 25},
        {"name": "生产厂家", "width": 15},
        {"name": "炉号", "width": 15},
        {"name": "库存长度", "width": 15},
        {"name": "库存重量", "width": 15},
        {"name": "备注", "width": 20}
    ]"#;

    let fields: Vec<Fields> = serde_json::from_str(f_str).unwrap();

    if product.lang == "zh" {
        out_excel(
            product.name.as_str(),
            &fields,
            &fields,
            rows.as_ref(),
            product.lang.as_str(),
        );
    } else {
        let t_str = r#"[
            {"name": "No.", "width": 6},
            {"name": "Name", "width": 15},
            {"name": "Material", "width": 15},
            {"name": "Part_No.", "width": 15},
            {"name": "Specification", "width": 15},
            {"name": "Status", "width": 20},
            {"name": "Standard", "width": 25},
            {"name": "Manufacturer", "width": 15},
            {"name": "Heat_No.", "width": 15},
            {"name": "Length", "width": 15},
            {"name": "Weight", "width": 15},
            {"name": "Remarks", "width": 20}
        ]"#;

        let en_title: Vec<Fields> = serde_json::from_str(t_str).unwrap();
        
        out_excel(
            product.name.as_str(),
            &en_title,
            &fields,
            rows.as_ref(),
            product.lang.as_str(),
        );
    }

    HttpResponse::Ok().json(&product.name)
}
