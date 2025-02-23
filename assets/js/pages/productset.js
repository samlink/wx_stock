let page_productset = function () {

    // if (!getCookie("wxok")) {
    //     window.location.href = "/";
    // }

    const lang = localStorage.getItem('language') || 'zh';
    if (lang == "en") {
        document.querySelector('#auto_input').placeholder = 'Name search';
        document.querySelector('.tree-title').textContent = 'Product category　';
        document.querySelector('#search-input').placeholder = 'Specification search';
        document.querySelector('#serach-button').textContent = 'Search';
        document.querySelector('#data-out').textContent = 'Export data';
        document.querySelector('#first').title = 'First page';
        document.querySelector('#pre').title = 'Previous page';
        document.querySelector('#aft').title = 'Next page';
        document.querySelector('#last').title = 'Last page';
        document.querySelector('.page-info').innerHTML =
            `<span>Page</span><input type="text" class="form-control" id="page-input" value="1">
                <span>of</span><span id="pages"></span><span>pages</span>`;
        document.querySelector('.table-info').innerHTML = `Total <span id="total-records"></span> records`;

        document.querySelector('.all-choose').textContent = 'Check all';
        document.querySelector('#f-ok').textContent = 'OK';
        document.querySelector('#f-cancel').textContent = 'Cancel';
    }

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
            tool_table.fetch_table((content) => {
                make_filter();
                // add_lu_link();
                show_stat(content);
            });

            // 清除状态
            document.querySelectorAll('.filter_button').forEach(button => {
                button.classList.remove('red');
            });
        }
    }

    tool_tree.tree_init(tree_data);
    tool_tree.fetch_tree(stem_click);

    let input = document.querySelector('#auto_input');

    let auto_comp = new AutoInput(input, "", `/stock/tree_auto`, () => {
        tool_tree.tree_search(input.value);
    });

    auto_comp.init();

    document.querySelector("#auto_search").addEventListener('click', () => {
        tool_tree.tree_search(input.value);
    });

    //商品规格表格数据 -------------------------------------------------------------------

    service.build_product_table(row_num, make_filter, '', show_stat);

    // 点击树的 stem 显示统计信息
    function show_statistic(cate) {
        fetch("/stock/fetch_statistic", {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: cate,
        })
            .then(response => response.json())
            .then(content => {
                let obj = lang == "zh" ? {
                    "3": "圆钢",
                    "4": "无缝钢管",
                } : {
                    "3": "Bar",
                    "4": "Pipe",
                };

                document.querySelector('.info-show').textContent = lang == "zh" ?
                    `${obj[cate]}长度合计：${content.库存长度} 米，重量合计：${content.库存重量} KG` :
                    `Total length of ${obj[cate]}: ${content.库存长度} meters, total weight: ${content.库存重量} KG`;
            });
    }

    // 显示统计信息，作为 fetch_table 的回调函数
    function show_stat(content) {
        let long = content[3] == 0 && content[4] != 0 ? "< 1" : content[3];
        document.querySelector('.info-show').textContent = lang == "zh" ?
            `长度合计：${long} 米，重量合计：${content[4]} KG` :
            `Total length: ${long} meters, total weight: ${content[4]} KG`;
    }

    // 点击树的茎 stem
    function stem_click() {
        let all_stem = document.querySelectorAll('.item-down');
        all_stem.forEach(stem => {
            stem.addEventListener('click', function () {
                let cate;
                if (lang == "zh") {
                    cate = this.textContent.trim() == "圆钢" ? "3" : "4";
                } else {
                    cate = this.textContent.trim() == "Bar" ? "3" : "4";
                }
                show_statistic(cate);
            })
        });
    }

    // 导出数据
    document.querySelector('#data-out').addEventListener('click', function () {
        if (global.product_name != "") {
            let data = {
                id: document.querySelector('#product-id').textContent.trim(),
                name: document.querySelector('#product-name').textContent.trim(),
                search: document.querySelector('#search-input').value.trim(),
                filter: get_filter(),
                cate: "正常销售",
                lang: lang,
            };

            fetch(`/stock/product_out`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
                .then(response => response.json())
                .then(content => {
                    if (content != -1) {
                        download_file(`/stock/download/${content}.xlsx`);
                        notifier.show(lang == "zh" ? '成功导出至 Excel 文件' : 'Successfully exported to Excel file', 'success');
                    } else {
                        notifier.show(lang == "zh" ? '权限不够，操作失败' : 'Permissions dinied, operation failed', 'danger');
                    }
                });
        } else {
            notifier.show(lang == "zh" ? '请先选择商品' : 'Please select a product first', 'danger');
        }
    });

    // ------------------------------------ 过滤部分开始--------------------------------------------
    // 表头过滤按钮中英文对照
    let eng_map;

    // 建立过滤器, 作为创建表格后的回调函数
    function make_filter() {
        const ths = document.querySelectorAll('.table-container thead th');
        for (let th of ths) {
            if (th.querySelector('.filter_button')) {
                return false;
            }
        }

        let has_filter = ['规格', '状态', '执行标准', '生产厂家', '炉号', '库存长度', '区域'];

        if (lang != "zh") {
            has_filter = ['Specification', 'Status', 'Standard', 'Manufacturer', 'Furnace', 'Length', 'Area'];
            eng_map = {
                'Specification': '规格',
                'Status': '状态',
                'Standard': '执行标准',
                'Manufacturer': '生产厂家',
                'Furnace': '炉号',
                'Length': '库存长度'
            }
        }

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
                na = lang == "zh" ? na : eng_map[na];

                let search = document.querySelector('#search-input').value;
                let cate = "正常销售";
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

                fetch('/stock/fetch_filter_items', {
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
                                row = lang == "zh" ? "(空白)" : "(Blank)";
                                n++;
                            } else if (row.trim() == "" && n == 1) {
                                continue;
                            }

                            if (post_data.filter_name == "状态" && lang == "en") {
                                row = service.status_to_en(row);
                            }

                            if (post_data.filter_name == "生产厂家" && lang == "en") {
                                row = service.factor_to_en(row);
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
                            let na = ch.parentNode.textContent.trim();

                            if (na == "(Blank)") {
                                na = "(空白)";
                            }

                            if (post_data.filter_name == "状态" && lang == "en") {
                                na = service.status_to_zh(na);
                            }

                            if (post_data.filter_name == "生产厂家" && lang == "en") {
                                na = service.factor_to_zh(na);
                            }

                            if (now_select.indexOf(`<${na}>`) != -1) {
                                ch.checked = true;
                            }
                        }
                    });
            })
        });

        make_red();
    }

    // 确定
    document.querySelector('#f-ok').addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        document.querySelector('.filter-container').style.display = "none";

        let checked = document.querySelector('.f-choose').querySelectorAll('.form-check');
        let filter_name = document.querySelector('#filter-name').textContent

        // console.log(filter_name);

        let f_sql = "", check_now = "";

        // 全选状态
        let all_checked = document.querySelector('#f-check-all').checked;

        if (all_checked) {
            document.querySelector('.f-choose').innerHTML = "";

            if (global.filter_sqls.length > 0 && global.filter_sqls[0].name == filter_name) {
                global.filter_conditions.delete(filter_name);
                global.filter_sqls.shift();
                let filter = global.filter_sqls.length == 0 ? "" : global.filter_sqls[0].sql;

                let post_data = {
                    filter: filter,
                    page: 1,
                };

                fresh_table(post_data);
            }

            return;
        }

        checked.forEach(ch => {
            let ch_name = ch.parentNode.textContent.trim();
            
            console.log(ch_name);
            

            if (ch_name == "(Blank)") {
                ch_name = "(空白)";
            }

            if (filter_name == "状态" && lang == "en") {
                ch_name = service.status_to_zh(ch_name);
            }

            if (filter_name == "生产厂家" && lang == "en") {
                ch_name = service.factor_to_zh(ch_name);
            }

            console.log(ch_name);


            if (ch.checked) {
                f_sql += `${filter_name} = '${ch_name}' OR `;
                check_now += `<${ch_name}>, `;   // 与 过滤器原始值 格式一致
            }
        });

        // 非空选中
        if (check_now != "") {
            // 去掉末尾的 OR, 并加括号
            let f_sql2 = f_sql.slice(0, -4) + ')';

            global.filter_conditions.set(filter_name, f_sql2);
            let filter = get_filter();

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

            let post_data = {
                filter: filter,
                page: 1,
            };

            fresh_table(post_data);
        } else {
            // 全不选的情况
            document.querySelector('#f-check-all').click();
            document.querySelector('#f-ok').click();
        }
    });

    // 过滤点击 ok 后，刷新表格
    function fresh_table(data) {
        document.querySelector('.f-choose').innerHTML = "";
        Object.assign(tool_table.table_data().post_data, data);

        tool_table.fetch_table((content) => {
            make_filter();
            // add_lu_link();
            show_stat(content);
        });

        make_red();
    }

    //设置过滤按钮颜色
    function make_red() {
        document.querySelectorAll('.filter_button').forEach(button => {
            let name = button.parentNode.textContent.trim();

            if (lang == "en") {
                name = eng_map[name];
            }

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
    }

    function get_filter() {
        let filter = `AND (`;

        // 构建过滤器（查询字符串）
        for (const [key, value] of global.filter_conditions) {    //遍历 使用 for of
            filter += `${value} AND (`;
        }

        filter = filter.slice(0, -6);
        return filter;
    }

    // 取消
    document.querySelector('#f-cancel').addEventListener('click', () => {
        document.querySelector('.filter-container').style.display = "none";
        document.querySelector('.f-choose').innerHTML = "";

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
            document.querySelector('.f-choose').innerHTML = "";
        }
    });

    // Esc 按键关闭 filter
    document.addEventListener('keydown', (event) => {
        const keyName = event.key;
        if (keyName === 'Escape') {
            document.querySelector('.filter-container').style.display = "none";
            document.querySelector('.f-choose').innerHTML = "";
        }
    }, false);

    // ------------------------------- 过滤部分结束 --------------------------------
}();