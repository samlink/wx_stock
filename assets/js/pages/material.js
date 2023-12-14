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
    append_blanks,
    append_cells,
    set_key_move,
    padZero
} from '../parts/tools.mjs';
import {
    build_blank_table, build_items_table, build_out_table, input_table_outdata
} from '../parts/edit_table.mjs';

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

                        // fetch('/fetch_check', {
                        //     method: 'post',
                        //     headers: {
                        //         "Content-Type": "application/json",
                        //     },
                        //     body: JSON.stringify({
                        //         cate: document_name,
                        //         dh: dh_div.textContent,
                        //     }),
                        // })
                        //     .then(response => response.json())
                        //     .then(data => {
                        //         let check = data.split('-');
                        //         let chk = document.querySelector('#check-button');
                        //         if (check[1] != "") {
                        //             chk.textContent = "已质检";
                        //             chk.classList.add('remembered');
                        //             set_readonly();
                        //         } else {
                        //             chk.textContent = "质检";
                        //             chk.classList.remove('remembered');
                        //         }
                        //     });
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

let standart = document.querySelector('#执行标准');
let auto_comp = new AutoInput(standart, "执行标准", "/get_status_auto");
auto_comp.init();

let position = document.querySelector('#库位');
let auto_comp2 = new AutoInput(position, "库位", "/get_status_auto");
auto_comp2.init();

function set_readonly() {
    let all_edit = document.querySelectorAll('.fields-show input');
    for (let edit of all_edit) {
        if (edit.id == "备注") {
            continue;
        }
        edit.disabled = true;
    }
    document.querySelector('#material-add').setAttribute("disabled", true);

    setTimeout(() => {
        document.querySelectorAll('.table-items tbody input').forEach((input) => {
            input.disabled = true;
        });
    }, 100);

    service.edit_button_disabled();
}

function document_top_handle(html, has_date) {
    let fields_show = document.querySelector('.fields-show .table-head');
    fields_show.innerHTML = html;
    let has_auto = document.querySelector('.has-auto');
    let next_auto = document.querySelector('.has-auto+div');

    let auto_doc = document.querySelector('#文本字段6');
    auto_doc.parentNode.classList.add("autocomplete");

    let auto_comp = new AutoInput(auto_doc, "材料采购", "/material_auto", () => {
        build_items(auto_doc.getAttribute("data"));
    });

    auto_comp.init();

    let date = document.querySelector('#日期');

    if (!has_date) {
        date.value = new Date().Format("yyyy-MM-dd");
    }

    //执行一个laydate实例
    laydate.render({
        elem: date,
        showBottom: false,
    });

    if (document.querySelector('#文本字段5')) {
        let da = document.querySelector('#文本字段5');
        laydate.render({
            elem: da,
            showBottom: false,
        })
    }

    // 回车和方向键的移动控制
    let all_input = document.querySelectorAll('.fields-show input');
    let form = document.querySelector('.fields-show');
    set_key_move(all_input, form, 7);
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

// 点击上传炉号质保书
let lu_upload = document.querySelector('#lu_upload');
document.querySelector('#lu_button').addEventListener('click', (e) => {
    let lu = document.querySelector('#炉号').value.trim();
    if (lu == "") {
        notifier.show('请先输入炉号', 'danger');
        return false;
    }

    e.preventDefault();
    lu_upload.click();
});

//上传 pdf 文件
lu_upload.addEventListener('change', () => {
    let lu_btn = document.querySelector('#lu_button');
    let lh = document.querySelector('#炉号').value.trim();
    lu_btn.disabled = true;
    const fd = new FormData();
    fd.append('file', lu_upload.files[0]);
    fetch(`/pdf_in`, {
        method: 'POST',
        body: fd,
    })
        .then(res => res.json())
        .then(content => {
            fetch(`/pdf_in_save`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(lh)
            })
                .then(response => response.json())
                .then(content => {
                    if (content == -2) {
                        alert_confirm("炉号质保书已存在, 是否替换？", {
                            confirmText: "确认",
                            cancelText: "取消",
                            confirmCallBack: () => {
                                fetch(`/pdf_in_save`, {
                                    method: 'post',
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(lh + ' ' + "yyy"),
                                })
                                    .then(response => response.json())
                                    .then(content => {
                                        lu_btn.classList.add('remembered');
                                        notifier.show('质保书成功保存', 'success');
                                    });
                            }
                        });
                    } else {
                        lu_btn.classList.add('remembered');
                        notifier.show('质保书成功保存', 'success');
                    }
                    lu_btn.disabled = "";
                });
        });
});

function build_items(dh) {
    fetch('/get_items', {
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
                let material = obj.split(SPLITER);
                tr += `<tr><td hidden>${material[0]}</td><td>${material[1]}</td>`;
                // let m = material[1].split('　');
                // tr += `<tr><td hidden>${material[0]}</td><td width="20%">${m[0]}</td><td width="30%">${m[1]}</td>
                //        <td width="10%">${m[2]}</td><td width="40%">${m[3]}</td></tr>`;
            });

            document.querySelector(".table-history tbody").innerHTML = tr;

            let lines = document.querySelectorAll(".table-history tbody tr");
            for (let l of lines) {
                l.addEventListener("dblclick", () => {
                    if (document.querySelector('#remember-button').textContent == '已审核' ||
                        document.querySelector('#save-button').disabled == true) {
                        return false;
                    }
                    document.querySelector('#m_id').value = l.querySelector('td:nth-child(1)').textContent;
                    let na = l.querySelector('td:nth-child(2)').textContent.split('　');
                    document.querySelector('#名称').value = na[0];
                    document.querySelector('#材质').value = na[1];
                    document.querySelector('#规格').value = na[2];
                    document.querySelector('#状态').value = na[3];
                    document.querySelector('#炉号').focus();
                    let fa = document.querySelector("#文本字段6").value;
                    let fac;
                    if (fa.split('　')[1]) {
                        fac = fa.split('　')[1];
                    } else {
                        fac = document.querySelector('.table-items tbody>tr .生产厂家').textContent;
                    }
                    document.querySelector('#生产厂家').value = fac;
                })
            }
        });
}

//构建商品规格表字段，字段设置中的右表数据 --------------------------

show_names = [
    {name: "序号", width: 10, class: "序号", type: "普通输入", editable: false, is_save: true, default: ""},
    {name: "名称", width: 40, class: "名称", type: "普通输入", editable: false, is_save: false, default: ""},
    {name: "材质", width: 60, class: "材质", type: "普通输入", editable: false, is_save: false, default: ""},
    {name: "规格", width: 60, class: "规格", type: "普通输入", editable: false, is_save: true, default: ""},
    {name: "状态", width: 80, class: "状态", type: "普通输入", editable: false, is_save: true, default: ""},
    {name: "炉号", width: 100, class: "炉号", type: "普通输入", editable: false, is_save: true, default: ""},
    {
        name: "执行标准",
        width: 120,
        class: "执行标准",
        type: "普通输入",
        editable: false,
        is_save: true,
        default: ""
    },
    {name: "生产厂家", width: 80, class: "生产厂家", type: "普通输入", editable: false, is_save: true, default: ""},
    {name: "库位", width: 60, class: "库位", type: "普通输入", editable: false, is_save: true, default: ""},
    {name: "物料号", width: 60, class: "物料号", type: "普通输入", editable: true, is_save: true, default: ""},
    {name: "长度", width: 30, class: "长度", type: "普通输入", editable: true, is_save: true, default: ""},
    {name: "重量", width: 30, class: "重量", type: "普通输入", editable: false, is_save: true, default: ""},
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
        del_func: sum_weight,  //删除表格行时, 需重算合计重量, 在这里运行回调函数
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
                dh: dh_div.textContent,
                document: document_name,
                calc_func: get_weight,
                del_func: sum_weight,  //删除表格行时, 需重算合计重量, 在这里运行回调函数
            }
            build_items_table(data);
        });
}

function get_weight(input_row) {
    input_row.querySelector('.长度').addEventListener('blur', function () {
        weight(input_row);
        sum_weight();
    });
}

// 理论重量计算
function weight(input_row) {
    let data = {
        long: input_row.querySelector('.长度').value.trim(),
        num: 1,
        name: input_row.querySelector('.名称').textContent.trim(),
        cz: input_row.querySelector('.材质').textContent.trim(),
        gg: input_row.querySelector('.规格').textContent.trim(),
    }

    if (regInt.test(data.long) && regInt.test(data.num)) {
        input_row.querySelector('.重量').textContent = service.calc_weight(data);
    } else {
        input_row.querySelector('.重量').textContent = 0;
    }
}

//计算合计理论重量
function sum_weight() {
    let all_input = document.querySelectorAll('.has-input');
    let sum = 0;
    for (let i = 0; i < all_input.length; i++) {
        sum += Number(all_input[i].querySelector('.重量').textContent);
    }
    if (document.querySelector('#实数字段3')) {
        document.querySelector('#实数字段3').value = sum.toFixed(Number(1));
    }
}

// 将材料数据填入表格
document.querySelector("#material-add").addEventListener('click', function () {
    if (!document.querySelector('#名称').value) {
        notifier.show('采购条目输入有错误', 'danger');
        return false;
    }

    let n = document.querySelector("#数量").value;
    if (!n || !regInt.test(n) || n <= 0) {
        notifier.show('数量输入有错误', 'danger');
        return false;
    }

    fetch(`/fetch_max_num`, {
        method: 'get',
    })
        .then(response => response.json())
        .then(content => {
            //在表内寻找最大值
            let max_num = content;
            let nums = document.querySelectorAll('.table-items .has-input .物料号');
            nums.forEach(num => {
                let v = Number(num.value.replace('M', ''));
                if (max_num < v) {
                    max_num = v;
                }
            });

            show_names[1].value = document.querySelector('#名称').value;
            show_names[2].value = document.querySelector('#材质').value;
            show_names[3].value = document.querySelector('#规格').value;
            show_names[4].value = document.querySelector('#状态').value;
            show_names[5].value = document.querySelector('#炉号').value;
            show_names[6].value = document.querySelector('#执行标准').value;
            show_names[7].value = document.querySelector('#生产厂家').value;
            show_names[8].value = document.querySelector('#库位').value;
            show_names[13].value = document.querySelector('#m_id').value;

            let data = {
                show_names: show_names,
                show_names_fn: function (n) {
                    this.show_names[9].value = `M${padZero(this.material_num + n + 1, 6)}`;
                },
                num: n,
                lines: table_lines,
                dh: dh_div.textContent,
                document: document_name,
                material_num: max_num,
            }

            build_out_table(data);
            edited = 1;
        });

});


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
            let save_str = '';
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

    document.querySelector('#print .print-title').textContent = "五星(天津)石油装备有限公司-原材料入库单";
    document.querySelector('#p-block1').innerHTML = `<p> 单号：${document.querySelector('#dh').textContent}</p>`;
    document.querySelector('#p-block2').innerHTML = `<p>日期：${document.querySelector('#日期').value}</p>`;

    var th = `<tr>
        <th width="3%">序号</th>
        <th width="6%">物料号</th>
        <th width="7%">材质</th>
        <th width="6%">规格</th>
        <th width="8%">状态</th>
        <th width="9%">炉号</th>
        <th width="4%">长度</th>
        <th width="3%">支数</th>
        <th width="7%">执行标准</th>
        <th width="8%">生产厂家</th>
        <th width="6%">重量</th>
    </tr>`;

    document.querySelector('.print-table thead').innerHTML = th;

    let sum = 0;
    let sum_weight = 0;

    let all_rows = document.querySelectorAll('.table-items .has-input');
    let trs = '';
    for (let row of all_rows) {
        trs += `<tr><td>${row.querySelector('td:nth-child(1)').textContent}</td>
                <td>${row.querySelector('td:nth-child(10) input').value}</td>`;

        for (let i = 3; i < 13; i++) {
            if (i == 7) {
                let v = row.querySelector(`td:nth-child(${i})`).textContent;
                trs += `<td>${row.querySelector('td:nth-child(11) input').value}</td>
                        <td>1</td><td>${v}</td>`;
                continue;
            }

            if (i == 9 || i == 10 || i == 11) {
                continue;
            }

            let t = row.querySelector(`td:nth-child(${i}) input`);
            let td = t ? t.value : row.querySelector(`td:nth-child(${i})`).textContent;
            trs += `<td>${td}</td>`;
        }

        trs += '</tr>';

        // sum += Number(row.querySelector(`td:nth-child(10) input`).value);
        sum_weight += Number(row.querySelector(`td:nth-child(12)`).textContent);
    }

    // 补空行
    let len = 9 - all_rows.length;
    trs += append_blanks(len, 11);

    trs += `<tr style="height: 50px"><td colspan="7"></td><td>${all_rows.length}</td>
            <td style="white-space: normal">来料重量：<br> ${document.querySelector('#实数字段1').value}</td>
            <td>实际重量：<br> ${document.querySelector('#实数字段2').value}</td><td>理论重量：<br> ${sum_weight.toFixed(1)}</td>`;

    document.querySelector('.print-table tbody').innerHTML = trs;

    document.querySelector('#p-block5').innerHTML = '<p>采购：</p>';
    document.querySelector('#p-block6').innerHTML = '<p>财务：</p>';
    document.querySelector('#p-block7').innerHTML = '<p>质检：</p>';
    document.querySelector('#p-block8').innerHTML = '<p>仓库：</p>';

    document.querySelector('#print').hidden = false;
    Print('#print', {});
    document.querySelector('#print').hidden = true;

});

// document.querySelector('#check-button').addEventListener('click', function () {
//     if (this.textContent == "已质检") {
//         return false;
//     }
//
//     let dh = dh_div.textContent;
//     let that = this;
//     if (dh == "新单据") {
//         notifier.show('请先保存单据', 'danger');
//         return false;
//     }
//
//     alert_confirm("确认质检吗？", {
//         confirmText: "确认",
//         cancelText: "取消",
//         confirmCallBack: () => {
//             fetch(`/check_in`, {
//                 method: 'post',
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(dh),
//             })
//                 .then(response => response.json())
//                 .then(content => {
//                     if (content != -1) {
//                         that.textContent = '已质检';
//                         that.classList.add('remembered');
//                         notifier.show('质检完成', 'success');
//                     } else {
//                         notifier.show('权限不够', 'danger');
//
//                     }
//                 });
//         }
//     })
// });

//审核单据
document.querySelector('#remember-button').addEventListener('click', function () {
    let formal_data = {
        button: this,
        dh: dh_div.textContent,
        document_name: document_name,
        edited: edited || input_table_outdata.edited,
        readonly_fun: set_readonly,
    }
    service.make_formal(formal_data);
});

//共用事件和函数 ---------------------------------------------------------------------

//保存、打印和审核前的错误检查
function error_check() {
    let all_rows = document.querySelectorAll('.table-items .has-input');
    //检查表头的错误
    if (!service.header_error_check(document_table_fields, all_rows)) {
        return false;
    }
    //检查明细
    for (let row of all_rows) {
        if (row.querySelector('td:nth-child(1)').textContent != "") {
            if (row.querySelector('.物料号').value.trim() == "") {
                notifier.show(`物料号不能为空`, 'danger');
                return false;
            }

            if (row.querySelector('.长度').value && !regInt.test(row.querySelector('.长度').value)) {
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