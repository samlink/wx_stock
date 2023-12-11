import {notifier} from '../parts/notifier.mjs';
import {alert_confirm} from '../parts/alert.mjs';
import {AutoInput} from '../parts/autocomplete.mjs';
import * as service from '../parts/service.mjs';
import {
    SPLITER,
    regInt,
    regReal,
    regDate,
    moneyUppercase,
    checkFileType,
    append_cells,
    append_blanks, set_key_move
} from '../parts/tools.mjs';
import {
    build_blank_table, build_items_table, build_out_table, input_table_outdata
} from '../parts/edit_table.mjs';
import {close_modal} from "../parts/modal.mjs";

let document_table_fields, table_lines, show_names, edited;
let document_bz = document.querySelector('#document-bz').textContent.trim();
let dh_div = document.querySelector('#dh');

//单据顶部信息构造显示，并添加事件处理 -----------------------------------------------------------

let document_name = "发货单据";

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

                        let dh = document.querySelector("#文本字段6").value;
                        build_items(dh);

                        let da = data.split(SPLITER);
                        document.querySelector('#owner').textContent = `[ ${da[da.length - 1]} ]`;

                        service.only_worker(da[da.length - 1], set_readonly);

                        let rem = document.querySelector('#remember-button');
                        if (da[da.length - 2] != "") {
                            rem.textContent = "已审核";
                            rem.classList.add('remembered');
                            set_readonly();
                        } else {
                            rem.textContent = "审核";
                            rem.classList.remove('remembered');
                        }
                        setTimeout(() => {
                            document.querySelector('#文本字段6').focus();
                        }, 200);
                    });
            } else {
                let html = service.build_inout_form(content);
                document_top_handle(html, false);
                document.querySelector('#remember-button').textContent = '审核';
                setTimeout(() => {
                    document.querySelector('#文本字段6').focus();
                }, 200);
            }
        }
    });

function set_readonly() {
    let all_edit = document.querySelectorAll('.document-value');
    for (let edit of all_edit) {
        if (edit.id == "备注") {
            continue;
        }
        edit.disabled = true;
    }

    setTimeout(() => {
        document.querySelectorAll('.table-items tbody input').forEach((input) => {
            input.disabled = true;
        });
    }, 100);

    service.edit_button_disabled();
}

function document_top_handle(html, has_date) {
    let fields_show = document.querySelector('.fields-show');
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

    let auto_comp = new AutoInput(auto_doc, "销售出库", "/materialout_auto", () => {
        build_items(auto_doc.getAttribute("data"));
    });

    auto_comp.init();

    // document.querySelector('#文本字段5').parentNode.parentNode.style.cssText = "margin-left: 250px;";
    let date = document.querySelector('#日期');
    if (!has_date) {
        date.value = new Date().Format("yyyy-MM-dd");
    }

    //执行一个laydate实例
    laydate.render({
        elem: date,
        showBottom: false,
    });

    // 回车和方向键的移动控制
    let all_input = document.querySelectorAll('.fields-show input');
    let form = document.querySelector('.fields-show');
    set_key_move(all_input, form, 9);
}

function build_items(dh) {
    fetch('/get_trans_info', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dh),
    })
        .then(response => response.json())
        .then(content => {
            let info = content.split(SPLITER);
            document.querySelector("#文本字段3").value = info[0];
            document.querySelector("#文本字段5").value = info[1];
            document.querySelector("#文本字段8").value = info[2];
            document.querySelector("#文本字段9").value = info[3];
            document.querySelector("#文本字段1").value = info[4];
            document.querySelector("#文本字段4").value = info[5];
        });

    fetch('/get_items_trans', {
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
                    if (document.querySelector('#remember-button').textContent == "已审核") {
                        return false;
                    }
                    let value = l.querySelector('td:nth-child(2)').textContent.split('　');
                    show_names[1].value = value[0];
                    show_names[2].value = value[1];
                    show_names[3].value = value[2];
                    show_names[4].value = value[3];
                    show_names[5].value = value[4];
                    show_names[6].value = value[5];
                    show_names[7].value = value[6];
                    show_names[8].value = value[7];
                    show_names[9].value = value[8];
                    show_names[10].value = value[9];
                    show_names[11].value = Number(value[9] * value[8]).toFixed(2);
                    show_names[13].value = l.querySelector('td:nth-child(1)').textContent;

                    let data = {
                        show_names: show_names,
                        lines: table_lines,
                        dh: dh_div.textContent,
                        document: document_name,
                        calc_func: calculate,
                    }

                    build_out_table(data);
                    edited = 1;
                    document.querySelector('#文本字段6').focus();
                })
            }
        });
}

function calculate(input_row) {
    input_row.querySelector('.数量').addEventListener('blur', function () {
        let mount = input_row.querySelector('.数量').value;
        if (regInt.test(mount)) {
            weight(input_row);
        } else {
            input_row.querySelector('.理论重量').textContent = 0;
        }
    });

    input_row.querySelector('.实际重量').addEventListener('blur', function () {
        let mount = input_row.querySelector('.实际重量').value;
        let price = input_row.querySelector('.单价').textContent;
        if (regReal.test(mount)) {
            input_row.querySelector('.总价').textContent = (price * mount).toFixed(2);
        } else {
            input_row.querySelector('.总价').textContent = 0;
        }
    });
}

// 出入库时使用的理论重量计算
function weight(input_row) {
    let data = {
        long: input_row.querySelector('.长度').textContent.trim(),
        num: input_row.querySelector('.数量').value.trim(),
        name: input_row.querySelector('.名称').textContent.trim(),
        cz: input_row.querySelector('.材质').textContent.trim(),
        gg: input_row.querySelector('.规格').textContent.trim(),
    }
    if (regInt.test(data.long) && regInt.test(data.num)) {
        input_row.querySelector('.理论重量').textContent = service.calc_weight(data);
    } else {
        input_row.querySelector('.理论重量').textContent = 0;
    }
}

//构建商品规格表字段，字段设置中的右表数据 --------------------------

show_names = [
    {name: "序号", width: 10, class: "序号", type: "普通输入", editable: false, is_save: true},
    {name: "名称", width: 40, class: "名称", type: "普通输入", editable: false, is_save: false},
    {name: "材质", width: 60, class: "材质", type: "普通输入", editable: false, is_save: false},
    {name: "规格", width: 60, class: "规格", type: "普通输入", editable: false, is_save: true},
    {name: "状态", width: 80, class: "状态", type: "普通输入", editable: false, is_save: true},
    {name: "炉号", width: 80, class: "炉号", type: "普通输入", editable: false, is_save: true},
    {name: "长度", width: 30, class: "长度", type: "普通输入", editable: false, is_save: true},
    {name: "数量", width: 30, class: "数量", type: "普通输入", editable: true, is_save: true},
    {name: "理论重量", width: 30, class: "理论重量", type: "普通输入", editable: false, is_save: true,},
    {name: "实际重量", width: 30, class: "实际重量", type: "普通输入", editable: true, is_save: true,},
    {name: "单价", width: 30, class: "单价", type: "普通输入", editable: false, is_save: true},
    {name: "总价", width: 60, class: "总价", type: "普通输入", editable: false, is_save: false, no_button: true},
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
table_lines = Math.floor((document.querySelector('body').clientHeight - 395) / 33);

if (dh_div.textContent == "新单据") {
    let data = {
        show_names: show_names,
        lines: table_lines,
        dh: dh_div.textContent,
        document: document_name,
    }

    build_blank_table(data);
} else {
    fetch("/fetch_trans_items", {
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
                rows: content,              //已有单据需要 rows
                lines: table_lines,
                dh: dh_div.textContent,
                document: document_name,
                calc_func: calculate,
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
            let value = f.show_name.indexOf("单号") == -1 ? all_values[n].value : all_values[n].value.split('　')[0];
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
        rights: "运输发货",
        document: save_str,
        remember: "",
        items: table_data,
    }

    // console.log(data);

    fetch(`/save_stransport`, {
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

        document.querySelector('#print .print-title').innerHTML = "<img src='/assets/img/logo_blue.png'/> 五星(天津)石油装备有限公司-销售发货单";

        let p = `<p style="padding:0">客户名称：${document.querySelector('#文本字段5').value}</p>
                        <p>客户地址：${document.querySelector('#文本字段1').value}</p>`;
        document.querySelector('#p-block1').innerHTML = p;

        let contact = `收货人/电话：${document.querySelector('#文本字段8').value} ${document.querySelector('#文本字段9').value}`;
        p = `<p>发货日期：${document.querySelector('#日期').value}</p><p>${contact}</p>`;
        document.querySelector('#p-block2').innerHTML = p;

        p = `<p>合同号：${document.querySelector('#文本字段3').value}</p><p>车号：${document.querySelector('#文本字段2').value}</p>`;
        document.querySelector('#p-block3').innerHTML = p;

        p = `<p>出库单号：${document.querySelector('#文本字段6').value.split('　')[0]}</p>
         <p>销售员：${document.querySelector('#owner').textContent.split(']')[0].replace('[', '')}</p>`;
        document.querySelector('#p-block4').innerHTML = p;

        var th = `<tr>
        <th width="3%">序号</th>
        <th width="7%">商品名称</th>
        <th width="8%">材质</th>
        <th width="6%">规格</th>
        <th width="10%">状态</th>
        <th width="10%">炉号</th>
        <th width="5%">长度</th>
        <th width="3%">支数</th>
        <th width="6%">理论重量</th>
        <th width="6%">实际重量</th>
        <th width="5%">单价<br>(元/kg)</th>
        <th width="6%">总价</th>
        <th width="8%">备注</th>
    </tr>`;

        document.querySelector('.print-table thead').innerHTML = th;

        let sum_money = 0;
        let sum_weight = 0;

        let all_rows = document.querySelectorAll('.table-items .has-input');
        let trs = '';
        for (let row of all_rows) {
            trs += '<tr>';
            for (let i = 1; i < 14; i++) {
                let t = row.querySelector(`td:nth-child(${i}) input`);
                let td = t ? t.value : row.querySelector(`td:nth-child(${i})`).textContent;
                trs += `<td>${td}</td>`;
            }

            trs += '</tr>';

            sum_weight += Number(row.querySelector(`td:nth-child(10) input`).value);
            sum_money += Number(row.querySelector(`td:nth-child(12)`).textContent);
        }

        // 补空行
        let len = 6 - all_rows.length;
        trs += append_blanks(len, 13);

        trs += `<tr><td colspan="2">合计</td>${append_cells(7)}
                              <td>${sum_weight}</td><td></td><td>${sum_money}</td><td></td>`;

        trs += `<tr><td colspan="2">合计（大写）</td><td colspan="11">${moneyUppercase(sum_money)}</td>`;
        trs += `<tr style="height: 40px"><td colspan="2">备注</td><td colspan="11"></td>`;

        document.querySelector('.print-table tbody').innerHTML = trs;

        document.querySelector('#p-block5').innerHTML = '<p>制单人：</p>';
        document.querySelector('#p-block6').innerHTML = '<p>财务：</p>';
        document.querySelector('#p-block7').innerHTML = '<p>提货司机：</p>';
        document.querySelector('#p-block8').innerHTML = '<p>客户确认：</p>';

        document.querySelector('#print').hidden = false;
        Print('#print', {});
        document.querySelector('#print').hidden = true;
    }
);

//审核单据
document.querySelector('#remember-button').addEventListener('click', function () {
    if (document.querySelector('#remember-button').textContent.trim() == "已审核") {
        return false;
    }
    let formal_data = {
        button: this,
        dh: dh_div.textContent,
        document_name: document_name,
        edited: edited || input_table_outdata.edited,
        readonly_fun: set_readonly,
    }
    service.make_formal(formal_data);
});

//错误检查, 保存、打印和审核前
function error_check() {
    let all_rows = document.querySelectorAll('.table-items .has-input');
    if (!service.header_error_check(document_table_fields, all_rows)) {
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