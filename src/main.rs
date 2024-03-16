use actix_files as fs;
use actix_identity::{CookieIdentityPolicy, IdentityService};
use actix_web::{cookie::time::Duration, web, web::Data, App, HttpServer};
use deadpool_postgres::Runtime;
use dotenv::dotenv;
use serde::Deserialize;

mod buyin;
mod customer;
mod documentquery;
mod field_set;
mod html;
mod material;
mod product;
mod service;
mod statistic;
mod tree;
mod user_manage;
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
                    .name("auth-sales")
                    .max_age(Duration::days(30)) //30天
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
            .service(html::help)
            .service(html::buy_in)
            .service(html::buy_back)
            .service(html::sale)
            .service(html::saleback)
            .service(html::kp)
            .service(html::transport)
            .service(html::material_in)
            .service(html::material_out)
            .service(html::stock_change_in)
            .service(html::stock_change_out)
            .service(html::buy_query)
            .service(html::sale_query)
            .service(html::trans_query)
            .service(html::kp_query)
            .service(html::change_query_in)
            .service(html::change_query_out)
            .service(html::stock_query_in)
            .service(html::stock_query_out)
            .service(html::business_query)
            .service(html::other_query)
            .service(html::stockin_items)
            .service(html::stockout_items)
            
            .service(buyin::fetch_inout_fields)
            .service(buyin::fetch_supplier)
            .service(buyin::fetch_inout_customer)
            .service(buyin::buyin_auto)
            .service(buyin::get_status_auto)
            .service(buyin::get_factory_auto)
            .service(buyin::fetch_one_product)
            .service(buyin::save_document)
            .service(buyin::save_stransport)
            .service(buyin::save_document_kp)
            .service(buyin::fetch_fh_items)
            .service(buyin::make_xs_kp)
            .service(buyin::fetch_document)
            .service(buyin::fetch_document_fh)
            .service(buyin::get_sale_dh)
            .service(buyin::fetch_document_items_sales)
            .service(buyin::fetch_document_items)
            .service(buyin::fetch_trans_items)
            .service(buyin::get_truck_auto)
            .service(buyin::get_truck2_auto)
            .service(buyin::fetch_kp_items)
            .service(buyin::get_items_trans)
            .service(buyin::get_sale_out)
            .service(buyin::fetch_other_documents)
            .service(buyin::fetch_sale_docs)
            .service(buyin::save_sale_money)
            .service(buyin::make_sumit_shen)
            .service(buyin::make_formal)
            .service(buyin::anti_formal)
            .service(buyin::check_ku)
            .service(buyin::check_ku2)

            .service(material::material_auto)
            .service(material::materialout_auto)
            .service(material::material_auto_out)
            .service(material::material_auto_sotckout)
            .service(material::material_auto_kt)
            .service(material::fetch_document_ck)
            .service(material::get_docs_out)
            .service(material::get_items)
            .service(material::get_items_out)
            .service(material::fetch_max_num)
            .service(material::get_trans_info)
            .service(material::save_material)
            .service(material::save_material_ck)
            .service(material::make_ck_complete)
            .service(material::make_fh_complete)
            .service(material::make_xs_wight)
            .service(material::fetch_document_rkd)
            .service(material::fetch_document_items_rk)
            .service(material::fetch_document_items_tr)
            .service(material::fetch_document_items_ck)
            .service(material::materialout_docs)
            .service(material::materialout_saved_docs)
            .service(material::materialin_docs)
            .service(material::materialsale_docs)
            .service(material::handle_not_pass)
            .service(material::pic_in)
            .service(material::pic_in_save)
            .service(material::pic_kp_save)
            .service(material::pic_fh_save)
            .service(material::pdf_in)
            .service(material::pdf_in_save)

            .service(documentquery::fetch_show_fields)
            .service(documentquery::fetch_all_documents)
            .service(documentquery::fetch_a_documents)
            .service(documentquery::documents_del)

            .service(user_set::login)
            .service(user_set::logon)
            .service(user_set::logout)
            .service(user_set::forget_pass)
            .service(user_set::change_pass)
            .service(user_set::phone_number)

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
            .service(product::fetch_pout_items)
            .service(product::fetch_lu)
            .service(product::product_out)
            .service(product::product_in)
            .service(product::product_datain)
            .service(product::product_updatein)
            .service(product::fetch_filter_items)


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

            .service(statistic::get_stockin_items)
            .service(statistic::get_stockout_items)
            .service(statistic::stockin_excel)
            .service(statistic::stockout_excel)
            .service(statistic::business_excel)
            .service(statistic::fetch_business)
            .service(statistic::fetch_statis)
            .service(statistic::fetch_cost)
            .service(statistic::home_statis)
            
            .service(service::fetch_blank)
            .service(service::fetch_help)
            .service(service::serve_download)
            .service(service::start_date)
            
            .service(web::resource("static/{name}").to(html::static_file))
            .service(fs::Files::new("/assets", "assets"))
            .service(fs::Files::new("/upload", "upload"))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
