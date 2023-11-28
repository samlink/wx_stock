use actix_files as fs;
use actix_identity::{CookieIdentityPolicy, IdentityService};
use actix_web::{App, HttpServer};
use config::ConfigError;
use dotenv::dotenv;
use serde::Deserialize;

mod business;
mod buyin;
mod material;
mod customer;
mod documentquery;
mod field_set;
mod html;
mod product;
mod report_design;
mod service;
mod statistic;
mod systemset;
mod tree;
mod user_manage;
mod user_set;

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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let port = dotenv::var("port").unwrap();

    let config = Config::from_env().unwrap();
    let pool = config.pg.create_pool(tokio_postgres::NoTls).unwrap();

    println!("服务已启动: 127.0.0.1:{}", port);

    HttpServer::new(move || {
        App::new()
            .data(pool.clone())
            .wrap(IdentityService::new(
                CookieIdentityPolicy::new(&[6; 32])
                    .name("auth-sales")
                    .max_age(2592000) //30天
                    .secure(false),
            ))
            .service(html::index)
            .service(html::login)
            .service(html::user_set)
            .service(html::user_manage)
            .service(html::product_set)
            .service(html::field_set)
            .service(html::customer_manage)
            .service(html::supplier_manage)
            .service(html::system_set)
            .service(html::help)
            .service(html::buy_in)
            .service(html::report_design)
            .service(html::sale)
            .service(html::saleback)
            .service(html::material_in)
            .service(html::material_out)
            .service(html::stock_change)
            .service(html::buy_query)
            .service(html::sale_query)
            .service(html::change_query)
            .service(html::stock_query)
            .service(html::business_query)
            .service(html::debt)
            .service(html::analys)
            .service(html::statistic)
            .service(html::cost)

            .service(buyin::fetch_inout_fields)
            .service(buyin::fetch_supplier)
            .service(buyin::fetch_inout_customer)
            .service(buyin::buyin_auto)
            .service(buyin::fetch_one_product)
            .service(buyin::save_document)
            .service(buyin::fetch_history)
            .service(buyin::fetch_document)
            .service(buyin::fetch_document_items_sales)
            .service(buyin::fetch_document_items)
            .service(buyin::make_formal)

            .service(material::material_auto)
            .service(material::get_items)
            
            .service(documentquery::fetch_used_fields)
            .service(documentquery::fetch_all_documents)
            .service(documentquery::update_rem)
            .service(documentquery::documents_del)
            .service(documentquery::fetch_limit)
            .service(documentquery::fetch_stay)
            
            .service(user_set::login)
            .service(user_set::logon)
            .service(user_set::logout)
            .service(user_set::forget_pass)
            .service(user_set::change_pass)
            .service(user_set::phone_number)
            .service(user_set::change_theme)
            
            .service(user_manage::pull_users)
            .service(user_manage::edit_user)
            .service(user_manage::del_user)

            .service(tree::tree)
            .service(tree::tree_add)
            .service(tree::tree_edit)
            .service(tree::tree_del)
            .service(tree::tree_auto)
            .service(tree::tree_drag)
            
            .service(product::fetch_product)
            .service(product::update_product)
            .service(product::add_product)
            .service(product::product_auto)

            .service(product::product_out)
            .service(product::product_in)
            .service(product::product_datain)
            .service(product::product_updatein)
            
            .service(field_set::fetch_fields)
            .service(field_set::fetch_fields2)
            .service(field_set::update_tableset)
            .service(field_set::update_tableset2)
            
            .service(customer::fetch_customer)
            .service(customer::update_customer)
            .service(customer::add_customer)
            .service(customer::customer_auto)
            .service(customer::customer_out)
            .service(customer::customer_in)
            .service(customer::supplier_in)
            .service(customer::customer_addin)
            .service(customer::customer_updatein)
            
            .service(business::fetch_business)
            .service(business::fetch_debt)
            
            .service(statistic::fetch_analys)
            .service(statistic::fetch_statis)
            .service(statistic::fetch_cost)
            .service(statistic::home_statis)
            
            .service(systemset::fetch_system)
            .service(systemset::update_system)
            
            .service(report_design::fetch_print_documents)
            .service(report_design::fetch_provider)
            .service(report_design::save_model)
            .service(report_design::fetch_models)
            .service(report_design::fetch_one_model)
            .service(report_design::fetch_provider_model)
            .service(report_design::del_model)
            
            .service(service::fetch_blank)
            .service(service::fetch_help)
            .service(service::serve_download)
            .service(service::start_date)
            // .service(web::resource("static/{name}").to(service::serve_static))
            .service(fs::Files::new("/assets", "assets"))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
