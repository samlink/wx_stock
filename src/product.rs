#![allow(deprecated)]
use crate::service::*;
use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use xlsxwriter::{prelude::FormatAlignment, *};

#[derive(Deserialize, Serialize)]
pub struct Product {
    pub data: String,
}

///获取商品
#[post("/fetch_product")]
pub async fn fetch_product(
    db: web::Data<Pool>,
    post_data: web::Json<TablePagerExt>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id).await;
    if user.username != "" {
        let conn = db.get().await.unwrap();
        let f_data = FilterData {
            id: post_data.id.clone(),
            name: post_data.name.clone(),
            cate: post_data.cate.clone(),
            filter: post_data.filter.clone(),
            filter_name: "".to_owned(),
        };

        let (product_sql, conditions, now_sql, filter_sql) =
            build_sql_search(db.clone(), f_data).await;

        // println!("{}", filter_sql);

        let skip = (post_data.page - 1) * post_data.rec;
        let f_map = map_fields(db.clone(), "商品规格").await;
        // 区域限制
        let area = "".to_owned();
        let mut done = "".to_owned();

        if post_data.cate == "销售单据" {
            done = format!("AND products.{}='否'", f_map["切完"]);
        }

        let fields = get_fields(db.clone(), "商品规格").await;

        let sql_fields = "SELECT products.文本字段1 as id, products.商品id, node_name, products.文本字段1, 规格型号, products.文本字段2,
                            products.文本字段3,products.文本字段5,products.文本字段4,出售价格,products.整数字段1,
                            COALESCE(出库次数,0)::integer as 整数字段2,
                            case when (products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer <0 then
                            0 else (products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer end
                            as 整数字段3,
                            case when 库存下限-COALESCE(理重合计,0)<0.1 then 0 else round((库存下限-COALESCE(理重合计,0))::numeric,2)::float8 end as 库存下限,
                            products.文本字段8,库位,products.文本字段6,products.文本字段7,products.备注,COALESCE(质保书,'') as 质保书, 单号id,".to_owned();

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM products
            JOIN documents on 单号id = 单号
            JOIN tree on tree.num = products.商品id
            LEFT JOIN lu on lu.炉号 = products.文本字段10
            LEFT JOIN cut_length() as foo
            ON products.文本字段1 = foo.物料号
            WHERE {} {} {} {} {} {} AND documents.文本字段10 <>'' AND products.文本字段1 <> '锯口费'
                AND products.文本字段1 not like 'WT%'
            ORDER BY {} OFFSET {} LIMIT {}"#,
            sql_fields,
            post_data.sort,
            product_sql,
            done,
            area,
            conditions,
            now_sql,
            filter_sql,
            post_data.sort,
            skip,
            post_data.rec
        );

        // println!("{}\n", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut products = Vec::new();
        for row in rows {
            let mut product = "".to_owned();
            let num: &str = row.get("id"); //字段顺序已与前端配合一致，后台不可自行更改
            product += &format!("{}{}", num, SPLITER);

            let num: i64 = row.get("序号");
            product += &format!("{}{}", num, SPLITER);

            product += &simple_string_from_base(row, &fields);

            let p_name: &str = row.get("node_name");
            product += &format!("{}{}", p_name, SPLITER);

            let p_id: &str = row.get("商品id");
            product += &format!("{}{}", p_id, SPLITER);

            let zhi: &str = row.get("质保书");
            product += &format!("{}{}", zhi, SPLITER);

            products.push(product);
        }

        // let products = build_string_from_base(rows, fields);

        let sql2 = format!(
            r#"SELECT count(products.文本字段1) as 记录数 FROM products
            JOIN documents on 单号id = 单号
            LEFT JOIN cut_length() as foo
            ON products.文本字段1 = foo.物料号
            WHERE {} {} {} {} {} AND documents.文本字段10 <>'' 
                AND products.文本字段1 not like 'WT%'
                AND products.文本字段1 <> '锯口费'"#,
            product_sql, area, conditions, now_sql, filter_sql
        );

        let rows = &conn.query(sql2.as_str(), &[]).await.unwrap();

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

async fn build_sql_search(
    db: web::Data<Pool>,
    post_data: FilterData,
) -> (String, String, String, String) {
    let f_map = map_fields(db.clone(), "商品规格").await;

    let product_sql = if post_data.id == "" {
        "true".to_owned()
    } else {
        format!("products.商品id = '{}'", post_data.id)
    };

    let now_sql = if post_data.cate == "现有库存" {
        " AND (products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer >= 10 AND products.文本字段7 <> '是'"
    } else {
        " AND ((products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer < 10 OR products.文本字段7 = '是') AND products.规格型号 <> '-'"
    };

    // 构建搜索字符串
    let mut conditions = "".to_owned();
    if post_data.name.trim() != "" {
        let post = post_data.name.trim().to_lowercase();
        conditions = format!(r#"AND LOWER(products.{}) LIKE '%{}%'"#, f_map["规格"], post);
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
            .replace(
                "库存长度",
                "products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2",
            )
            .replace("炉号", "products.文本字段4")
            .replace("区域", "products.文本字段6")
            .replace("(空白)", "");
    }

    (product_sql, conditions, now_sql.to_owned(), filter_sql)
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
    let user = get_user(db.clone(), id).await;
    if user.username != "" {
        let f_map = map_fields(db.clone(), "商品规格").await;
        let conn = db.get().await.unwrap();
        let f_data = FilterData {
            id: post_data.id.clone(),
            name: post_data.name.clone(),
            cate: post_data.cate.clone(),
            filter: post_data.filter.clone(),
            filter_name: "".to_owned(),
        };
        let (product_sql, conditions, now_sql, filter_sql) =
            build_sql_search(db.clone(), f_data).await;

        let mut items: Vec<String> = Vec::new();

        if post_data.filter_name == "库存长度" {
            let sql = format!(
                r#"SELECT DISTINCT (products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer
                    as 库存长度 FROM products 
                    LEFT JOIN cut_length() as foo
                    ON products.文本字段1 = foo.物料号
                    where {} {} {} {}
                    ORDER BY 库存长度"#,
                product_sql, conditions, now_sql, filter_sql,
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
                    LEFT JOIN cut_length() as foo
                    ON products.文本字段1 = foo.物料号
                    where {} {} {} {}
                    ORDER BY {}"#,
                f_map[post_data.filter_name.as_str()],
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

#[derive(Deserialize, Serialize, Debug)]
pub struct ProductName {
    id: String,
    name: String,
    search: String,
    filter: String,
}

//导出数据
#[post("/product_out")]
pub async fn product_out(db: web::Data<Pool>, product: web::Json<ProductName>) -> HttpResponse {
    println!("{:?}",product);

    let needs = vec![
        "文本字段1",
        "规格型号",
        "文本字段2",
        "文本字段3",
        "文本字段4",
        "文本字段5",
        "整数字段3",
        "库存下限",
        "备注",
    ];
    let fields_origin = get_fields(db.clone(), "商品规格").await;
    let fields = fields_origin
        .iter()
        .filter(|f| needs.contains(&&*f.field_name))
        .collect::<Vec<_>>();
    
    let file_name = format!("./download/{}.xlsx", product.name);
    let wb = Workbook::new(&file_name).unwrap();
    let mut sheet = wb.add_worksheet(Some("数据")).unwrap();

    //设置列宽
    sheet.set_column(0, 0, 8.0, None).unwrap();
    sheet.set_column(1, 1, 12.0, None).unwrap();

    // sheet.write_string(0, 0, "商品id", Some(&format1)).unwrap();

    let mut n = 0;
    for f in &fields {
        sheet
            .write_string(
                0,
                n,
                &f.show_name,
                Some(
                    &wb.add_format()
                        .set_align(FormatAlignment::CenterAcross)
                        .set_bold(),
                ),
            )
            .unwrap();
        sheet
            .set_column(n, n, (f.show_width * 2.5).into(), None)
            .unwrap();

        n += 1;
    }

    let now_sql = 
        " AND (products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer > 0 AND products.文本字段7 <> '是'";
    
    let search_sql = format!(r#"AND products.规格型号 LIKE '%{}%'"#, product.search);

    // let reg = Regex::new(r"库存长度 = '(\d+)'").unwrap();
    // let long = reg.captures(product.filter.as_str()).unwrap().get(1).unwrap().as_str();

    // 构建 filter 字符串
    let mut filter_sql = "".to_owned();
    if product.filter != "" {
        filter_sql = product
            .filter
            .replace("规格", "规格型号")
            .replace("状态", "products.文本字段2")
            .replace("执行标准", "products.文本字段3")
            .replace("生产厂家", "products.文本字段5")
            .replace("炉号", "products.文本字段4")
            .replace("(空白)", "")
            .replace("库存长度", "(products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::text");
    }

    println!("{}", filter_sql);

    let init = r#"SELECT "#.to_owned();
    let mut sql = build_sql_for_excel(init, &fields, "products".to_owned());

    sql += &format!(
        r#"1 FROM products JOIN documents ON 单号id = 单号
            LEFT JOIN cut_length() as foo
            ON products.文本字段1 = foo.物料号
            WHERE 商品id='{}' {} {} {} AND documents.文本字段10 <> '' ORDER BY products.文本字段1"#, 
        product.id, now_sql, search_sql, filter_sql
    );

    let new_sql = sql
            .replace("cast(products.整数字段2 as VARCHAR)", "COALESCE(切分次数,0)::text as 整数字段2")
            .replace("cast(products.整数字段3 as VARCHAR)", "(products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::text as 整数字段3")
            .replace("cast(products.库存下限 as VARCHAR)", "case when 库存下限-COALESCE(理重合计,0)<0.1 then '0' else round((库存下限-COALESCE(理重合计,0))::numeric,2)::text end as 库存下限");

    let conn = db.get().await.unwrap();
    let rows = &conn.query(new_sql.as_str(), &[]).await.unwrap();

    let mut n = 1u32;
    for row in rows {
        let mut m = 0u16;
        for f in &fields {
            if f.data_type == "布尔" {
                sheet
                    .write_string(
                        n,
                        m,
                        row.get(&*f.field_name),
                        Some(&wb.add_format().set_align(FormatAlignment::CenterAcross)),
                    )
                    .unwrap();
            } else {
                sheet
                    .write_string(n, m, row.get(&*f.field_name), None)
                    .unwrap();
            }
            m += 1;
        }
        n += 1;
    }

    wb.close().unwrap();
    HttpResponse::Ok().json(product.name.clone())
}
