use actix_identity::Identity;
use actix_web::{get, web, HttpResponse};
use async_recursion::async_recursion;
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
struct TreeNode {
    node_name: String,
    num: String,
    show: bool,
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

#[async_recursion]
async fn get_tree(db: web::Data<Pool>, num: String) -> Vec<TreeNode> {
    let conn = db.get().await.unwrap();
    let mut tree_get = Vec::new();

    let rows = &conn
        .query(
            r##"SELECT node_name, num, pnum, show FROM tree 
            WHERE pnum=$1 AND show=true AND not_use=false 
            order by orders"##, 
            &[&num],
        )
        .await
        .unwrap();

    if !rows.is_empty() {
        for row in rows {
            let node = TreeNode {
                node_name: row.get(0),
                num: row.get(1),
                show: row.get(3),
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

