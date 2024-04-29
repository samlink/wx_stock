let page_productset = function () {
    let global = {
        row_id: 0,
        edit: 0,
        eidt_cate: "",
        product_id: "",
        product_name: "",
        filter_conditions: new Map(),
        filter_sqls: [],
    }

    //配置自动完成和树的显示 ---------------------------------------------------

    let tree_height = document.querySelector('.tree-container').clientHeight;
    let row_num = Math.floor((tree_height - 50) / 30);

    let tree_data = {
        leaf_click: (id, name) => {
            global.product_name = name;
            global.product_id = id;

            document.querySelector('#product-name').textContent = name;
            document.querySelector('#product-id').textContent = id;
            document.querySelector('#search-input').value = "";

            let post_data = {
                id: id,
                name: '',
                filter: '',
                page: 1,
            };

            Object.assign(tool_table.table_data().post_data, post_data);
            tool_table.fetch_table(() => {
                add_lu_link();
            });
        }
    }

    tool_tree.tree_init(tree_data);
    tool_tree.fetch_tree(open_node);

    let input = document.querySelector('#auto_input');

    let auto_comp = new AutoInput(input, "", `/tree_auto`, () => {
        tool_tree.tree_search(input.value);
    });

    auto_comp.init();

    document.querySelector("#auto_search").addEventListener('click', () => {
        tool_tree.tree_search(input.value);
    });

    //商品规格表格数据 -------------------------------------------------------------------

    service.build_product_table(row_num, make_filter, add_lu_link);

    // 给炉号加入连接, 同时给入库单号加入连接
    function add_lu_link() {
        let trs = document.querySelectorAll('.table-product tbody tr');

        for (let tr of trs) {
            // 炉号连接            
            if (tr.querySelector(".炉号")) {
                let lu = `${tr.querySelector('.名称').textContent.trim().split(' ')[0]}_${tr.querySelector('.规格').textContent.trim()}_${tr.querySelector('.炉号').textContent.trim()}`;
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
                            tr.querySelector('.炉号').innerHTML = `<a href="/material_in${content}" title="点击下载质保书">${tr.querySelector('.炉号').textContent.trim()}</a>`
                        }
                    })
            }
            else {
                continue;
            }

            // 入库单号连接
            let rk = tr.querySelector('.入库单号');
            if (rk && rk.textContent.trim() != "KT202312-01") {
                let url = rk.textContent.trim().startsWith("RK") ? "/material_in/" : "/stock_change_in/";
                rk.innerHTML = `<a href="${url}${rk.textContent.trim()}" title="点击查阅单据">${rk.textContent.trim()}</a>`;
            }
        }
    }

    // 建立过滤器, 作为创建表格后的回调函数
    function make_filter() {
        const ths = document.querySelectorAll('.table-container thead th');

        let has_filter = ['规格', '状态', '执行标准', '生产厂家', '炉号', '库存长度', '区域'];

        ths.forEach(th => {
            if (has_filter.indexOf(th.textContent) != -1) {
                th.innerHTML = `${th.textContent} <button class="filter_button"><i class="fa fa-filter"></i></button>`;
            }
        });

        document.querySelectorAll('.filter_button').forEach(button => {
            button.addEventListener('click', function (e) {
                e.stopPropagation();
                let filter = document.querySelector('.filter-container');
                filter.style.top = e.clientY + 20 + "px";
                filter.style.left = e.clientX - this.parentNode.clientWidth + 20 + "px";
                document.querySelector('#f-check-all').checked = false;

                filter.style.display = "block";

                let na = button.parentNode.textContent.trim();
                let search = document.querySelector('#search-input').value;
                let cate = document.querySelector('#p-select').value;
                let id = document.querySelector('#product-id').textContent.trim();

                document.querySelector('#filter-name').textContent = na;

                let filter_sql = "";
                if (global.filter_sqls.length > 1 && na == global.filter_sqls[0].name) {
                    filter_sql = global.filter_sqls[1].sql;
                } else if (global.filter_sqls.length > 0 && na == global.filter_sqls[0].name) {
                    filter_sql = "";
                } else if (global.filter_sqls.length == 0) {
                    filter_sql = "";
                } else if (global.filter_sqls.length > 0 && na != global.filter_sqls[0].name) {
                    filter_sql = global.filter_sqls[0].sql;
                }

                let post_data = {
                    id: id,
                    name: search,
                    cate: cate,
                    filter_name: na,
                    filter: filter_sql,
                };

                fetch('/fetch_filter_items', {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(post_data),
                })
                    .then(response => response.json())
                    .then(content => {
                        let html = "";
                        let n = 0;
                        for (let row of content) {
                            if (row.trim() == "" && n == 0) {
                                row = "(空白)";
                                n++;
                            } else if (row.trim() == "" && n == 1) {
                                continue;
                            }

                            html += `
                                <label class="check-radio">
                                    <input class="form-check" type="checkbox">
                                    <span class="checkmark"></span>
                                    <span class="all-choose">${row}</span>
                                </label>
                            `;
                        }

                        filter.querySelector('.f-choose').innerHTML = html;

                        let now_select = [];
                        for (let item of global.filter_sqls) {
                            if (item.name.trim() == na) {
                                now_select = item.now;
                                break;
                            }
                        }

                        for (let ch of filter.querySelectorAll('.form-check')) {
                            if (now_select.indexOf(`<${ch.parentNode.textContent.trim()}>`) != -1) {
                                ch.checked = true;
                            }
                        }
                    });
            })
        })
    };

    // 确定
    document.querySelector('#f-ok').addEventListener('click', () => {
        let checked = document.querySelector('.f-choose').querySelectorAll('.form-check');
        let filter_name = document.querySelector('#filter-name').textContent
        let f_sql = "", check_now = "";

        document.querySelector('.f-choose').innerHTML = "";
        document.querySelector('.filter-container').style.display = "none";

        checked.forEach(ch => {
            const ch_name = ch.parentNode.textContent.trim();
            if (ch.checked) {
                f_sql += `${filter_name} = '${ch_name}' OR `;
                check_now += `<${ch_name}>, `;   // 与 过滤器原始值 格式一致
            }
        });

        if (check_now == "") {
            return;
        }

        // 去掉末尾的 OR, 并加括号
        let f_sql2 = f_sql.slice(0, -4) + ')';

        global.filter_conditions.set(filter_name, f_sql2);

        let filter = `AND (`;
        let keys = [];

        // 构建过滤器（查询字符串）
        for (const [key, value] of global.filter_conditions) {    //遍历 使用 for of
            filter += `${value} AND (`;
            keys.push(key);
        }

        filter = filter.slice(0, -6);

        if ((global.filter_sqls.length == 0 || global.filter_sqls[0].name != filter_name) &&
            check_now != "" && check_now.split(',').length != checked.length + 1) {
            let orig = "";   // 过滤器原始值
            checked.forEach(ch => {
                orig += `${ch.parentNode.textContent.trim()}, `;
            });

            let sql = {
                name: filter_name,
                sql: filter,
                origin: orig,
                now: check_now,
            }

            global.filter_sqls.unshift(sql);
        } else if (global.filter_sqls.length > 0 && global.filter_sqls[0].name == filter_name) {
            if (check_now == global.filter_sqls[0].origin || check_now.split(',').length == checked.length + 1) {
                global.filter_sqls.shift();
                filter = global.filter_sqls.length == 0 ? "" : global.filter_sqls[0].sql;
            } else {
                global.filter_sqls[0].sql = filter;
                global.filter_sqls[0].now = check_now;
            }
        }

        // console.log(global.filter_sqls);

        let post_data = {
            filter: filter,
            page: 1,
        };

        Object.assign(tool_table.table_data().post_data, post_data);

        tool_table.fetch_table(() => {
            add_lu_link();
        });

        //设置颜色提示
        document.querySelectorAll('.filter_button').forEach(button => {
            let name = button.parentNode.textContent.trim();
            let has = false;
            for (let item of global.filter_sqls) {
                if (item.name == name) {
                    button.classList.add('red');
                    has = true;
                    break;
                }
            }
            if (!has) {
                button.classList.remove('red');
            }
        });
    });

    // 取消
    document.querySelector('#f-cancel').addEventListener('click', () => {
        document.querySelector('.filter-container').style.display = "none";
    });

    // 全选
    document.querySelector('#f-check-all').addEventListener('click', () => {
        let checked = document.querySelector('#f-check-all').checked;
        document.querySelector('.f-choose').querySelectorAll('.form-check').forEach(input => {
            if (checked) {
                input.checked = true;
            } else {
                input.checked = false;
            }
        })
    });

    // 点击空白区域关闭 filter
    document.querySelector('body').addEventListener('click', (e) => {
        let filters = ['filter-container', 'f-title', 'f-choose', 'f-sumit', 'f-items',
            'checkmark', 'check-radio', 'form-check', 'all-choose', 'f-button'];
        if (filters.indexOf(e.target.className) == -1) {
            document.querySelector('.filter-container').style.display = "none";
        }
    });

    // Esc 按键关闭 filter
    document.addEventListener('keydown', (event) => {
        const keyName = event.key;
        if (keyName === 'Escape') {
            document.querySelector('.filter-container').style.display = "none";
        }
    }, false);

    // 筛选当前库存
    document.querySelector('#p-select').addEventListener('change', () => {
        let post_data = {
            id: document.querySelector('#product-id').textContent.trim(),
            name: document.querySelector('#search-input').value,
            cate: document.querySelector('#p-select').value,
            page: 1,
        };

        Object.assign(tool_table.table_data().post_data, post_data);
        tool_table.fetch_table(() => {
            add_lu_link();
        });
    });

    //增加按键
    document.querySelector('#add-button').addEventListener('click', function () {
        global.eidt_cate = "add";

        if (global.product_name != "") {
            document.querySelector('.modal-body').innerHTML = service.build_add_form(service.table_fields());
            document.querySelector('.modal-title').textContent = global.product_name;
            document.querySelector('.modal-dialog').style.cssText = "max-width: 500px;"
            document.querySelector('.modal').style.display = "block";
            document.querySelector('.modal-body input').focus();
            leave_alert();
        } else {
            notifier.show('请先选择商品', 'danger');
        }
    });

    //查阅出库按键
    document.querySelector('#find-button').addEventListener('click', function () {
        global.eidt_cate = "add";
        let chosed = document.querySelector('tbody .focus');
        let id = chosed ? chosed.querySelector('td:nth-child(2)').textContent.trim() : "";
        let p_name = chosed ? chosed.querySelector('.名称').textContent.trim() : "";

        if (global.product_name == "") {
            global.product_name = p_name;
        }

        if (global.product_name != "" && id != "") {
            fetch('/fetch_pout_items', {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: id,
            })
                .then(response => response.json())
                .then(content => {
                    let html = `
                    <div class="table-container table-pout">
                        <table>
                            <thead>
                                <tr><th width="6%">序号</th><th width="10%">出库类别</th><th width="15%">日期</th><th width="15%">单号</th>
                                <th width="8%">长度</th><th width="8%">数量</th><th width="8%">总长度</th><th width="10%">实际重量</th><th width="13%">备注</th></tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>                        
                    </div>`;

                    let tds = "";
                    let n = 1;
                    for (let row of content) {
                        let hr = row.cate == "销售出库" ? "/material_out/" : "/stock_change_out/";
                        tds += `<tr><td>${n++}</td><td>${row.cate}</td><td>${row.date}</td><td><a href="${hr}${row.dh}" target="_blank">${row.dh}</a></td>
                            <td>${row.long}</td><td>${row.num}</td><td>${row.all_long}</td><td>${row.weight}</td><td>${row.note}</td></tr>`;
                    }

                    for (let i = 0; i < 15 - n + 1; i++) {
                        tds += `<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
                    }

                    let gg = chosed.querySelector('td:nth-child(4)').textContent;
                    let status = chosed.querySelector('td:nth-child(5)').textContent;
                    let long = chosed.querySelector('td:nth-child(10)').textContent;
                    let now_long = chosed.querySelector('td:nth-child(12)').textContent;

                    document.querySelector('.modal-body').innerHTML = html;
                    document.querySelector('.modal-body .table-pout tbody').innerHTML = tds;
                    document.querySelector('.modal-title').textContent = `${id}：${global.product_name}　${gg}　${status}，入库长度：${long}　现有长度：${now_long}`;
                    document.querySelector('.modal-dialog').style.cssText = "max-width: 800px;";
                    document.querySelector('.modal').style.display = "block";
                    document.querySelector('#modal-sumit-button').style.display = "none";
                });
        } else {
            notifier.show('请先选择商品', 'danger');
        }
    });

    //编辑按键
    if (document.querySelector('#edit-button')) {
        document.querySelector('#edit-button').addEventListener('click', function () {
            global.eidt_cate = "edit";

            let chosed = document.querySelector('tbody .focus');
            let id = chosed ? chosed.querySelector('td:nth-child(2)').textContent : "";
            let p_name = chosed ? chosed.querySelector('.名称').textContent.trim() : "";
            let p_id = chosed ? chosed.querySelector('.商品id').textContent.trim() : "";

            if (global.product_name == "") {
                global.product_name = p_name;
            }

            if (global.product_id == "") {
                global.product_id = p_id;
            }

            if (global.product_name != "" && global.product_id != "" && id != "") {
                let fields = [{
                    "id": 105,
                    "num": 2,
                    "field_name": "文本字段1",
                    "data_type": "文本",
                    "show_name": "物料号",
                    "show_width": 5,
                    "ctr_type": "普通输入",
                    "option_value": "",
                    "default_value": "",
                    "is_show": true,
                    "show_order": 1,
                    "all_edit": true,
                    "is_use": false
                },
                {
                    "id": 131,
                    "num": 5,
                    "field_name": "文本字段2",
                    "data_type": "文本",
                    "show_name": "状态",
                    "show_width": 4,
                    "ctr_type": "普通输入",
                    "option_value": "",
                    "default_value": "",
                    "is_show": true,
                    "show_order": 4,
                    "all_edit": true,
                    "is_use": true
                },
                {
                    "id": 114,
                    "num": 10,                  // 对应表格字段顺号
                    "field_name": "整数字段1",
                    "data_type": "整数",
                    "show_name": "入库长度",
                    "show_width": 4,
                    "ctr_type": "普通输入",
                    "option_value": "",
                    "default_value": "",
                    "is_show": true,
                    "show_order": 4,
                    "all_edit": true,
                    "is_use": true
                },
                {
                    "id": 133,
                    "num": 14,
                    "field_name": "库位",
                    "data_type": "文本",
                    "show_name": "库位",
                    "show_width": 4,
                    "ctr_type": "普通输入",
                    "option_value": "",
                    "default_value": "",
                    "is_show": true,
                    "show_order": 12,
                    "all_edit": true,
                    "is_use": true
                },
                {
                    "id": 120,
                    "num": 17,
                    "field_name": "文本字段7",
                    "data_type": "文本",
                    "show_name": "切完",
                    "show_width": 3,
                    "ctr_type": "下拉列表",
                    "option_value": "否_是",
                    "default_value": "",
                    "is_show": true,
                    "show_order": 14,
                    "all_edit": true,
                    "is_use": true
                },
                {
                    "id": 110,
                    "num": 18,
                    "field_name": "备注",
                    "data_type": "文本",
                    "show_name": "备注",
                    "show_width": 5,
                    "ctr_type": "普通输入",
                    "option_value": "",
                    "default_value": "",
                    "is_show": true,
                    "show_order": 15,
                    "all_edit": true,
                    "is_use": true
                }];

                let form = "<form>";
                for (let name of fields) {
                    let control;
                    let dis = !name.is_use ? "disabled" : "";
                    if (name.ctr_type == "普通输入") {
                        let value = chosed.querySelector(`td:nth-child(${name.num})`).textContent;
                        control = `<div class="form-group">
                            <div class="form-label">
                                <label>${name.show_name}</label>
                            </div>
                            <input class="form-control input-sm has-value" type="text" value="${value}" ${dis}>
                        </div>`;
                    } else {
                        let show_value = chosed.querySelector(`td:nth-child(${name.num})`).textContent;
                        control = `<div class="form-group">
                            <div class="form-label">                                    
                                <label>${name.show_name}</label>
                            </div>
                            <select class='select-sm has-value'>`;

                        let options = name.option_value.split('_');
                        for (let value of options) {
                            if (value == show_value) {
                                control += `<option value="${value}" selected>${value}</option>`;
                            } else {
                                control += `<option value="${value}">${value}</option>`;
                            }
                        }

                        control += "</select></div>";
                    }

                    form += control;
                }
                form += "</form>";

                global.row_id = id;
                document.querySelector('.modal-body').innerHTML = form;
                document.querySelector('.modal-title').textContent = global.product_name;
                document.querySelector('.modal-dialog').style.cssText = "max-width: 500px;";
                document.querySelector('.modal').style.display = "block";
                document.querySelector('.modal-body input').focus();
                leave_alert();
            } else {
                notifier.show('请先选择物料', 'danger');
            }
        });
    }

    //提交按键
    document.querySelector('#modal-sumit-button').addEventListener('click', function () {
        if (global.eidt_cate == "add" || global.eidt_cate == "edit") {
            let all_input = document.querySelectorAll('.has-value');
            if (all_input[0].value != "") {
                let num = 0;
                for (let input of all_input) {
                    if (service.table_fields()[num].data_type == "整数" && !regInt.test(input.value)
                        || service.table_fields()[num].data_type == "实数" && !regReal.test(input.value)) {
                        notifier.show('数字字段输入错误', 'danger');
                        return false;
                    }
                    num++;
                }
                let product = `${global.row_id}${SPLITER}${global.product_id}${SPLITER}`;

                num = 0;

                for (let input of all_input) {
                    let value;
                    if (input.parentNode.className.indexOf('check-radio') == -1) {
                        value = input.value;
                    } else {
                        value = input.checked;
                    }

                    if (service.table_fields()[num].data_type == "整数" || service.table_fields()[num].data_type == "实数") {
                        value = Number(value);
                    }

                    product += `${value}${SPLITER}`;
                    num++;
                }

                let data = {
                    data: product,
                };

                let url = global.eidt_cate == "edit" ? `/update_product` : `/add_product`;

                fetch(url, {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                })
                    .then(response => response.json())
                    .then(content => {
                        if (content == 1) {
                            global.edit = 0;
                            modal_out_data.edit = 0;
                            notifier.show('商品修改成功', 'success');

                            tool_table.fetch_table(() => {
                                add_lu_link();
                            });

                            if (global.eidt_cate == "add") {
                                for (let input of all_input) {
                                    input.value = "";
                                }
                            }
                            close_modal();
                        } else {
                            notifier.show('权限不够，操作失败', 'danger');
                        }
                    });
            } else {
                notifier.show('空值不能提交', 'danger');

            }
        } else {
            let url = global.eidt_cate == "批量导入" ? `/product_datain` : `/product_updatein`;
            fetch(url, {
                method: 'post',
                body: global.product_id,
            })
                .then(response => response.json())
                .then(content => {
                    if (content == 1) {
                        notifier.show('批量操作成功', 'success');
                        tool_table.fetch_table(() => {
                            add_lu_link();
                        });
                        close_modal();
                    } else {
                        notifier.show('权限不够，操作失败', 'danger');
                    }
                });
        }
    });

    modal_init();

    //数据导入和导出 ------------------------------------------------------------------------------

    document.querySelector('#data-out').addEventListener('click', function () {
        if (global.product_name != "") {
            let data = {
                id: global.product_id,
                name: global.product_name,
                done: document.querySelector('#p-select').value,
            };

            fetch(`/product_out`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
                .then(response => response.json())
                .then(content => {
                    if (content != -1) {
                        download_file(`/download/${content}.xlsx`);
                        notifier.show('成功导出至 Excel 文件', 'success');
                    } else {
                        notifier.show('权限不够，操作失败', 'danger');
                    }
                });
        } else {
            notifier.show('请先选择商品', 'danger');
        }
    });

    //批量导入
    let fileBtn = document.getElementById('choose_file');

    document.getElementById('data-in').addEventListener('click', function () {
        if (global.product_name == "") {
            notifier.show('请先选择商品分类', 'danger');
            return false;
        }
        fileBtn.click();
    });

    fileBtn.addEventListener('change', () => {
        data_in(fileBtn, "将追加", "追加新数据，同时保留原数据", "批量导入");
    });

    //批量更新
    let fileBtn_update = document.getElementById('choose_file2');

    document.getElementById('data-update').addEventListener('click', function () {
        if (global.product_name == "") {
            notifier.show('请先选择商品分类', 'danger');
            return false;
        }
        fileBtn_update.click();
    });

    fileBtn_update.addEventListener('change', () => {
        data_in(fileBtn_update, "将更新", "更新数据，原数据将被替换，请谨慎操作！", "批量更新");
    });

    function data_in(fileBtn, info1, info2, cate) {
        if (checkFileType(fileBtn)) {
            const fd = new FormData();
            fd.append('file', fileBtn.files[0]);
            fetch(`/product_in`, {
                method: 'POST',
                body: fd,
            })
                .then(res => res.json())
                .then(content => {
                    if (content != -1 && content != -2) {
                        let rows = "<div class='table-container table-product'><table style='font-size: 12px;'><thead>";
                        let n = 1;
                        for (let item of content[0]) {
                            let arr_p = item.split("<`*_*`>");
                            let row;
                            if (n == 1) {
                                row = `<tr>`;
                                for (let i = 0; i < arr_p.length - 1; i++) {
                                    row += `<th>${arr_p[i]}</th}>`;
                                }
                                row += "</tr></thead><tbody>";
                                n = 2;
                            } else {
                                row = `<tr>`;
                                for (let i = 0; i < arr_p.length - 1; i++) {
                                    row += `<td>${arr_p[i]}</td>`;
                                }
                                row += "</tr>";
                            }

                            rows += row;
                        }
                        rows += "</tbody></table></div>";
                        document.querySelector('.modal-body').innerHTML = rows;

                        let message = content[2] > 50 ? " (仅显示前 50 条）" : "";
                        document.querySelector('.modal-title').innerHTML = `${global.product_name} ${info1} ${content[1]} 条数据${message}：`;
                        document.querySelector('#modal-info').innerHTML = `${global.product_name} ${info2}`;

                        global.eidt_cate = cate;

                        document.querySelector('.modal-dialog').style.cssText = "max-width: 1200px;";
                        document.querySelector('.modal').style.cssText = "display: block";
                        fileBtn.value = "";

                    } else if (content == -1) {
                        notifier.show('缺少操作权限', 'danger');
                    } else {
                        notifier.show('excel 表列数不符合', 'danger');
                    }
                });
        } else {
            notifier.show('需要 excel 文件', 'danger');
        }
    }
}();