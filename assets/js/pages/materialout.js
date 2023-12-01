import {notifier} from '../parts/notifier.mjs';
import {alert_confirm} from '../parts/alert.mjs';
import {AutoInput} from '../parts/autocomplete.mjs';
import * as service from '../parts/service.mjs';
import {SPLITER, regInt, regReal, regDate, moneyUppercase} from '../parts/tools.mjs';
import {
    build_blank_table, build_items_table, build_out_table, input_table_outdata
} from '../parts/edit_table.mjs';
// import {
//     build_blank_table, build_items_table, build_out_table, input_table_outdata
// } from '../parts/input_material_out_tmp.mjs';

let document_table_fields, table_lines, show_names, edited;
let num_position = document.querySelector('#num_position').textContent.split(",");
let document_bz = document.querySelector('#document-bz').textContent.trim();
let dh_div = document.querySelector('#dh');

//单据顶部信息构造显示，并添加事件处理 -----------------------------------------------------------

let document_name;
if (document_bz.indexOf("入库") != -1) {
    document_name = "入库单据";
} else if (document_bz.indexOf("出库") != -1) {
    document_name = "出库单据";
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
                        alert('dd');
                        console.log(html);
                        document_top_handle(html, true);

                        let dh = document.querySelector("#文本字段6").value;
                        build_items(dh);

                        fetch('/fetch_check', {
                            method: 'post',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(dh_div.textContent),
                        })
                            .then(response => response.json())
                            .then(data => {
                                let check = data.split('-');
                                let rem = document.querySelector('#remember-button');
                                if (check[0] != "") {
                                    rem.textContent = "已审核";
                                    rem.classList.add('remembered');
                                    set_readonly();
                                } else {
                                    rem.textContent = "审核";
                                    rem.classList.remove('remembered');
                                }

                                let chk = document.querySelector('#check-button');
                                if (check[1] != "") {
                                    chk.textContent = "已质检";
                                    chk.classList.add('remembered');
                                    set_readonly();
                                } else {
                                    chk.textContent = "质检";
                                    chk.classList.remove('remembered');
                                }
                            });
                    });
            } else {
                let html = service.build_inout_form(content);
                document_top_handle(html, false);
                document.querySelector('#remember-button').textContent = '审核'
            }
        }
    });


function set_readonly() {
    document.querySelector('#文本字段6').readOnly = true;
    // document.querySelector('#material-add').setAttribute("disabled", true);
    document.querySelector('#save-button').setAttribute("disabled", true);
}

function document_top_handle(html, has_date) {
    let fields_show = document.querySelector('.fields-show .table-head');
    fields_show.innerHTML = html;
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

    let auto_doc = document.querySelector('#文本字段6');
    auto_doc.parentNode.classList.add("autocomplete");

    let auto_comp = new AutoInput(auto_doc, "商品销售", "/materialout_auto", () => {
        build_items(auto_doc.getAttribute("data"));
    });

    auto_comp.init();

    document.querySelector('#文本字段5').parentNode.parentNode.style.cssText = "margin-left: 250px;";

    let date = document.querySelector('#日期');
    // date.parentNode.parentNode.style.cssText = "margin-left: 250px;";

    if (!has_date) {
        date.value = new Date().Format("yyyy-MM-dd");
    }

    //执行一个laydate实例
    laydate.render({
        elem: date,
        showBottom: false,
    });
}

let show_th = [
    {name: "物料号", width: 60},
    {name: "名称", width: 60},
    {name: "材质", width: 80},
    {name: "规格", width: 80},
    {name: "状态", width: 100},
    {name: "炉号", width: 100},
    {name: "库存长度", width: 80},
];

function build_items(dh) {
    fetch('/get_docs_out', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dh),
    })
        .then(response => response.json())
        .then(content => {
            let info = content.split(SPLITER);
            document.querySelector("#文本字段5").value = info[0];
            document.querySelector("#文本字段4").value = info[1];
        });


    fetch('/get_items_out', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dh),
    })
        .then(response => response.json())
        .then(content => {
            let tr = "";
            content.forEach(obj => {
                let material = obj.split(`${SPLITER}`);
                tr += `<tr><td hidden>${material[0]}</td><td>${material[1]}</td></tr>`;
            });
            document.querySelector(".table-history tbody").innerHTML = tr;

            let lines = document.querySelectorAll(".table-history tbody tr");
            for (let l of lines) {
                l.addEventListener("dblclick", () => {
                    let value = l.querySelector('td:nth-child(2)').textContent.split('　');
                    show_names[1].value = value[0];
                    show_names[2].value = value[1];
                    show_names[3].value = value[2];
                    show_names[4].value = value[3];
                    show_names[6].value = value[4];
                    show_names[7].value = value[5];
                    show_names[8].value = value[4] * value[5];
                    show_names[12].value = l.querySelector('td:nth-child(1)').textContent;

                    let auto_data = {
                        n: 10,
                        cate: "",
                        url: `/material_auto_out`,
                        cb: fill_gg,
                        cf: () => {
                            return document.querySelector('.table-items .inputting td:nth-child(13)').textContent;
                        }
                    }

                    let data = {
                        show_names: show_names,
                        lines: table_lines,
                        dh: dh_div.textContent,
                        auto_data: auto_data,
                        document: document_name,
                        auto_th: show_th,
                    }

                    build_out_table(data);
                })
            }
        });
}

function fill_gg() {
    let field_values = document.querySelector(`.inputting .auto-input`).getAttribute("data").split(SPLITER);
    let lh_input = document.querySelector(`.inputting .炉号`).textContent = field_values[6];
    document.querySelector(`.inputting .重量`).focus();
    // input_table_outdata.edited = true;
}

//构建商品规格表字段，字段设置中的右表数据 --------------------------

show_names = [
    {name: "序号", width: 10, class: "序号", type: "普通输入", editable: false, is_save: true},
    {name: "名称", width: 40, class: "名称", type: "普通输入", editable: false, is_save: false},
    {name: "材质", width: 60, class: "材质", type: "普通输入", editable: false, is_save: false},
    {name: "规格", width: 60, class: "规格", type: "普通输入", editable: false, is_save: true},
    {name: "状态", width: 80, class: "状态", type: "普通输入", editable: false, is_save: true},
    {name: "炉号", width: 100, class: "炉号", type: "普通输入", editable: false, is_save: true},
    {name: "长度", width: 30, class: "长度", type: "普通输入", editable: false, is_save: true},
    {name: "数量", width: 30, class: "数量", type: "普通输入", editable: true, is_save: true},
    {name: "总长度", width: 30, class: "总长度", type: "普通输入", editable: false, is_save: true},
    {name: "物料号", width: 60, class: "auto-input", type: "autocomplete", editable: true, is_save: true, no_button: true},
    {name: "重量", width: 30, class: "重量", type: "普通输入", editable: true, is_save: true,},
    {
        name: "备注",
        width: 100,
        class: "备注",
        type: "普通输入",
        editable: true,
        is_save: true,
        css: 'style="border-right:none"'
    },
    {
        name: "",
        width: 0,
        class: "m_id",
        type: "普通输入",
        editable: false,
        is_save: true,
        css: 'style="width:0%; border-left:none; color:white"',
    },
];

//计算表格行数，33 为 lineHeight （行高）
table_lines = Math.floor((document.querySelector('body').clientHeight - 390) / 33);

if (dh_div.textContent == "新单据") {
    let data = {
        show_names: show_names,
        lines: table_lines,
        dh: dh_div.textContent,
        document: document_name,
    }

    build_blank_table(data);
} else {
    // let url = document_name == "入库单据" ?  : "/fetch_document_items"
    fetch("/fetch_document_items_rk", {
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
            let data = {
                show_names: show_names,
                rows: content,
                lines: table_lines,
                auto_th: show_th,
                dh: dh_div.textContent,
                document: document_name,
                gg_n: 3,
            }

            build_items_table(data);
        });
}

//保存、打印、质检、审核 -------------------------------------------------------------------

//保存
document.querySelector('#save-button').addEventListener('click', function () {
    //错误勘察
    if (!error_check()) {
        return false;
    }

    let all_values = document.querySelectorAll('.document-value');

    //构建表头存储字符串，将存入单据中
    let save_str = `${document_bz}${SPLITER}${dh_div.textContent}${SPLITER}`;

    let n = 0;
    for (let f of document_table_fields) {
        if (f.data_type == "文本") {
            let value = f.show_name != "单据单号" ? all_values[n].value : all_values[n].value.split('　')[0];
            save_str += `${value}${SPLITER}`;
        } else if (f.data_type == "整数" || f.data_type == "实数") {
            let value = all_values[n].value ? all_values[n].value : 0;
            save_str += `${value}${SPLITER}`;
        } else {
            save_str += `${all_values[n].checked ? "是" : "否"}${SPLITER}`;
        }
        n++;
    }

    // 构建字符串数组，将存入单据明细中
    let table_data = [];
    let all_rows = document.querySelectorAll('.table-items .has-input');
    for (let row of all_rows) {
        if (row.querySelector('td:nth-child(1)').textContent != "") {
            let len = show_names.length;
            let save_str = ``;

            for (let i = 0; i < len; i++) {
                if (show_names[i].is_save) {
                    if (show_names[i].type == "普通输入" || show_names[i].type == "autocomplete" || show_names[i].type == "下拉列表") {     // 下拉列表和二值选一未测试
                        let value = row.querySelector(`.${show_names[i].class}`).value;
                        if (!value) value = row.querySelector(`.${show_names[i].class}`).textContent;
                        save_str += `${value.trim()}${SPLITER}`;
                    } else {
                        let value = row.querySelector(`.${show_names[i].class}`).checked ? "是" : "否";
                        save_str += `${value.trim()}${SPLITER}`;
                    }
                }
            }
            table_data.push(save_str);
        }
    }

    let data = {
        rights: document_bz,
        document: save_str,
        remember: `${document.querySelector('#remember-button').textContent}${SPLITER}${document.querySelector('#check-button').textContent}`,
        items: table_data,
    }

    console.log(data);

    fetch(`/save_material_ck`, {
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
document.querySelector('#print-button').addEventListener('click', function () {
    //错误勘察
    if (!error_check()) {
        return false;
    }
    ;

    let id = document.querySelector('#print-choose').value;
    fetch(`/fetch_provider_model`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: Number(id),
    })
        .then(response => response.json())
        .then(content => {
            var configElementTypeProvider = (function () {
                return function (options) {
                    var addElementTypes = function (context) {
                        context.allElementTypes = [];   //在这里清空一次，否则会累积元素，且只有第一次写入的元素有效
                        context.testModule = [];

                        context.addPrintElementTypes(
                            "testModule",
                            [
                                new hiprint.PrintElementTypeGroup("常规", JSON.parse(content[0])),
                                new hiprint.PrintElementTypeGroup("自定义", [
                                    {
                                        tid: 'configModule.customText',
                                        title: '自定义文本',
                                        customText: '自定义文本',
                                        custom: true,
                                        type: 'text'
                                    },
                                    {
                                        tid: 'configModule.image',
                                        title: '图片',
                                        data: `/assets/img/logo.png`,
                                        type: 'image'
                                    },
                                    {
                                        tid: 'configModule.tableCustom',
                                        title: '表格',
                                        type: 'tableCustom',
                                        field: 'table',
                                        options: {
                                            width: 500,
                                        }
                                    },
                                ]),
                            ]
                        );
                    };

                    return {
                        addElementTypes: addElementTypes
                    };
                };
            })();

            hiprint.init({
                providers: [new configElementTypeProvider()]
            });

            let hiprintTemplate = new hiprint.PrintTemplate({
                template: JSON.parse(content[1]),
            });

            var printData = {
                // 供应商: document.querySelector('#supplier-input').value,
                // 客户: document.querySelector('#supplier-input').value,
                日期时间: new Date().Format("yyyy-MM-dd hh:mm"),
                dh: dh_div.textContent,
                maker: document.querySelector('#user-name').textContent.split('　')[1],
                // barCode: dh,
            };

            let show_fields = document.querySelectorAll('.document-value');
            let n = 0;
            for (let field of document_table_fields) {
                if (field.data_type == "布尔") {
                    printData[field.show_name] = show_fields[n].checked ? "是" : "否";
                } else {
                    printData[field.show_name] = show_fields[n].value;
                }
                n++;
            }

            let table_data = [];
            let all_rows = document.querySelectorAll('.table-items .has-input');
            let count = 0;
            let sum = 0;
            for (let row of all_rows) {
                if (row.querySelector('td:nth-child(2) input').value != "") {
                    let row_data = {};
                    for (let cell of show_names) {
                        let da = row.querySelector(`.${cell.class}`);
                        row_data[cell.name] = cell.editable ? da.value : da.textContent;
                    }

                    table_data.push(row_data);

                    count += Number(row_data["实际重量"]);
                    sum += Number(row_data["金额"]);
                }
            }

            let row_data = {};
            row_data["序号"] = '合计';
            row_data["实际重量"] = count.toFixed(2);
            row_data["金额"] = sum.toFixed(Number(num_position[1]));

            table_data.push(row_data);

            printData['chinese'] = moneyUppercase(Number(row_data['金额']))
            printData["table"] = table_data;

            hiprintTemplate.print(printData);
        });
});

fetch_print_models(document.querySelector('#document-bz').textContent.trim());

document.querySelector('#check-button').addEventListener('click', function () {
    if (this.textContent == "已质检") {
        return false;
    }

    let dh = dh_div.textContent;
    let that = this;
    if (dh == "新单据") {
        notifier.show('请先保存单据', 'danger');
        return false;
    }

    alert_confirm("确认质检吗？", {
        confirmText: "确认",
        cancelText: "取消",
        confirmCallBack: () => {
            fetch(`/check_in`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dh),
            })
                .then(response => response.json())
                .then(content => {
                    if (content != -1) {
                        that.textContent = '已质检';
                        that.classList.add('remembered');
                        notifier.show('质检完成', 'success');
                    } else {
                        notifier.show('权限不够', 'danger');

                    }
                });
        }
    })
});

//审核
document.querySelector('#remember-button').addEventListener('click', function () {
    if (this.textContent == "已审核") {
        return false;
    }

    if (dh_div.textContent == "新单据" || edited || input_table_outdata.edited) {
        notifier.show('请先保存单据', 'danger');
        return false;
    }

    let that = this;
    alert_confirm("确认审核吗？", {
        confirmText: "确认",
        cancelText: "取消",
        confirmCallBack: () => {
            fetch(`/make_formal_in`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dh_div.textContent),
            })
                .then(response => response.json())
                .then(content => {
                    if (content != -1) {
                        that.textContent = '已审核';
                        that.classList.add('remembered');
                        notifier.show('审核完成', 'success');
                    } else {
                        notifier.show('权限不够', 'danger');

                    }
                });
        }
    });
});

//共用事件和函数 ---------------------------------------------------------------------

//获取打印模板
function fetch_print_models(value) {
    let print_id;
    if (value == "商品采购") {
        print_id = 3;
    } else if (value == "采购退货") {
        print_id = 4;
    } else if (value == "商品销售") {
        print_id = 1;
    } else if (value == "销售退货") {
        print_id = 2;
    } else {
        print_id = 5;
    }

    fetch(`/fetch_models`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: print_id,
    })
        .then(response => response.json())
        .then(content => {
            let model_options = "";
            for (let data of content) {
                model_options += `<option value="${data.id}">打印 - ${data.name}</option>`;
            }

            document.querySelector('#print-choose').innerHTML = model_options;
        });
}

//保存、打印和审核前的错误检查
function error_check() {
    if (!regDate.test(document.querySelector('#日期').value)) {
        notifier.show('日期输入错误', 'danger');
        return false;
    }

    let all_values = document.querySelectorAll('.document-value');
    for (let i = 0; i < document_table_fields.length; i++) {
        if (document_table_fields[i].data_type == "整数") {
            if (all_values[i].value && !regInt.test(all_values[i].value)) {
                notifier.show(`${document_table_fields[i].show_name}输入错误`, 'danger');
                return false;
            }
        } else if (document_table_fields[i].data_type == "实数") {
            if (all_values[i].value && !regReal.test(all_values[i].value)) {
                notifier.show(`${document_table_fields[i].show_name}输入错误`, 'danger');
                return false;
            }
        }
    }

    let all_rows = document.querySelectorAll('.table-items .has-input');
    let lines = all_rows.length;
    if (lines == 0) {
        notifier.show(`表格不能为空`, 'danger');
        return false;
    }

    for (let row of all_rows) {
        if (row.querySelector('td:nth-child(1)').textContent != "") {
            if (row.querySelector('.长度').value && !regReal.test(row.querySelector('.长度').value)) {
                notifier.show(`长度输入错误`, 'danger');
                return false;
            } else if (!row.querySelector('.长度').value) {
                row.querySelector('.长度').value = 0;
            }

            if (row.querySelector('.重量').textContent.trim() == "") {
                row.querySelector('.重量').textContent = 0;
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