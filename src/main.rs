use actix_files as fs;
use actix_identity::{CookieIdentityPolicy, IdentityService};
use actix_web::{web, App, HttpServer};
use config::ConfigError;
// use deadpool_postgres::{Config, ManagerConfig, RecyclingMethod};
// use deadpool_postgres::{Client, Pool, PoolError};
use dotenv::dotenv;
use rand::Rng;
use serde::Deserialize;
// use tokio_postgres::NoTls;

mod html;
mod service;
mod user;
mod useraes;

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    // let mut cfg = Config::new();
    // cfg.host = Some("127.0.0.1".to_string());
    // cfg.user = Some("postgres".to_string());
    // cfg.password = Some("sam197298".to_owned());
    // cfg.dbname = Some("sales".to_string());
    // cfg.manager = Some(ManagerConfig {
    //     recycling_method: RecyclingMethod::Fast,
    // });
    // let pool = cfg.create_pool(NoTls).unwrap();

    #[derive(Deserialize)]
    struct Config {
        pg: deadpool_postgres::Config,
    }

    impl Config {
        fn from_env() -> Result<Self, ConfigError> {
            let mut cfg = ::config::Config::new();
            cfg.merge(::config::Environment::new().separator("__"))?;
            cfg.try_into()
        }
    }

    dotenv().ok();
    let config = Config::from_env().unwrap();
    let pool = config.pg.create_pool(tokio_postgres::NoTls).unwrap();

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
            .service(html::index)
            .service(html::login)
            .service(user::login)
            .service(user::logon)
            .service(web::resource("static/{name}").to(service::serve_static))
            .service(fs::Files::new("/assets", "assets"))
    })
    .bind("127.0.0.1:8083")?
    .run()
    .await
}
