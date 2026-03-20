let page_productset = function () {

    if (!getCookie("wxok")) {
        window.location.href = "/";
    }

    // 初始化购物车管理器
    let cartManager = null;

    const lang = localStorage.getItem('language') || 'zh';
    const SPEC_UNIT_STORAGE_KEY = 'productset_spec_unit';
    const SPEC_UNIT_TEXTS = {
        zh: {
            controlLabel: '规格单位',
            mmHeader: '规格 (mm)',
            inHeader: '规格 (in)',
        },
        en: {
            controlLabel: 'Spec unit',
            mmHeader: 'Dia./OD*WT mm',
            inHeader: 'Dia./OD*WT in',
        }
    };

    function normalizeSpecUnit(unit) {
        return unit == 'in' ? 'in' : 'mm';
    }

    // 过滤窗口(表头过滤)文案中英文切换
    // 模板里默认写中文，这里按 lang 动态替换，避免英文界面仍显示“取消”
    (function applyFilterI18n() {
        const txt = (zh, en) => (lang == 'zh' ? zh : en);

        // 顶部复选框区域：全选 / 取消
        const checkAllSpan = document.querySelector('label[for="f-check-all"] .all-choose');
        if (checkAllSpan) checkAllSpan.textContent = txt('全选', 'All');

        const uncheckAllSpan = document.querySelector('label[for="f-uncheck-all"] .all-choose');
        if (uncheckAllSpan) uncheckAllSpan.textContent = txt('取消', 'Cancel');

        // 底部按钮：取消 / 确定
        const cancelBtn = document.querySelector('#f-cancel');
        if (cancelBtn) cancelBtn.textContent = txt('取消', 'Cancel');

        const okBtn = document.querySelector('#f-ok');
        if (okBtn) okBtn.textContent = txt('确定', 'OK');
    })();

    // 购物车相关文本映射
    const cartTexts = {
        zh: {
            cartTitle: '购物车',
            cartTooltip: '查看购物车',
            addToCart: '添加到购物车',
            addSuccess: '商品已添加到购物车',
            addError: '添加失败，请重试',
            networkError: '网络连接失败',
            serverError: '服务器错误',
            loginRequired: '请先登录',
            alreadyInCart: '商品已在购物车中',
            loading: '正在添加...',
            emptyCart: '购物车为空',
            itemsInCart: '购物车中有 {count} 件商品'
        },
        en: {
            cartTitle: 'Shopping Cart',
            cartTooltip: 'View Cart',
            addToCart: 'Add to Cart',
            addSuccess: 'Item added to cart successfully',
            addError: 'Failed to add item, please try again',
            networkError: 'Network connection failed',
            serverError: 'Server error, please try again later',
            loginRequired: 'Please login first to continue',
            alreadyInCart: 'Item is already in cart',
            loading: 'Adding...',
            emptyCart: 'Cart is empty',
            itemsInCart: '{count} item(s) in cart'
        }
    };

    // 获取购物车相关文本的辅助函数
    function getCartText(key, params = {}) {
        let text = cartTexts[lang][key] || cartTexts['zh'][key] || key;

        // 简单的文本插值
        if (params && typeof text === 'string') {
            Object.keys(params).forEach(param => {
                text = text.replace(`{${param}}`, params[param]);
            });
        }

        return text;
    }

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
        spec_unit: normalizeSpecUnit(localStorage.getItem(SPEC_UNIT_STORAGE_KEY)),
    }

    function getSpecHeaderText(unit = global.spec_unit) {
        return unit == 'in' ? SPEC_UNIT_TEXTS[lang].inHeader : SPEC_UNIT_TEXTS[lang].mmHeader;
    }

    function syncSpecUnitControl() {
        const label = document.querySelector('#spec-unit-label');
        if (label) {
            label.textContent = SPEC_UNIT_TEXTS[lang].controlLabel;
        }

        const select = document.querySelector('#spec-unit-select');
        if (select) {
            select.value = global.spec_unit;
        }
    }

    function normalizeFilterName(name) {
        return {
            '规格': '规格',
            '规格 (mm)': '规格',
            '规格 (in)': '规格',
            'Dia./OD*WT mm': '规格',
            'Dia./OD*WT in': '规格',
            'Condition': '状态',
            'Standard': '执行标准',
            'Manufacturer': '生产厂家',
            'Heat No.': '炉批号',
            'Length (mm)': '库存长度',
            'Length (mm) ': '库存长度',
        }[name] || name;
    }

    function setHeaderText(th, text) {
        const filterButton = th.querySelector('.filter_button');
        if (!filterButton) {
            th.textContent = text;
            return;
        }

        const textNode = Array.from(th.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) {
            textNode.textContent = `${text} `;
        } else {
            th.insertBefore(document.createTextNode(`${text} `), filterButton);
        }
    }

    function getSpecHeaderCell() {
        const specHeaders = new Set([
            '规格',
            SPEC_UNIT_TEXTS.zh.mmHeader,
            SPEC_UNIT_TEXTS.zh.inHeader,
            SPEC_UNIT_TEXTS.en.mmHeader,
            SPEC_UNIT_TEXTS.en.inHeader,
        ]);

        return Array.from(document.querySelectorAll('.table-product thead th'))
            .find(th => specHeaders.has(th.textContent.trim()));
    }

    function formatSpecInches(mmSpec) {
        return (mmSpec || '').replace(/[0-9]+(?:\.[0-9]+)?/g, (match) => {
            const value = Number(match);
            return Number.isFinite(value) ? (value / 25.4).toFixed(3) : match;
        });
    }

    function formatSpecForUnit(mmSpec, unit = global.spec_unit) {
        return unit == 'in' ? formatSpecInches(mmSpec) : (mmSpec || '');
    }

    function updateSpecHeader() {
        const specHeader = getSpecHeaderCell();
        if (!specHeader) {
            return;
        }

        setHeaderText(specHeader, getSpecHeaderText());
        const tableData = tool_table.table_data && tool_table.table_data();
        if (tableData && tableData.header_names) {
            tableData.header_names[SPEC_UNIT_TEXTS.zh.mmHeader] = 'pi.size';
            tableData.header_names[SPEC_UNIT_TEXTS.zh.inHeader] = 'pi.size';
            tableData.header_names[SPEC_UNIT_TEXTS.en.mmHeader] = 'pi.size';
            tableData.header_names[SPEC_UNIT_TEXTS.en.inHeader] = 'pi.size';
        }
    }

    function updateRenderedSpecCells() {
        document.querySelectorAll('.table-product tbody td.规格').forEach(cell => {
            const mmSpec = cell.dataset.mmSpec ? decodeURIComponent(cell.dataset.mmSpec) : cell.textContent.trim();
            if (!cell.dataset.mmSpec) {
                cell.dataset.mmSpec = encodeURIComponent(mmSpec);
            }

            const specText = formatSpecForUnit(mmSpec, global.spec_unit);
            cell.textContent = specText;
            cell.title = specText;
        });
    }

    function updateFilterPopupSpecValues() {
        const container = document.querySelector('.filter-container');
        if (!container || container.style.display !== 'block') {
            return;
        }

        const filterNameEl = document.querySelector('#filter-name');
        if (!filterNameEl || filterNameEl.textContent.trim() !== '规格') {
            return;
        }

        container.querySelectorAll('.f-choose label.check-radio').forEach(label => {
            const input = label.querySelector('input.form-check');
            const span = label.querySelector('span.all-choose');
            if (!input || !span) return;

            const rawMmValue = (input.dataset && input.dataset.value) ? input.dataset.value : span.textContent.trim();
            span.textContent = formatSpecForUnit(rawMmValue, global.spec_unit);
        });
    }

    function applySpecUnitDisplay() {
        syncSpecUnitControl();
        updateSpecHeader();
        updateRenderedSpecCells();
        updateFilterPopupSpecValues();
    }

    // 初始化购物车功能
    async function initializeCart() {
        try {
            cartManager = new CartManager();
            await cartManager.init();

            // 确保购物车管理器使用正确的语言设置
            cartManager.updateLanguage(lang);

            console.log('Shopping cart initialized successfully');
        } catch (error) {
            console.error('Failed to initialize shopping cart:', error);
        }
    }

    // 购物车表格刷新回调
    function onTableRefresh() {
        applySpecUnitDisplay();

        if (canDownload() && typeof add_lu_link === 'function') {
            add_lu_link();
        }

        // 表格刷新后，购物车按钮事件监听器会自动工作（使用事件委托）
        // 这里可以添加其他需要在表格刷新后执行的购物车相关逻辑
        if (cartManager) {
            // 确保购物车UI状态正确
            cartManager.updateCartDisplay(cartManager.getCurrentCount());

            // 高亮显示在购物车中的表格条目
            cartManager.highlightCartItems();
        }
    }

    function canDownload() {
        const el = document.querySelector('#can-download');
        if (!el) return false;
        const v = (el.textContent || '').trim().toLowerCase();
        return v === 'true' || v === '1' || v === 'yes';
    }

    // 获取购物车管理器实例（供其他模块使用）
    function getCartManager() {
        return cartManager;
    }

    // 刷新购物车数量（供外部调用）
    async function refreshCartCount() {
        if (cartManager) {
            await cartManager.getCartCount();
            cartManager.updateCartDisplay(cartManager.getCurrentCount());
        }
    }

    // 更新购物车语言设置
    function updateCartLanguage(newLang) {
        if (cartManager) {
            cartManager.updateLanguage(newLang);
        }
    }

    // 将购物车相关函数暴露到全局作用域（如果需要）
    if (typeof window !== 'undefined') {
        window.getCartManager = getCartManager;
        window.refreshCartCount = refreshCartCount;
        window.updateCartLanguage = updateCartLanguage;
        window.getCartText = getCartText;
    }

    //配置自动完成和树的显示 ---------------------------------------------------

    let tree_height = document.querySelector('.tree-container').clientHeight;
    let row_num = Math.floor((tree_height - 80) / 30);

    let tree_data = {
        leaf_click: (id, name) => {
            // 切换树节点时重置过滤状态（避免上一节点的过滤条件/按钮红色残留）
            try {
                global.filter_conditions && global.filter_conditions.clear && global.filter_conditions.clear();
                global.filter_sqls && (global.filter_sqls.length = 0);

                // 清空当前表格请求的过滤条件
                if (tool_table && tool_table.table_data && tool_table.table_data().post_data) {
                    tool_table.table_data().post_data.filter = '';
                }

                // 关闭过滤面板并清空内容
                const filterBox = document.querySelector('.filter-container');
                if (filterBox) {
                    filterBox.style.display = 'none';
                    const choose = filterBox.querySelector('.f-choose');
                    if (choose) choose.innerHTML = '';
                }
            } catch (e) {
                console.warn('reset filter state failed:', e);
            }

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
                show_stat(content);
                onTableRefresh();
            });

            // 清除按钮红色（并同步通用过滤器的按钮着色逻辑）
            document.querySelectorAll('.filter_button').forEach(button => {
                button.classList.remove('red');
            });
            if (typeof tableFilter !== 'undefined' && tableFilter.updateButtonColors) {
                tableFilter.updateButtonColors();
            }
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

    service.build_product_table(row_num, make_filter, onTableRefresh, show_stat);
    applySpecUnitDisplay();

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

    // 添加炉号链接
    function add_lu_link() {
        let trs = document.querySelectorAll('.table-product tbody tr');
        service.get_lu(trs);
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
                spec_unit: global.spec_unit,
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

    function get_filter() {
        let filter = `AND (`;

        // 构建过滤器（查询字符串）
        for (const [key, value] of global.filter_conditions) {    //遍历 使用 for of
            filter += `${value} AND (`;
        }

        filter = filter.slice(0, -6);
        return filter;
    }


    // ------------------------------------ 过滤部分开始--------------------------------------------

    // 表头过滤按钮中英文对照：用于英文表头下仍能正确匹配后端字段名/按钮变红
    let has_filter = lang == "zh" ? ['规格', '规格 (mm)', '规格 (in)', '状态', '执行标准', '生产厂家', '炉批号', '库存长度 (mm)'] :
        ['Dia./OD*WT mm', 'Dia./OD*WT in', 'Condition', 'Standard', 'Manufacturer', 'Heat No.', 'Length (mm)'];

    // 使用通用过滤器
    const tableFilter = initTableFilter({
        normalizeName: normalizeFilterName,
        // 过滤条目翻译：英文界面下展示英文，但提交过滤时仍使用原始中文值(data-value)
        translateItem: ({ filterName, value }) => {
            if (filterName === '规格') {
                return formatSpecForUnit(value, global.spec_unit);
            }
            if (lang !== 'en') return value;
            // filterName 在 normalizeName 后为中文字段名
            if (filterName === '生产厂家') {
                return (typeof Translator !== 'undefined' && Translator.translateManufacturer)
                    ? Translator.translateManufacturer(value, 'en')
                    : value;
            }
            if (filterName === '状态') {
                return (typeof Translator !== 'undefined' && Translator.translateStatus)
                    ? Translator.translateStatus(value, 'en')
                    : value;
            }
            return value;
        },
        getThs: () => document.querySelectorAll('.table-container thead th'),
        has_filter: has_filter,
        url: '/stock/fetch_filter_items',
        state: global,
        position: 'cursor',
        buildFetchPostData: ({ name, baseFilterSql }) => {
            let search = document.querySelector('#search-input').value;
            // wx_stock 的 productset 页面没有 #p-select（erp 版本才有库存类别下拉框），这里做兼容：
            // - 若存在则取其值
            // - 否则使用默认类别（与导出/查询接口一致）
            const cateEl = document.querySelector('#p-select');
            let cate = cateEl ? cateEl.value : '正常销售';
            let id = document.querySelector('#product-id').textContent.trim();
            return {
                id: id,
                name: search,
                cate: cate,
                filter_name: name,
                filter: baseFilterSql,
            };
        },
        onRefreshTable: (filterSql) => {
            document.querySelector('.f-choose').innerHTML = '';
            Object.assign(tool_table.table_data().post_data, { filter: filterSql, page: 1 });
            tool_table.fetch_table((content) => {
                make_filter();
                show_stat(content);
                onTableRefresh();
            });
        },
    });

    const specUnitSelect = document.querySelector('#spec-unit-select');
    if (specUnitSelect) {
        specUnitSelect.addEventListener('change', function () {
            global.spec_unit = normalizeSpecUnit(this.value);
            localStorage.setItem(SPEC_UNIT_STORAGE_KEY, global.spec_unit);
            applySpecUnitDisplay();
            tableFilter.updateButtonColors();
        });
    }

    function make_filter() {
        tableFilter.ensureButtons();
        tableFilter.updateButtonColors();
    }

    // ------------------------------- 过滤部分结束 --------------------------------

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            // 延迟初始化购物车，确保所有依赖都已加载
            setTimeout(initializeCart, 100);
        });
    } else {
        // DOM已经加载完成，直接初始化
        setTimeout(initializeCart, 100);
    }
}();