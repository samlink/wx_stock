// 通用筛选过滤器初始化函数
// 用法：
// const tableFilter = initTableFilter({
//   getThs: () => document.querySelectorAll('.table-container thead th'),
//   has_filter: ['规格', ...],
//   url: '/fetch_filter_items',
//   state: { filter_conditions: new Map(), filter_sqls: [] },
//   buildFetchPostData: ({ name, baseFilterSql }) => ({ name: ..., filter_name: name, filter: baseFilterSql, ...更多字段 }),
//   onRefreshTable: (filterSql) => { ... 刷新表格 ... },
//   position: 'relative' | 'cursor',
//   positionOffset: { top: 0, left: 0 },
//   thDecorator: (th) => { ... 可选，设置 th 的样式 ... },
//   selectors: { container: '.filter-container', ok: '#f-ok', cancel: '#f-cancel', checkAll: '#f-check-all', uncheckAll: '#f-uncheck-all', choose: '.f-choose', name: '#filter-name' }
// });
// tableFilter.ensureButtons();
// tableFilter.updateButtonColors();
function initTableFilter(options) {
    const opts = Object.assign({
        // 将表头显示名(可能为英文)转换为内部统一使用的过滤字段名(通常为中文)
        // 用于：
        // - 英文表头下按钮变红
        // - 请求后端 filter_items 时传递统一字段名
        // - 构建 filter_conditions / filter_sqls 的 key
        normalizeName: (name) => name,
        // 翻译过滤条目（仅影响展示文本）。
        // 注意：SQL 构建会使用条目的原始值（data-value），避免“显示英文但提交值变化”导致过滤失败。
        translateItem: ({ filterName, value }) => value,
        selectors: {
            container: '.filter-container',
            ok: '#f-ok',
            cancel: '#f-cancel',
            checkAll: '#f-check-all',
            uncheckAll: '#f-uncheck-all',
            choose: '.f-choose',
            name: '#filter-name',
        },
        position: 'relative', // 'relative' | 'cursor'
        positionOffset: { top: 0, left: 0 },
    }, options || {});

    const state = opts.state; // 期望包含 filter_conditions(Map) 与 filter_sqls(Array)

    function getFilterContainer() {
        return document.querySelector(opts.selectors.container);
    }

    function buildFilterString() {
        let filter = 'AND (';
        for (const [key, value] of state.filter_conditions) {
            filter += `${value} AND (`;
        }
        filter = filter.slice(0, -6); // 去掉最后一个 ' AND ('
        return filter;
    }

    function updateButtonColors() {
        document.querySelectorAll('.filter_button').forEach(button => {
            // 兼容英文表头：按钮显示名可能是英文，但 state.filter_sqls 内部存的是统一字段名
            let name = opts.normalizeName(button.parentNode.textContent.trim());
            let has = false;
            for (let item of state.filter_sqls) {
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

    function setCommonEventBindingsOnce() {
        const container = getFilterContainer();
        if (!container || container.dataset.bound === '1') return;

        // 确定
        document.querySelector(opts.selectors.ok).addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();

            container.style.display = 'none';

            let checked = container.querySelector(opts.selectors.choose).querySelectorAll('.form-check');
            // #filter-name 存放的是内部统一字段名
            let filter_name = document.querySelector(opts.selectors.name).textContent;
            let f_sql = '', check_now = '';

            // 全选状态
            let all_checked = document.querySelector(opts.selectors.checkAll).checked;
            if (all_checked) {
                container.querySelector(opts.selectors.choose).innerHTML = '';

                if (state.filter_sqls.length > 0 && state.filter_sqls[0].name == filter_name) {
                    state.filter_conditions.delete(filter_name);
                    state.filter_sqls.shift();
                    let filter = state.filter_sqls.length == 0 ? '' : state.filter_sqls[0].sql;

                    opts.onRefreshTable && opts.onRefreshTable(filter);
                }
                return;
            }

            checked.forEach(ch => {
                // 优先使用 data-value（原始值），避免英文界面展示翻译后影响过滤值
                const raw_value = (ch.dataset && ch.dataset.value) ? ch.dataset.value : ch.parentNode.textContent.trim();
                if (ch.checked) {
                    f_sql += `${filter_name} = '${raw_value}' OR `;
                    check_now += `<${raw_value}>, `;
                }
            });

            if (check_now != '') {
                let f_sql2 = f_sql.slice(0, -4) + ')';
                state.filter_conditions.set(filter_name, f_sql2);
                let filter = buildFilterString();

                if ((state.filter_sqls.length == 0 || state.filter_sqls[0].name != filter_name) &&
                    check_now != '' && check_now.split(',').length != checked.length + 1) {
                    let orig = '';
                    checked.forEach(ch => {
                        const raw_value = (ch.dataset && ch.dataset.value) ? ch.dataset.value : ch.parentNode.textContent.trim();
                        orig += `${raw_value}, `;
                    });

                    let sql = {
                        name: filter_name,
                        sql: filter,
                        origin: orig,
                        now: check_now,
                    };
                    state.filter_sqls.unshift(sql);
                } else if (state.filter_sqls.length > 0 && state.filter_sqls[0].name == filter_name) {
                    if (check_now == state.filter_sqls[0].origin || check_now.split(',').length == checked.length + 1) {
                        state.filter_sqls.shift();
                        filter = state.filter_sqls.length == 0 ? '' : state.filter_sqls[0].sql;
                    } else {
                        state.filter_sqls[0].sql = filter;
                        state.filter_sqls[0].now = check_now;
                    }
                }

                opts.onRefreshTable && opts.onRefreshTable(filter);
            } else {
                // 全不选的情况 => 等价于全选
                document.querySelector(opts.selectors.checkAll).click();
                document.querySelector(opts.selectors.ok).click();
            }
        });

        // 取消
        document.querySelector(opts.selectors.cancel).addEventListener('click', () => {
            container.style.display = 'none';
            container.querySelector(opts.selectors.choose).innerHTML = '';
        });

        // 全选
        document.querySelector(opts.selectors.checkAll).addEventListener('click', () => {
            let checked = document.querySelector(opts.selectors.checkAll).checked;
            container.querySelector(opts.selectors.choose).querySelectorAll('.form-check').forEach(input => {
                input.checked = !!checked;
            });
            // 取消全选时，取消取消checkbox的选中状态
            if (!checked) {
                document.querySelector(opts.selectors.uncheckAll).checked = false;
            }
        });

        // 取消选择（新增功能）
        document.querySelector(opts.selectors.uncheckAll).addEventListener('click', () => {
            let checked = document.querySelector(opts.selectors.uncheckAll).checked;
            container.querySelector(opts.selectors.choose).querySelectorAll('.form-check').forEach(input => {
                input.checked = !checked;
            });
            // 取消全选时，取消全选checkbox的选中状态
            if (checked) {
                document.querySelector(opts.selectors.checkAll).checked = false;
            }
        });

        // 点击空白区域关闭 filter
        document.querySelector('body').addEventListener('click', (e) => {
            let filters = ['filter-container', 'f-title', 'f-choose', 'f-sumit', 'f-items',
                'checkmark', 'check-radio', 'form-check', 'all-choose', 'f-button'];
            if (filters.indexOf(e.target.className) == -1) {
                container.style.display = 'none';
                container.querySelector(opts.selectors.choose).innerHTML = '';
            }
        });

        // Esc 按键关闭 filter
        document.addEventListener('keydown', (event) => {
            const keyName = event.key;
            if (keyName === 'Escape') {
                container.style.display = 'none';
                container.querySelector(opts.selectors.choose).innerHTML = '';
            }
        }, false);

        container.dataset.bound = '1';
    }

    function openFilterPanel(button, e, filterName) {
        const container = getFilterContainer();
        if (!container) return;

        // 位置设置
        if (opts.position === 'cursor' && e) {
            container.style.top = (e.clientY + (opts.cursorOffsetY || 20)) + 'px';
            container.style.left = (e.clientX - (button.parentNode ? button.parentNode.clientWidth : 0) + (opts.cursorOffsetX || 20)) + 'px';
        } else {
            // relative to button
            const rect = button.getBoundingClientRect();
            container.style.top = (rect.bottom + (opts.positionOffset.top || 0)) + 'px';
            container.style.left = (rect.left + (opts.positionOffset.left || 0)) + 'px';
        }

        // 设置宽度为所在列宽度的稍小值
        const th = button.parentNode;
        if (th) {
            container.style.width = th.clientWidth < 220 ? '220px' : (th.clientWidth - 10) + 'px';
        }

        document.querySelector(opts.selectors.checkAll).checked = false;
        document.querySelector(opts.selectors.uncheckAll).checked = false;
        container.style.display = 'block';
        // 在隐藏域里存内部统一字段名（用于后续构建 SQL / 按钮着色）
        document.querySelector(opts.selectors.name).textContent = opts.normalizeName(filterName);
    }

    function ensureButtons() {
        setCommonEventBindingsOnce();

        const ths = typeof opts.getThs === 'function' ? opts.getThs() : (opts.ths || []);
        // 防止重复绑定
        for (let th of ths) {
            if (th.querySelector && th.querySelector('.filter_button')) {
                return false;
            }
        }

        ths.forEach(th => {
            if (opts.has_filter.indexOf(th.textContent) != -1) {
                th.innerHTML = `${th.textContent} <button class="filter_button"><i class="fa fa-filter"></i></button>`;
                if (typeof opts.thDecorator === 'function') {
                    opts.thDecorator(th);
                }
            }
        });

        document.querySelectorAll('.filter_button').forEach(button => {
            button.addEventListener('click', function (e) {
                e.stopPropagation();
                const thText = button.parentNode.textContent.trim();
                const na = opts.normalizeName(thText); // 内部统一字段名
                openFilterPanel(button, e, thText);

                let filter_sql = '';
                if (state.filter_sqls.length > 1 && na == state.filter_sqls[0].name) {
                    filter_sql = state.filter_sqls[1].sql;
                } else if (state.filter_sqls.length > 0 && na == state.filter_sqls[0].name) {
                    filter_sql = '';
                } else if (state.filter_sqls.length == 0) {
                    filter_sql = '';
                } else if (state.filter_sqls.length > 0 && na != state.filter_sqls[0].name) {
                    filter_sql = state.filter_sqls[0].sql;
                }

                const post_data = opts.buildFetchPostData({ name: na, baseFilterSql: filter_sql });

                fetch(opts.url, {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(post_data),
                })
                    .then(response => response.json())
                    .then(content => {
                        let html = '';
                        let n = 0;
                        for (let row of content) {
                            if (row.trim() == '' && n == 0) {
                                row = '(空白)';
                                n++;
                            } else if (row.trim() == '' && n == 1) {
                                continue;
                            }
                            const raw_value = row;
                            const display_value = opts.translateItem({ filterName: na, value: raw_value });
                            html += `
                            <label class="check-radio">
                                <input class="form-check" type="checkbox" data-value="${raw_value}">
                                <span class="checkmark"></span>
                                <span class="all-choose">${display_value}</span>
                            </label>
                        `;
                        }
                        const container = getFilterContainer();
                        container.querySelector(opts.selectors.choose).innerHTML = html;

                        // 选中已选择项
                        let now_select = [];
                        for (let item of state.filter_sqls) {
                            if (item.name.trim() == na) {
                                now_select = item.now;
                                break;
                            }
                        }
                        for (let ch of container.querySelectorAll('.form-check')) {
                            const raw_value = (ch.dataset && ch.dataset.value) ? ch.dataset.value : ch.parentNode.textContent.trim();
                            if (now_select.indexOf(`<${raw_value}>`) != -1) {
                                ch.checked = true;
                            }
                        }
                    });
            });
        });

        updateButtonColors();
    }

    return {
        ensureButtons,
        updateButtonColors,
        buildFilterString,
    };
}