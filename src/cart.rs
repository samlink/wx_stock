use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize)]
pub struct AddToCartRequest {
    user_id: i32,
    material_number: String,
}

#[derive(Deserialize)]
pub struct UserRequest {
    user_id: i32,
}

#[derive(Serialize)]
pub struct CartResponse {
    success: bool,
    cart_count: i32,
    message: String,
}

#[derive(Serialize)]
pub struct CartCountResponse {
    count: i32,
}

#[derive(Serialize)]
pub struct CartMaterialsResponse {
    materials: Vec<String>,
    count: i32,
}

#[derive(Serialize)]
pub struct CartItem {
    material_number: String,
    quantity: i32,
    added_at: String,
}

#[derive(Serialize)]
pub struct CartItemsResponse {
    items: Vec<CartItem>,
    total_count: i32,
}

#[derive(Serialize)]
pub struct CartDetailItem {
    material_number: String,
    product_name: String,
    cz: String,
    specification: String,
    status: String,
    standard: String,
    manufacturer: String,
    heat_number: String,
    stock_length: i32,
    stock_weight: f64,
    unit_price: f64,
    quantity: i32,
    order_length: i32,
    order_weight: f64,
    note: Option<String>,
    total_price: f64,
    added_at: String,
    low_stock: bool,
}

#[derive(Serialize)]
pub struct CartDetailResponse {
    items: Vec<CartDetailItem>,
    total_count: i32,
    total_length: i32,
    total_weight: f64,
}

#[derive(Deserialize)]
pub struct RemoveFromCartRequest {
    user_id: i32,
    material_number: String,
}


#[derive(Deserialize, Debug)]
pub struct SubmitOrderRequest {
    user_id: i32,
    items: Vec<OrderItem>,
}

#[derive(Deserialize, Debug)]
pub struct OrderItem {
    material_number: String,
    length: i32,
    weight: f64,
    quantity: i32,
    note: String,
}

#[derive(Deserialize, Debug)]
pub struct SaveCartDetailsRequest {
    user_id: i32,
    items: Vec<CartDetailUpdate>,
}

#[derive(Deserialize, Debug)]
pub struct CartDetailUpdate {
    material_number: String,
    quantity: i32,
    order_length: i32,
    order_weight: f64,
    note: Option<String>,
}

#[derive(Serialize)]
pub struct OrderResponse {
    success: bool,
    order_id: Option<String>,
    message: String,
}

/// 添加商品到购物车
#[post("/add_to_cart")]
pub async fn add_to_cart(
    db: web::Data<Pool>,
    request: web::Json<AddToCartRequest>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name.is_empty() {
        return HttpResponse::Unauthorized().json(json!({
            "success": false,
            "message": "用户未登录"
        }));
    }

    let conn = db.get().await.unwrap();

    // 尝试插入或更新购物车项目
    let insert_result = conn
        .execute(
            r#"INSERT INTO shopping_cart (user_id, material_number) 
               VALUES ($1, $2)
               ON CONFLICT (user_id, material_number) 
               DO NOTHING"#,
            &[&request.user_id, &request.material_number],
        )
        .await;

    match insert_result {
        Ok(_) => {
            // 获取更新后的购物车总数量
            let count_result = conn
                .query_one(
                    "SELECT COUNT(*) as count FROM shopping_cart WHERE user_id = $1",
                    &[&request.user_id],
                )
                .await;

            let cart_count: i64 = count_result.unwrap().get("count");

            HttpResponse::Ok().json(CartResponse {
                success: true,
                cart_count: cart_count as i32,
                message: "商品已添加到购物车".to_string(),
            })
        }
        Err(e) => {
            eprintln!("添加到购物车失败: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "success": false,
                "message": "添加到购物车失败"
            }))
        }
    }
}

/// 获取购物车商品数量
#[post("/get_cart_count")]
pub async fn get_cart_count(
    db: web::Data<Pool>,
    request: web::Json<UserRequest>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name.is_empty() {
        return HttpResponse::Unauthorized().json(json!({
            "count": 0
        }));
    }

    let conn = db.get().await.unwrap();

    // 获取购物车商品数量
    let count_result = conn
        .query_one(
            "SELECT COUNT(*) as count FROM shopping_cart WHERE user_id = $1",
            &[&request.user_id],
        )
        .await;

    match count_result {
        Ok(row) => {
            let count: i64 = row.get("count");
            HttpResponse::Ok().json(CartCountResponse {
                count: count as i32,
            })
        }
        Err(_) => HttpResponse::Ok().json(CartCountResponse { count: 0 }),
    }
}

/// 获取购物车物料号列表
#[post("/get_cart_materials")]
pub async fn get_cart_materials(
    db: web::Data<Pool>,
    request: web::Json<UserRequest>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name.is_empty() {
        return HttpResponse::Unauthorized().json(json!({
            "materials": [],
            "count": 0
        }));
    }

    let conn = db.get().await.unwrap();

    // 获取购物车物料号列表
    let materials_result = conn
        .query(
            "SELECT material_number FROM shopping_cart WHERE user_id = $1 ORDER BY added_at DESC",
            &[&request.user_id],
        )
        .await;

    match materials_result {
        Ok(rows) => {
            let mut materials = Vec::new();
            for row in rows {
                materials.push(row.get("material_number"));
            }

            let count = materials.len() as i32;
            HttpResponse::Ok().json(CartMaterialsResponse { materials, count })
        }
        Err(_) => HttpResponse::Ok().json(CartMaterialsResponse {
            materials: vec![],
            count: 0,
        }),
    }
}

/// 获取购物车商品列表
#[post("/get_cart_items")]
pub async fn get_cart_items(
    db: web::Data<Pool>,
    request: web::Json<UserRequest>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name.is_empty() {
        return HttpResponse::Unauthorized().json(json!({
            "items": [],
            "total_count": 0
        }));
    }

    let conn = db.get().await.unwrap();

    // 获取购物车商品列表
    let items_result = conn
        .query(
            r#"SELECT material_number, quantity, added_at 
               FROM shopping_cart 
               WHERE user_id = $1 
               ORDER BY added_at DESC"#,
            &[&request.user_id],
        )
        .await;

    match items_result {
        Ok(rows) => {
            let mut items = Vec::new();
            for row in rows {
                let added_at: std::time::SystemTime = row.get("added_at");
                let datetime: chrono::DateTime<chrono::Utc> = added_at.into();
                items.push(CartItem {
                    material_number: row.get("material_number"),
                    quantity: row.get("quantity"),
                    added_at: datetime.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
                });
            }

            HttpResponse::Ok().json(CartItemsResponse {
                total_count: items.len() as i32,
                items,
            })
        }
        Err(_) => HttpResponse::Ok().json(CartItemsResponse {
            items: vec![],
            total_count: 0,
        }),
    }
}

/// 获取购物车详细信息（包含商品详情）
#[post("/get_cart_detail")]
pub async fn get_cart_detail(
    db: web::Data<Pool>,
    request: web::Json<UserRequest>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name.is_empty() {
        return HttpResponse::Unauthorized().json(json!({
            "items": [],
            "total_count": 0,
            "total_length": 0,
            "total_weight": 0.0
        }));
    }

    let conn = db.get().await.unwrap();

    // 获取购物车商品详细信息
    let items_result = conn
        .query(
            r#"SELECT 
                sc.material_number,
                sc.quantity,
                sc.added_at,
                p.物料号,
                split_part(t.node_name, ' ', 2) as product_name,
                split_part(t.node_name, ' ', 1) as cz,
                p.规格型号 as specification,
                p.文本字段2 as status,
                p.文本字段3 as standard,
                p.文本字段5 as manufacturer,
                p.文本字段4 as heat_number,
                COALESCE(foo.库存长度, 0) as stock_length,
                COALESCE(foo.理论重量, 0) as stock_weight,
                COALESCE(foo.理论重量, 0) * 0.1 as unit_price,
                COALESCE(sc.order_length, 0) as order_length,
                COALESCE(sc.order_weight, 0) as order_weight,
                sc.note as note
            FROM shopping_cart sc
            JOIN products p ON sc.material_number = p.物料号
            JOIN tree t ON p.商品id = t.num
            LEFT JOIN mv_length_weight foo ON p.物料号 = foo.物料号
            WHERE sc.user_id = $1
            ORDER BY sc.added_at DESC"#,
            &[&request.user_id],
        )
        .await;

    match items_result {
        Ok(rows) => {
            let mut items = Vec::new();
            let mut total_length = 0;
            let mut total_weight = 0.0;

            for row in rows {
                let quantity: i32 = row.get("quantity");
                let unit_price: f64 = row.get("unit_price");
                let total_item_price = unit_price * quantity as f64;
                let original_stock_length: i32 = row.get("stock_length");
                let original_stock_weight: f64 = row.get("stock_weight");
                let saved_order_length: i32 = row.get("order_length");
                let saved_order_weight: f64 = row.get("order_weight");
                let saved_note: Option<String> = row.get("note");

                let added_at: std::time::SystemTime = row.get("added_at");
                let datetime: chrono::DateTime<chrono::Utc> = added_at.into();

                // 检查库存是否低于10，如果是则标记为低库存并重置为0
                let low_stock = original_stock_length < 10;
                let stock_length = if low_stock { 0 } else { original_stock_length };
                let stock_weight = if low_stock { 0.0 } else { original_stock_weight };

                // 基于保存数据或默认规则回显 Input 值
                // 若 saved_order_length == 0: 用库存长度作为订购长度，订购数量=1，订购重量=库存重量
                // 若 saved_order_length > 0: 用保存的订购长度/重量/备注
                let (order_length, order_weight) = if saved_order_length > 0 {
                    (saved_order_length, saved_order_weight)
                } else {
                    (stock_length, stock_weight)
                };
                let display_quantity = if saved_order_length > 0 { quantity } else { 1 };

                // 计算总长度和总重量（基于显示用数量）
                total_length += order_length * display_quantity;
                total_weight += order_weight * display_quantity as f64;

                items.push(CartDetailItem {
                    material_number: row.get("material_number"),
                    product_name: row.get("product_name"),
                    cz: row.get("cz"),
                    specification: row.get("specification"),
                    status: row.get("status"),
                    standard: row.get("standard"),
                    manufacturer: row.get("manufacturer"),
                    heat_number: row.get("heat_number"),
                    stock_length,
                    stock_weight,
                    unit_price,
                    quantity: display_quantity,
                    order_length,
                    order_weight,
                    note: saved_note,
                    total_price: total_item_price,
                    added_at: datetime.format("%Y-%m-%d %H:%M:%S").to_string(),
                    low_stock,
                });
            }

            HttpResponse::Ok().json(CartDetailResponse {
                total_count: items.len() as i32,
                total_length,
                total_weight,
                items,
            })
        }
        Err(_) => HttpResponse::Ok().json(CartDetailResponse {
            items: vec![],
            total_count: 0,
            total_length: 0,
            total_weight: 0.0,
        }),
    }
}

/// 从购物车中删除商品
#[post("/remove_from_cart")]
pub async fn remove_from_cart(
    db: web::Data<Pool>,
    request: web::Json<RemoveFromCartRequest>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name.is_empty() {
        return HttpResponse::Unauthorized().json(json!({
            "success": false,
            "message": "用户未登录"
        }));
    }

    let conn = db.get().await.unwrap();

    // 删除购物车中的商品
    let delete_result = conn
        .execute(
            "DELETE FROM shopping_cart WHERE user_id = $1 AND material_number = $2",
            &[&request.user_id, &request.material_number],
        )
        .await;

    match delete_result {
        Ok(rows_affected) => {
            if rows_affected > 0 {
                HttpResponse::Ok().json(json!({
                    "success": true,
                    "message": "商品已从购物车中移除"
                }))
            } else {
                HttpResponse::Ok().json(json!({
                    "success": false,
                    "message": "商品不在购物车中"
                }))
            }
        }
        Err(e) => {
            eprintln!("删除购物车商品失败: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "success": false,
                "message": "删除失败，请重试"
            }))
        }
    }
}

/// 清空购物车
#[post("/clear_cart")]
pub async fn clear_cart(
    db: web::Data<Pool>,
    request: web::Json<UserRequest>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name.is_empty() {
        return HttpResponse::Unauthorized().json(json!({
            "success": false,
            "message": "用户未登录"
        }));
    }

    let conn = db.get().await.unwrap();

    // 清空购物车
    let clear_result = conn
        .execute(
            "DELETE FROM shopping_cart WHERE user_id = $1",
            &[&request.user_id],
        )
        .await;

    match clear_result {
        Ok(_) => HttpResponse::Ok().json(json!({
            "success": true,
            "message": "购物车已清空"
        })),
        Err(e) => {
            eprintln!("清空购物车失败: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "success": false,
                "message": "清空失败，请重试"
            }))
        }
    }
}

/// 保存购物车明细（在前端输入框 blur 后逐行保存）
#[post("/save_cart_details")]
pub async fn save_cart_details(
    db: web::Data<Pool>,
    request: web::Json<SaveCartDetailsRequest>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name.is_empty() {
        return HttpResponse::Unauthorized().json(json!({
            "success": false,
            "message": "用户未登录"
        }));
    }

    if request.items.is_empty() {
        return HttpResponse::Ok().json(json!({
            "success": true
        }));
    }

    let conn = db.get().await.unwrap();

    // 批量保存（逐条 upsert）
    for it in &request.items {
        let note_val: Option<&str> = it.note.as_deref();
        let result = conn
            .execute(
                r#"INSERT INTO shopping_cart (user_id, material_number, quantity, order_length, order_weight, note)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT (user_id, material_number)
                   DO UPDATE SET quantity = EXCLUDED.quantity,
                                 order_length = EXCLUDED.order_length,
                                 order_weight = EXCLUDED.order_weight,
                                 note = EXCLUDED.note"#,
                &[&request.user_id, &it.material_number, &it.quantity, &it.order_length, &it.order_weight, &note_val],
            )
            .await;
        
        if result.is_err() {
            return HttpResponse::InternalServerError().json(json!({
                "success": false,
                "message": format!("保存物料 {} 失败", it.material_number)
            }));
        }
    }

    HttpResponse::Ok().json(json!({
        "success": true
    }))
}

/// 提交订单
#[post("/submit_order")]
pub async fn submit_order(
    db: web::Data<Pool>,
    request: web::Json<SubmitOrderRequest>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name.is_empty() {
        return HttpResponse::Unauthorized().json(json!({
            "success": false,
            "message": "用户未登录"
        }));
    }

    if request.items.is_empty() {
        return HttpResponse::BadRequest().json(json!({
            "success": false,
            "message": "购物车为空"
        }));
    }

    let mut conn = db.get().await.unwrap();

    // 开始事务
    let transaction = conn.transaction().await.unwrap();

    // 参数校验 + 库存校验
    for item in &request.items {
        // 基本参数校验：长度、数量、重量必须为正
        if item.length <= 0 || item.quantity <= 0 || item.weight <= 0.0 {
            return HttpResponse::BadRequest().json(json!({
                "success": false,
                "message": format!("商品 {} 的订购长度/数量/重量必须为正数", item.material_number)
            }));
        }

        // 查询库存长度并校验“总订购长度 <= 库存长度”
        let stock_result = transaction
            .query_one(
                "SELECT COALESCE(foo.库存长度, 0) as stock_length FROM products p 
                 LEFT JOIN mv_length_weight foo ON p.物料号 = foo.物料号 
                 WHERE p.物料号 = $1",
                &[&item.material_number],
            )
            .await;

        match stock_result {
            Ok(row) => {
                let stock_length: i32 = row.get("stock_length");
                let requested_total: i32 = item.length.saturating_mul(item.quantity);
                if requested_total > stock_length {
                    return HttpResponse::Ok().json(json!({
                        "success": false,
                        "message": format!(
                            "商品 {} 的总订购长度 {} 超过库存长度 {}",
                            item.material_number, requested_total, stock_length
                        )
                    }));
                }
            }
            Err(_) => {
                return HttpResponse::Ok().json(json!({
                    "success": false,
                    "message": format!("商品 {} 不存在", item.material_number)
                }));
            }
        }
    }

    // 生成订单号
    let order_id = format!(
        "WX-{}-{}",
        request.user_id,
        chrono::Utc::now().format("%Y%m%d%H%M%S")
    );

    // 创建订单记录
    let order_result = transaction
        .execute(
            "INSERT INTO orders (order_id, user_id) VALUES ($1, $2)",
            &[&order_id, &request.user_id],
        )
        .await;

    if order_result.is_err() {
        return HttpResponse::InternalServerError().json(json!({
            "success": false,
            "message": "创建订单失败"
        }));
    }

    // 创建订单详情
    for item in &request.items {
        let detail_result = transaction
            .execute(
                "INSERT INTO order_items (order_id, material_number, length, weight, quantity, note) VALUES ($1, $2, $3, $4, $5, $6)",
                &[
                    &order_id,
                    &item.material_number,
                    &item.length,
                    &item.weight,
                    &item.quantity,
                    &item.note,
                ],
            )
            .await;

        if detail_result.is_err() {
            return HttpResponse::InternalServerError().json(json!({
                "success": false,
                "message": "创建订单详情失败"
            }));
        }
    }

    // 清空购物车
    let clear_result = transaction
        .execute(
            "DELETE FROM shopping_cart WHERE user_id = $1",
            &[&request.user_id],
        )
        .await;

    if clear_result.is_err() {
        return HttpResponse::InternalServerError().json(json!({
            "success": false,
            "message": "清空购物车失败"
        }));
    }

    // 提交事务
    if transaction.commit().await.is_err() {
        return HttpResponse::InternalServerError().json(json!({
            "success": false,
            "message": "提交订单失败"
        }));
    }

    HttpResponse::Ok().json(OrderResponse {
        success: true,
        order_id: Some(order_id),
        message: "订单提交成功".to_string(),
    })
}
