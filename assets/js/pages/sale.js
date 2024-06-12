let page_sale = function () {
    let document_table_fields, show_names, edited, auto_data;
    let document_bz = document.querySelector('#document-bz').textContent.trim();
    let dh_div = document.querySelector('#dh');

    //表格行数，33 为行高
    let table_lines = Math.floor((document.querySelector('body').clientHeight - 395) / 33);

    //单据顶部信息构造显示，并添加事件处理 -----------------------------------------------------------

    let document_name, edit_data;
    document_name = "销售单据";

    let buttons = document.querySelectorAll('.buy-buttons .buttons button');
    buttons.forEach((button) => {
        button.classList.add('ch-width');
    });

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
                            service.fei_readonly(values[len - 6], "buy-content");
                        });

                    //同时获取相关单据信息, 加载表头内容时
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

                sale_back();
            }
        });

    // 处理表头字段
    function document_top_handle(html, has_date) {
        if (document_bz == "销售退货") {
            html = html.replace("交货", "收货");
            html = html.replace("出库完成</label>", "入库完成</label>");
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

        // 交货日期
        laydate.render({
            elem: document.querySelector('#文本字段2'),
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

    //构建商品规格表字段 参数与上面同样的 url 不同--------------------------
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
                    default: "",
                    no_button: true
                },
                {name: "材质", width: 100, class: "材质", type: "普通输入", editable: false, is_save: false, default: ""},
            ];

            for (let item of content) {
                let edit = false;
                show_names.push({
                    name: item.show_name, width: item.show_width * 18, type: item.ctr_type,
                    class: item.show_name, editable: edit, is_save: true, default: item.option_value
                });
            }

            show_names.push({
                name: "类型", width: 50, class: "类型", type: "下拉列表", editable: true, is_save: true, default: "按重量_按件"
            });
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

            show_names.push({
                name: "金额", width: 80, class: "money", type: "普通输入", editable: false, is_save: true, default: ""
            });

            show_names.push({
                name: "物料号", width: 60, class: "物料号", type: "普通输入", editable: false, is_save: true, default: ""
            });

            show_names.push({
                name: "备注",
                width: 100,
                class: "note",
                type: "普通输入",
                editable: true,
                is_save: true,
                default: "",
            });

            let show_th = [
                {name: "名称", width: 60},
                {name: "材质", width: 80},
                {name: "规格", width: 80},
                {name: "状态", width: 100},
                {name: "执行标准", width: 100},
                {name: "库存长度", width: 80},
                {name: "库存重量", width: 80},
                {name: "物料号", width: 90},
            ];

            auto_data = [{
                n: 2,                       //第2个单元格是自动输入
                cate: document_name,
                auto_url: `/buyin_auto`,
                show_th: show_th,
                type: "table",
                cb: fill_gg,
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
                type_change(row);
            } else {
                fetch("/fetch_document_items_sales", {
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
                                let row = edit_table.appand_edit_row();
                                type_change(row);
                            }

                            let rows = document.querySelectorAll('.table-items tbody tr');
                            rows.forEach(row => {
                                type_change(row);
                            });

                        }, 200);
                    })
            }
        });

    // 类型变化事件
    function type_change(row) {
        if (row.querySelector('.类型')) {
            row.querySelector('.类型').addEventListener('change', function () {
                calc_money(row);
                sum_money();
            });
        }
    }

    // 销售退货右表
    function sale_back() {
        if (document_bz == "销售退货") {
            document.querySelector('.table-note').style.display = "block";
            document.querySelector('.table-history').style.marginLeft = 0;
            document.querySelector('.table-history').style.borderBottomLeftRadius = 0;
            document.querySelector('.table-history').style.borderBottomRightRadius = 0;

            let ht = document.querySelector('#文本字段6');
            ht.addEventListener('blur', function () {
                if (ht.value == "") {
                    return;
                }

                fetch('/get_sale_dh', {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: ht.value.trim()
                })
                    .then(response => response.json())
                    .then(data => {
                        document.querySelector(".table-note tbody").innerHTML = `<tr><td>${data}</td></tr>`;
                        let tr = document.querySelector(".table-note tbody tr");
                        tr.addEventListener('click', function () {
                            window.open("/sale/" + tr.querySelector('td').textContent.split('　')[1]);
                        })
                    })
            });
        }
    }

    // 自动计算
    function calculate(input_row) {
        input_row.querySelector('.规格').addEventListener('blur', function () {
            calc_weight(input_row);
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

    //计算行金额
    function calc_money(input_row) {
        let price = input_row.querySelector('.price').value;
        let mount = input_row.querySelector('.mount').value;

        if (!mount) {
            mount = input_row.querySelector('.mount').textContent;
        }
        let money = "";
        if (price && regReal.test(price) && mount && regReal.test(mount)) {
            if (input_row.querySelector('.类型').value == "按重量") {
                money = (price * mount).toFixed(2);
            } else {
                money = (price * input_row.querySelector('.num').value).toFixed(2);
            }
        }

        input_row.querySelector('.money').textContent = money;
    }

    //计算合计金额
    function sum_money() {
        let all_input = document.querySelectorAll('.has-input');
        let sum = 0, sum_n = 0, sum_weight = 0, sum_weight_s = 0;

        for (let i = 0; i < all_input.length; i++) {
            let price = all_input[i].querySelector('.price').value;
            let mount = all_input[i].querySelector('.mount').value;
            if (!mount) {
                mount = all_input[i].querySelector('.mount').textContent;
            }

            let n = Number(all_input[i].querySelector('.num').value);
            let weight_s = Number(all_input[i].querySelector('.weight').value);

            if (all_input[i].querySelector('td:nth-child(2) .auto-input').value != "" &&
                price && regReal.test(price) && mount && regReal.test(mount)) {
                if (all_input[i].querySelector('.类型').value == "按重量") {
                    sum += price * mount;
                } else {
                    sum += price * all_input[i].querySelector('.num').value;
                }

                sum_n += n;
                sum_weight += Number(mount);
                sum_weight_s += weight_s;
            }
        }

        document.querySelector('#sum-money').innerHTML = `数量：${sum_n}，  理论重量：${sum_weight.toFixed(1)} kg，  实际重量：${sum_weight_s.toFixed(1)} kg， 金额合计：${sum.toFixed(2)} 元`;
        if (document.querySelector('#应结金额')) {
            document.querySelector('#应结金额').value = sum.toFixed(2);
        }
    }

    // 销售时使用的理论重量计算
    function calc_weight(input_row) {
        let data = {
            long: input_row.querySelector('.long').value,
            num: input_row.querySelector('.num').value,
            name: input_row.querySelector('.auto-input').value,
            cz: input_row.querySelector('.材质').textContent.trim(),
            gg: input_row.querySelector('.规格').textContent.trim(),
        }

        if (regInt.test(data.long) && regInt.test(data.num) && input_row.querySelector('.材质').textContent.trim() != "--") {
            input_row.querySelector('.mount').value = service.calc_weight(data);
        } else {
            input_row.querySelector('.mount').value = 0;
        }
    }

    //自动填充
    function fill_gg() {
        let row_input = document.querySelector(`.table-items .inputting`);
        let field_values = row_input.querySelector(`.auto-input`).getAttribute("data").split(SPLITER);

        row_input.querySelector(`.材质`).textContent = field_values[2];
        row_input.querySelector(`.规格`).textContent = field_values[3];
        row_input.querySelector(`.状态`).textContent = field_values[4];
        row_input.querySelector(`.执行标准`).textContent = field_values[5];
        row_input.querySelector(`.long`).value = field_values[6];
        row_input.querySelector(`.num`).value = 1;
        row_input.querySelector(`.mount`).value = field_values[7];
        row_input.querySelector(`.物料号`).textContent = field_values[8];
        calc_weight(row_input);

        let price_input = row_input.querySelector(`.price`);
        price_input.focus();

        let row = edit_table.appand_edit_row();
        type_change(row);
        edited = true;
    }

    //保存、打印和审核 -------------------------------------------------------------------

    //保存
    document.querySelector('#save-button').addEventListener('click', function () {
        //错误勘察
        if (!error_check()) {
            return false;
        }

        let dh = dh_div.textContent == "新单据" ? "" : dh_div.textContent;
        service.check_ku(dh, save);
    });

    function save() {
        let customer_id = document.querySelector('#supplier-input').getAttribute('data');
        let all_values = document.querySelectorAll('.document-value');

        //构建数据字符串
        let user_name = document.querySelector('#user-name').textContent.split('　')[1];
        let save_str = `${document_bz}${SPLITER}${dh_div.textContent}${SPLITER}${customer_id}${SPLITER}${user_name}${SPLITER}`;
        save_str += service.build_save_header(all_values, document_table_fields);

        let table_data = [];
        let all_rows = document.querySelectorAll('.table-items .has-input');
        for (let row of all_rows) {
            if (row.querySelector('.名称') && row.querySelector('.名称').value != "") {
                let save_items = service.build_save_items("类型", row, show_names);  // show_names 从“类型”开始索引
                if (save_items != "") {
                    table_data.push(save_items);
                }
            } else {
                break;
            }
        }

        let data = {
            rights: document_bz,
            document: save_str,
            remember: document.querySelector('#remember-button').textContent,
            items: table_data,
        }

        // console.log(data);

        fetch(`/save_document_sale`, {
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
    }

    // 只读设置
    function set_readonly() {
        let all_edit = document.querySelectorAll('.fields-show input');
        for (let edit of all_edit) {
            if (edit.id == '是否欠款' || edit.id == "文本字段2" || edit.id == "出库完成" ||
                edit.id == "发货完成" || edit.id == "文本字段5" || edit.id == "文本字段4" || edit.id == "备注") {
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

    //共用事件和函数 ---------------------------------------------------------------------

    //保存、打印和审核前的错误检查
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
            if (row.querySelector('.名称').value != "") {
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

                let weight = row.querySelector('.weight');
                if (weight.value && !regReal.test(weight.value)) {
                    notifier.show(`重量输入错误`, 'danger');
                    return false;
                } else if (!weight.value) {
                    weight.value = 0;
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
