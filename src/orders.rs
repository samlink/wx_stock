use actix_identity::Identity;
use actix_web::{post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use serde_json::json;

// 请求结构体
#[derive(Deserialize)]
pub struct UserOrdersRequest {
    user_id: i32,
    search: Option<String>,
    page: Option<i32>,
    rec: Option<i32>,
}

#[derive(Deserialize)]
pub struct OrderDetailsRequest {
    user_id: i32,
    order_id: String,
}

#[derive(Deserialize)]
pub struct PendingOrdersCountRequest {
    user_id: i32,
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
    page: i32,
    rec: i32,
}

#[derive(Serialize)]
pub struct OrderDetailItem {
    material_number: String,
    product_name: String,
    cz: String,
    specification: String,
    status: String,
    standard: String,
    manufacturer: String,
    heat_number: String,
    stock_length: i32,
    stock_weight: f32,
    quantity: i32,
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

#[derive(Serialize)]
pub struct PendingOrdersCountResponse {
    success: bool,
    count: i32,
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

    // 获取分页参数
    let page = request.page.unwrap_or(1);
    let rec = request.rec.unwrap_or(10);
    let search = request.search.as_deref().unwrap_or("").trim();
    
    let (orders_result, total_count) = if search.is_empty() {
        // 无搜索时的查询
        let total_result = conn.query_one(
            "SELECT COUNT(*) as total FROM orders o WHERE o.user_id = $1",
            &[&request.user_id]
        ).await;
        let total_count = match total_result {
            Ok(row) => row.get::<_, i64>("total"),
            Err(_) => 0,
        } as i32;

        let skip = ((page - 1) * rec) as i64;
        let rec_i64 = rec as i64;

        let orders_result = conn.query(
            r#"SELECT
                o.order_id,
                o.created_at,
                o.status,
                COUNT(oi.id) as item_count,
                SUM(COALESCE(mv.理论重量, 0)) as total_weight
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.material_number = p.物料号
            LEFT JOIN mv_length_weight mv ON p.物料号 = mv.物料号
            WHERE o.user_id = $1
            GROUP BY o.order_id, o.created_at, o.status
            ORDER BY o.created_at DESC
            OFFSET $2 LIMIT $3"#,
            &[&request.user_id, &skip, &rec_i64]
        ).await;
        
        (orders_result, total_count)
    } else {
        // 有搜索时的查询
        let search_param = format!("%{}%", search);
        let total_result = conn.query_one(
            r#"SELECT COUNT(*) as total FROM orders o 
               WHERE o.user_id = $1 
               AND (o.order_id ILIKE $2 OR EXISTS (
                   SELECT 1 FROM order_items oi2 
                   JOIN tree t ON oi2.material_number = t.num 
                   WHERE oi2.order_id = o.order_id AND t.node_name ILIKE $3
               ))"#,
            &[&request.user_id, &search_param, &search_param]
        ).await;
        let total_count = match total_result {
            Ok(row) => row.get::<_, i64>("total"),
            Err(_) => 0,
        } as i32;

        let skip = ((page - 1) * rec) as i64;
        let rec_i64 = rec as i64;

        let orders_result = conn.query(
            r#"SELECT
                o.order_id,
                o.created_at,
                o.status,
                COUNT(oi.id) as item_count,
                SUM(COALESCE(mv.理论重量, 0)) as total_weight
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.material_number = p.物料号
            LEFT JOIN mv_length_weight mv ON p.物料号 = mv.物料号
            WHERE o.user_id = $1
            AND (o.order_id ILIKE $2 OR EXISTS (
                SELECT 1 FROM order_items oi2
                JOIN tree t ON oi2.material_number = t.num
                WHERE oi2.order_id = o.order_id AND t.node_name ILIKE $3
            ))
            GROUP BY o.order_id, o.created_at, o.status
            ORDER BY o.created_at DESC
            OFFSET $4 LIMIT $5"#,
            &[&request.user_id, &search_param, &search_param, &skip, &rec_i64]
        ).await;
        
        (orders_result, total_count)
    };

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
                total_count,
                page,
                rec,
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

    // 先查询订单头信息（确保订单属于该用户）
    let order_info_res = conn
        .query_opt(
            r#"SELECT order_id, created_at, status FROM orders WHERE order_id = $1 AND user_id = $2"#,
            &[&request.order_id, &request.user_id],
        )
        .await;

    let order_info_row = match order_info_res {
        Ok(Some(row)) => row,
        Ok(None) => {
            return create_not_found_response("未找到该订单或无权访问");
        }
        Err(e) => {
            eprintln!("查询订单头失败: {}", e);
            return create_error_response("查询订单头失败");
        }
    };

    // 使用JOIN查询获取完整的商品详细信息
    let items_result = conn
        .query(
            r#"SELECT 
                oi.material_number,
                split_part(t.node_name, ' ', 2) as product_name,
                split_part(t.node_name, ' ', 1) as cz,
                p.规格型号 as specification,
                p.文本字段2 as status,
                p.文本字段3 as standard,
                p.文本字段5 as manufacturer,
                p.文本字段4 as heat_number,
                oi.length,
                oi.weight
            FROM order_items oi
            JOIN products p ON oi.material_number = p.物料号
            JOIN tree t ON p.商品id = t.num
            WHERE oi.order_id = $1"#,
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
                let quantity: i32 = 1;
                let stock_weight: f32 = row.get("weight");
                let total_item_weight = stock_weight as f64;

                total_items += 1;
                total_quantity += quantity;
                total_weight += total_item_weight;

                items.push(OrderDetailItem {
                    material_number: row.get("material_number"),
                    product_name: row.get("product_name"),
                    cz: row.get("cz"),
                    specification: row.get("specification"),
                    status: row.get("status"),
                    standard: row.get("standard"),
                    manufacturer: row.get("manufacturer"),
                    heat_number: row.get("heat_number"),
                    stock_length: row.get("length"),
                    stock_weight,
                    quantity,
                });
            }

            let created_at: std::time::SystemTime = order_info_row.get("created_at");
            let datetime: chrono::DateTime<chrono::Utc> = created_at.into();

            let order_details = OrderDetails {
                order_id: order_info_row.get("order_id"),
                created_at: datetime.format("%Y-%m-%d %H:%M:%S").to_string(),
                status: order_info_row.get("status"),
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

/// 获取用户未处理订单数量
#[post("/get_pending_orders_count")]
pub async fn get_pending_orders_count(
    db: web::Data<Pool>,
    request: web::Json<PendingOrdersCountRequest>,
    id: Identity,
) -> HttpResponse {
    // 验证用户登录状态
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name.is_empty() {
        return create_unauthorized_response();
    }

    let conn = db.get().await.unwrap();

    // 查询未处理订单数量（状态为"pending"的订单）
    let count_result = conn
        .query_one(
            r#"SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND status = 'pending'"#,
            &[&request.user_id],
        )
        .await;

    match count_result {
        Ok(row) => {
            let count: i64 = row.get("count");
            HttpResponse::Ok().json(PendingOrdersCountResponse {
                success: true,
                count: count as i32,
            })
        }
        Err(e) => {
            eprintln!("查询未处理订单数量失败: {}", e);
            create_error_response("查询未处理订单数量失败")
        }
    }
}