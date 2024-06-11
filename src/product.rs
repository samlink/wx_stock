#![allow(deprecated)]
use crate::service::*;
use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::{get, post, web, HttpResponse};
use calamine::{open_workbook, Reader, Xlsx};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
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
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
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
        let f_map = map_fields(db.clone(), "商品规格").await;
        // 区域限制
        let mut area = "".to_owned();
        let mut done = "".to_owned();
        if !user.rights.contains("跨区查库存") {
            area = format!(r#"AND products.{}='{}'"#, f_map["区域"], user.area);
        }
        if post_data.cate == "销售单据" {
            done = format!("AND products.{}='否'", f_map["切完"]);
        }

        let fields = get_fields(db.clone(), "商品规格").await;

        let sql_fields = "SELECT products.物料号 as id, products.商品id, node_name, products.物料号, 规格型号, products.文本字段2,
                            products.文本字段3,products.文本字段5,products.文本字段4,出售价格,products.整数字段1, COALESCE(foo.切分次数,0) 整数字段2, 
                            COALESCE(foo.库存长度,0) 整数字段3, COALESCE(foo.理论重量,0) 库存下限, products.文本字段8,库位,products.文本字段6,
                            case when COALESCE(库存类别,'')<>'锁定' then 库存状态 else 库存类别 end 库存状态,products.备注,
                            COALESCE(质保书,'') as 质保书, 单号id,".to_owned();

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM products
            {}
            JOIN documents on 单号id = 单号
            JOIN tree on tree.num = products.商品id
            LEFT JOIN lu on lu.炉号 = products.文本字段10
            LEFT JOIN length_weight() as foo
            ON products.物料号 = foo.物料号
            WHERE {} {} {} {} {} {} {}
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
            r#"SELECT count(products.物料号) as 记录数, COALESCE(sum(库存长度)/1000, 0) 库存长度, COALESCE(sum(理论重量),0) 库存重量 
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

        HttpResponse::Ok().json((products, count, pages, long, weight))
    } else {
        HttpResponse::Ok().json(-1)
    }
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
        " AND 库存状态='' and 库存长度 > 10"
    } else if post_data.cate == "已切完" {
        " AND (库存状态='已切完' OR 库存状态 = '' and 库存长度 <= 10)"
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
                r#"AND (LOWER(products.{}) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%' OR
                   LOWER(products.{}) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%'
                   OR LOWER(products.{}) LIKE '%{}%')
                "#,
                f_map["物料号"],
                na,
                f_map["规格"],
                na,
                f_map["生产厂家"],
                na,
                f_map["炉号"],
                na,
                f_map["备注"],
                na,
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

#[derive(Deserialize)]
pub struct FilterData {
    id: String,
    filter_name: String,
    name: String,
    cate: String,
    filter: String,
}

///获取表头统计信息
#[post("/fetch_statistic")]
pub async fn fetch_statistic(db: web::Data<Pool>, cate: String, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
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

///获取 filter items
#[post("/fetch_filter_items")]
pub async fn fetch_filter_items(
    db: web::Data<Pool>,
    post_data: web::Json<FilterData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
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

///编辑更新产品
#[post("/update_product")]
pub async fn update_product(
    db: web::Data<Pool>,
    p: web::Json<Product>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "库存设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let mut product: Vec<&str> = p.data.split(SPLITER).collect();
        product[6] = if product[6] == "正常销售" {
            ""
        } else {
            product[6]
        };

        let sql = format!(
            r#"UPDATE products SET 文本字段2='{}', 文本字段4='{}', 整数字段1={}, 库存状态='{}', 备注='{}' WHERE 物料号='{}'"#,
            product[3], product[4], product[5], product[6], product[7], product[0]
        );

        let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();

        let sql = format!(
            r#"UPDATE products SET 库存下限 = 库存下限*(整数字段1::real/整数字段3::real), 整数字段3 = {} WHERE 物料号='{}'"#,
            product[5], product[0]
        );

        let _ = &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///编辑更新产品
#[post("/add_product")]
pub async fn add_product(db: web::Data<Pool>, p: web::Json<Product>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "库存设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let fields = get_fields(db.clone(), "商品规格").await;
        let mut init = r#"INSERT INTO products ("#.to_owned();

        for f in &fields {
            init += &format!("{},", &*f.field_name);
        }

        init += r#"商品id) VALUES("#;

        let product: Vec<&str> = p.data.split(SPLITER).collect();
        let mut sql = build_sql_for_insert(product.clone(), init, fields, 2);

        sql += &format!("'{}')", product[1]);

        let _ = &conn.query(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct Message {
    id: i32,
    label: String,
}

//自动完成
#[get("/product_auto")]
pub async fn product_auto(
    db: web::Data<Pool>,
    search: web::Query<SearchCate>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let sql = &format!(
            r#"SELECT id, 规格型号 AS label FROM products
               JOIN documents ON 单号id = 单号
               WHERE 商品id='{}' AND LOWER(规格型号) LIKE '%{}%' AND documents.文本字段10 <> {}'' LIMIT 10"#,
            search.cate,
            search.s.to_lowercase(), NOT_DEL_SQL
        );

        autocomplete(db, sql).await
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct ProductName {
    id: String,
    name: String,
    fields: String,
    cate: String,
    filter: String,
    search: String,
}
#[derive(Deserialize, Debug)]
struct FieldsData {
    width: f32,
    field: &'static str,
}

//导出数据
#[post("/product_out")]
pub async fn product_out(
    db: web::Data<Pool>,
    product: web::Json<ProductName>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "导出数据".to_owned()).await;
    if user.name != "" {
        let fields_str = r#"{
            "名称": {
                "width": 4,
                "field": "split_part(node_name,' ',2) 名称,"
            },
            "材质": {
                "width": 4,
                "field": "split_part(node_name,' ',1) 材质,"
            },
            "物料号": {
                "width": 5,
                "field": "products.物料号 物料号,"
            },
            "规格": {
                "width": 5,
                "field": "products.规格型号 规格,"
            },
            "状态": {
                "width": 6,
                "field": "products.文本字段2 状态,"
            },
            "执行标准": {
                "width": 7,
                "field": "products.文本字段3 执行标准,"
            },
            "炉号": {
                "width": 5,
                "field": "products.文本字段4 炉号,"
            },
            "生产厂家": {
                "width": 5,
                "field": "products.文本字段5 生产厂家,"
            },
            "切分": {
                "width": 3,
                "field": "切分次数::text 切分,"
            },
            "库存长度": {
                "width": 4,
                "field": "库存长度::text 库存长度,"
            },
            "理论重量": {
                "width": 4,
                "field": "理论重量::text 理论重量,"
            },
            "入库长度": {
                "width": 4,
                "field": "products.整数字段1::text 入库长度,"
            },
            "外径壁厚": {
                "width": 4,
                "field": "products.文本字段8 外径壁厚,"
            },
            "入库单号": {
                "width": 5,
                "field": "单号id 入库单号,"
            },
            "入库日期": {
                "width": 4,
                "field": "d.日期 入库日期,"
            },
            "入库方式": {
                "width": 4,
                "field": "d.类别 入库方式,"
            },
            "原因": {
                "width": 4,
                "field": "case when 单号id like 'TR%' then d.文本字段1 else '' end 原因,"
            },
            "库位": {
                "width": 3,
                "field": "products.库位,"
            },
            "库存类别": {
                "width": 4,
                "field": "case when COALESCE(库存类别,'')<>'锁定' then 库存状态 else 库存类别 end 库存类别,"
            },
            "区域": {
                "width": 3,
                "field": "products.文本字段6 区域,"
            },
            "备注": {
                "width": 5,
                "field": "products.备注,"
            }
        }"#;

        let fields_map: HashMap<String, FieldsData> = serde_json::from_str(fields_str).unwrap();
        let fields: Vec<&str> = product.fields.trim_end_matches('#').split('#').collect();

        let file_name = format!("./download/{}.xlsx", product.name);
        let wb = Workbook::new(&file_name).unwrap();
        let mut sheet = wb.add_worksheet(Some("数据")).unwrap();

        //设置列宽
        sheet.set_column(0, 0, 8.0, None).unwrap();
        sheet.set_column(1, 1, 12.0, None).unwrap();

        let mut n = 0;
        let mut select_fields = "select ".to_owned();

        for f in &fields {
            if fields_map.contains_key(*f) {
                // 构建查询字段
                select_fields += &fields_map.get(*f).unwrap().field;

                sheet
                    .write_string(
                        0,
                        n,
                        f,
                        Some(
                            &wb.add_format()
                                .set_align(FormatAlignment::CenterAcross)
                                .set_bold(),
                        ),
                    )
                    .unwrap();

                sheet
                    .set_column(n, n, (fields_map.get(*f).unwrap().width * 3.0).into(), None)
                    .unwrap();

                n += 1;
            }
        }

        select_fields = select_fields.trim_end_matches(',').to_owned();

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
            r#"{} from products 
                {} JOIN tree ON products.商品id = tree.num
                join documents d on d.单号 = products.单号id
                LEFT JOIN length_weight() as foo
                ON products.物料号 = foo.物料号
                where {} {} {} {} {}"#,
            select_fields, lock_join_sql, product_sql, conditions, now_sql, filter_sql, NOT_DEL_SQL
        );

        // println!("{}\n", sql);
        
        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let mut n = 1u32;
        for row in rows {
            let mut m = 0u16;
            for f in &fields {
                sheet
                    .write_string(n, m, row.get(&*f), None)
                    .unwrap();
                m += 1;
            }
            n += 1;
        }

        wb.close().unwrap();
        HttpResponse::Ok().json(product.name.clone())
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量导入、批量更新返回数据表，展示给用户确认
#[post("/product_in")]
pub async fn product_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let path = save_file(payload).await.unwrap();

        let mut total_rows = 0;
        let fields = get_fields(db.clone(), "商品规格").await;
        let mut records = Vec::new();
        let mut excel: Xlsx<_> = open_workbook(path).unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let mut num = 1;
            let total_coloum = r.get_size().1;
            total_rows = r.get_size().0 - 1;
            if total_coloum != fields.len() {
                return HttpResponse::Ok().json(-2);
            }

            if total_rows > 0 {
                //制作表头数据
                let mut rec = "".to_owned();
                // rec += &format!("{}{}", "商品id", SPLITER);
                for f in &fields {
                    rec += &format!("{}{}", &*f.show_name, SPLITER);
                }

                records.push(rec);

                for j in 0..total_rows {
                    let mut rec = "".to_owned();
                    for i in 0..total_coloum {
                        rec += &format!("{}{}", r[(j + 1, i)], SPLITER);
                    }

                    records.push(rec);

                    num += 1;
                    if num == 50 {
                        break;
                    }
                }
            }
        }
        HttpResponse::Ok().json((records, total_rows))
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量导入数据写库。在用户确认提交后，将数据写入数据库
#[post("/product_datain")]
pub async fn product_datain(db: web::Data<Pool>, p_id: String, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let mut excel: Xlsx<_> = open_workbook("./upload/upload_in.xlsx").unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let fields = get_fields(db.clone(), "商品规格").await;
            let conn = db.get().await.unwrap();

            let total_rows = r.get_size().0 - 1;

            if total_rows > 0 {
                let mut init = r#"INSERT INTO products ("#.to_owned();

                for f in &fields {
                    init += &format!("{},", &*f.field_name);
                }

                init += r#"商品id, 单号id) VALUES("#; // 单号id 是与 documents 单据库的“单号”关联的外键，需有值。这里的值是初始建库时，
                                                      // 手工 insert into 的单号，所有的数据导入，均以此单号为键
                for j in 0..total_rows {
                    let mut sql = init.clone();

                    for i in 0..fields.len() {
                        if fields[i].data_type == "文本" {
                            sql += &format!("'{}',", r[(j + 1, i)]);
                        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数"
                        {
                            let num = format!("{}", r[(j + 1, i)]);
                            if num != "" {
                                sql += &format!("{},", num);
                            } else {
                                sql += &format!("{},", "0");
                            }
                        } else {
                            let op: Vec<&str> = fields[i].option_value.split("_").collect();
                            let val = if format!("{}", r[(j + 1, i)]) == op[0] {
                                true
                            } else {
                                false
                            };
                            sql += &format!("{},", val);
                        }
                    }

                    sql += &format!("'{}','{}')", p_id, "KT202312-01"); // 这个单号id 是初始建库时手动 insert into documents 中的，
                    let _ = &conn.query(sql.as_str(), &[]).await.unwrap();
                }
            }
        }
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//批量更新数据写库
#[post("/product_updatein")]
pub async fn product_updatein(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "批量导入".to_owned()).await;
    if user.name != "" {
        let mut excel: Xlsx<_> = open_workbook("./upload/upload_in.xlsx").unwrap();

        if let Some(Ok(r)) = excel.worksheet_range("数据") {
            let fields = get_fields(db.clone(), "商品规格").await;
            let conn = db.get().await.unwrap();
            let total_rows = r.get_size().0 - 1;

            if total_rows > 0 {
                for j in 0..total_rows {
                    let mut sql = r#"UPDATE products SET "#.to_owned();

                    for i in 0..fields.len() {
                        if fields[i].data_type == "文本" {
                            sql += &format!("{}='{}',", fields[i].field_name, r[(j + 1, i)]);
                            // 把第一列 商品id 略过, 所以 i + 1
                        } else if fields[i].data_type == "实数" || fields[i].data_type == "整数"
                        {
                            sql += &format!("{}={},", fields[i].field_name, r[(j + 1, i)]);
                        } else {
                            let op: Vec<&str> = fields[i].option_value.split("_").collect();
                            let val = if format!("{}", r[(j + 1, i)]) == op[0] {
                                true
                            } else {
                                false
                            };
                            sql += &format!("{}={},", fields[i].field_name, val);
                        }
                    }

                    sql = sql.trim_end_matches(',').to_owned();
                    sql += &format!(r#" WHERE 物料号='{}'"#, r[(j + 1, 0)]);

                    let _ = &conn.query(sql.as_str(), &[]).await.unwrap();
                }
            }
        }
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
struct PoutItem {
    dh: String,
    cate: String,
    date: String,
    // long: i32,
    all_long: i32,
    num: i32,
    weight: f32,
    note: String,
}

///获取物料出库明细
#[post("/fetch_pout_items")]
pub async fn fetch_pout_items(db: web::Data<Pool>, data: String, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let da: Vec<&str> = data.split('#').collect();

        let sql = if da.len() == 1 {
            format!("select 单号id, 类别, 日期, 数量, 长度*数量 as 总长, 重量, pout_items.备注 from pout_items
                        join documents on 单号 = 单号id
                        where 物料号 = '{}' and 文本字段10 <> '' {} order by 单号id desc", da[0], NOT_DEL_SQL)
        } else {
            format!("select 单号id, max(类别) 类别, max(日期) 日期, sum(数量)::int 数量, sum(长度*数量)::int as 总长, sum(重量) 重量, max(pout_items.备注) 备注 from pout_items
                        join documents on 单号 = 单号id
                        where 物料号 = '{}' and 文本字段10 = '' {}
                        group by 单号id
                    union all
                    select 单号id, max(类别) 类别, max(日期) 日期, sum(数量)::int 数量, sum(长度*数量)::int as 总长, sum(理重) 重量, max(document_items.备注) 备注 from document_items
                        join documents on 单号 = 单号id
                        where 单号id like 'XS%' and 物料号 = '{}' and 出库完成 = false  {}
                        group by 单号id
                        order by 单号id desc", da[0], NOT_DEL_SQL, da[0], NOT_DEL_SQL)
        };

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut date = Vec::new();
        for row in rows {
            let da = PoutItem {
                dh: row.get("单号id"),
                cate: row.get("类别"),
                date: row.get("日期"),
                // long: row.get("长度"),
                all_long: row.get("总长"),
                num: row.get("数量"),
                weight: row.get("重量"),
                note: row.get("备注"),
            };
            date.push(da);
        }

        HttpResponse::Ok().json(date)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取全部属性
#[post("/fetch_all_info")]
pub async fn fetch_all_info(db: web::Data<Pool>, data: String, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();

        let sql = format!("
            select p.物料号, 规格型号 规格, p.文本字段2 状态,p.文本字段3 执行标准, p.文本字段4 炉号,
                p.文本字段5 生产厂家, COALESCE(切分次数,0)::text 切分, COALESCE(库存长度,0)::text 库存长度,
                COALESCE(理论重量,0)::text 库存重量, p.整数字段1::text 入库长度, p.文本字段8 外径壁厚, 单号id 入库单号,
                d.日期 入库日期, d.类别 入库方式, case when 单号id like 'TR%' then d.文本字段1 else '' end 原因,
                p.库位, case when COALESCE(库存类别,'')<>'锁定' then 库存状态 else 库存类别 end 库存类别,
                p.文本字段6 区域, p.备注
            FROM products p
            JOIN tree ON p.商品id = tree.num
            JOIN documents d ON d.单号 = p.单号id
            LEFT JOIN length_weight() as foo
            ON p.物料号 = foo.物料号
            WHERE p.物料号 = '{}'", data);

        // println!("{}", sql);

        let row = &conn.query_one(sql.as_str(), &[]).await.unwrap();
        let wu_num = json!({
                "物料号": row.get::<&str, &str>("物料号"),
                "规格": row.get::<&str, &str>("规格"),
                "状态": row.get::<&str, &str>("状态"),
                "执行标准": row.get::<&str, &str>("执行标准"),
                "炉号": row.get::<&str, &str>("炉号"),
                "生产厂家": row.get::<&str, &str>("生产厂家"),
                "切分": row.get::<&str, &str>("切分"),
                "库存长度": row.get::<&str, &str>("库存长度"),
                "库存重量": row.get::<&str, &str>("库存重量"),
                "入库长度": row.get::<&str, &str>("入库长度"),
                "外径壁厚": row.get::<&str, &str>("外径壁厚"),
                "入库单号": row.get::<&str, &str>("入库单号"),
                "入库日期": row.get::<&str, &str>("入库日期"),
                "入库方式": row.get::<&str, &str>("入库方式"),
                "原因": row.get::<&str, &str>("原因"),
                "库位": row.get::<&str, &str>("库位"),
                "库存类别": row.get::<&str, &str>("库存类别"),
                "区域": row.get::<&str, &str>("区域"),
                "备注": row.get::<&str, &str>("备注"),
        });

        HttpResponse::Ok().json(wu_num)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///获取炉号质保书
#[post("/fetch_lu")]
pub async fn fetch_lu(
    db: web::Data<Pool>,
    lh: web::Json<Vec<String>>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let mut lu_arr = Vec::new();
        for lu in lh.iter() {
            let sql = format!(r#"select 质保书 from lu where 炉号 like '{}%'"#, lu);
            let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
            for row in rows {
                let value: String = row.get("质保书");
                lu_arr.push(value);
            }
        }
        HttpResponse::Ok().json(lu_arr)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
