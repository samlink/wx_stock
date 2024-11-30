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
                make_filter();
            });
        }
    }

    tool_tree.tree_init(tree_data);
    tool_tree.fetch_tree(open_node);

    let input = document.querySelector('#auto_input');

    let auto_comp = new AutoInput(input, "", `/stock/tree_auto`, () => {
        tool_tree.tree_search(input.value);
    });

    auto_comp.init();

    document.querySelector("#auto_search").addEventListener('click', () => {
        tool_tree.tree_search(input.value);
    });

    //商品规格表格数据 -------------------------------------------------------------------

    service.build_product_table(row_num, make_filter);

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
                let cate = "现有库存";
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
        });

        make_red();
    }

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
            make_filter();
        });

        make_red();
    });

    //设置过滤按钮颜色
    function make_red() {
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
    }

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
}();