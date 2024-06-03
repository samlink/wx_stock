let page_transport = function () {
    let document_table_fields, table_lines, show_names, edited;
    let document_bz = document.querySelector('#document-bz').textContent.trim();
    let dh_div = document.querySelector('#dh');

    //单据顶部信息构造显示，并添加事件处理 -----------------------------------------------------------

    let document_name = "发货单据";
    let shen_print = "";   //打印审核人
    // let customer_po = "";  //用于打印的全局变量

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
                    fetch(`/fetch_document_fh`, {
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
                            document_top_handle(html);

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
                            let da = data.split(SPLITER);
                            let pic = da[da.length - 6].replace("pic_", "min_");
                            shen_print = da[16];
                            if (pic.startsWith("/upload")) {
                                document.querySelector('#upload-pic').setAttribute('src', `${pic}?${Math.random()}`);
                            }
                        });
                } else {
                    let html = service.build_inout_form(content);
                    document_top_handle(html);
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

        document.querySelector('#save-button').disabled = true;

        setTimeout(() => {
            document.querySelectorAll('.table-items tbody input').forEach((input) => {
                input.disabled = true;
            });
        }, 100);

        service.edit_button_disabled();
    }

    function document_top_handle(html) {
        let fields_show = document.querySelector('.fields-show');
        fields_show.innerHTML = html;

        let comany = document.querySelector('#文本字段5');
        let auto_doc = document.querySelector('#文本字段11');
        auto_doc.parentNode.classList.add("autocomplete");

        let auto_comp = new AutoInput(auto_doc, comany, "/get_truck_auto", () => {
        });

        auto_comp.init();

        let auto_doc2 = document.querySelector('#文本字段12');
        auto_doc2.parentNode.classList.add("autocomplete");

        let auto_comp2 = new AutoInput(auto_doc2, comany, "/get_truck2_auto", () => {
        });

        auto_comp2.init();

        let date = document.querySelector('#日期');
        date.closest(".form-group").style.display = "none";
        date.value = new Date().Format("yyyy-MM-dd");

        // 回车和方向键的移动控制
        let all_input = document.querySelectorAll('.fields-show input');
        let form = document.querySelector('.fields-show');
        set_key_move(all_input, form, 9);

        service.set_sumit_shen();
        //提交审核
        document.querySelector('#sumit-shen').addEventListener('click', function () {
            let da = document.querySelector('#日期');
            if (da.value.trim() == "" || !regDate.test(document.querySelector('#日期').value)) {
                notifier.show('日期输入错误', 'danger');
                return false;
            }
            if (document.querySelector('#文本字段11').value.trim() == "") {
                notifier.show('请填写提货车牌', 'danger');
                return false;
            }
            if (document.querySelector('#文本字段12').value.trim() == "") {
                notifier.show('请填写提货车牌', 'danger');
                return false;
            }
            let shen_data = {
                button: this,
                dh: dh_div.textContent,
                document_name: document_name,
                edited: edited || edit_table.input_table_outdata().edited,
            }
            service.sumit_shen(shen_data);
        });

        // 选择结算和打印
        let select_print = document.createElement("select");
        select_print.id = "my-select";
        select_print.options.add(new Option("结算单", "结算单"));
        select_print.options.add(new Option("发货单", "发货单"));
        fields_show.appendChild(select_print);
        alert('dd')
    }

    service.get_materials_docs('/materialout_docs', "商品销售", build_items);

    // 获取单据列表
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
            });

        fetch('/get_sale_out', {
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
                    let c = obj.split(SPLITER);
                    let done = c[1] == "true" ? "class='red'" : "";
                    tr += `<tr ${done}><td>${c[0]}</td></tr>`;
                });

                document.querySelector(".table-history tbody").innerHTML = tr;

                let lines = document.querySelectorAll(".table-history tbody tr");
                for (let l of lines) {
                    l.addEventListener("dblclick", () => {
                        if (document.querySelector('#remember-button').textContent == "已审核" ||
                            document.querySelector('#save-button').disabled == true) {
                            return false;
                        }

                        let dh = l.querySelector('td:nth-child(1)').textContent.split('　')[0];

                        fetch('/get_items_trans', {
                            method: 'post',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(dh),
                        })
                            .then(response => response.json())
                            .then(content => {
                                document.querySelectorAll('#trans-table tbody tr').forEach(tr => {
                                    if (tr.querySelector('td:nth-child(2)').textContent.trim() == "锯口费") {
                                        tr.parentNode.removeChild(tr);
                                    }
                                });

                                for (let c of content) {
                                    let value = c.split('　');
                                    let money = Number(value[9] * value[8]).toFixed(2);
                                    if (value[0] == "锯口费") {
                                        money = Number(value[9] * value[6]).toFixed(2);
                                    }
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
                                    show_names[11].value = money;
                                    show_names[12].value = value[10];
                                    show_names[13].value = value[11];
                                    show_names[14].value = value[12];

                                    let data = {
                                        show_names: show_names,
                                        lines: table_lines,
                                        dh: dh_div.textContent,
                                        document: document_name,
                                        calc_func: calculate,
                                        change_func: sum_money,         //新加载或删除变动时运行
                                    }

                                    edit_table.build_out_table(data);
                                }
                                sum_money();
                                edited = 1;
                                document.querySelector('#文本字段6').focus();
                            });
                    })
                }

            });
    }

    // 获取已保存单据
    fetch('/materialout_saved_docs', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify("商品销售"),
    })
        .then(response => response.json())
        .then(content => {
            let title = document.querySelector(".table-save thead th");
            title.innerHTML = title.textContent + " " + content.length + " 单";

            let tr = "";
            content.forEach(obj => {
                tr += `<tr><td>${obj.label}</td><td hidden>${obj.id}</td></tr>`;
            });

            document.querySelector(".table-save tbody").innerHTML = tr;

            let lines = document.querySelectorAll(".table-save tbody tr");
            for (let l of lines) {
                l.addEventListener("dblclick", () => {
                    let dh = l.querySelector('td:nth-child(2)').textContent.trim();
                    window.location.href = "/transport/" + dh;

                });
            }
        });

    function calculate(input_row) {
        input_row.querySelector('.数量').addEventListener('blur', function () {
            let mount = input_row.querySelector('.数量').value;
            if (regInt.test(mount)) {
                weight(input_row);
            } else {
                input_row.querySelector('.理论重量').textContent = 0;
            }
            sum_money();
        });

        input_row.querySelector('.实际重量').addEventListener('blur', function () {
            let mount = input_row.querySelector('.实际重量').value;
            let price = input_row.querySelector('.单价').textContent;
            if (regReal.test(mount)) {
                input_row.querySelector('.总价').textContent = (price * mount).toFixed(2);
            } else {
                input_row.querySelector('.总价').textContent = 0;
            }
            sum_money();
        });
    }

    //计算合计金额
    function sum_money() {
        let all_input = document.querySelectorAll('.has-input');
        let sum = 0, sum_n = 0, sum_weight = 0, sum_weight_s = 0;

        for (let i = 0; i < all_input.length; i++) {
            let mount = Number(all_input[i].querySelector('.理论重量').textContent);
            let money = Number(all_input[i].querySelector('.总价').textContent);
            let n = Number(all_input[i].querySelector('.数量').value);
            let weight_s = Number(all_input[i].querySelector('.实际重量').value);

            sum += money;
            sum_n += n;
            sum_weight += mount;
            sum_weight_s += weight_s;
        }

        document.querySelector('#sum-money').innerHTML = `数量：${sum_n}，  理论重量：${sum_weight.toFixed(1)} kg，  实际重量：${sum_weight_s.toFixed(1)} kg， 金额合计：${sum.toFixed(2)} 元`;
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
        { name: "序号", width: 10, class: "序号", type: "普通输入", editable: false, is_save: true },
        { name: "名称", width: 40, class: "名称", type: "普通输入", editable: false, is_save: false },
        { name: "材质", width: 60, class: "材质", type: "普通输入", editable: false, is_save: false },
        { name: "规格", width: 60, class: "规格", type: "普通输入", editable: false, is_save: true },
        { name: "状态", width: 80, class: "状态", type: "普通输入", editable: false, is_save: true },
        { name: "炉号", width: 80, class: "炉号", type: "普通输入", editable: false, is_save: true },
        { name: "长度", width: 30, class: "长度", type: "普通输入", editable: false, is_save: true },
        { name: "数量", width: 30, class: "数量", type: "普通输入", editable: true, is_save: true },
        { name: "理论重量", width: 30, class: "理论重量", type: "普通输入", editable: false, is_save: true, },
        { name: "实际重量", width: 30, class: "实际重量", type: "普通输入", editable: true, is_save: true, },
        { name: "单价", width: 30, class: "单价", type: "普通输入", editable: false, is_save: true },
        { name: "总价", width: 60, class: "总价", type: "普通输入", editable: false, is_save: false, no_button: true },
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
            css: 'style="width:0%; border-left:none; border-right:none; color:white"',
        },
        {
            name: "",
            width: 0,
            class: "m_dh",
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

        edit_table.build_blank_table(data);
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
                    change_func: sum_money,
                }

                edit_table.build_items_table(data);

                let trs = document.querySelectorAll('.table-items .has-input');

                for (let tr of trs) {
                    if (tr.querySelector(".炉号")) {
                        let lu = `${tr.querySelector('.材质').textContent.trim()}_${tr.querySelector('.规格').textContent.trim()}_${tr.querySelector('.炉号').textContent.trim()}`;
                        fetch("/fetch_lu", {
                            method: 'post',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(lu),
                        })
                            .then(response => response.json())
                            .then(content => {
                                if (content != "" && content != -1) {
                                    tr.querySelector('.炉号').innerHTML = `<a href="${content}" title="点击下载质保书">${tr.querySelector('.炉号').textContent.trim()}</a>`
                                }
                            })
                    }
                    else {
                        continue;
                    }
                }
            });
    }

    // 图片处理 -----------------------------------------------------------------
    service.handle_pic(dh_div, "/pic_fh_save");
    modal_init();

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
                    save_money_weight(content);   // content 是返回的发货单号
                    dh_div.textContent = content;
                    notifier.show('单据保存成功', 'success');
                    edited = false;
                    edit_table.input_table_outdata().edited = false;
                } else {
                    notifier.show('权限不够，操作失败', 'danger');
                }
            });
    });

    // 保存重量和金额
    function save_money_weight(trans_dh) {
        let sum_money = document.querySelector('#sum-money').textContent;
        let sum_a = sum_money.match(/\d+(\.\d+)?/g);
        let weight = sum_a[2];
        let sum = sum_a[3];
        let dh = document.querySelector('#文本字段6').value;    // 销售单号

        let da = `${dh}${SPLITER}${trans_dh}${SPLITER}${sum}${SPLITER}${weight}`;

        // 更新单据金额
        fetch(`/save_sale_money`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: da,
        });
    }

    //打印
    document.querySelector('#print-button').addEventListener('click', async function () {
        //错误勘察
        if (!error_check()) {
            return false;
        }

        if (document.querySelector('#remember-button').textContent == "审核") {
            notifier.show('审核后才能打印', 'danger');
            return false;
        }

        // 获取客户PO
        let cus_po = await (await fetch("/get_customer_po", {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: document.querySelector('#文本字段6').value.trim(),
        })).json();

        document.querySelector('#print .print-title').innerHTML = "<img src='/assets/img/logo_blue.png'/> 五星(天津)石油装备有限公司-销售发货单";

        let p = `<p style="padding:0">客户名称：${document.querySelector('#文本字段5').value}</p>
                        <p>客户地址：${document.querySelector('#文本字段1').value}</p>`;
        document.querySelector('#p-block1').innerHTML = p;

        let contact = `收货人/电话：${document.querySelector('#文本字段8').value} ${document.querySelector('#文本字段9').value}`;
        p = `<p>发货日期：${document.querySelector('#日期').value}</p><p>${contact}</p>`;
        document.querySelector('#p-block2').innerHTML = p;

        p = `<p>合同号：${document.querySelector('#文本字段3').value}</p><p>车号：${document.querySelector('#文本字段2').value} / ${document.querySelector('#文本字段11').value}</p>`;
        document.querySelector('#p-block3').innerHTML = p;

        p = `<p>客户PO：${cus_po}</p><p>销售单号：${document.querySelector('#文本字段6').value.split('　')[0]}</p>`;
        document.querySelector('#p-block4').innerHTML = p;

        var th = `<tr>
        <th width="3%">序号</th>
        <th width="7%">商品名称</th>
        <th width="8%">材质</th>
        <th width="6%">规格<br>(mm)</th>
        <th width="10%">状态</th>
        <th width="10%">炉号</th>
        <th width="5%">长度 (mm)</th>
        <th width="3%">支数</th>
        <th width="6%">理论重量<br>(KG)</th>
        <th width="7%">实际重量<br>(KG)</th>
        <th width="5%">单价<br>(元/KG)</th>
        <th width="8%">总价<br>(元)</th>
        <th width="8%">备注</th>
    </tr>`;

        document.querySelector('.print-table thead').innerHTML = th;

        let sum_money = 0;
        let sum_weight = 0;
        let sum_li_weight = 0;
        let sum_zhi = 0;

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
            sum_li_weight += Number(row.querySelector(`td:nth-child(9)`).textContent);
            let name = row.querySelector('td:nth-child(2)').textContent.trim();
            sum_zhi += name != "锯口费" ? Number(row.querySelector(`td:nth-child(8) input`).value) : 0;
        }

        // 补空行
        let len = 6 - all_rows.length;
        trs += append_blanks(len, 13);

        trs += `<tr><td colspan="2">合计</td>${append_cells(5)}<td>${sum_zhi}</td><td>${sum_li_weight.toFixed(1)}</td>
             <td>${sum_weight.toFixed(1)}</td><td></td><td>${sum_money.toFixed(2)}</td><td></td>`;
        trs += `<tr><td colspan="2">合计（大写）</td><td colspan="11">${moneyUppercase(sum_money.toFixed(2))}</td>`;
        trs += `<tr class='no-bottom' style="height: 40px"><td colspan="2">备注</td><td colspan="11"></td>`;

        document.querySelector('.print-table tbody').innerHTML = trs;

        document.querySelector('#p-block5').innerHTML = `<p>制单人：${document.querySelector('#user-name').textContent.split('　')[1]}</p>`;
        document.querySelector('#p-block6').innerHTML = `<p>审核：${shen_print}</p>`;
        document.querySelector('#p-block7').innerHTML = '<p>装车：</p>';
        document.querySelector('#p-block8').innerHTML = '<p>提货：</p>';

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
            edited: edited || edit_table.input_table_outdata().edited,
            readonly_fun: set_readonly,
            xsdh: document.querySelector('#文本字段6').value,    //销售单号，用于确认发货完成
            after_func: make_complete  //审核后，确认发货完成
        }
        service.make_formal(formal_data);
    });

    //审核时，将对销售单做发货完成的确认
    function make_complete(dh) {
        fetch(`/make_fh_complete`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dh),
        });
    }

    //错误检查, 保存、打印和审核前
    function error_check() {
        let all_rows = document.querySelectorAll('.table-items .has-input');
        if (!service.header_error_check(document_table_fields, all_rows)) {
            return false;
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