// import { notifier } from '/assets/js/parts/notifier.mjs';
// import * as service from '/assets/js/parts/service.mjs';
// import {
//     SPLITER,
//     regReal,
//     set_key_move
// } from '/assets/js/parts/tools.mjs';
// import {
//     appand_edit_row, build_blank_table, build_items_table, input_table_outdata
// } from '/assets/js/parts/edit_table.mjs';
// import { modal_init } from "/assets/js/parts/modal.mjs";
let page_kp = function () {
    let document_table_fields, table_lines, show_names, edited;
    let document_bz = document.querySelector('#document-bz').textContent.trim();
    let dh_div = document.querySelector('#dh');

    //单据顶部信息构造显示，并添加事件处理 -----------------------------------------------------------

    const document_name = "销售开票";

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
                    // 加载已有单据的表头内容
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
                            let values = data.split(SPLITER);
                            let len = values.length;
                            let customer = document.querySelector('#文本字段2');
                            customer.value = values[2];
                            customer.setAttribute('data', values[len - 4]);

                            let pic = values[values.length - 3].replace("pic_", "min_");
                            if (pic.startsWith("/upload")) {
                                document.querySelector('#upload-pic').setAttribute('src', `${pic}?${Math.random()}`);
                            }

                            let set_data = {
                                content: data,
                                readonly_fun: set_readonly,
                                focus_fun: () => { }
                            }
                            service.set_shens_owner(set_data);

                            let dh = document.querySelector('#文本字段6').value;
                            fetch_others(dh);

                        });
                } else {
                    let html = service.build_inout_form(content);
                    document_top_handle(html, false);
                    document.querySelector('#remember-button').textContent = '审核';
                }
            }
        });

    function document_top_handle(html, has_date) {
        document.querySelector('.fields-show').innerHTML = html;

        let date = document.querySelector('#日期');
        if (!has_date) {
            date.value = new Date().Format("yyyy-MM-dd");
        }

        laydate.render({
            elem: date,
            showBottom: false,
        });

        let all_input = document.querySelectorAll('.fields-show input');
        let form = document.querySelector('.fields-show');
        set_key_move(all_input, form, all_input.length - 1);
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

    show_names = [
        { name: "序号", width: 40, class: "序号", type: "普通输入", editable: false, is_save: true, default: 1 },
        {
            name: "名称",
            width: 80,
            class: "名称",
            type: "普通输入",
            editable: true,
            is_save: true,
            default: ""
        },
        { name: "规格型号", width: 120, class: "材质", type: "普通输入", editable: true, is_save: true, default: "" },
        { name: "数量", width: 50, class: "num", type: "普通输入", editable: true, is_save: true, default: "" },
        { name: "单价", width: 50, class: "price", type: "普通输入", editable: true, is_save: true, default: "" },
        { name: "金额", width: 80, class: "money", type: "普通输入", editable: false, is_save: false, default: "" },
        { name: "税率", width: 60, class: "税率", type: "普通输入", editable: true, is_save: true, default: "13%" },
        { name: "税额", width: 80, class: "税额", type: "普通输入", editable: false, is_save: false, default: "", },
    ]

    //计算表格行数，33 为 lineHeight （行高）
    table_lines = Math.floor((document.querySelector('body').clientHeight - 395) / 33);

    fetch("/fetch_sale_docs", {
        method: 'post',
    })
        .then(response => response.json())
        .then(content => {
            let title = document.querySelector(".table-docs thead th");
            title.innerHTML = title.textContent + " " + content.length + " 单";

            let tr = "";
            content.forEach(obj => {
                let material = obj.label.split(`${SPLITER}`);
                tr += `<tr><td hidden>${obj.id}</td><td>${material[0]}</td>
                <td hidden>${material[1]}</td></tr>`;
            });

            document.querySelector(".table-docs tbody").innerHTML = tr;

            let lines = document.querySelectorAll(".table-docs tbody tr");
            for (let l of lines) {
                l.addEventListener("dblclick", () => {
                    if (document.querySelector('#remember-button').textContent == '已审核' ||
                        document.querySelector('#save-button').disabled == true) {
                        return false;
                    }

                    let value = l.querySelector('td:nth-child(3)').textContent.split('　');
                    let dh = l.querySelector('td:nth-child(1)').textContent;
                    document.querySelector('#文本字段6').value = dh;
                    document.querySelector('#文本字段8').value = value[2] != "" ? `${value[1]} / ${value[2]}` : value[1];
                    document.querySelector('#文本字段2').value = value[0];
                    document.querySelector('#文本字段2').setAttribute('data', value[4]);
                    // document.querySelector('#应结金额').value = value[3];
                    fetch_fh_items(dh);
                    fetch_others(dh);
                })
            }
        });

    fetch('/fetch_sale_saved_docs', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify("销售开票"),
    })
        .then(response => response.json())
        .then(content => {
            let title = document.querySelector(".table-save thead th");
            title.innerHTML = title.textContent + " " + content.length + " 单";

            let tr = "";
            content.forEach(obj => {
                tr += `<tr><td>${obj.label.split(`${SPLITER}`)[0]}</td><td hidden>${obj.id}</td></tr>`;
            });

            document.querySelector(".table-save tbody").innerHTML = tr;

            let lines = document.querySelectorAll(".table-save tbody tr");
            for (let l of lines) {
                l.addEventListener("dblclick", () => {
                    // if (document.querySelector('#remember-button').textContent == "已审核" ||
                    //     document.querySelector('#save-button').disabled == true) {
                    //     return false;
                    // }
                    let dh = l.querySelector('td:nth-child(2)').textContent.trim();
                    window.location.href = "/kp/" + dh;

                });
            }
        });

    if (dh_div.textContent == "新单据") {
        let edit_data = {
            show_names: show_names,
            lines: table_lines,
            calc_func: calc,
            del_func: sum_money,
        }

        edit_table.build_blank_table(edit_data);
    } else {
        fetch('/fetch_kp_items', {
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
                let edit_data = {
                    show_names: show_names,
                    rows: content,
                    lines: table_lines,
                    dh: dh_div.textContent,
                    document: document_name,
                    calc_func: calc,
                    change_func: sum_money,         //新加载或删除变动时运行
                }

                edit_table.build_items_table(edit_data);
            });
    }

    // 图片处理 
    service.handle_pic(dh_div, "/pic_kp_save");
    modal_init();

    // 获取其他相关单据
    function fetch_others(dh) {
        fetch(`/fetch_other_documents`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dh),
        })
            .then(response => response.json())
            .then(data => {
                let tr = "";
                data.forEach(obj => {
                    if (obj.indexOf("开票") == -1) {
                        tr += `<tr><td>${obj}</td></tr>`;
                    }
                });

                document.querySelector(".table-history tbody").innerHTML = tr;

                let trs = document.querySelectorAll(".table-history tbody tr");
                let ck = "DO: ", fh = "FO: ";
                for (let tr of trs) {
                    let cate = tr.querySelector('td').textContent.split('　');
                    tr.addEventListener('click', function () {
                        let url;
                        if (cate[0].indexOf("出库") != -1) {
                            url = "/material_out/";
                        } else if (cate[0].indexOf("发货") != -1) {
                            url = "/transport/";
                        } else {
                            url = "/material_in/";
                        }
                        window.open(url + tr.querySelector('td').textContent.split('　')[1]);
                    })

                    // 生成发票备注信息
                    if (cate[0].indexOf("出库") != -1) {
                        ck += cate[1] + " / ";
                    } else if (cate[0].indexOf("发货") != -1) {
                        fh += cate[1] + " / ";
                    }
                }
                let note = `<p>CN: ${document.querySelector('#文本字段8').value}</p><p>${ck.replace(/(\s|\/)+$/g, '')}</p><p>${fh.replace(/(\s|\/)+$/g, '')}</p>`;
                document.querySelector(".table-note tbody").innerHTML = note;
            });
    }

    // 获取明细
    function fetch_fh_items(dh) {
        fetch(`/fetch_fh_items`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dh),
        })
            .then(response => response.json())
            .then(data => {
                document.querySelector(".table-items tbody").innerHTML = '';

                let edit_data = {
                    show_names: show_names,
                    rows: data,
                    // auto_data: auto_data,
                    lines: table_lines,
                    dh: dh_div.textContent,
                    document: document_name,
                    calc_func: calc,
                    change_func: sum_money,         //新加载或删除变动时运行
                }

                edit_table.build_items_table(edit_data);
            });
    }

    function calc(row) {
        row.querySelector('.num').addEventListener('blur', function () {
            row_calc();
            sum_money();
        });
        row.querySelector('.price').addEventListener('blur', function () {
            row_calc();
            sum_money();
        });
        row.querySelector('.税率').addEventListener('blur', function () {
            row_calc();
            sum_money();
        });
    }

    function row_calc() {
        let row = document.querySelector('.table-items .inputting');
        let num = row.querySelector('.num').value;
        let price = row.querySelector('.price').value;
        let tax = row.querySelector('.税率').value.replace('%', '');

        let money = num * price;
        row.querySelector('.money').textContent = money.toFixed(2);
        row.querySelector('.税额').textContent = (money - money / (1 + tax / 100)).toFixed(2);
    }

    //计算合计金额
    function sum_money() {
        let all_input = document.querySelectorAll('.has-input');
        let sum = 0;
        let sum_tax = 0;
        for (let i = 0; i < all_input.length; i++) {
            let money = all_input[i].querySelector('.money').textContent.trim();
            let tax = all_input[i].querySelector('.税额').textContent.trim();

            sum += money * 1;
            sum_tax += tax * 1;
        }

        document.querySelector('#sum-money').innerHTML = `金额合计：${sum.toFixed(2)} 元  　 　 税额合计：${sum_tax.toFixed(2)} 元`;
        document.querySelector('#应结金额').value = sum.toFixed(2);
        if (document.querySelector('#文本字段5')) document.querySelector('#文本字段5').value = sum.toFixed(2);
    }

    //保存、打印和审核 -------------------------------------------------------------------

    //保存
    document.querySelector('#save-button').addEventListener('click', function () {
        //错误勘察
        if (!error_check()) {
            return false;
        }

        let all_values = document.querySelectorAll('.document-value');
        let custid = document.querySelector('#文本字段2').getAttribute("data");
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

        let data = {
            rights: document_bz,
            document: save_str,
            remember: document.querySelector('#remember-button').textContent,
            items: table_data,
        }

        // console.log(data);

        fetch(`/save_document_kp`, {
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
                if (!(input.classList.contains("备注") || input.classList.contains("note"))) {
                    input.disabled = true;
                }
            });
        }, 100);

        service.edit_button_disabled();
    }

    //审核单据
    document.querySelector('#remember-button').addEventListener('click', function () {
        let formal_data = {
            button: this,
            dh: dh_div.textContent,
            xsdh: `${document.querySelector('#文本字段6').value}${SPLITER}${document.querySelector("#是否欠款").checked}`,
            document_name: document_name,
            edited: edited || input_table_outdata.edited,
            readonly_fun: set_readonly,
            after_func: function (xsdh, dh) {
                // 将实际是否欠款写入销售单
                fetch(`/make_xs_kp`, {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(xsdh),
                });
            }
        }
        service.make_formal(formal_data);
    });

    //共用事件和函数 ---------------------------------------------------------------------

    //错误检查
    function error_check() {
        if (document.querySelector('#文本字段8').value.trim() == '') {
            notifier.show('合同编号不能为空', 'danger');
            return false;
        }

        let all_rows = document.querySelectorAll('.table-items .has-input');
        if (!service.header_error_check(document_table_fields, all_rows)) {
            return false;
        }

        if (all_rows.length == 0) {
            notifier.show('明细不能为空', 'danger');
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
}();