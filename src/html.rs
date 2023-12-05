use crate::service::{get_user, r2s, UserData};
use actix_identity::Identity;
use actix_web::{get, web, HttpRequest, HttpResponse};
use deadpool_postgres::Pool;
use dotenv::dotenv;

include!(concat!(env!("OUT_DIR"), "/templates.rs")); //templates.rs 是通过 build.rs 自动生成的文件, 该文件包含了静态文件对象和所有模板函数
use templates::*; // Ctrl + 鼠标左键 查看 templates.rs, 这是自动生成的, 无需修改

fn goto_login() -> HttpResponse {
    HttpResponse::Found()
        .header("location", format!("/{}", "login"))
        .finish()
}

fn name_show(user: &UserData) -> String {
    if user.duty != "总经理" {
        format!("｜{}区 {}｜ 　{}", user.area, user.duty, user.name)
    } else {
        format!("{} 　{}", user.duty, user.name)
    }
}

///主页
#[get("/")]
pub async fn index(_req: HttpRequest, db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "".to_owned()).await;
    if user.name != "" {
        let name = name_show(&user);
        let html = r2s(|o| home(o, name, format!("{}.css", user.theme)));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
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
    let mut user = get_user(db, id, "".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| userset(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///用户管理
#[get("/user_manage")]
pub async fn user_manage(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db, id, "用户设置".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| usermanage(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///商品设置
#[get("/product_set")]
pub async fn product_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db, id, "库存状态".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| productset(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///系统设置
#[get("/field_set")]
pub async fn field_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db, id, "".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| fieldset(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///客户管理
#[get("/customer_manage")]
pub async fn customer_manage(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db, id, "客户管理".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| customer(o, user, "客户"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///供应商管理
#[get("/supplier_manage")]
pub async fn supplier_manage(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db, id, "供应商管理".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| customer(o, user, "供应商"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

// ///系统参数
// #[get("/system_set")]
// pub async fn system_set(db: web::Data<Pool>, id: Identity) -> HttpResponse {
//     let mut user = get_user(db, id, "系统参数".to_owned()).await;
//     if user.name != "" {
//         user.show = name_show(&user);
//         let html = r2s(|o| systemset(o, user));
//         HttpResponse::Ok().content_type("text/html").body(html)
//     } else {
//         goto_login()
//     }
// }

///帮助信息
#[get("/help")]
pub async fn help(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let user = get_user(db, id, "".to_owned()).await;
    if user.name != "" {
        let name = name_show(&user);
        let html = r2s(|o| help_say_html(o, name, user.theme));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///材料采购
#[get("/buy_in/{dh}")]
pub async fn buy_in(db: web::Data<Pool>, dh_num: web::Path<String>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "材料采购".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        let setup = vec!["材料采购", "供应商", "入库单号", dh, "customer"];    // customer 表示有客户(供应商)自动完成

        user.show = name_show(&user);
        let html = r2s(|o| buyin(o, user, setup));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///商品销售
#[get("/sale/{dh}")]
pub async fn sale(db: web::Data<Pool>, dh_num: web::Path<String>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "商品销售".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        
        let setup = vec!["商品销售", "客户", "出库及发货单号", dh, "customer"];
        user.show = name_show(&user);
        let html = r2s(|o| buyin(o, user, setup));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///销售退货
#[get("/saleback/{dh}")]
pub async fn saleback(db: web::Data<Pool>, dh_num: web::Path<String>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "商品销售".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        let setup = vec!["销售退货", "客户", "入库单号", dh, "customer"];
        user.show = name_show(&user);
        let html = r2s(|o| buyin(o, user, setup));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///库存调整
#[get("/stock_change_in/{dh}")]
pub async fn stock_change_in(
    db: web::Data<Pool>,
    dh_num: web::Path<String>,
    id: Identity,
) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "调整库存".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        let setup = vec!["调整入库", "供应商", "近期调整", dh];
        user.show = name_show(&user);
        let html = r2s(|o| stockin(o, user, setup));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

#[get("/stock_change_out/{dh}")]
pub async fn stock_change_out(
    db: web::Data<Pool>,
    dh_num: web::Path<String>,
    id: Identity,
) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "调整库存".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        let setup = vec!["调整出库", "供应商", "近期调整", dh];
        user.show = name_show(&user);
        let html = r2s(|o| stockout(o, user, setup));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

/// 采购入库
#[get("/material_in/{dh}")]
pub async fn material_in(db: web::Data<Pool>, dh_num: web::Path<String>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "采购入库".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        let setup = vec!["采购入库", "客户", "采购条目", dh, "no_customer"];
        user.show = name_show(&user);
        let html = r2s(|o| material(o, user, setup));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

// 销售出库
#[get("/material_out/{dh}")]
pub async fn material_out(db: web::Data<Pool>, dh_num: web::Path<String>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "销售出库".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        let setup = vec!["销售出库", "客户", "销售条目", dh, "no_customer"];
        user.show = name_show(&user);
        let html = r2s(|o| materialout(o, user, setup));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

// 运输发货
#[get("/transport/{dh}")]
pub async fn transport(db: web::Data<Pool>, dh_num: web::Path<String>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "商品销售".to_owned()).await;
    if user.name != "" {
        let dh = if *dh_num == "new" {
            "新单据"
        } else {
            &*dh_num
        };
        let setup = vec!["运输发货", "客户", "销售条目", dh, "no_customer"];
        user.show = name_show(&user);
        let html = r2s(|o| saletrans(o, user, setup));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

///报表设计
#[get("/report_design")]
pub async fn report_design(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| reportdesign(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

#[get("/buy_query")]
pub async fn buy_query(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "采购查询".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| query(o, user, "采购销售", "采购查询", "document_items"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

#[get("/sale_query")]
pub async fn sale_query(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "销售查询".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| query(o, user, "采购销售", "销售查询", "document_items"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}
#[get("/trans_query")]
pub async fn trans_query(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "销售查询".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| query(o, user, "采购销售", "发货查询", "document_items"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

#[get("/change_query_in")]
pub async fn change_query_in(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "出入库查询".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| query(o, user, "仓储管理", "入库查询", "products"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

#[get("/change_query_out")]
pub async fn change_query_out(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "出入库查询".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| query(o, user, "仓储管理", "出库查询", "pout_items"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

#[get("/stock_query_in")]
pub async fn stock_query_in(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "调库查询".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| query(o, user, "仓储管理", "调入查询", "products"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

#[get("/stock_query_out")]
pub async fn stock_query_out(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "调库查询".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| query(o, user, "仓储管理", "调出查询", "pout_items"));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

#[get("/business_query")]
pub async fn business_query(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "业务往来".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| businessquery(o, user));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}

#[get("/stockin_items")]
pub async fn stockin_items(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "入库明细".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| stockinitems(o, user,));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}
#[get("/stockout_items")]
pub async fn stockout_items(db: web::Data<Pool>, id: Identity) -> HttpResponse {
    let mut user = get_user(db.clone(), id, "出库明细".to_owned()).await;
    if user.name != "" {
        user.show = name_show(&user);
        let html = r2s(|o| stockoutitems(o, user,));
        HttpResponse::Ok().content_type("text/html").body(html)
    } else {
        goto_login()
    }
}
