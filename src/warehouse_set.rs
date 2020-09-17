use crate::service::{PostData, get_user};
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct HouseData {
    pub id: i32,
    pub name: String,
    pub cate: String,
}

///获取仓库
#[get("/fetch_house")]
pub async fn fetch_house(
    db: web::Data<Pool>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "仓库设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let rows = &conn.query("SELECT id, name FROM warehouse ORDER BY show_order", &[]).await.unwrap();

        let mut houses: Vec<HouseData> = Vec::new();

        for row in rows {
            let house = HouseData {
                id: row.get("id"),
                name: row.get("name"),
                cate: "".to_owned(),
            };

            houses.push(house);
        }

        HttpResponse::Ok().json(houses)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///编辑仓库
#[post("/update_house")]
pub async fn update_house(
    db: web::Data<Pool>,
    data: web::Json<HouseData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "仓库设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let sql = if data.cate=="增加" { 
            format!("INSERT INTO warehouse (name) VALUES('{}')", data.name)
        }
        else {
            format!("UPDATE warehouse SET name='{}' WHERE id={}", data.name, data.id)
        };

        &conn.query(sql.as_str(), &[]).await.unwrap();


        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}