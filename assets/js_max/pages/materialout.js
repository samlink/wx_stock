import { notifier } from '/assets/js/parts/notifier.mjs';
import * as service from '/assets/js/parts/service.mjs';
import {
    SPLITER,
    regInt,
    regReal,
    append_cells,
    append_blanks, set_key_move
} from '/assets/js/parts/tools.mjs';
import {
    build_blank_table, build_items_table, build_out_table, input_table_outdata
} from '/assets/js/parts/edit_table.mjs';
import { close_modal, modal_init } from "/assets/js/parts/modal.mjs";

let document_table_fields, table_lines, show_names, edited;
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
                fetch(`/fetch_document_ck`, {
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
                        let pic = da[da.length - 3].replace("pic_", "min_");
                        if (pic.startsWith("/upload")) {
                            document.querySelector('#upload-pic').setAttribute('src', `${pic}?${Math.random()}`);
                        }

                        let set_data = {
                            content: data,
                            readonly_fun: set_readonly,
                            focus_fun: () => {
                                setTimeout(() => {
                                    document.querySelector('#文本字段6').focus();
                                }, 200);
                            }
                        }
                        service.set_shens_owner(set_data);
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
    let all_edit = document.querySelectorAll('.fields-show input');
    for (let edit of all_edit) {
        if (edit.id == "备注" || edit.id == "是否欠款") {
            continue;
        }
        edit.disabled = true;
    }

    setTimeout(() => {
        document.querySelectorAll('.table-items tbody input').forEach((input) => {
            input.disabled = true;
        });
    }, 100);

    document.querySelector('#pic-button').setAttribute("disabled", true);

    service.edit_button_disabled();
}

function document_top_handle(html, has_date) {
    let fields_show = document.querySelector('.fields-show');
    fields_show.innerHTML = html;
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
    set_key_move(all_input, form, 5);
    service.set_sumit_shen();

    //提交审核
    document.querySelector('#sumit-shen').addEventListener('click', function () {
        let shen_data = {
            button: this,
            dh: dh_div.textContent,
            document_name: document_name,
            edited: edited || input_table_outdata.edited,
        }
        service.sumit_shen(shen_data);
    });
}

service.get_materials_docs("/materialsale_docs", "商品销售", build_items);

// 已保存的单据
fetch('/materialsale_saved_docs', {
    method: 'post',
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify("商品销售"),
})
    .then(response => response.json())
    .then(content => {
        let tr = "";
        content.forEach(obj => {
            tr += `<tr><td>${obj.label}</td><td hidden>${obj.id}</td></tr>`;
        });

        document.querySelector(".table-save tbody").innerHTML = tr;

        let lines = document.querySelectorAll(".table-save tbody tr");
        for (let l of lines) {
            l.addEventListener("dblclick", () => {
                if (document.querySelector('#remember-button').textContent == "已审核" ||
                    document.querySelector('#save-button').disabled == true) {
                    return false;
                }
                let dh = l.querySelector('td:nth-child(2)').textContent.trim();
                window.location.href = "/material_out/" + dh;
            });
        }
    });

let show_th = [
    { name: "物料号", width: 100 },
    { name: "名称", width: 60 },
    { name: "材质", width: 80 },
    { name: "规格", width: 80 },
    { name: "状态", width: 100 },
    { name: "炉号", width: 100 },
    { name: "库存长度", width: 80 },
];

let auto_data = [{
    n: 10,
    cate: "",
    auto_url: `/material_auto_out`,
    show_th: show_th,
    cb: fill_gg,
    cf: () => {  //前置函数, 用于动态构建查询字符串
        let stat = document.querySelector('.table-items .inputting .状态').textContent.trim();
        return `${document.querySelector('.table-items .inputting .m_id').textContent.trim()}　
                ${document.querySelector('.table-items .inputting .规格').textContent.trim()}　
                ${stat.replace('+', SPLITER)}　
                ${document.querySelector('.table-items .inputting .长度').value.trim()}`
    }
}];

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
            document.querySelector("#文本字段4").setAttribute("data", info[2]);
            // document.querySelector("#备注").value = info[3];
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
                let done = "";
                
                if (material[4] == "已") {
                    done = "class='red'";
                }
                else if(material[4] == "分"){
                    done = "class='yellow'";
                }

                tr += `<tr ${done}><td hidden>${material[0]}</td><td>${material[1]}</td>
                    <td hidden>${material[2]}</td><td hidden>${material[3]}</td></tr>`;
            });

            document.querySelector(".table-history tbody").innerHTML = tr;

            let lines = document.querySelectorAll(".table-history tbody tr");
            for (let l of lines) {
                l.addEventListener("dblclick", () => {
                    if (document.querySelector('#remember-button').textContent == '已审核' ||
                        document.querySelector('#save-button').disabled == true) {
                        return false;
                    }
                    let value = l.querySelector('td:nth-child(2)').textContent.split('　');
                    show_names[1].value = value[0];
                    show_names[2].value = value[1];
                    show_names[3].value = value[2];
                    show_names[4].value = value[3];
                    show_names[6].value = value[4];
                    show_names[7].value = value[5];
                    show_names[8].value = value[4] * value[5];
                    show_names[9].value = "";
                    show_names[12].value = value[6];
                    show_names[13].value = l.querySelector('td:nth-child(1)').textContent;
                    show_names[14].value = l.querySelector('td:nth-child(3)').textContent;
                    show_names[15].value = l.querySelector('td:nth-child(4)').textContent;

                    let data = {
                        show_names: show_names,
                        lines: table_lines,
                        dh: dh_div.textContent,
                        auto_data: auto_data,
                        document: document_name,
                        calc_func: get_weight,
                        calc_func2: weight,
                    }

                    build_out_table(data);
                    edited = 1;
                })
            }
        });
}

let ku = new Map();  // 记忆物料库存长度
function fill_gg() {
    let field_values = document.querySelector(`.inputting .auto-input`).getAttribute("data").split(SPLITER);
    let lh_input = document.querySelector(`.inputting .炉号`).textContent = field_values[6];
    document.querySelector(`.inputting .重量`).focus();
    ku.set(field_values[1], Number(field_values[7]));
}

//构建商品规格表字段，字段设置中的右表数据 --------------------------

show_names = [
    { name: "序号", width: 10, class: "序号", type: "普通输入", editable: false, is_save: true },
    { name: "名称", width: 40, class: "名称", type: "普通输入", editable: false, is_save: false },
    { name: "材质", width: 60, class: "材质", type: "普通输入", editable: false, is_save: false },
    { name: "规格", width: 50, class: "规格", type: "普通输入", editable: false, is_save: false },
    { name: "状态", width: 80, class: "状态", type: "普通输入", editable: false, is_save: false },
    { name: "炉号", width: 100, class: "炉号", type: "普通输入", editable: false, is_save: false },
    { name: "长度", width: 30, class: "长度", type: "普通输入", editable: true, is_save: true },
    { name: "数量", width: 20, class: "数量", type: "普通输入", editable: true, is_save: true },
    { name: "总长度", width: 30, class: "总长度", type: "普通输入", editable: false, is_save: false },
    {
        name: "物料号",
        width: 100,
        class: "物料号",
        type: "autocomplete",
        editable: true,
        is_save: true,
        no_button: true
    },
    { name: "重量", width: 30, class: "重量", type: "普通输入", editable: true, is_save: true, },
    { name: "理论重量", width: 40, class: "理论重量", type: "普通输入", editable: false, is_save: true, },
    {
        name: "　备注",
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
        is_save: false,
        css: 'style="width:0%; border-left:none; border-right:none; color:white"',
    }, {
        name: "",
        width: 0,
        class: "s_id",
        type: "普通输入",
        editable: false,
        is_save: true,
        css: 'style="width:0%; border-left:none; border-right:none; color:white"',
    }, {
        name: "",
        width: 0,
        class: "d_id",
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
        calc_func: get_weight,
        change_func: sum_money,         //新加载或删除变动时运行
    }

    build_blank_table(data);
} else {
    // let url = document_name == "入库单据" ?  : "/fetch_document_items"
    fetch("/fetch_document_items_ck", {
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
                auto_data: auto_data,
                dh: dh_div.textContent,
                document: document_name,
                calc_func: get_weight,      // 自动计算的函数, 可带参数
                change_func: sum_money,         //新加载或删除变动时运行
            }

            build_items_table(data);
        });
}

//计算合计
function sum_money() {
    let all_input = document.querySelectorAll('.has-input');
    let sum_n = 0, sum_weight = 0, sum_weight_s = 0;

    for (let i = 0; i < all_input.length; i++) {
        let mount = Number(all_input[i].querySelector('.理论重量').textContent);
        let n = Number(all_input[i].querySelector('.数量').value);
        let weight_s = Number(all_input[i].querySelector('.重量').value);

        sum_n += n;
        sum_weight += mount;
        sum_weight_s += weight_s;
    }

    document.querySelector('#sum-money').innerHTML = `数量：${sum_n}，  实际重量：${sum_weight_s.toFixed(1)} kg， 理论重量：${sum_weight.toFixed(1)} kg `;
}

function get_weight(input_row) {
    input_row.querySelector('.数量').addEventListener('blur', function () {
        let mount = input_row.querySelector('.数量').value;
        let long = input_row.querySelector('.长度').value;
        if (regInt.test(mount) && regInt.test(long)) {
            input_row.querySelector('.总长度').textContent = mount * long;
            weight(input_row);
            sum_money();
        } else {
            input_row.querySelector('.总长度').textContent = 0;
        }
    });

    input_row.querySelector('.长度').addEventListener('blur', function () {
        let mount = input_row.querySelector('.数量').value;
        let long = input_row.querySelector('.长度').value;
        if (regInt.test(mount) && regInt.test(long)) {
            input_row.querySelector('.总长度').textContent = mount * long;
            weight(input_row);
            sum_money();
        } else {
            input_row.querySelector('.总长度').textContent = 0;
        }
    });

    input_row.querySelector('.重量').addEventListener('blur', function () {
        sum_money();
    });

    input_row.querySelector('.auto-input').addEventListener('blur', function () {
        weight(input_row);
        sum_money();
    })
}

// 出库时使用的理论重量计算
function weight(input_row) {
    let data = {
        long: input_row.querySelector('.总长度').textContent.trim(),
        num: 1,
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

// 图片处理 -----------------------------------------------------------------
service.handle_pic(dh_div, "/pic_in_save");
modal_init();

//保存、打印、质检、审核 -------------------------------------------------------------------

//保存
document.querySelector('#save-button').addEventListener('click', function () {
    //错误勘察
    if (!error_check() || !ku_check()) {
        return false;
    }

    let all_values = document.querySelectorAll('.document-value');
    let custid = document.querySelector('#文本字段4').getAttribute("data");
    //构建表头存储字符串，将存入单据中
    let save_str = `${document_bz}${SPLITER}${dh_div.textContent}${SPLITER}${custid}${SPLITER}`;

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
        rights: document_bz,
        document: save_str,
        remember: document.querySelector('#remember-button').textContent,
        items: table_data,
    }

    // console.log(data);

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
    document.querySelector('#print .print-title').textContent = "五星(天津)石油装备有限公司-下料过磅单";
    document.querySelector('#p-block1').innerHTML = `<p>客户：${document.querySelector('#文本字段4').value}</p>`;
    document.querySelector('#p-block2').innerHTML = `<p>日期：${document.querySelector('#日期').value}</p>`;
    document.querySelector('#p-block3').innerHTML = `<p>合同号：${document.querySelector('#文本字段5').value}</p>`;
    document.querySelector('#p-block4').innerHTML = `<p> 单号：${document.querySelector('#dh').textContent}</p>`;

    var th = `<tr>
        <th class = "center" width = "3%">序号</th>
        <th class="center" width="7%">名称</th>
        <th class="center" width="9%">材质</th>
        <th class="center" width="6%">规格</th>
        <th class="center" width="10%">状态</th>
        <th class="center" width="7%">下料长度</th>
        <th class="center" width="3%">支数</th>
        <th class="center" width="10%">料号</th>     
        <th class="center" width="8%">重量</th>
        <th class="center" width="7%">理论重量</th>
        <th class="center" width="8%">剩余长度</th>
        <th class="center" width="10%">备注</th>
    </tr>`;

    document.querySelector('.print-table thead').innerHTML = th;

    let sum = 0;
    let weight = 0;
    let weight_s = 0;
    let all_rows = document.querySelectorAll('.table-items .has-input');
    let trs = '';
    for (let row of all_rows) {
        let printable = [];
        for (let i = 1; i < 14; i++) {
            if (i == 6 || i == 9) {
                continue;
            }
            let t = row.querySelector(`td:nth-child(${i}) input`);
            let td = t != undefined ? t.value : row.querySelector(`td:nth-child(${i})`).textContent;
            td = td.trim() == "0" ? "" : td;
            printable.push(td);
        }

        trs += '<tr>';
        for (let i = 0; i < 12; i++) {
            if (i == 10) {              // 剩余长度
                trs += `<td></td>`;
                continue;
            }
            let v = printable.shift();
            trs += `<td>${v}</td>`;
        }
        trs += '</tr>';
        sum += Number(row.querySelector(`td:nth-child(8) input`).value);
        weight += Number(row.querySelector('td:nth-child(12)').textContent.trim());
        weight_s += Number(row.querySelector('.重量').value);
    }

    // 补空行
    let len = 5 - all_rows.length;
    trs += append_blanks(len, 13);

    trs += `<tr class="sum-cell"><td class="center" colspan="2">合计</td>${append_cells(4)}
            <td>${sum}</td>${append_cells(1)}<td>${weight_s != 0 ? weight_s.toFixed(1) : ''}</td><td>${weight.toFixed(1)}</td>${append_cells(2)}</tr>`;

    document.querySelector('.print-table tbody').innerHTML = trs;
    document.querySelector('#p-block5').innerHTML = `<p>制单（仓库）：${document.querySelector('#user-name').textContent.split('　')[1]}</p>`;
    document.querySelector('#p-block6').innerHTML = '<p>审核（销售）：</p>';
    document.querySelector('#p-block7').innerHTML = '<p>下料员：</p>';
    document.querySelector('#p-block8').innerHTML = '<p>过磅员：</p>';
    document.querySelector('#print .print-note').innerHTML = '<p>注：此单一式三联，第一联（白）仓库，第二联（红）销售，第三联（黄）财务</p>';

    document.querySelector('#print').hidden = false;
    Print('#print', {});
    document.querySelector('#print').hidden = true;
});

//审核单据
document.querySelector('#remember-button').addEventListener('click', function () {
    let formal_data = {
        button: this,
        dh: dh_div.textContent,
        document_name: document_name,
        edited: edited || input_table_outdata.edited,
        readonly_fun: set_readonly,
        xsdh: document.querySelector('#文本字段6').value,    //销售单号，用于确认出库完成
        after_func: make_complete  //审核后，确认出库完成
    }
    service.make_formal(formal_data);
});

//审核时，将对销售单做出库完成的确认并填入实际重量
function make_complete(xsdh, dh) {
    // 将实际重量填入销售单
    fetch(`/make_xs_wight`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dh),
    });

    // 出库完成确认
    fetch(`/make_ck_complete`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(xsdh),
    });
}

//共用事件和函数 ---------------------------------------------------------------------

//保存、打印和审核前的错误检查
function error_check() {
    let all_rows = document.querySelectorAll('.table-items .has-input');
    //检查表头的错误
    if (!service.header_error_check(document_table_fields, all_rows)) {
        return false;
    }
    for (let row of all_rows) {
        if (row.querySelector('td:nth-child(1)').textContent != "") {
            if (row.querySelector('.auto-input').value.trim() == "") {
                notifier.show(`物料号不能为空`, 'danger');
                return false;
            }

            if (row.querySelector('.重量').value && !regReal.test(row.querySelector('.重量').value)) {
                notifier.show(`重量输入错误`, 'danger');
                return false;
            } else if (!row.querySelector('.重量').value) {
                row.querySelector('.重量').value = 0;
            }

            let wl = row.querySelector('.物料号')
            if (wl.getAttribute("data") != "undefined" && 
                wl.getAttribute("data").split(SPLITER).length == 1 && dh_div.textContent == "新单据") {
                notifier.show(`${wl.value} 不在库中`, 'danger');
                return false;
            }
        }
    }
    return true;
}

function ku_check() {
    let now_ku = new Map();
    let all_rows = document.querySelectorAll('.table-items .has-input');

    for (let row of all_rows) {
        if (row.querySelector('.名称').textContent.trim() != "") {
            let key = row.querySelector('.物料号').value.trim();
            let long = row.querySelector('.总长度').textContent.trim();

            if (now_ku.has(key)) {
                now_ku.set(key, now_ku.get(key) + Number(long));
            } else {
                now_ku.set(key, Number(long));
            }
        }
    }

    for (let [key, value] of now_ku) {
        if (ku.has(key) && value > ku.get(key)) {
            notifier.show(`${key} 超过库存长度}`, 'danger');
            return false;
        }
    }
    return true;
}

window.onbeforeunload = function (e) {
    if (edited || input_table_outdata.edited) {
        e.returnValue = ("编辑未保存提醒");
    }
}