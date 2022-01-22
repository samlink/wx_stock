use crate::service::get_user;
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
pub async fn fetch_house(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let rows = &conn
            .query("SELECT id, name FROM warehouse WHERE not_use=false ORDER BY show_order", &[])
            .await
            .unwrap();

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
        let sql = if data.cate == "增加" {
            format!("INSERT INTO warehouse (name) VALUES('{}')", data.name)
        } else if data.cate == "编辑" {
            format!(
                "UPDATE warehouse SET name='{}' WHERE id={}",
                data.name, data.id
            )
        } else {
            format!("UPDATE warehouse SET not_use=true WHERE id={}", data.id)
        };

        let _ = &conn.query(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///仓库拖拽
#[post("/house_drag")]
pub async fn house_drag(
    db: web::Data<Pool>,
    data: web::Json<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "仓库设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let ids: Vec<&str> = data.split(",").collect();
        for i in 0..ids.len() {
            let sql = format!(
                "UPDATE warehouse SET show_order={} WHERE id={}",
                i + 1,
                ids[i]
            );
            let _ = &conn.query(sql.as_str(), &[]).await.unwrap();
        }

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

// ///获取库位
// #[post("/fetch_position")]
// pub async fn fetch_position(
//     db: web::Data<Pool>,
//     data: web::Json<i32>,
//     id: Identity,
// ) -> HttpResponse {
//     let user = get_user(db.clone(), id, "仓库设置".to_owned()).await;
//     if user.name != "" {
//         let conn = db.get().await.unwrap();
//         let sql = format!("SELECT position FROM warehouse WHERE id={}", data);
//         let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
//         let mut position = "".to_owned();
//         for row in rows {
//             position = row.get("position");
//         }
//         HttpResponse::Ok().json(position)
//     } else {
//         HttpResponse::Ok().json(-1)
//     }
// }

// ///编辑库位
// #[post("/edit_position")]
// pub async fn edit_position(
//     db: web::Data<Pool>,
//     data: web::Json<HouseData>,
//     id: Identity,
// ) -> HttpResponse {
//     let user = get_user(db.clone(), id, "仓库设置".to_owned()).await;
//     if user.name != "" {
//         let conn = db.get().await.unwrap();
//         let position = data.name.trim_end_matches(",").to_owned();
//         let sql = format!(
//             "UPDATE warehouse SET position='{}' WHERE id={}",
//             position, data.id
//         );
//         &conn.execute(sql.as_str(), &[]).await.unwrap();

//         HttpResponse::Ok().json(1)
//     } else {
//         HttpResponse::Ok().json(-1)
//     }
// }

// //库位自动完成
// #[get("/position_auto")]
// pub async fn position_auto(
//     db: web::Data<Pool>,
//     search: web::Query<SearchCate>,
//     id: Identity,
// ) -> HttpResponse {
//     let user_name = id.identity().unwrap_or("".to_owned());
//     if user_name != "" {
//         let conn = db.get().await.unwrap();
//         let s = search.s.to_lowercase();

//         let sql = &format!(
//             r#"SELECT position FROM warehouse WHERE id = {}"#,
//             search.cate
//         );
//         let rows = &conn.query(sql.as_str(), &[]).await.unwrap();
//         let mut postion = "".to_owned();

//         for row in rows {
//             postion = row.get("position")
//         }

//         let mut p_arr: Vec<&str> = postion.split(",").collect();
//         p_arr.retain(|&x| x.to_lowercase().contains(&s));

//         let mut data = Vec::new();
//         let mut n = 1;
//         for p in p_arr {
//             if n > 10 {
//                 break;
//             } else {
//                 let message = Message {
//                     id: 1,
//                     label: p.to_string(),
//                 };
//                 data.push(message);
//             }
//             n += 1;
//         }

//         HttpResponse::Ok().json(data)
//     } else {
//         HttpResponse::Ok().json(-1)
//     }
// }