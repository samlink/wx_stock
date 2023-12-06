import {notifier} from '../parts/notifier.mjs';
import {alert_confirm} from '../parts/alert.mjs';
import * as service from '../parts/service.mjs'
import {SPLITER, regInt, regReal, regDate, moneyUppercase} from '../parts/tools.mjs';
import {customer_init, out_data} from '../parts/customer.mjs';
import {
    appand_edit_row, build_blank_table, build_items_table, input_table_outdata
} from '../parts/edit_table.mjs';
import {edit_button_disabled} from "../parts/service.mjs";

let document_table_fields, table_lines, show_names, edited;
let document_bz = document.querySelector('#document-bz').textContent.trim();
let dh_div = document.querySelector('#dh');

//单据顶部信息构造显示，并添加事件处理 -----------------------------------------------------------

let document_name, edit_data;
if (document_bz.indexOf("销售") != -1) {
    document_name = "销售单据";
} else if (document_bz.indexOf("采购") != -1) {
    document_name = "采购单据";
}

//获取单据表头部分的字段（字段设置中的右表内容）
fetch(`/fetch_inout_fields`, {
    method: 'post',
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(document_name),
})
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            document_table_fields = content;
            if (dh_div.textContent != "新单据") {
                // 获取本单据内容
                fetch(`/fetch_document`, {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cate: document_name,
                        dh: dh_div.textContent,
                    }),
                })
                    .then(response => response.json())
                    .then(data => {
                        let html = service.build_inout_form(document_table_fields, data);
                        document_top_handle(html, true);
                        let values = data.split(SPLITER);
                        let len = values.length;
                        let customer = document.querySelector('#supplier-input');
                        customer.value = values[len - 3];
                        customer.setAttribute('data', values[len - 4]);
                        document.querySelector('#owner').textContent = `[ ${values[len - 1]} ]`;

                        let rem = document.querySelector('#remember-button');
                        if (values[len - 2] != "") {
                            rem.textContent = "已审核";
                            rem.classList.add('remembered');
                            set_readonly();
                        } else {
                            rem.textContent = "审核";
                            rem.classList.remove('remembered');
                        }
                    });

                //获取相关单据信息
                fetch(`/fetch_other_documents`, {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(dh_div.textContent),
                })
                    .then(response => response.json())
                    .then(data => {
                            let tr = "";
                            data.forEach(obj => {
                                let material = obj.split(`${SPLITER}`);
                                tr += `<tr><td>${material[0]}</td><td>${material[1]}</td><td>${material[2]}</td></tr>`;
                            });

                            document.querySelector(".table-history tbody").innerHTML = tr;
                            let trs = document.querySelectorAll(".table-history tbody tr");
                            for (let tr of trs) {
                                tr.addEventListener('click', function () {
                                    let url;
                                    let cate = tr.querySelector('td:nth-child(1)').textContent;
                                    if (cate.indexOf("出库") != -1) {
                                        url = "/material_out/";
                                    } else if (cate.indexOf("发货") != -1) {
                                        url = "/transport/";
                                    } else {
                                        url = "/material_in/";
                                    }
                                    window.location = url + tr.querySelector('td:nth-child(2)').textContent;
                                })
                            }
                        }
                    );
            } else {
                let html = service.build_inout_form(content);
                document_top_handle(html, false);
                document.querySelector('#remember-button').textContent = '审核'
            }
        }
    });

function document_top_handle(html, has_date) {
    if (document.querySelector('.has-auto')) {
        document.querySelector('.has-auto').insertAdjacentHTML('afterend', html);

        let fields_show = document.querySelector('.fields-show');
        let has_auto = document.querySelector('.has-auto');
        let next_auto = document.querySelector('.has-auto+div');

        //加入滚动事件处理
        fields_show.addEventListener('scroll', function () {
            if (fields_show.scrollTop != 0) {
                has_auto.style.cssText = "position: relative; left: 5px;";
                next_auto.style.cssText = "margin-left: -3px;"
            } else {
                has_auto.style.cssText = "";
                next_auto.style.cssText = "";
            }
        });
    } else {
        document.querySelector('.fields-show').innerHTML = html;
    }

    let date = document.querySelector('#日期');
    if (!has_date) {
        date.value = new Date().Format("yyyy-MM-dd");
    }

    //执行一个laydate实例
    laydate.render({
        elem: date,
        showBottom: false,
        // theme: 'molv',
        // theme: '#62468d',
    });

    if (document.querySelector('#文本字段2')) {
        let da = document.querySelector('#文本字段2');
        laydate.render({
            elem: da,
            showBottom: false,
        })
    }

    if (document.querySelector('#文本字段3')) {
        let da = document.querySelector('#文本字段3');
        laydate.render({
            elem: da,
            showBottom: false,
        })
    }
}

if (document.querySelector('#supplier-input')) {
    customer_init();
}

//构建商品规格表字段，字段设置中的右表数据 --------------------------
fetch(`/fetch_inout_fields`, {
    method: 'post',
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify("商品规格"),
})
    .then(response => response.json())
    .then(content => {
        show_names = [
            {name: "序号", width: 40, class: "序号", type: "普通输入", editable: false, is_save: false, default: 1},
            {
                name: "名称",
                width: 80,
                class: "名称",
                type: "autocomplete",
                editable: true,
                is_save: true,
                save: "id",      //对于 autocomplete 可选择保存 id 或是 value
                default: ""
            },
            {name: "材质", width: 100, class: "材质", type: "普通输入", editable: false, is_save: false, default: ""},
        ];

        for (let item of content) {
            show_names.push({
                name: item.show_name, width: item.show_width * 18, type: item.ctr_type,
                class: item.show_name, editable: true, is_save: true, default: item.option_value
            });
        }

        if (document_name == "销售单据") {
            show_names.push({
                name: "单价", width: 50, class: "price", type: "普通输入", editable: true, is_save: true, default: ""
            });
            show_names.push({
                name: "长度", width: 60, class: "long", type: "普通输入", editable: true, is_save: true, default: ""
            });
            show_names.push({
                name: "数量", width: 50, class: "num", type: "普通输入", editable: true, is_save: true, default: ""
            });
            show_names.push({
                name: "理论重量",
                width: 60,
                class: "mount",
                type: "普通输入",
                editable: true,
                is_save: true,
                default: ""
            });
            show_names.push({
                name: "实际重量",
                width: 60,
                class: "weight",
                type: "普通输入",
                editable: true,
                is_save: true,
                default: ""
            });
        } else if (document_name == "采购单据") {
            show_names.push({
                name: "单价", width: 60, class: "price", type: "普通输入", editable: true, is_save: true, default: ""
            });
            show_names.push({
                name: "重量", width: 60, class: "mount", type: "普通输入", editable: true, is_save: true, default: ""
            });
        }

        show_names.push({
            name: "金额", width: 80, class: "money", type: "普通输入", editable: false, is_save: false, default: ""
        });
        show_names.push({
            name: "备注",
            width: 100,
            class: "note",
            type: "普通输入",
            editable: true,
            is_save: true,
            default: "",
            css: 'style="border-right:none"'
        });
        show_names.push({
            name: "",
            width: 0,
            class: "m_id",
            type: "普通输入",
            editable: false,
            is_save: true,
            css: 'style="width:0%; border-left:none; color:white"',
        });

        // 设置"状态"为自动输入
        show_names.forEach(item => {
            if (item.name == "状态") {
                item.type = "autocomplete";
                item.no_button = true;           //无需 modal 选择按钮
                item.save = "value";             //保存值, 而非 id
                return;
            }
        });

        //计算表格行数，33 为 lineHeight （行高）
        table_lines = Math.floor((document.querySelector('body').clientHeight - 365) / 33);
        //构造商品规格自动完成
        let gg_n = document_name == "销售单据" ? 4 : 3;

        let show_th = [
            {name: "名称", width: 60},
            {name: "材质", width: 80},
            {name: "规格", width: 80},
            {name: "状态", width: 100},
            {name: "售价", width: 60},
            {name: "库存长度", width: 80},
            {name: "库存重量", width: 80},
        ];

        let auto_data = [{
            n: 2,                       //第2个单元格是自动输入
            cate: document_name,
            auto_url: `/buyin_auto`,
            show_th: show_th,
            type: "table",
            cb: fill_gg,
        }, {
            n: 5,
            cate: "状态",
            auto_url: '/get_status_auto',
            type: "simple",
        }];

        if (dh_div.textContent == "新单据") {
            edit_data = {
                show_names: show_names,
                lines: table_lines,
                auto_data: auto_data,
                dh: dh_div.textContent,
                calc_func: calculate,
                del_func: sum_money,
            }

            build_blank_table(edit_data);
            appand_edit_row();
        } else {
            let url = document_name == "销售单据" ? "/fetch_document_items_sales" : "/fetch_document_items";
            fetch(url, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cate: document_name,
                    dh: dh_div.textContent,
                }),
            })
                .then(response => response.json())
                .then(content => {
                    edit_data = {
                        show_names: show_names,
                        rows: content,
                        auto_data: auto_data,
                        lines: table_lines,
                        dh: dh_div.textContent,
                        document: document_name,
                        calc_func: calculate,
                        del_func: sum_money,
                    }

                    build_items_table(edit_data);
                    appand_edit_row();
                });
        }
    });

function calculate(input_row) {
    if (input_row.querySelector('.price')) {
        input_row.querySelector('.price').addEventListener('blur', function () {
            calc_money(input_row);
            sum_money();
        });

        input_row.querySelector('.mount').addEventListener('blur', function () {
            calc_money(input_row);
            sum_money();
        });
    }

    if (input_row.querySelector('.long')) {
        input_row.querySelector('.long').addEventListener('blur', function () {
            calc_weight(input_row);
            calc_money(input_row);
            sum_money();
        });

        input_row.querySelector('.num').addEventListener('blur', function () {
            calc_weight(input_row);
            calc_money(input_row);
            sum_money();
        });
    }
}

//计算行金额
function calc_money(input_row) {
    let price = input_row.querySelector('.price').value;
    let mount = input_row.querySelector('.mount').value;
    if (!mount) {
        mount = input_row.querySelector('.mount').textContent;
    }
    let money = "";
    if (price && regReal.test(price) && mount && regReal.test(mount)) {
        if (input_row.querySelector('.材质').textContent.trim() != "--") {
            money = (price * mount).toFixed(0);
        } else {
            money = (price * input_row.querySelector('.num').value).toFixed(0);
        }
    }

    input_row.querySelector('.money').textContent = money;
}

//计算合计金额
function sum_money() {
    let all_input = document.querySelectorAll('.has-input');
    let sum = 0;
    for (let i = 0; i < all_input.length; i++) {
        let price = all_input[i].querySelector('.price').value;
        let mount = all_input[i].querySelector('.mount').value;
        if (!mount) {
            mount = all_input[i].querySelector('.mount').textContent;
        }
        if (all_input[i].querySelector('td:nth-child(2) .auto-input').value != "" &&
            price && regReal.test(price) && mount && regReal.test(mount)) {
            if (all_input[i].querySelector('.材质').textContent.trim() != "--") {
                sum += price * mount;
            } else {
                sum += price * all_input[i].querySelector('.num').value;
            }
        }
    }

    document.querySelector('#sum-money').innerHTML = `金额合计：${sum.toFixed(0)} 元`;
    document.querySelector('#应结金额').value = sum.toFixed(0);
}

// 销售时使用的理论重量计算
function calc_weight(input_row) {
    let data = {
        long: input_row.querySelector('.long').value,
        num: input_row.querySelector('.num').value,
        name: input_row.querySelector('.auto-input').value,
        cz: input_row.querySelector('.材质').textContent,
        gg: input_row.querySelector('.规格').value,
    }

    if (regInt.test(data.long) && regInt.test(data.num) && input_row.querySelector('.材质').textContent.trim() != "--") {
        input_row.querySelector('.mount').value = service.calc_weight(data);
    } else {
        input_row.querySelector('.mount').value = 0;
    }
}

function fill_gg() {
    let field_values = document.querySelector(`.inputting .auto-input`).getAttribute("data").split(SPLITER);
    let n = 3;  //从第 3 列开始填入数据
    let num = document_name == "销售单据" ? 4 : 3;  //填充数量
    for (let i = 2; i < 2 + num; i++) {     //不计末尾的库存和售价两个字段
        let val = field_values[i];
        // console.log(shown);
        if ((show_names[i].type == "普通输入" || show_names[i].type == "autocomplete") && show_names[i].editable) {
            document.querySelector(`.inputting td:nth-child(${n}) input`).value = val;
        } else if (show_names[i].type == "普通输入" && !show_names[i].editable) {
            document.querySelector(`.inputting td:nth-child(${n})`).textContent = val;
        } else if (show_names[i].type == "下拉列表" && show_names[i].editable) {
            document.querySelector(`.inputting td:nth-child(${n}) select`).value = val;
        } else if (show_names[i].type == "下拉列表" && !show_names[i].editable) {
            document.querySelector(`.inputting td:nth-child(${n})`).textContent = val;
        }
        // if (product_table_fields[i - 2].ctr_type == "二值选一") {
        //     val = val == "true" ? product_table_fields[i - 2].option_value.split('_')[0] : product_table_fields[i - 2].option_value.split('_')[1];
        // }

        n++;
    }

    let price_input = document.querySelector(`.inputting .price`);
    price_input.focus();

    appand_edit_row();
    edited = true;
}

//保存、打印和审核 -------------------------------------------------------------------

//保存
document.querySelector('#save-button').addEventListener('click', function () {
    //错误勘察
    if (!error_check()) {
        return false;
    }

    let customer_id = document.querySelector('#supplier-input').getAttribute('data');
    let all_values = document.querySelectorAll('.document-value');

    //构建数据字符串
    let user_name = document.querySelector('#user-name').textContent.split('　')[1];
    let save_str = `${document_bz}${SPLITER}${dh_div.textContent}${SPLITER}${customer_id}${SPLITER}${user_name}${SPLITER}`;
    save_str += service.build_save_header(all_values, document_table_fields);

    let table_data = [];
    let all_rows = document.querySelectorAll('.table-items .has-input');
    for (let row of all_rows) {
        if (row.querySelector('td:nth-child(2) input').value != "") {
            let save_str = `${row.querySelector('td:nth-child(2) input').getAttribute('data').split(SPLITER)[0]}${SPLITER}`;
            save_str += service.build_save_items(2, row, show_names);
            table_data.push(save_str);
        }
    }

    let data = {
        rights: document_bz,
        document: save_str,
        remember: document.querySelector('#remember-button').textContent,
        items: table_data,
    }

    // console.log(data);

    fetch(`/save_document`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                dh_div.textContent = content;
                notifier.show('单据保存成功', 'success');
                edited = false;
                input_table_outdata.edited = false;
            } else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
});

//打印
// if (document.querySelector('#print-button')) {
//     addEventListener('click', function () {
//         //错误勘察
//         if (!error_check()) {
//             return false;
//         }
//
//         let id = document.querySelector('#print-choose').value;
//         fetch(`/fetch_provider_model`, {
//             method: 'post',
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: Number(id),
//         })
//             .then(response => response.json())
//             .then(content => {
//                 var configElementTypeProvider = (function () {
//                     return function (options) {
//                         var addElementTypes = function (context) {
//                             context.allElementTypes = [];   //在这里清空一次，否则会累积元素，且只有第一次写入的元素有效
//                             context.testModule = [];
//
//                             context.addPrintElementTypes(
//                                 "testModule",
//                                 [
//                                     new hiprint.PrintElementTypeGroup("常规", JSON.parse(content[0])),
//                                     new hiprint.PrintElementTypeGroup("自定义", [
//                                         {
//                                             tid: 'configModule.customText',
//                                             title: '自定义文本',
//                                             customText: '自定义文本',
//                                             custom: true,
//                                             type: 'text'
//                                         },
//                                         {
//                                             tid: 'configModule.image',
//                                             title: '图片',
//                                             data: `/assets/img/logo.png`,
//                                             type: 'image'
//                                         },
//                                         {
//                                             tid: 'configModule.tableCustom',
//                                             title: '表格',
//                                             type: 'tableCustom',
//                                             field: 'table',
//                                             options: {
//                                                 width: 500,
//                                             }
//                                         },
//                                     ]),
//                                 ]
//                             );
//                         };
//
//                         return {
//                             addElementTypes: addElementTypes
//                         };
//                     };
//                 })();
//
//                 hiprint.init({
//                     providers: [new configElementTypeProvider()]
//                 });
//
//                 let hiprintTemplate = new hiprint.PrintTemplate({
//                     template: JSON.parse(content[1]),
//                 });
//
//                 var printData = {
//                     供应商: document.querySelector('#supplier-input').value,
//                     客户: document.querySelector('#supplier-input').value,
//                     日期时间: new Date().Format("yyyy-MM-dd hh:mm"),
//                     dh: dh_div.textContent,
//                     maker: document.querySelector('#user-name').textContent.split('　')[1],
//                     // barCode: dh,
//                 };
//
//                 let show_fields = document.querySelectorAll('.document-value');
//                 let n = 0;
//                 for (let field of document_table_fields) {
//                     if (field.data_type == "布尔") {
//                         printData[field.show_name] = show_fields[n].checked ? "是" : "否";
//                     } else {
//                         printData[field.show_name] = show_fields[n].value;
//                     }
//                     n++;
//                 }
//
//                 let table_data = [];
//                 let all_rows = document.querySelectorAll('.table-items .has-input');
//                 let count = 0;
//                 let sum = 0;
//                 for (let row of all_rows) {
//                     if (row.querySelector('td:nth-child(2) input').value != "") {
//                         let row_data = {};
//                         for (let cell of show_names) {
//                             let da = row.querySelector(`.${cell.class}`);
//                             row_data[cell.name] = cell.editable ? da.value : da.textContent;
//                         }
//
//                         table_data.push(row_data);
//
//                         count += Number(row_data["实际重量"]);
//                         sum += Number(row_data["金额"]);
//                     }
//                 }
//
//                 let row_data = {};
//                 row_data["序号"] = '合计';
//                 row_data["实际重量"] = count.toFixed(2);
//                 row_data["金额"] = sum.toFixed(0);
//
//                 table_data.push(row_data);
//
//                 printData['chinese'] = moneyUppercase(Number(row_data['金额']))
//                 printData["table"] = table_data;
//
//                 hiprintTemplate.print(printData);
//             });
//     });
// }

// fetch_print_models(document.querySelector('#document-bz').textContent.trim());

function set_readonly() {
    let all_edit = document.querySelectorAll('.document-value');
    for (let edit of all_edit) {
        edit.readOnly = true;
    }
    document.querySelector('#supplier-input').readOnly = true;
    document.querySelector('#supplier-serach').disabled = true;
    document.querySelector('#save-button').disabled = true;

    service.edit_button_disabled();
}

//审核单据
let formal_data = {
    button: document.querySelector('#remember-button'),
    dh: dh_div.textContent,
    document_name: document_name,
    edited: edited || input_table_outdata.edited,
    readonly_fun: set_readonly,
}
service.make_formal(formal_data);

//共用事件和函数 ---------------------------------------------------------------------

// //获取打印模板
// function fetch_print_models(value) {
//     let print_id;
//     if (value == "材料采购") {
//         print_id = 3;
//     } else if (value == "采购退货") {
//         print_id = 4;
//     } else if (value == "商品销售") {
//         print_id = 1;
//     } else if (value == "销售退货") {
//         print_id = 2;
//     } else {
//         print_id = 5;
//     }
//
//     fetch(`/fetch_models`, {
//         method: 'post',
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: print_id,
//     })
//         .then(response => response.json())
//         .then(content => {
//             let model_options = "";
//             for (let data of content) {
//                 model_options += `<option value="${data.id}">打印 - ${data.name}</option>`;
//             }
//
//             document.querySelector('#print-choose').innerHTML = model_options;
//         });
// }

//保存、打印和审核前的错误检查
function error_check() {
    let customer_id = document.querySelector('#supplier-input').getAttribute('data');
    if (customer_id == null) {
        notifier.show('客户或供应商不在库中', 'danger');
        return false;
    }

    let all_rows = document.querySelectorAll('.table-items .has-input');
    if (!service.header_error_check(document_table_fields, all_rows)) {
        return false;
    }

    for (let row of all_rows) {
        if (row.querySelector('td:nth-child(2) input').value != "") {
            let mount = row.querySelector('.mount');
            if (row.querySelector('.price').value && !regReal.test(row.querySelector('.price').value)) {
                notifier.show(`单价输入错误`, 'danger');
                return false;
            } else if (!row.querySelector('.price').value) {
                row.querySelector('.price').value = 0;
            }

            if (mount.value && !regReal.test(mount.value)) {
                notifier.show(`重量输入错误`, 'danger');
                return false;
            } else if (!mount.value) {
                mount.value = 0;
            }

            if (row.querySelector('.long')) {
                if (row.querySelector('.long').value && !regReal.test(row.querySelector('.long').value)) {
                    notifier.show(`长度输入错误`, 'danger');
                    return false;
                } else if (!row.querySelector('.long').value) {
                    row.querySelector('.long').value = 0;
                }

                if (row.querySelector('.num').value && !regReal.test(row.querySelector('.num').value)) {
                    notifier.show(`数量输入错误`, 'danger');
                    return false;
                } else if (!row.querySelector('.num').value) {
                    row.querySelector('.num').value = 0;
                }

                if (row.querySelector('.weight').value && !regReal.test(row.querySelector('.weight').value)) {
                    notifier.show(`实际重量输入错误`, 'danger');
                    return false;
                } else if (row.querySelector('.weight').value.trim() == "") {
                    row.querySelector('.weight').value = 0;
                }
            }
        }
    }
    return true;
}

window.onbeforeunload = function (e) {
    if (edited || input_table_outdata.edited) {
        var e = window.event || e;
        e.returnValue = ("编辑未保存提醒");
    }
}