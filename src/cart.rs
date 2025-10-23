use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize)]
pub struct AddToCartRequest {
    user_id: String,
    material_number: String,
}

#[derive(Deserialize)]
pub struct UserRequest {
    user_id: String,
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

/// 获取购物车商品列表（预留功能）
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
