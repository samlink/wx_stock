import {notifier} from '../parts/notifier.mjs';
import {alert_confirm} from '../parts/alert.mjs';
import {AutoInput} from '../parts/autocomplete.mjs';
import * as service from '../parts/service.mjs';
import {SPLITER, regInt, regReal, regDate, moneyUppercase} from '../parts/tools.mjs';
import {
    appand_edit_row,
    build_blank_table,
    build_content_table, build_items_table,
    input_table_outdata
} from '../parts/edit_table.mjs';

let document_table_fields, table_lines, show_names, edited;
let document_bz = document.querySelector('#document-bz').textContent.trim();
let dh_div = document.querySelector('#dh');

//单据顶部信息构造显示，并添加事件处理 -----------------------------------------------------------

let document_name = "库存调入";

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
                        document_top_handle(html, true);

                        let values = data.split(SPLITER);
                        document.querySelector('#owner').textContent = `[ ${values[values.length - 1]} ]`;

                        let rem = document.querySelector('#remember-button');
                        if (values[values.length - 2] != "") {
                            rem.textContent = "已审核";
                            rem.classList.add('remembered');
                            set_readonly();
                        } else {
                            rem.textContent = "审核";
                            rem.classList.remove('remembered');
                        }
                    });
            } else {
                let html = service.build_inout_form(content);
                document_top_handle(html, false);
                document.querySelector('#remember-button').textContent = '审核'
            }
        }
    });


function set_readonly() {
    let all_edit = document.querySelectorAll('.document-value');
    for (let edit of all_edit) {
        edit.readOnly = true;
    }
    document.querySelector('#save-button').setAttribute("disabled", true);
    service.edit_button_disabled();
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

    let date = document.querySelector('#日期');

    if (!has_date) {
        date.value = new Date().Format("yyyy-MM-dd");
    }

    //执行一个laydate实例
    laydate.render({
        elem: date,
        showBottom: false,
    });
}

//构建商品规格表字段，字段设置中的右表数据 --------------------------

show_names = [
    {name: "序号", width: 10, class: "序号", type: "普通输入", editable: false, is_save: true, default: ""},
    {
        name: "名称",
        width: 60,
        class: "名称",
        type: "autocomplete",
        editable: true,
        is_save: true,
        save: "id",
        default: ""
    },
    {name: "材质", width: 60, class: "材质", type: "普通输入", editable: false, is_save: false, default: ""},
    {name: "规格", width: 60, class: "规格", type: "普通输入", editable: true, is_save: true, default: ""},
    {name: "状态", width: 80, class: "状态", type: "普通输入", editable: true, is_save: true, default: ""},
    {name: "炉号", width: 100, class: "炉号", type: "普通输入", editable: true, is_save: true, default: ""},
    {
        name: "执行标准",
        width: 120,
        class: "执行标准",
        type: "autocomplete",
        editable: true,
        is_save: true,
        save: "value",
        no_button: true,
        default: ""
    },
    {
        name: "生产厂家",
        width: 80,
        class: "生产厂家",
        type: "autocomplete",
        editable: true,
        is_save: true,
        save: "value",
        no_button: true,
        default: ""
    },
    {
        name: "库位",
        width: 60,
        class: "库位",
        type: "autocomplete",
        editable: true,
        is_save: true,
        save: "value",
        no_button: true,
        default: ""
    },
    {name: "物料号", width: 60, class: "物料号", type: "普通输入", editable: true, is_save: true, default: ""},
    {name: "长度", width: 30, class: "长度", type: "普通输入", editable: true, is_save: true, default: ""},
    {name: "理论重量", width: 30, class: "重量", type: "普通输入", editable: false, is_save: true, default: ""},
    {
        name: "备注",
        width: 100,
        class: "备注",
        type: "普通输入",
        editable: true,
        is_save: true,
        default: "",
        css: 'style="border-right:none"'
    },
    {
        name: "",
        width: 0,
        class: "m_id",
        type: "普通输入",
        editable: false,
        is_save: true,
        default: "",
        css: 'style="width:0%; border-left:none; color:white"',
    }, //此列不可省略
];

//计算表格行数，33 为 lineHeight （行高）
table_lines = Math.floor((document.querySelector('body').clientHeight - 360) / 33);

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
    n: 2,
    cate: document_name,
    auto_url: `/buyin_auto`,
    show_th: show_th,
    type: "table",
    cb: fill_gg,
}, {
    n: 7,
    cate: "执行标准",
    auto_url: `/get_status_auto`,
    type: "simple",
}, {
    n: 8,
    cate: "生产厂家",
    auto_url: `/get_status_auto`,
    type: "simple",
}, {
    n: 9,
    cate: "库位",
    auto_url: `/get_status_auto`,
    type: "simple",
},
];

if (dh_div.textContent == "新单据") {
    let data = {
        width: document.querySelector('.content').clientWidth - 15,
        show_names: show_names,
        lines: table_lines,
        auto_data: auto_data,
        dh: dh_div.textContent,
        document: document_name,
        calc_func: get_weight,
    }

    build_blank_table(data);
    appand_edit_row();
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
                width: document.querySelector('.content').clientWidth - 15,
                show_names: show_names,
                rows: content,
                lines: table_lines,
                auto_data: auto_data,
                dh: dh_div.textContent,
                document: document_name,
                calc_func: get_weight,
            }

            build_items_table(data);
            appand_edit_row();
        });
}

function get_weight(input_row) {
    input_row.querySelector('.长度').addEventListener('blur', function () {
        weight(input_row);
    });
}

// 理论重量计算
function weight(input_row) {
    let data = {
        long: input_row.querySelector('.长度').value.trim(),
        num: 1,
        name: input_row.querySelector('.auto-input').value.trim(),
        cz: input_row.querySelector('.材质').textContent.trim(),
        gg: input_row.querySelector('.规格').value.trim(),
    }

    if (regInt.test(data.long) && regInt.test(data.num)) {
        input_row.querySelector('.重量').textContent = service.calc_weight(data);
    } else {
        input_row.querySelector('.重量').textContent = 0;
    }
}

function fill_gg() {
    let field_values = document.querySelector(`.inputting .auto-input`).getAttribute("data").split(SPLITER);
    let n = 3;
    let num = 3;  //从第 3 列开始填入数据
    for (let i = 2; i < 2 + num; i++) {     //不计末尾的库存和售价两个字段
        let val = field_values[i];
        if (show_names[i].type == "普通输入" && show_names[i].editable) {
            document.querySelector(`.inputting td:nth-child(${n}) input`).value = val;
        } else if (show_names[i].type == "普通输入" && !show_names[i].editable) {
            document.querySelector(`.inputting td:nth-child(${n})`).textContent = val;
        }
        n++;
    }

    let focus_input = document.querySelector(`.inputting .炉号`);
    focus_input.focus();

    appand_edit_row();
    edited = true;
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
    save_str += service.build_save_header(all_values, document_table_fields);

    // 构建字符串数组，将存入单据明细中
    let table_data = [];
    let all_rows = document.querySelectorAll('.table-items .has-input');
    for (let row of all_rows) {
        if (row.querySelector('.材质').textContent.trim() != "") {
            let save_str = "";
            save_str += service.build_save_items(0, row, show_names);
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

    fetch(`/save_material`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content == -2) {
                notifier.show('物料号有重复，无法保存', 'danger');
                return false;
            } else if (content != -1) {
                dh_div.textContent = content;
                notifier.show('单据保存成功', 'success');
                edited = false;
                input_table_outdata.edited = false;
            } else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
});

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

//保存、打印和审核前的错误检查
function error_check() {
    let all_rows = document.querySelectorAll('.table-items .has-input');
    service.header_error_check(document_table_fields, all_rows);

    for (let row of all_rows) {
        if (row.querySelector('.材质').textContent.trim() != "") {
            if (row.querySelector('.物料号').value.trim() == "") {
                notifier.show(`物料号不能为空`, 'danger');
                return false;
            }

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