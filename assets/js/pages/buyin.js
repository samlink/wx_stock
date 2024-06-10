let page_buyin = function () {
    let document_table_fields, show_names, edited, auto_data;
    let document_bz = document.querySelector('#document-bz').textContent.trim();
    let dh_div = document.querySelector('#dh');

    //计算表格行数，33 为 lineHeight （行高）
    let table_lines = Math.floor((document.querySelector('body').clientHeight - 395) / 33);

    //单据顶部信息构造显示，并添加事件处理 -----------------------------------------------------------

    let document_name, edit_data;
    document_name = "采购单据";

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
                            let set_data = {
                                content: data,
                                readonly_fun: set_readonly,
                                focus_fun: () => {
                                    setTimeout(() => {
                                        document.querySelector('.table-items tbody .名称').focus();
                                    }, 200);
                                }
                            }
                            service.set_shens_owner(set_data);
                            service.fei_readonly(values[len - 6],"buy-content");
                        });

                    //同时获取相关单据信息
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
                                    tr += `<tr><td>${obj}</td></tr>`;
                                });

                                document.querySelector(".table-history tbody").innerHTML = tr;
                                let trs = document.querySelectorAll(".table-history tbody tr");
                                for (let tr of trs) {
                                    tr.addEventListener('click', function () {
                                        let url;
                                        let cate = tr.querySelector('td').textContent.split('　')[0];
                                        if (cate.indexOf("出库") != -1) {
                                            url = "/material_out/";
                                        } else if (cate.indexOf("发货") != -1) {
                                            url = "/transport/";
                                        } else if (cate.indexOf("开票") != -1) {
                                            url = "/kp/";
                                        } else {
                                            url = "/material_in/";
                                        }
                                        window.open(url + tr.querySelector('td').textContent.split('　')[1]);
                                    })
                                }
                            }
                        );
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

    // 处理表头字段
    function document_top_handle(html, has_date) {
        if (document_bz == "采购退货") {
            html = html.replace("到货", "发货");
            html = html.replace("入库完成</label>", "处理完成</label>");
        }

        if (document.querySelector('.has-auto')) {
            document.querySelector('.has-auto').insertAdjacentHTML('afterend', html);
        } else {
            document.querySelector('.fields-show').innerHTML = html;
        }

        // 订单日期
        let date = document.querySelector('#日期');
        if (!has_date) {
            date.value = new Date().Format("yyyy-MM-dd");
        }

        laydate.render({
            elem: date,
            showBottom: false,
        });

        // 到货日期
        laydate.render({
            elem: document.querySelector('#文本字段3'),
            showBottom: false,
        })

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
                edited: edited || edit_table.input_table_outdata().edited,
            }
            service.sumit_shen(shen_data);
        });
    }

    if (document.querySelector('#supplier-input')) {
        tool_customer.customer_init();
    }

    //构建商品规格表字段 --------------------------
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
                let edit = true;
                show_names.push({
                    name: item.show_name, width: item.show_width * 18, type: item.ctr_type,
                    class: item.show_name, editable: edit, is_save: true, default: item.option_value
                });
            }

            show_names.push({
                name: "单价", width: 60, class: "price", type: "普通输入", editable: true, is_save: true, default: ""
            });
            show_names.push({
                name: "长度", width: 60, class: "长度", type: "普通输入", editable: true, is_save: true, default: ""
            });
            show_names.push({
                name: "重量", width: 60, class: "mount", type: "普通输入", editable: true, is_save: true, default: ""
            });

            show_names.push({
                name: "金额", width: 80, class: "money", type: "普通输入", editable: false, is_save: true, default: ""
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
                css: 'style="width:0%; border-left:none; color:white"'
            });

            // 设置"状态"为自动输入
            show_names.forEach(item => {
                if (item.name == "状态" || item.name == "执行标准") {
                    item.type = "autocomplete";
                    item.no_button = true;           //无需 modal 选择按钮
                    item.save = "value";             //保存值, 而非 id
                }
            });

            auto_data = [{
                n: 2,                       //第2个单元格是自动输入
                cate: document_name,
                auto_url: '/fetch_nothing',
                show_th: '',
                type: "table",
                cb: fill_gg,
            }, {
                n: 5,
                cate: "状态",
                auto_url: '/get_status_auto',
                type: "simple",
                width: 230,
            },
                {
                    n: 6,
                    cate: "执行标准",
                    auto_url: '/get_status_auto',
                    type: "simple",
                    width: 300,  //自定义宽度，默认与 auto input 宽度相同
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

                edit_table.build_blank_table(edit_data);
                let row = edit_table.appand_edit_row();
            } else {
                fetch("/fetch_document_items", {
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
                            change_func: sum_money,         //新加载或删除变动时运行
                        }

                        edit_table.build_items_table(edit_data);

                        setTimeout(() => {
                            if (document.querySelector('#remember-button').textContent.trim() == "审核") {
                                edit_table.appand_edit_row();
                            }
                        }, 200);
                    })
            }
        });

    // 自动计算
    function calculate(input_row) {
        input_row.querySelector('.规格').addEventListener('blur', function () {
            calc_money(input_row);
            sum_money();
        });

        input_row.querySelector('.price').addEventListener('blur', function () {
            calc_money(input_row);
            sum_money();
        });

        input_row.querySelector('.mount').addEventListener('blur', function () {
            calc_money(input_row);
            sum_money();
        });
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
            money = (price * mount).toFixed(2);
        }

        input_row.querySelector('.money').textContent = money;
    }

    //计算合计金额
    function sum_money() {
        let all_input = document.querySelectorAll('.has-input');
        let sum = 0, sum_weight = 0;

        for (let i = 0; i < all_input.length; i++) {
            let price = all_input[i].querySelector('.price').value;
            let mount = all_input[i].querySelector('.mount').value;
            if (!mount) {
                mount = all_input[i].querySelector('.mount').textContent;
            }

            if (all_input[i].querySelector('td:nth-child(2) .auto-input').value != "" &&
                price && regReal.test(price) && mount && regReal.test(mount)) {
                sum += price * mount;
                sum_weight += Number(mount);
            }
        }

        if (document.querySelector('#应结金额')) {
            document.querySelector('#应结金额').value = sum.toFixed(Number(2));
        }
        document.querySelector('#sum-money').innerHTML = `重量：${sum_weight.toFixed(1)} kg， 金额合计：${sum.toFixed(2)} 元`;
    }

    //自动填充
    function fill_gg() {
        let row_input = document.querySelector(`.table-items .inputting`);
        let field_values = row_input.querySelector(`.auto-input`).getAttribute("data").split(SPLITER);

        row_input.querySelector(`.材质`).textContent = field_values[1];
        row_input.querySelector(`.规格`).value = field_values[2];
        row_input.querySelector(`.状态`).value = field_values[3];
        row_input.querySelector(`.执行标准`).value = field_values[4];
        row_input.querySelector('.m_id').textContent = field_values[0];

        let price_input = row_input.querySelector(`.price`);
        price_input.focus();

        edit_table.appand_edit_row();
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
                let save_str = `${row.querySelector('td:nth-child(12)').textContent.trim()}${SPLITER}`;
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
                    edit_table.input_table_outdata().edited = false;
                } else {
                    notifier.show('权限不够，操作失败', 'danger');
                }
            });
    });

    // 只读设置
    function set_readonly() {
        let all_edit = document.querySelectorAll('.fields-show input');
        for (let edit of all_edit) {
            if (edit.id == '入库完成' || edit.id == "备注") {
                continue;
            }

            edit.disabled = true;
        }

        document.querySelector('#supplier-serach').disabled = true;

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
            document_name: document_name,
            edited: edited || edit_table.input_table_outdata().edited,
            readonly_fun: set_readonly,
        }
        service.make_formal(formal_data);
    });

    //错误检查
    function error_check() {
        let customer_id = document.querySelector('#supplier-input').getAttribute('data');
        if (customer_id == null) {
            notifier.show('客户或供应商不在库中', 'danger');
            return false;
        }

        if (document.querySelector('#文本字段6') && document.querySelector('#文本字段6').value.trim() == '') {
            notifier.show('合同编号不能为空', 'danger');
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
        if (edited || edit_table.input_table_outdata().edited) {
            var e = window.event || e;
            e.returnValue = ("编辑未保存提醒");
        }
    }
}();
