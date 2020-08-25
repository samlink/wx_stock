use actix_files as fs;
use actix_identity::{CookieIdentityPolicy, IdentityService};
use actix_web::{web, App, HttpServer};
use tokio_postgres::NoTls;

// use r2d2::Pool;
// use r2d2_postgres::{PostgresConnectionManager, TlsMode};
// use r2d2_postgres::PostgresConnectionManager;
use deadpool_postgres::{Config, Manager, ManagerConfig, Pool, RecyclingMethod};
use rand::Rng;

mod home;
mod service;
mod user;
mod useraes;

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    // let manager = PostgresConnectionManager::new(
    //     "postgres://postgres:sam197298@localhost:5432/stock"
    //         .parse()
    //         .unwrap(),
    //     NoTls,
    // );

    // let manager = PostgresConnectionManager::new(
    //     "postgres://postgres:sam197298@localhost:5432/stock",
    //     TlsMode::None,
    // )
    // .unwrap();

    // let pool = Pool::new(manager).unwrap();

    // let mut cfg = tokio_postgres::Config::new();
    // cfg.host("127.0.0.1");
    // cfg.user("postgres");
    // cfg.password("sam197298");
    // cfg.dbname("stock");
    // let mgr = Manager::new(cfg, tokio_postgres::NoTls);
    // let pool = Pool::new(mgr, 6);

    let mut cfg = Config::new();
    cfg.host = Some("127.0.0.1".to_string());
    cfg.user = Some("postgres".to_string());
    cfg.password = Some("sam197298".to_owned());
    cfg.dbname = Some("stock".to_string());
    cfg.manager = Some(ManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    });
    let pool = cfg.create_pool(NoTls).unwrap();

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
            .service(user::login)
            .service(user::logon)
            .service(web::resource("static/{name}").to(service::serve_static))
            .service(fs::Files::new("/assets", "assets"))
    })
    .bind("127.0.0.1:8083")?
    .run()
    .await
}
