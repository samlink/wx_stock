use crate::service::get_user;
use actix_identity::Identity;
use actix_web::{get, post, web, HttpResponse};
use async_recursion::async_recursion;
use deadpool_postgres::Pool;
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

#[post("/tree_add")]
pub async fn tree_add(db: web::Data<Pool>, data: web::Json<Num>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());

    if user_name != "" {
        let conn = db.get().await.unwrap();
        let mut num = "".to_owned();
        let mut pnum = data.pnum.clone();

        if pnum != "" {
            let rows = &conn
                .query(
                    r#"SELECT num FROM tree WHERE pnum = $1 ORDER BY num DESC limit 1"#,
                    &[&data.pnum],
                )
                .await
                .unwrap();

            if !rows.is_empty() {
                for row in rows {
                    num = row.get(0);
                }
                let str1 = &num[0..num.len() - 3];
                let str2 = &num[num.len() - 3..];
                num = str1.to_owned() + &(str2.parse::<i32>().unwrap() + 1).to_string();
            } else {
                num = data.pnum.clone() + "_101";
            }
        } else {
            let rows = &conn
                .query(
                    r##"SELECT num FROM tree WHERE pnum='#' ORDER BY num DESC limit 1"##,
                    &[],
                )
                .await
                .unwrap();

            if !rows.is_empty() {
                for row in rows {
                    num = row.get(0);
                }
                num = (num.parse::<i32>().unwrap() + 1).to_string();
            } else {
                num = "1".to_string();
            }
            pnum = "#".to_string();
        };

        &conn
            .execute(
                r#"INSERT INTO tree (node_name, num, pnum) VALUES ($1,$2,$3)"#,
                &[&data.node_name, &num, &pnum],
            )
            .await
            .unwrap();

        HttpResponse::Ok().json(num)
    } else {
        HttpResponse::Ok().json(0)
    }
}

#[post("/tree_edit")]
pub async fn tree_edit(db: web::Data<Pool>, data: web::Json<Num>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();

        &conn
            .execute(
                r#"UPDATE tree SET node_name=$1 WHERE num=$2"#,
                &[&data.node_name, &data.pnum],
            )
            .await
            .unwrap();

        // &conn
        //     .execute(
        //         r#"UPDATE content SET title=$1 WHERE num=$2"#,
        //         &[&data.node_name, &data.pnum],
        //     )
        //     .await
        //     .unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(0)
    }
}

#[post("/tree_del")]
pub async fn tree_del(db: web::Data<Pool>, data: web::Json<Num>, id: Identity) -> HttpResponse {
    let user_name = id.identity().unwrap_or("".to_owned());
    if user_name != "" {
        let conn = db.get().await.unwrap();
        &conn
            .execute(r#"DELETE FROM tree WHERE num=$1"#, &[&data.pnum])
            .await
            .unwrap();
        // &conn.execute(r#"DELETE FROM content WHERE num=$2"#, &[&data.pnum]);
        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(0)
    }
}

#[async_recursion]
async fn get_tree(db: web::Data<Pool>, num: String) -> Vec<TreeNode> {
    let conn = db.get().await.unwrap();
    let mut tree_get = Vec::new();

    let rows = &conn
        .query(
            r##"SELECT node_name, num, pnum FROM tree WHERE pnum=$1 ORDER BY node_name"##, //查询字段名称与结构名称对应
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
