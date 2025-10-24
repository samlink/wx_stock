use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use serde_json::json;

// 请求结构体
#[derive(Deserialize)]
pub struct UserOrdersRequest {
    user_id: i32,
}

#[derive(Deserialize)]
pub struct OrderDetailsRequest {
    user_id: i32,
    order_id: String,
}

// 响应结构体
#[derive(Serialize)]
pub struct OrderSummary {
    order_id: String,
    created_at: String,
    status: String,
    item_count: i32,
    total_weight: f64,
}

#[derive(Serialize)]
pub struct UserOrdersResponse {
    success: bool,
    orders: Vec<OrderSummary>,
    total_count: i32,
}

#[derive(Serialize)]
pub struct OrderDetailItem {
    material_number: String,
    product_name: String,
    specification: String,
    status: String,
    standard: String,
    manufacturer: String,
    heat_number: String,
    stock_length: i32,
    stock_weight: f64,
    unit_price: f64,
    quantity: i32,
    total_price: f64,
}

#[derive(Serialize)]
pub struct OrderSummaryInfo {
    total_items: i32,
    total_quantity: i32,
    total_weight: f64,
}

#[derive(Serialize)]
pub struct OrderDetails {
    order_id: String,
    created_at: String,
    status: String,
    items: Vec<OrderDetailItem>,
    summary: OrderSummaryInfo,
}

#[derive(Serialize)]
pub struct OrderDetailsResponse {
    success: bool,
    order: Option<OrderDetails>,
    message: String,
}

// 错误处理辅助函数
fn create_error_response(message: &str) -> HttpResponse {
    HttpResponse::InternalServerError().json(json!({
        "success": false,
        "message": message
    }))
}

fn create_unauthorized_response() -> HttpResponse {
    HttpResponse::Unauthorized().json(json!({
        "success": false,
        "message": "用户未登录"
    }))
}

fn create_not_found_response(message: &str) -> HttpResponse {
    HttpResponse::NotFound().json(json!({
        "success": false,
        "message": message
    }))
}

fn create_forbidden_response() -> HttpResponse {
    HttpResponse::Forbidden().json(json!({
        "success": false,
        "message": "权限不足"
    }))
}

/// 获取用户订单列表
#[post("/get_user_orders")]
pub async fn get_user_orders(
    db: web::Data<Pool>,
    request: web::Json<UserOrdersRequest>,
    id: Identity,
) -> HttpResponse {
    // 验证用户登录状态
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name.is_empty() {
        return create_unauthorized_response();
    }

    let conn = db.get().await.unwrap();

    // 验证用户权限 - 确保用户只能查看自己的订单
    let user_check_result = conn
        .query_opt(
            "SELECT id FROM customers WHERE id = $1 AND username = $2",
            &[&request.user_id, &user_name],
        )
        .await;

    match user_check_result {
        Ok(Some(_)) => {
            // 用户验证通过，继续查询订单
        }
        Ok(None) => {
            return create_forbidden_response();
        }
        Err(e) => {
            eprintln!("用户权限验证失败: {}", e);
            return create_error_response("权限验证失败");
        }
    }

    // 查询用户订单列表，包含订单基本信息和统计数据
    let orders_result = conn
        .query(
            r#"SELECT 
                o.order_id,
                o.created_at,
                o.status,
                COUNT(oi.id) as item_count,
                COALESCE(SUM(COALESCE(mv.理论重量, 0) * oi.quantity), 0) as total_weight
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON oi.material_number = p.物料号
            LEFT JOIN mv_length_weight mv ON p.物料号 = mv.物料号
            WHERE o.user_id = $1
            GROUP BY o.order_id, o.created_at, o.status
            ORDER BY o.created_at DESC"#,
            &[&request.user_id],
        )
        .await;

    match orders_result {
        Ok(rows) => {
            let mut orders = Vec::new();
            
            for row in rows {
                let created_at: std::time::SystemTime = row.get("created_at");
                let datetime: chrono::DateTime<chrono::Utc> = created_at.into();
                let item_count: i64 = row.get("item_count");
                let total_weight: f64 = row.get("total_weight");

                orders.push(OrderSummary {
                    order_id: row.get("order_id"),
                    created_at: datetime.format("%Y-%m-%d %H:%M:%S").to_string(),
                    status: row.get("status"),
                    item_count: item_count as i32,
                    total_weight,
                });
            }

            HttpResponse::Ok().json(UserOrdersResponse {
                success: true,
                total_count: orders.len() as i32,
                orders,
            })
        }
        Err(e) => {
            eprintln!("查询订单列表失败: {}", e);
            create_error_response("查询订单列表失败")
        }
    }
}

/// 获取订单明细
#[post("/get_order_details")]
pub async fn get_order_details(
    db: web::Data<Pool>,
    request: web::Json<OrderDetailsRequest>,
    id: Identity,
) -> HttpResponse {
    // 验证用户登录状态
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name.is_empty() {
        return create_unauthorized_response();
    }

    let conn = db.get().await.unwrap();

    // 验证订单权限 - 确保用户只能查看自己的订单
    let order_check_result = conn
        .query_opt(
            r#"SELECT o.order_id, o.created_at, o.status 
               FROM orders o 
               JOIN customers c ON o.user_id = c.id 
               WHERE o.order_id = $1 AND o.user_id = $2 AND c.username = $3"#,
            &[&request.order_id, &request.user_id, &user_name],
        )
        .await;

    let order_info = match order_check_result {
        Ok(Some(row)) => row,
        Ok(None) => {
            return create_not_found_response("订单不存在或无权限访问");
        }
        Err(e) => {
            eprintln!("订单权限验证失败: {}", e);
            return create_error_response("订单权限验证失败");
        }
    };

    // 使用JOIN查询获取完整的商品详细信息
    let items_result = conn
        .query(
            r#"SELECT 
                oi.material_number,
                oi.quantity,
                p.物料号,
                split_part(t.node_name, ' ', 2) as product_name,
                p.规格型号 as specification,
                p.文本字段2 as status,
                p.文本字段3 as standard,
                p.文本字段5 as manufacturer,
                p.文本字段4 as heat_number,
                COALESCE(mv.库存长度, 0) as stock_length,
                COALESCE(mv.理论重量, 0) as stock_weight,
                COALESCE(mv.理论重量, 0) * 0.1 as unit_price
            FROM order_items oi
            JOIN products p ON oi.material_number = p.物料号
            JOIN tree t ON p.商品id = t.num
            LEFT JOIN mv_length_weight mv ON p.物料号 = mv.物料号
            WHERE oi.order_id = $1
            ORDER BY oi.created_at ASC"#,
            &[&request.order_id],
        )
        .await;

    match items_result {
        Ok(rows) => {
            let mut items = Vec::new();
            let mut total_items = 0;
            let mut total_quantity = 0;
            let mut total_weight = 0.0;

            for row in rows {
                let quantity: i32 = row.get("quantity");
                let unit_price: f64 = row.get("unit_price");
                let stock_weight: f64 = row.get("stock_weight");
                let total_item_price = unit_price * quantity as f64;
                let total_item_weight = stock_weight * quantity as f64;

                total_items += 1;
                total_quantity += quantity;
                total_weight += total_item_weight;

                items.push(OrderDetailItem {
                    material_number: row.get("material_number"),
                    product_name: row.get("product_name"),
                    specification: row.get("specification"),
                    status: row.get("status"),
                    standard: row.get("standard"),
                    manufacturer: row.get("manufacturer"),
                    heat_number: row.get("heat_number"),
                    stock_length: row.get("stock_length"),
                    stock_weight,
                    unit_price,
                    quantity,
                    total_price: total_item_price,
                });
            }

            let created_at: std::time::SystemTime = order_info.get("created_at");
            let datetime: chrono::DateTime<chrono::Utc> = created_at.into();

            let order_details = OrderDetails {
                order_id: order_info.get("order_id"),
                created_at: datetime.format("%Y-%m-%d %H:%M:%S").to_string(),
                status: order_info.get("status"),
                items,
                summary: OrderSummaryInfo {
                    total_items,
                    total_quantity,
                    total_weight,
                },
            };

            HttpResponse::Ok().json(OrderDetailsResponse {
                success: true,
                order: Some(order_details),
                message: "订单明细获取成功".to_string(),
            })
        }
        Err(e) => {
            eprintln!("查询订单明细失败: {}", e);
            create_error_response("查询订单明细失败")
        }
    }
}