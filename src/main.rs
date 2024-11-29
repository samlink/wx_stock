use actix_files as fs;
use actix_identity::{CookieIdentityPolicy, IdentityService};
use actix_web::{cookie::time::Duration, web, web::Data, App, HttpServer};
use deadpool_postgres::Runtime;
use dotenv::dotenv;
use serde::Deserialize;

mod html;
mod product;
mod service;
mod tree;
mod user_set;

#[derive(Deserialize)]
struct Config {
    pg: deadpool_postgres::Config,
}

impl Config {
    pub fn from_env() -> Result<Self, config::ConfigError> {
        let cfg = config::Config::builder()
            .add_source(config::Environment::default().separator("__"))
            .build()?;
        cfg.try_deserialize()
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let port = dotenv::var("port").unwrap();
    let config = Config::from_env().unwrap();
    let pool = config
        .pg
        .create_pool(Some(Runtime::Tokio1), tokio_postgres::NoTls)
        .unwrap();

    println!("服务已启动: 127.0.0.1:{}", port);

    HttpServer::new(move || {
        App::new()
            .app_data(Data::new(pool.clone()))
            .wrap(IdentityService::new(
                CookieIdentityPolicy::new(&[6; 32])
                    .name("auth-guest")
                    .max_age(Duration::days(30)) //30天
                    .secure(false),
            ))
            .service(html::home)
            .service(html::login)
            .service(html::user_set)
            .service(tree::tree)
            .service(tree::tree_auto)
            .service(product::product_auto)
            .service(product::fetch_product)
            .service(product::fetch_statistic)
            .service(product::product_auto)
            .service(product::fetch_lu)
            .service(product::fetch_filter_items)
            .service(user_set::login)
            .service(user_set::logon)
            .service(user_set::logout)
            .service(user_set::forget_pass)
            .service(user_set::change_pass)
            .service(user_set::phone_number)
            .service(web::resource("static/{name}").to(html::static_file))
            .service(fs::Files::new("/assets", "assets"))
            .service(fs::Files::new("/upload", "../sales/upload"))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
