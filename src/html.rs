use crate::service::{get_fraction, get_user, r2s};
use actix_identity::Identity;
use actix_web::{get, web, HttpRequest, HttpResponse};
use deadpool_postgres::Pool;
use dotenv::dotenv;

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

///主页
#[get("/")]
pub async fn index(_req: HttpRequest, db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| help_say_html(o, user.name));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///登录
#[get("/login")]
pub fn login(_req: HttpRequest) -> HttpResponse {
    dotenv().ok();
    let comany = dotenv::var("company").unwrap();
    let html = r2s(|o| login_html(o, comany));
    HttpResponse::Ok().content_type("text/html").body(html)
}

///用户自己设置
#[get("/user_set")]
pub async fn user_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| userset(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///用户管理
#[get("/user_manage")]
pub async fn user_manage(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "用户设置".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| usermanage(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///商品设置
#[get("/product_set")]
pub async fn product_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "商品设置".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| productset(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///系统设置
#[get("/field_set")]
pub async fn field_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "字段设置".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| fieldset(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///客户管理
#[get("/customer_manage")]
pub async fn customer_manage(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "客户管理".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| customer(o, user, "客户"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///供应商管理
#[get("/supplier_manage")]
pub async fn supplier_manage(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "供应商管理".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| customer(o, user, "供应商"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///仓库设置
#[get("/warehouse_set")]
pub async fn warehouse_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "仓库设置".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| warehouse(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///系统参数
#[get("/system_set")]
pub async fn system_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "系统参数".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| systemset(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///帮助信息
#[get("/help")]
pub async fn help(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "".to_owned()).await;

    if user.name != "" {
        let html = r2s(|o| help_say_html(o, user.name));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///商品采购
#[get("/buy_in/{dh}")]
pub async fn buy_in(db: web::Data<Pool>, dh_num: web::Path<String>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品采购".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        let num_position = get_fraction(db).await;
        let setup = vec!["商品采购", "供应商", "近期采购", dh];
        let options = vec!["采购入库", "退货出库"];
        let html = r2s(|o| buyin(o, user, num_position, setup, options));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///商品销售
#[get("/sale/{dh}")]
pub async fn sale(db: web::Data<Pool>, dh_num: web::Path<String>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "商品销售".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        let num_position = get_fraction(db).await;
        let setup = vec!["商品销售", "客户", "近期销售", dh];
        let options = vec!["商品销售", "销售退货"];
        let html = r2s(|o| buyin(o, user, num_position, setup, options));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///库存调整
#[get("/stock_change/{dh}")]
pub async fn stock_change(
    db: web::Data<Pool>,
    dh_num: web::Path<String>,
    id: Identity,
) -> HttpResponse {
    let user = get_user(db.clone(), id, "库存调整".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        let num_position = get_fraction(db).await;
        let setup = vec!["库存调整", "供应商", "近期调整", dh];
        let options = vec!["库存调整"];
        let html = r2s(|o| buyin(o, user, num_position, setup, options));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

///报表设计
#[get("/report_design")]
pub async fn report_design(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "报表设计".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| reportdesign(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

#[get("/buy_query")]
pub async fn buy_query(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "采购查询".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| query(o, user, "采购查询"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

#[get("/sale_query")]
pub async fn sale_query(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "销售查询".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| query(o, user, "销售查询"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

#[get("/change_query")]
pub async fn change_query(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "调整查询".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| query(o, user, "调整查询"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

#[get("/stock_query")]
pub async fn stock_query(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "库存检查".to_owned()).await;
    if user.name != "" {
        let html = r2s(|o| stockquery(o, user, "库存检查"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}

#[get("/business_query")]
pub async fn business_query(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db.clone(), id, "业务往来".to_owned()).await;
    let num_position = get_fraction(db).await;

    if user.name != "" {
        let html = r2s(|o| businessquery(o, user,num_position));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        HttpResponse::Found().header("location", "/login").finish()
    }
}
