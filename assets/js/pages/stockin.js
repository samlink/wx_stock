// import { notifier } from '/assets/js/parts/notifier.mjs';
// import * as service from '/assets/js/parts/service.mjs';
// import { SPLITER, regInt, regReal, set_key_move, padZero } from '/assets/js/parts/tools.mjs';
// import {
//     appand_edit_row,
//     build_blank_table,
//     build_items_table,
//     edit_table.input_table_outdata
// } from '/assets/js/parts/edit_table.mjs';
let page_stockin = function () {
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

                            let set_data = {
                                content: data,
                                readonly_fun: set_readonly,
                                focus_fun: () => {
                                    setTimeout(() => {
                                        document.querySelector('.table-items tbody .原物料号').focus();
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
                        document.querySelector('.table-items tbody .名称').focus();
                    }, 200);
                }
            }
        });

    function set_readonly() {
        let all_edit = document.querySelectorAll('.fields-show input');
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
        let fields_show = document.querySelector('.fields-show .table-head');
        fields_show.innerHTML = html;
        let has_auto = document.querySelector('.has-auto');
        let next_auto = document.querySelector('.has-auto+div');

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
        set_key_move(all_input, form, 2);
        service.set_sumit_shen();
        //提交审核
        document.querySelector('#sumit-shen').addEventListener('click', function () {
            let shen_data = {
                button: this,
                dh: dh_div.textContent,
                document_name: document_name,
                edited: edited || edit_table.input_table_outdata.edited,
            }
            service.sumit_shen(shen_data);
        });
    }

    //构建商品规格表字段，字段设置中的右表数据 --------------------------

    show_names = [
        { name: "序号", width: 10, class: "序号", type: "普通输入", editable: false, is_save: true, default: "" },
        {
            name: "原物料号",
            width: 60,
            class: "原物料号",
            type: "autocomplete",
            editable: true,
            is_save: false,
            no_button: true,
            default: ""
        },
        {
            name: "名称",
            width: 60,
            class: "名称",
            type: "普通输入",
            editable: false,
            is_save: false,
            default: ""
        },
        { name: "材质", width: 60, class: "材质", type: "普通输入", editable: false, is_save: false, default: "" },
        { name: "规格", width: 60, class: "规格", type: "普通输入", editable: false, is_save: true, default: "" },
        {
            name: "状态",
            width: 80,
            class: "状态",
            type: "普通输入",
            editable: false,
            is_save: true,
            default: ""
        },
        {
            name: "执行标准",
            width: 120,
            class: "执行标准",
            type: "普通输入",
            editable: false,
            is_save: true,
            // save: "value",
            // no_button: true,
            default: ""
        },
        { name: "炉号", width: 100, class: "炉号", type: "普通输入", editable: false, is_save: true, default: "" },
        {
            name: "生产厂家",
            width: 80,
            class: "生产厂家",
            type: "普通输入",
            editable: false,
            is_save: true,
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
        { name: "物料号", width: 60, class: "物料号", type: "普通输入", editable: false, is_save: true, default: "" },
        { name: "长度", width: 30, class: "长度", type: "普通输入", editable: true, is_save: true, default: "" },
        { name: "理论重量", width: 30, class: "重量", type: "普通输入", editable: false, is_save: true, default: "" },
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
    table_lines = Math.floor((document.querySelector('body').clientHeight - 395) / 33);

    let show_th = [
        { name: "物料号", width: 60 },
        { name: "名称", width: 60 },
        { name: "材质", width: 80 },
        { name: "规格", width: 80 },
        { name: "状态", width: 100 },
        { name: "执行标准", width: 100 },
        { name: "炉号", width: 100 },
        { name: "生产厂家", width: 100 },
        { name: "库存长度", width: 80 },
    ];

    let auto_data = [{
        n: 2,
        cate: "1",
        auto_url: `/material_auto_sotckout`,
        show_th: show_th,
        type: "table",
        cb: fill_gg,
    }, {
        n: 10,
        cate: "库位",
        auto_url: `/get_status_auto`,
        type: "simple",
    },];

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

        edit_table.build_blank_table(data);
        edit_table.appand_edit_row();
    } else {
        fetch("/fetch_document_items_tr", {
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

                edit_table.build_items_table(data);
                edit_table.appand_edit_row();
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

    function fill_gg() {
        let field_values = document.querySelector(`.inputting .auto-input`).getAttribute("data").split(SPLITER);
        let n = 3;   //从第 3 列开始填入数据
        let num = 7;  //填充的单元格个数
        for (let i = 2; i < 2 + num; i++) {     //不计末尾的库存和售价两个字段
            let val = field_values[i];
            if (show_names[i].type == "普通输入" && show_names[i].editable) {
                document.querySelector(`.inputting td:nth-child(${n}) input`).value = val;
            } else if (show_names[i].type == "普通输入" && !show_names[i].editable) {
                document.querySelector(`.inputting td:nth-child(${n})`).textContent = val;
            }
            n++;
        }
        // 将商品id 存入最后一个单元格
        document.querySelector(`.inputting td:last-child`).textContent = field_values[0];

        fetch(`/fetch_max_num`, {
            method: 'get',
        })
            .then(response => response.json())
            .then(content => {
                //在表内寻找最大值
                let max_num = content;
                let nums = document.querySelectorAll('.table-items .has-input .物料号');
                nums.forEach(num => {
                    let v = Number(num.textContent.replace('M', ''));
                    if (max_num < v) {
                        max_num = v;
                    }
                });
                document.querySelector('.table-items .inputting .物料号').textContent =
                    `M${padZero(max_num + 1, 6)}`;
            });

        let focus_input = document.querySelector(`.inputting .库位`);
        focus_input.focus();

        edit_table.appand_edit_row();
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
                // save_str = row.querySelector('.原物料号').getAttribute("data").split(SPLITER)[0] + SPLITER;
                save_str += service.build_save_items(0, row, show_names);
                save_str += row.querySelector('.原物料号').value;
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
                    edit_table.input_table_outdata.edited = false;
                } else {
                    notifier.show('权限不够，操作失败', 'danger');
                }
            });
    });

    //审核单据
    document.querySelector('#remember-button').addEventListener('click', function () {
        let formal_data = {
            button: this,
            dh: dh_div.textContent,
            document_name: document_name,
            edited: edited || edit_table.input_table_outdata.edited,
            readonly_fun: set_readonly,
        }
        service.make_formal(formal_data);
    });

    //共用事件和函数 ---------------------------------------------------------------------

    //错误检查, 用于保存, 打印和审核
    function error_check() {
        let all_rows = document.querySelectorAll('.table-items .has-input');
        service.header_error_check(document_table_fields, all_rows);

        for (let row of all_rows) {
            if (row.querySelector('.材质').textContent.trim() != "") {
                if (row.querySelector('.物料号').textContent.trim() == "") {
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
        if (edited || edit_table.input_table_outdata.edited) {
            var e = window.event || e;
            e.returnValue = ("编辑未保存提醒");
        }
    }
}();