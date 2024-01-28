#![allow(deprecated)]
use crate::service::*;
use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::{get, post, web, HttpResponse};
use calamine::{open_workbook, Reader, Xlsx};
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

        let (product_sql, conditions, now_sql, filter_sql) = build_sql_search(db.clone(), f_data).await;

        println!("{}", filter_sql);

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

        let sql_fields = "SELECT products.文本字段1 as id, products.商品id, node_name, products.文本字段1, 规格型号, products.文本字段2,
                            products.文本字段3,products.文本字段5,products.文本字段4,出售价格,products.整数字段1,
                            COALESCE(切分次数,0)::integer as 整数字段2,
                            case when (products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer <0 then
                            0 else (products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer end
                            as 整数字段3,
                            case when 库存下限-COALESCE(理重合计,0)<0.1 then 0 else round((库存下限-COALESCE(理重合计,0))::numeric,2)::real end as 库存下限,
                            products.文本字段8,库位,products.文本字段6,products.文本字段7,products.备注,".to_owned();

        let sql = format!(
            r#"{} ROW_NUMBER () OVER (ORDER BY {}) as 序号 FROM products
            JOIN documents on 单号id = 单号
            JOIN tree on tree.num = products.商品id
            LEFT JOIN cut_length() as foo
            ON products.文本字段1 = foo.物料号
            WHERE {} {} {} {} {} {} AND documents.文本字段10 <>''
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

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

        let products = build_string_from_base(rows, fields);

        let sql2 = format!(
            r#"SELECT count(products.文本字段1) as 记录数 FROM products
            JOIN documents on 单号id = 单号
            LEFT JOIN cut_length() as foo
            ON products.文本字段1 = foo.物料号
            WHERE {} {} {} {} {} AND documents.文本字段10 <>''"#,
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

async fn build_sql_search(db: web::Data<Pool>, post_data: FilterData) -> (String, String, String, String) {
    let f_map = map_fields(db.clone(), "商品规格").await;

    let product_sql = if post_data.id == "" {
        "true".to_owned()
    } else {
        format!("products.商品id = '{}'", post_data.id)
    };

    let now_sql = if post_data.cate == "现有库存" {
        " AND (products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer > 0 AND products.文本字段7 <> '是'"
    } else {
        " AND ((products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2)::integer <= 0 OR products.文本字段7 = '是') AND products.规格型号 <> '-'"
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
                   OR LOWER(products.{}) LIKE '%{}%' OR LOWER(products.{}) LIKE '%{}%')
                "#,
                f_map["物料号"],
                na,
                f_map["规格"],
                na,
                f_map["生产厂家"],
                na,
                f_map["区域"],
                na,
                f_map["切完"],
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

    (product_sql, conditions, now_sql.to_owned(), filter_sql)
}

#[derive(Deserialize)]
struct FilterData {
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
        let (product_sql, conditions, now_sql, filter_sql) = build_sql_search(db.clone(), f_data).await;

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

        // println!("{}", sql);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut items: Vec<&str> = Vec::new();
        for row in rows {
            items.push(row.get(0));
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
        let fields = get_fields(db.clone(), "商品规格").await;

        let product: Vec<&str> = p.data.split(SPLITER).collect();
        let init = r#"UPDATE products SET "#.to_owned();

        let mut sql = build_sql_for_update(product.clone(), init, fields, 2);

        sql += &format!(
            r#"商品id='{}' WHERE 文本字段1='{}'"#,
            product[1], product[0]
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
               WHERE 商品id='{}' AND LOWER(规格型号) LIKE '%{}%' AND documents.文本字段10 <> '' LIMIT 10"#,
            search.cate,
            search.s.to_lowercase()
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
        let fields = get_fields(db.clone(), "商品规格").await;

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

        let init = r#"SELECT "#.to_owned();
        let mut sql = build_sql_for_excel(init, &fields, "products".to_owned());

        sql += &format!(
            r#"1 FROM products JOIN documents ON 单号id = 单号
               WHERE 商品id='{}' AND documents.文本字段10 <> '' ORDER BY 规格型号"#, //此处的 1 仅为配合前面自动生成最后的逗号, 无其他意义
            product.id
        );

        let conn = db.get().await.unwrap();
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();

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
                    sql += &format!(r#" WHERE 文本字段1='{}'"#, r[(j + 1, 0)]);

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
    long: i32,
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

        let sql = format!("select 单号id, 类别, 日期, 长度, 数量, 长度*数量 as 总长, 重量, pout_items.备注 from pout_items
                                join documents on 单号 = 单号id
                                where 物料号 = '{}' and 文本字段10 <> '' order by 单号id desc", data);

        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut date = Vec::new();
        for row in rows {
            let da = PoutItem {
                dh: row.get("单号id"),
                cate: row.get("类别"),
                date: row.get("日期"),
                long: row.get("长度"),
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

///获取炉号质保书
#[post("/fetch_lu")]
pub async fn fetch_lu(db: web::Data<Pool>, lh: web::Json<String>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let sql = format!(r#"select 质保书 from lu where 炉号='{}'"#, lh);
        let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
        let mut bao = "";
        for row in rows {
            bao = row.get("质保书");
        }
        HttpResponse::Ok().json(bao)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
