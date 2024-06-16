use crate::service::get_user;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use async_recursion::async_recursion;
use deadpool_postgres::Pool;
use rust_pinyin::get_pinyin;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
struct TreeNode {
    node_name: String,
    num: String,
    children: Vec<TreeNode>,
}

#[get("/tree")]
pub async fn tree(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let tree = get_tree(db, "#".to_owned()).await;
        HttpResponse::Ok().json(tree)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize)]
pub struct Num {
    pnum: String,
    node_name: String,
}

// #[post("/tree_add")]
// pub async fn tree_add(db: web::Data<Pool>, data: web::Json<Num>, id: Identity) -> HttpResponse {
//     let user = get_user(db.clone(), id, "库存设置".to_owned()).await;
//     if user.name != "" {
//         let conn = db.get().await.unwrap();
//         let mut num = "".to_owned();
//         let mut pnum = data.pnum.clone();
//         let pinyin = get_pinyin(&data.node_name);
//
//         if pnum != "" {
//             let rows = &conn
//                 .query(
//                     r#"SELECT num FROM tree WHERE pnum = $1 ORDER BY num DESC limit 1"#,
//                     &[&data.pnum],
//                 )
//                 .await
//                 .unwrap();
//
//             if !rows.is_empty() {
//                 for row in rows {
//                     num = row.get(0);
//                 }
//                 let str1 = &num[0..num.len() - 3];
//                 let str2 = &num[num.len() - 3..];
//                 num = str1.to_owned() + &(str2.parse::<i32>().unwrap() + 1).to_string();
//             } else {
//                 num = data.pnum.clone() + "_101";
//             }
//         } else {
//             let rows = &conn
//                 .query(
//                     r##"SELECT num FROM tree WHERE pnum='#' ORDER BY num DESC limit 1"##,
//                     &[],
//                 )
//                 .await
//                 .unwrap();
//
//             if !rows.is_empty() {
//                 for row in rows {
//                     num = row.get(0);
//                 }
//                 num = (num.parse::<i32>().unwrap() + 1).to_string();
//             } else {
//                 num = "1".to_string();
//             }
//             pnum = "#".to_string();
//         };
//
//         let _ = &conn
//             .execute(
//                 r#"INSERT INTO tree (node_name, num, pnum, pinyin) VALUES ($1,$2,$3,$4)"#,
//                 &[&data.node_name, &num, &pnum, &pinyin],
//             )
//             .await
//             .unwrap();
//
//         HttpResponse::Ok().json(num)
//     } else {
//         HttpResponse::Ok().json(0)
//     }
// }
//
// #[post("/tree_edit")]
// pub async fn tree_edit(db: web::Data<Pool>, data: web::Json<Num>, id: Identity) -> HttpResponse {
//     let user = get_user(db.clone(), id, "库存设置".to_owned()).await;
//     if user.name != "" {
//         let conn = db.get().await.unwrap();
//         let pinyin = get_pinyin(&data.node_name);
//
//         let _ = &conn
//             .execute(
//                 r#"UPDATE tree SET node_name=$1, pinyin=$3 WHERE num=$2"#,
//                 &[&data.node_name, &data.pnum, &pinyin],
//             )
//             .await
//             .unwrap();
//
//         HttpResponse::Ok().json(1)
//     } else {
//         HttpResponse::Ok().json(0)
//     }
// }
//
// #[post("/tree_del")]
// pub async fn tree_del(db: web::Data<Pool>, data: web::Json<Num>, id: Identity) -> HttpResponse {
//     let user = get_user(db.clone(), id, "库存设置".to_owned()).await;
//     if user.name != "" {
//         let conn = db.get().await.unwrap();
//         let rows = &conn
//             .query(
//                 r#"SELECT id FROM products WHERE 商品id=$1 LIMIT 1"#,
//                 &[&data.pnum],
//             )
//             .await
//             .unwrap();
//         if rows.is_empty() {
//             let _ = &conn
//                 .execute(r#"DELETE FROM tree WHERE num=$1"#, &[&data.pnum])
//                 .await
//                 .unwrap();
//         } else {
//             let _ = &conn
//                 .execute(
//                     r#"UPDATE products SET 停用=true WHERE 商品id=$1"#,
//                     &[&data.pnum],
//                 )
//                 .await
//                 .unwrap();
//
//             let _ = &conn
//                 .execute(
//                     r#"UPDATE tree SET not_use=true WHERE num=$1"#,
//                     &[&data.pnum],
//                 )
//                 .await
//                 .unwrap();
//         }
//
//         HttpResponse::Ok().json(1)
//     } else {
//         HttpResponse::Ok().json(0)
//     }
// }

#[async_recursion]
async fn get_tree(db: web::Data<Pool>, num: String) -> Vec<TreeNode> {
    let conn = db.get().await.unwrap();
    let mut tree_get = Vec::new();

    let rows = &conn
        .query(
            r##"SELECT node_name, num, pnum FROM tree WHERE pnum=$1 AND not_use=false order by num"##, //查询字段名称与结构名称对应
            &[&num],
        )
        .await
        .unwrap();

    if !rows.is_empty() {
        for row in rows {
            let node = TreeNode {
                node_name: row.get(0),
                num: row.get(1),
                children: get_tree(db.clone(), row.get(1)).await,
            };

            tree_get.push(node);
        }
    }

    tree_get
}

#[derive(Deserialize)]
pub struct Search {
    s: String,
}

#[derive(Deserialize, Serialize)]
pub struct Message {
    id: String,
    label: String,
}

/// 用作自动完成，
/// db: 数据库链接池，
/// search: 前端传过来的搜索字符串，
/// 返回 {id, label} 对象数组的 json 数据
#[get("/tree_auto")]
pub async fn tree_auto(
    db: web::Data<Pool>,
    search: web::Query<Search>,
    id: Identity,
) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        let s = ("%".to_owned() + &search.s + "%").to_lowercase();
        let pinyin = search.s.to_lowercase() + "%";
        let rows = &conn
            .query(
                r#"SELECT num AS id, node_name AS label FROM tree WHERE not_use=false AND pinyin LIKE $2 OR LOWER(node_name) LIKE $1 LIMIT 10"#, //查询字段名称与结构名称对应
                &[&s, &pinyin],
            )
            .await
            .unwrap();

        let mut data: Vec<Message> = vec![];
        for row in rows {
            let message = Message {
                id: row.get("id"),
                label: row.get("label"),
            };

            data.push(message);
        }

        HttpResponse::Ok().json(data)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

#[derive(Deserialize, Serialize)]
pub struct TreeId {
    pub pnum: String,
    pub num: String,
}

#[post("/tree_drag")]
pub async fn tree_drag(
    db: web::Data<Pool>,
    tree_id: web::Json<TreeId>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "库存设置".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        let _ = &conn
            .execute(
                r#"UPDATE tree SET pnum = $2 WHERE num = $1"#,
                &[&tree_id.num, &tree_id.pnum],
            )
            .await
            .unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}
