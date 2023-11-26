import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import * as service from '../parts/service.mjs'
import { SPLITER, regInt, regReal, regDate, moneyUppercase } from '../parts/tools.mjs';
import { customer_init, out_data } from '../parts/customer.mjs';
import { input_table_init, input_table_outdata } from '../parts/input_table.mjs';

let document_table_fields, table_lines, show_names, edited;
let num_position = document.querySelector('#num_position').textContent.split(",");
let document_bz = document.querySelector('#document-bz').textContent.trim();
let dh_div = document.querySelector('#dh');

//单据顶部信息构造显示，并添加事件处理 -----------------------------------------------------------

let document_name;
if (document_bz.indexOf("销售") != -1) {
    document_name = "销售单据";
}
else if (document_bz.indexOf("采购") != -1) {
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
                        fetch_print_models(values[len - 1]);

                        let rem = document.querySelector('#remember-button');
                        if (values[len - 2] == "true") {
                            rem.textContent = "已审核";
                            rem.classList.add('remembered');
                        }
                        else {
                            rem.textContent = "审核";
                            rem.classList.remove('remembered');
                        }

                        let customer = document.querySelector('#supplier-input');
                        customer.value = values[len - 3];
                        customer.setAttribute('data', values[len - 4]);


                    });
            }
            else {
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
            }
            else {
                has_auto.style.cssText = "";
                next_auto.style.cssText = "";
            }
        });
    }
    else {
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
            { name: "序号", width: 40, class: "序号", type: "普通输入", editable: false, is_save: false, default: 1 },
            { name: "名称", width: 80, class: "auto-input", type: "autocomplete", editable: true, is_save: true, default: "" },
            { name: "材质", width: 100, class: "材质", type: "普通输入", editable: false, is_save: false, default: "" },
        ];

        for (let item of content) {
            show_names.push({
                name: item.show_name, width: item.show_width * 18, type: item.ctr_type,
                class: item.show_name, editable: true, is_save: true, default: item.option_value
            });
        }

        if (document_name == "销售单据") {
            show_names.push({ name: "单价", width: 50, class: "price", type: "普通输入", editable: true, is_save: true, default: "" });
            show_names.push({ name: "长度", width: 60, class: "long", type: "普通输入", editable: true, is_save: true, default: "" });
            show_names.push({ name: "数量", width: 50, class: "num", type: "普通输入", editable: true, is_save: true, default: "" });
            show_names.push({ name: "理论重量", width: 60, class: "mount", type: "普通输入", editable: false, is_save: true, default: "" });
            show_names.push({ name: "实际重量", width: 60, class: "weight", type: "普通输入", editable: true, is_save: true, default: "" });
        }
        else if (document_name == "采购单据") {
            show_names.push({ name: "单价", width: 60, class: "price", type: "普通输入", editable: true, is_save: true, default: "" });
            show_names.push({ name: "重量", width: 60, class: "mount", type: "普通输入", editable: true, is_save: true, default: "" });
        }

        show_names.push({ name: "金额", width: 80, class: "money", type: "普通输入", editable: false, is_save: false, default: "" });
        show_names.push({ name: "备注", width: 100, class: "note", type: "普通输入", editable: true, is_save: true, default: "" });

        // show_names.forEach(item => {
        //     if (item.name == "规格") {
        //         item.editable = true;
        //         item.class ="规格";
        //         return;
        //     }
        // });

        //计算表格行数，33 为 lineHeight （行高）
        table_lines = Math.floor((document.querySelector('body').clientHeight - 390) / 33);

        //构造商品规格自动完成
        let gg_n = document_name == "销售单据" ? 4 : 3;
        let show_th = [
            { name: "名称", width: 60 },
            { name: "材质", width: 80 },
            { name: "规格", width: 80 },
            { name: "状态", width: 100 },
            { name: "售价", width: 60 },
            { name: "库存长度", width: 80 },
            { name: "库存重量", width: 80 },
        ];

        if (dh_div.textContent == "新单据") {
            let data = {
                show_names: show_names,
                lines: table_lines,
                auto_th: show_th,
                dh: dh_div.textContent,
                gg_n: gg_n,     // 自动填充规格单元格的数量
            }

            input_table_init(data);
        }
        else {
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
                    let data = {
                        show_names: show_names,
                        rows: content,
                        lines: table_lines,
                        auto_th: show_th,
                        dh: dh_div.textContent,
                    }

                    input_table_init(data);
                });
        }
    });

//保存、打印和审核 -------------------------------------------------------------------

//保存
document.querySelector('#save-button').addEventListener('click', function () {
    //错误勘察
    if (!error_check()) {
        return false;
    };

    let customer_id = document.querySelector('#supplier-input').getAttribute('data');
    let all_values = document.querySelectorAll('.document-value');

    //构建数据字符串
    let user_name = document.querySelector('#user-name').textContent.split('　')[1];

    let save_str = `${document_bz}${SPLITER}${dh_div.textContent}${SPLITER}${customer_id}${SPLITER}${user_name}${SPLITER}`;

    let n = 0;
    for (let f of document_table_fields) {
        if (f.data_type == "文本") {
            save_str += `${all_values[n].value}${SPLITER}`;
        }
        else if (f.data_type == "整数" || f.data_type == "实数") {
            let value = all_values[n].value ? all_values[n].value : 0;
            save_str += `${value}${SPLITER}`;
        }
        else {
            save_str += `${all_values[n].checked ? "是" : "否"}${SPLITER}`;
        }
        n++;
    }

    let table_data = [];
    let all_rows = document.querySelectorAll('.table-items .has-input');
    for (let row of all_rows) {
        if (row.querySelector('td:nth-child(2) input').value != "") {
            let len = show_names.length;
            let save_str = `${row.querySelector('td:nth-child(2) input').getAttribute('data').split(SPLITER)[0]}${SPLITER}`;

            for (let i = 2; i < len; i++) {
                if (show_names[i].is_save) {
                    if (show_names[i].type == "autocomplete") {
                        let value = row.querySelector(`.${show_names[i].class}`).getAttribute('data').split(SPLITER)[0];
                        save_str = `${value}${SPLITER}`;
                    }
                    if (show_names[i].type == "普通输入" || show_names[i].type == "下拉列表") {     // 下拉列表和二值选一未测试
                        let value = row.querySelector(`.${show_names[i].class}`).value;
                        if (!value) value = row.querySelector(`.${show_names[i].class}`).textContent;
                        save_str += `${value}${SPLITER}`;
                    }
                    else {
                        let value = row.querySelector(`.${show_names[i].class}`).checked ? "是" : "否";
                        save_str += `${value}${SPLITER}`;
                    }
                }
            }
            table_data.push(save_str);
        }
    }

    let data = {
        rights: document_bz,
        document: save_str,
        remember: document.querySelector('#remember-button').textContent,
        items: table_data,
    }

    console.log(data);

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
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
});

//打印
document.querySelector('#print-button').addEventListener('click', function () {
    //错误勘察
    if (!error_check()) {
        return false;
    };

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
                                    { tid: 'configModule.customText', title: '自定义文本', customText: '自定义文本', custom: true, type: 'text' },
                                    { tid: 'configModule.image', title: '图片', data: `/assets/img/logo.png`, type: 'image' },
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
                供应商: document.querySelector('#supplier-input').value,
                客户: document.querySelector('#supplier-input').value,
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
                }
                else {
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
                    row_data["序号"] = row.querySelector('td:nth-child(1)').textContent;
                    row_data["名称"] = row.querySelector('td:nth-child(2) input').value;
                    row_data["材质"] = row.querySelector('td:nth-child(3)').textContent;
                    row_data["规格"] = row.querySelector('td:nth-child(4) input').value;
                    row_data["状态"] = row.querySelector('td:nth-child(5) input').value;

                    let n = 6;
                    // for (let f of product_table_fields) {
                    //     row_data[f.show_name] = row.querySelector(`td:nth-child(${n})`).textContent;
                    //     n++
                    // }

                    row_data["单价"] = row.querySelector(`td:nth-child(${n}) input`).value;
                    row_data["重量"] = row.querySelector(`td:nth-child(${++n}) input`).value;
                    row_data["金额"] = row.querySelector(`td:nth-child(${++n})`).textContent;

                    row_data["备注"] = row.querySelector(`td:nth-child(${++n}) input`).value;

                    table_data.push(row_data);

                    count += Number(row_data["数量"]);
                    sum += Number(row_data["金额"]);
                }
            }

            let row_data = {};
            row_data["序号"] = '合计';
            row_data["数量"] = count;
            row_data["金额"] = sum.toFixed(Number(num_position[1]));

            table_data.push(row_data);

            printData['chinese'] = moneyUppercase(Number(row_data['金额']))
            printData["table"] = table_data;

            hiprintTemplate.print(printData);
        });
});

fetch_print_models(document.querySelector('#document-bz').textContent.trim());

//开新单
document.querySelector('#document-new-button').addEventListener('click', function () {
    window.location = "/buy_in/new";
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
    alert_confirm("单据审核后，编辑需要权限，确认审核吗？", {
        confirmText: "确认",
        cancelText: "取消",
        confirmCallBack: () => {
            fetch(`/make_formal`, {
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
                    }
                    else {
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
    }
    else if (value == "采购退货") {
        print_id = 4;
    }
    else if (value == "商品销售") {
        print_id = 1;
    }
    else if (value == "销售退货") {
        print_id = 2;
    }
    else {
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
    let customer_id = document.querySelector('#supplier-input').getAttribute('data');
    if (customer_id == null) {
        notifier.show('客户或供应商不在库中', 'danger');
        return false;
    }

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
        }
        else if (document_table_fields[i].data_type == "实数") {
            if (all_values[i].value && !regReal.test(all_values[i].value)) {
                notifier.show(`${document_table_fields[i].show_name}输入错误`, 'danger');
                return false;
            }
        }
    }

    let all_rows = document.querySelectorAll('.table-items .has-input');

    let lines = 0;
    for (let row of all_rows) {
        if (row.querySelector('td:nth-child(2) input').value != "") {
            lines = 1;
            let mount = row.querySelector('.mount').value ? row.querySelector('.mount').value : row.querySelector('.mount').textContent;
            if (!regReal.test(row.querySelector('.price').value) || !regReal.test(mount)) {
                notifier.show(`单价或数量输入错误`, 'danger');
                return false;
            }
        }
    }

    if (lines == 0) {
        notifier.show(`表格不能为空`, 'danger');
        return false;
    }

    return true;
}

window.onbeforeunload = function (e) {
    if (edited || input_table_outdata.edited) {
        var e = window.event || e;
        e.returnValue = ("编辑未保存提醒");
    }
}