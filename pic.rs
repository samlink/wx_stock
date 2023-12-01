use actix_files as fs;
use actix_identity::Identity;
use actix_multipart::Multipart;
use actix_web::Either;
use actix_web::{get, post, web, Error, HttpRequest, HttpResponse};
use deadpool_postgres::Pool;
use dotenv::dotenv;
use futures::{StreamExt, TryStreamExt};
use image::imageops::FilterType;
use serde::{Deserialize, Serialize};
// use std::fs::File;
use image::GenericImageView;
use std::io::{self, Write};

//image = "0.23.14"


///编辑名称
#[post("/edit_name")]
pub async fn edit_name(
    db: web::Data<Pool>,
    mut post_data: web::Json<NameData>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "钱币编辑".to_owned()).await;
    if user.name != "" {
        let conn = db.get().await.unwrap();
        if post_data.cate == "add" {
            post_data.id = format!("{}", Uuid::new_v4());
        }
        if post_data.pic == "/upload/coins/coin.jpg" {
            post_data.pic = format!("/upload/coins/coin_{}.jpg", post_data.id);
            fs::rename("./upload/coins/coin.jpg", format!(".{}", post_data.pic)).unwrap();
            fs::rename(
                "./upload/coins/min.jpg",
                format!("./upload/coins/min_{}.jpg", post_data.id),
            )
                .unwrap();
        }

        if post_data.cate == "add" {
            let _rows = &conn
                .execute(
                    r#"INSERT INTO names (id, tree_id, 版别, 说明, 图片, 珍品, 热门, 顺序, 图片来源, 来源链接) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)"#,
                    &[
                        &post_data.id,
                        &post_data.pid,
                        &post_data.edition,
                        &post_data.note,
                        &post_data.pic,
                        &post_data.best,
                        &post_data.hot,
                        &post_data.order,
                        &post_data.from,
                        &post_data.link,
                    ],
                )
                .await
                .unwrap();
        } else {
            let sql = format!(
                r#"UPDATE names SET 版别='{}', 说明='{}', 图片='{}', 珍品={}, 热门={}, 顺序='{}', 图片来源='{}', 来源链接='{}' WHERE id='{}'"#,
                post_data.edition,
                post_data.note,
                post_data.pic,
                post_data.best,
                post_data.hot,
                post_data.order,
                post_data.from,
                post_data.link,
                post_data.id
            );
            let _rows = &conn.execute(sql.as_str(), &[]).await.unwrap();
        }

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

///删除图片
#[post("/del_pic")]
pub async fn del_pic(
    db: web::Data<Pool>,
    post_data: web::Json<PicDel>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, post_data.rights.clone()).await;
    if user.name != "" {
        let pic1 = format!(".{}", post_data.img);
        let mut pic2 = pic1.replace("min", &post_data.cate);

        let mut db_name = "names";
        if post_data.cate == "price" {
            db_name = "price";
        }

        // println!("{}", pic2);

        fs::remove_file(pic1).unwrap_or(());
        fs::remove_file(pic2.clone()).unwrap_or(());

        let conn = db.get().await.unwrap();
        pic2.remove(0);
        let sql = format!(r#"update {} set 图片='' where 图片 = '{}'"#, db_name, pic2);
        let _rows = &conn.execute(sql.as_str(), &[]).await.unwrap();

        HttpResponse::Ok().json(1)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//上传图片
#[post("/pic_in")]
pub async fn pic_in(db: web::Data<Pool>, payload: Multipart, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "钱币编辑".to_owned()).await;
    if user.name != "" {
        let path = "./upload/coins/coin.jpg".to_owned();
        let path2 = "./upload/coins/".to_owned();
        save_file(payload, path.clone()).await.unwrap();
        let path3 = smaller(path.clone(), path2);
        HttpResponse::Ok().json(path3)
    } else {
        HttpResponse::Ok().json(-1)
    }
}

//上传文件保存
pub async fn save_file(mut payload: Multipart, path: String) -> Result<String, Error> {
    while let Ok(Some(mut field)) = payload.try_next().await {
        let filepath = path.clone();
        let mut f = web::block(|| std::fs::File::create(filepath))
            .await
            .unwrap();

        while let Some(chunk) = field.next().await {
            let data = chunk.unwrap();
            f = web::block(move || f.write_all(&data).map(|_| f)).await?;
        }
    }
    Ok(path)
}

//缩小图片
pub fn smaller(path: String, path2: String) -> String {
    let img = image::open(path).unwrap();
    let (width, height) = img.dimensions();
    let r = if height < width { 200 } else { 800 };
    let scaled = img.resize(400, r, FilterType::Lanczos3);
    let path3 = format!("{}min.jpg", path2);
    scaled.save(path3.clone()).unwrap();
    path3
}