use actix_files as fs;
use actix_identity::{CookieIdentityPolicy, IdentityService};
use actix_web::{web, App, HttpServer};
use postgres::NoTls;
use r2d2::Pool;
use r2d2_postgres::PostgresConnectionManager;
use rand::Rng;

mod home;
mod service;
mod user;
mod useraes;

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    let manager = PostgresConnectionManager::new(
        "postgres://postgres:sam197298@localhost:5432/stock"
            .parse()
            .unwrap(),
        NoTls,
    );

    let pool = Pool::new(manager).unwrap();
    let private_key = rand::thread_rng().gen::<[u8; 32]>();

    println!("服务已启动: 127.0.0.1:8083");

    HttpServer::new(move || {
        App::new()
            .data(pool.clone())
            .wrap(IdentityService::new(
                CookieIdentityPolicy::new(&private_key)
                    .name("auth-sales")
                    .secure(false),
            ))
            .service(home::index)
            .service(home::login)
            .service(web::resource("static/{name}").to(service::serve_static))
            .service(fs::Files::new("/assets", "assets"))
    })
    .bind("127.0.0.1:8083")?
    .run()
    .await
}
