/**
 * 我的订单页面控制器
 * My Orders Page Controller
 */
let page_myorders = function () {
    // 检查用户登录状态
    if (!getCookie("wxok")) {
        window.location.href = "/";
        return;
    }

    // 多语言支持
    const lang = localStorage.getItem('language') || 'zh';
    const texts = {
        zh: {
            pageTitle: '我的订单',
            ordersList: '订单列表',
            orderDetails: '订单明细',
            orderNumber: '订单号',
            orderDate: '订单日期',
            orderStatus: '订单状态',
            selectOrderPrompt: '请选择订单查看明细',
            selectOrderDescription: '点击左侧订单列表中的订单项查看详细信息',
            noOrders: '暂无订单',
            noOrdersDescription: '您还没有提交过任何订单',
            loading: '加载中...',
            refresh: '刷新',
            networkError: '网络连接失败',
            serverError: '服务器错误',
            loadOrdersError: '加载订单列表失败',
            loadDetailsError: '加载订单明细失败',
            orderDetailsLoadError: '订单明细加载失败',
            orderDetailsLoadErrorDescription: '请刷新页面重试',
            orderNotFound: '订单不存在或已删除',
            unauthorized: '无权限访问此订单',
            materialNumber: '物料号',
            productName: '商品名称',
            specification: '规格型号',
            status: '状态',
            standard: '执行标准',
            manufacturer: '生产厂家',
            heatNumber: '炉批号',
            stockLength: '库存长度',
            stockWeight: '库存重量',
            stockLengthUnit: '库存长度(mm)',
            stockWeightUnit: '库存重量(kg)',
            quantity: '数量',
            totalItems: '商品总数',
            totalLength: '总长度',
            totalWeight: '总重量',
            totalLengthUnit: 'mm',
            totalWeightUnit: 'kg',
            statusPending: '待处理',
            statusDone: '已处理',
            retry: '重试',
            serialNumber: '序号',
            itemsCount: '件商品'
        },
        en: {
            pageTitle: 'My Orders',
            ordersList: 'Orders List',
            orderDetails: 'Order Details',
            orderNumber: 'Order Number',
            orderDate: 'Order Date',
            orderStatus: 'Order Status',
            selectOrderPrompt: 'Please select an order to view details',
            selectOrderDescription: 'Click on an order item in the left list to view detailed information',
            noOrders: 'No orders found',
            noOrdersDescription: 'You have not submitted any orders yet',
            loading: 'Loading...',
            refresh: 'Refresh',
            networkError: 'Network connection failed',
            serverError: 'Server error',
            loadOrdersError: 'Failed to load orders list',
            loadDetailsError: 'Failed to load order details',
            orderDetailsLoadError: 'Failed to load order details',
            orderDetailsLoadErrorDescription: 'Please refresh the page and try again',
            orderNotFound: 'Order not found or deleted',
            unauthorized: 'Unauthorized to access this order',
            materialNumber: 'Material Number',
            productName: 'Product Name',
            specification: 'Specification',
            status: 'Status',
            standard: 'Standard',
            manufacturer: 'Manufacturer',
            heatNumber: 'Heat Number',
            stockLength: 'Stock Length',
            stockWeight: 'Stock Weight',
            stockLengthUnit: 'Stock Length(mm)',
            stockWeightUnit: 'Stock Weight(kg)',
            totalItems: 'Total Items',
            totalLength: 'Total Length',
            totalWeight: 'Total Weight',
            totalLengthUnit: 'mm',
            totalWeightUnit: 'kg',
            statusPending: 'Pending',
            statusDone: 'Done',
            quantity: 'Quantity',
            retry: 'Retry',
            serialNumber: 'Serial No.',
            itemsCount: ' items'
        }
    };

    /**
     * 订单管理器类
     * OrderManager Class
     */
    class OrderManager {
        constructor() {
            this.orders = [];
            this.selectedOrder = null;
            this.selectedOrderDetails = null;
            this.isLoading = false;
            this.userId = Number(document.querySelector('#user-id').textContent.trim());
            this.currentPage = 1;
            this.recordsPerPage = 10;
            this.totalCount = 0;
            this.currentSearch = "";
            
            // 计算每页显示条目数（基于屏幕高度）
            this.calculateRecordsPerPage();
        }

        /**
         * 计算每页显示条目数
         * 基于 orders-list-container 减去翻页控件高度
         */
        calculateRecordsPerPage() {
            try {
                const container = document.querySelector('.orders-list-container');
                const pagination = document.querySelector('.orders-pagination');
                
                if (!container) {
                    this.recordsPerPage = 10;
                    return;
                }
                
                // 获取容器总高度
                const containerHeight = container.clientHeight;
                
                // 获取翻页控件高度（包括边距和边框）
                let paginationHeight = 0;
                if (pagination) {
                    const paginationStyle = window.getComputedStyle(pagination);
                    paginationHeight = pagination.offsetHeight +
                                     parseFloat(paginationStyle.marginTop || 0) +
                                     parseFloat(paginationStyle.marginBottom || 0);
                }
                
                // 计算可用于显示订单项的高度
                const availableHeight = containerHeight - paginationHeight;
                
                // 每个订单项的高度（包括间距）
                // order-item: padding 12px*2 + margin-bottom 8px + 内容约38px ≈ 70px
                const itemHeight = 62;
                
                // 额外的内边距空间
                const containerPadding = 20;
                
                // 计算可显示的订单数量
                const maxRecords = Math.floor((availableHeight - containerPadding) / itemHeight);
                
                // 确保至少显示5条，最多20条
                this.recordsPerPage = Math.max(5, Math.min(maxRecords, 20));
            } catch (error) {
                console.error('计算每页显示条目数失败:', error);
                this.recordsPerPage = 10; // 出错时使用默认值
            }
        }

        /**
         * 初始化订单管理器
         */
        async init() {
            try {
                await this.getOrdersList();
            } catch (error) {
                console.error('Failed to initialize OrderManager:', error);
                notifier.show(texts[lang].loadOrdersError, 'danger', 4000);
            }
        }

        /**
         * 获取用户订单列表
         */
        async getOrdersList(resetPage = true) {
            if (this.isLoading) return;

            if (resetPage) {
                this.currentPage = 1;
            }

            try {
                this.isLoading = true;
                this.showOrdersLoadingState();

                const response = await fetch('/stock/get_user_orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: this.userId,
                        search: this.currentSearch,
                        page: this.currentPage,
                        rec: this.recordsPerPage
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.orders = data.orders || [];
                        this.totalCount = data.total_count || 0;
                        this.renderOrdersList();
                        this.updatePagination();
                    } else {
                        throw new Error(data.message || 'Failed to get orders');
                    }
                } else if (response.status === 401) {
                    // 用户未登录，跳转到登录页面
                    window.location.href = "/";
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            } catch (error) {
                console.error('Error loading orders:', error);
                this.showOrdersErrorState(error.message);
                notifier.show(texts[lang].loadOrdersError, 'danger', 4000);
            } finally {
                this.isLoading = false;
            }
        }

        /**
         * 搜索订单
         */
        async searchOrders(searchTerm) {
            this.currentSearch = searchTerm.trim();
            await this.getOrdersList();
        }

        /**
         * 跳转到指定页
         */
        async goToPage(page) {
            const totalPages = Math.ceil(this.totalCount / this.recordsPerPage);
            if (page >= 1 && page <= totalPages && page !== this.currentPage) {
                this.currentPage = page;
                await this.getOrdersList(false);
            }
        }

        /**
         * 下一页
         */
        async nextPage() {
            await this.goToPage(this.currentPage + 1);
        }

        /**
         * 上一页
         */
        async prevPage() {
            await this.goToPage(this.currentPage - 1);
        }

        /**
         * 首页
         */
        async firstPage() {
            await this.goToPage(1);
        }

        /**
         * 尾页
         */
        async lastPage() {
            const totalPages = Math.ceil(this.totalCount / this.recordsPerPage);
            await this.goToPage(totalPages);
        }

        /**
         * 获取订单明细
         */
        async getOrderDetails(orderId) {
            if (this.isLoading) return;

            try {
                this.isLoading = true;
                this.showDetailsLoadingState();

                const response = await fetch('/stock/get_order_details', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: this.userId,
                        order_id: orderId
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.order) {
                        this.selectedOrderDetails = data.order;
                        // 成功后隐藏顶部加载指示器
                        const headerLoading = document.getElementById('details-loading');
                        if (headerLoading) headerLoading.style.display = 'none';
                        this.renderOrderDetails(data.order);
                    } else {
                        throw new Error(data.message || texts[lang].orderNotFound);
                    }
                } else if (response.status === 401) {
                    window.location.href = "/";
                } else if (response.status === 403) {
                    throw new Error(texts[lang].unauthorized);
                } else if (response.status === 404) {
                    throw new Error(texts[lang].orderNotFound);
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            } catch (error) {
                console.error('Error loading order details:', error);
                this.showDetailsErrorState(error.message);
                notifier.show(texts[lang].loadDetailsError, 'danger', 4000);
            } finally {
                this.isLoading = false;
            }
        }

        /**
         * 选择订单
         */
        selectOrder(orderId) {
            // 更新选中状态
            this.selectedOrder = orderId;
            this.updateOrderSelection();

            // 获取订单明细
            this.getOrderDetails(orderId);

            document.querySelector('#order-details-title').textContent = texts[lang].orderDetails + ' - ' + orderId;
        }

        /**
         * 更新翻页控件
         */
        updatePagination() {
            const totalPages = Math.ceil(this.totalCount / this.recordsPerPage);
            
            // 更新翻页信息
            const pageInput = document.getElementById('orders-page-input');
            const totalPagesSpan = document.getElementById('orders-pages');
            const totalRecordsSpan = document.getElementById('orders-total-records');
            
            if (pageInput) pageInput.value = this.currentPage;
            if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
            if (totalRecordsSpan) totalRecordsSpan.textContent = this.totalCount;

            // 更新按钮状态
            const firstBtn = document.getElementById('orders-first');
            const prevBtn = document.getElementById('orders-pre');
            const nextBtn = document.getElementById('orders-aft');
            const lastBtn = document.getElementById('orders-last');
            
            if (firstBtn) firstBtn.disabled = this.currentPage === 1;
            if (prevBtn) prevBtn.disabled = this.currentPage === 1;
            if (nextBtn) nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
            if (lastBtn) lastBtn.disabled = this.currentPage === totalPages || totalPages === 0;

            // 显示/隐藏翻页控件
            const pagination = document.getElementById('orders-pagination');
            if (pagination) {
                pagination.style.display = this.totalCount > this.recordsPerPage ? 'flex' : 'none';
            }
        }

        /**
         * 渲染订单列表
         */
        renderOrdersList() {
            const container = document.getElementById('orders-list');

            if (this.orders.length === 0) {
                container.innerHTML = `
                    <div class="empty-orders">
                        <i class="fa fa-list-alt"></i>
                        <p>${this.currentSearch ? '未找到匹配的订单' : texts[lang].noOrders}</p>
                    </div>
                `;
                // 隐藏翻页控件
                const pagination = document.getElementById('orders-pagination');
                if (pagination) pagination.style.display = 'none';
                return;
            }

            let html = '<div class="orders-list">';
            this.orders.forEach(order => {
                const statusClass = this.getOrderStatusClass(order.status);
                const statusText = this.getOrderStatusText(order.status);

                html += `
                    <div class="order-item" data-order-id="${order.order_id}" onclick="orderManager.selectOrder('${order.order_id}')">
                        <div class="order-header">
                            <div class="order-number">${order.order_id}</div>
                            <div class="order-date">${this.formatDate(order.created_at)}</div>
                            <div class="order-status ${statusClass}">${statusText}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            container.innerHTML = html;
        }

        /**
         * 渲染订单明细（使用购物车样式的表格，带表头与底部汇总）
         */
        renderOrderDetails(orderData) {
            const container = document.querySelector('.order-details-container');
            const infoBlock = document.getElementById('order-info');
            const tableBlock = document.getElementById('order-details-table');
            const tbody = document.getElementById('order-details-tbody');
            const summaryBlock = document.getElementById('order-summary');

            if (!orderData || !orderData.items) {
                // 无数据：隐藏信息区、表格与汇总，显示默认提示块
                const headerLoading = document.getElementById('details-loading');
                if (headerLoading) headerLoading.style.display = 'none';
                const infoBlock = document.getElementById('order-info');
                const tableBlock = document.getElementById('order-details-table');
                const summaryBlock = document.getElementById('order-summary');
                const defaultBlock = document.getElementById('default-details-state');
                if (infoBlock) infoBlock.style.display = 'none';
                if (tableBlock) tableBlock.style.display = 'none';
                if (summaryBlock) summaryBlock.style.display = 'none';
                if (defaultBlock) defaultBlock.style.display = 'block';
                return;
            }

            // 显示订单基本信息
            if (infoBlock) {
                const headerLoading = document.getElementById('details-loading');
                if (headerLoading) headerLoading.style.display = 'none';
                infoBlock.style.display = 'block';
                const idEl = document.getElementById('order-id-display');
                const dateEl = document.getElementById('order-date-display');
                const statusEl = document.getElementById('order-status-display');
                if (idEl) idEl.textContent = orderData.order_id || '';
                if (dateEl) dateEl.textContent = this.formatDate(orderData.created_at);
                if (statusEl) {
                    statusEl.textContent = this.getOrderStatusText(orderData.status);
                    statusEl.className = 'info-value status ' + this.getOrderStatusClass(orderData.status);
                }
            }

            // 计算汇总：商品总数（行数）、总长度、总重量（按数量汇总）
            let totalItems = orderData.items.length;
            let totalLength = 0;
            let totalWeight = 0;
            orderData.items.forEach(item => {
                const qty = Number(item.quantity || 1);
                const len = Number(item.stock_length || 0);
                const wt = Number(item.stock_weight || 0);
                totalLength += len * qty;
                totalWeight += wt * qty;
            });

            // 填充表体，使用模板中已有的固定表头结构，保证只有tbody滚动
            if (tableBlock && tbody) {
                // 隐藏默认提示
                const defaultBlock = document.getElementById('default-details-state');
                if (defaultBlock) defaultBlock.style.display = 'none';
                tableBlock.style.display = 'block';
                let rowsHtml = '';
                orderData.items.forEach((item, index) => {
                    // 翻译状态和厂家字段（如果需要）
                    const translatedStatus = lang === 'en' && typeof Translator !== 'undefined'
                        ? Translator.translateStatus(item.status || '', 'en')
                        : (item.status || '');
                    const translatedManufacturer = lang === 'en' && typeof Translator !== 'undefined'
                        ? Translator.translateManufacturer(item.manufacturer || '', 'en')
                        : (item.manufacturer || '');
                    
                    rowsHtml += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.product_name || ''}</td>
                            <td>${item.material_number || ''}</td>
                            <td>${item.specification || ''}</td>
                            <td>${translatedStatus}</td>
                            <td title="${item.standard || ''}">${item.standard || ''}</td>
                            <td>${translatedManufacturer}</td>
                            <td title="${item.heat_number || ''}">${item.heat_number || ''}</td>
                            <td>${Number(item.stock_length || 0)}</td>
                            <td>${Number(item.stock_weight || 0).toFixed(2)}</td>
                            <td>${Number(item.quantity || 1)}</td>
                        </tr>
                    `;
                });
                tbody.innerHTML = rowsHtml;
                // 修复表头对齐，参照购物车实现
                fixOrderDetailsHeaderAlignment();
                // 同步内层表格容器高度与外层容器一致
                setTimeout(() => { try { syncOrderDetailsTableHeight(); } catch (e) { } }, 0);
            }

            // 显示汇总信息
            if (summaryBlock) {
                summaryBlock.style.display = 'block';
                const itemsEl = document.getElementById('order-total-items');
                const lengthEl = document.getElementById('order-total-length');
                const weightEl = document.getElementById('order-total-weight');
                if (itemsEl) itemsEl.textContent = totalItems.toString();
                if (lengthEl) lengthEl.textContent = `${totalLength} ${texts[lang].totalLengthUnit}`;
                if (weightEl) weightEl.textContent = `${totalWeight.toFixed(2)} ${texts[lang].totalWeightUnit}`;
            }
            // 再次同步高度，考虑汇总区域显示后的布局变化
            setTimeout(() => { try { syncOrderDetailsTableHeight(); } catch (e) { } }, 0);

        }

        /**
         * 更新订单选择状态
         */
        updateOrderSelection() {
            // 移除所有选中状态
            document.querySelectorAll('.order-item').forEach(item => {
                item.classList.remove('selected');
            });

            // 添加当前选中状态
            if (this.selectedOrder) {
                const selectedItem = document.querySelector(`[data-order-id="${this.selectedOrder}"]`);
                if (selectedItem) {
                    selectedItem.classList.add('selected');
                }
            }
        }

        /**
         * 显示订单列表加载状态
         */
        showOrdersLoadingState() {
            const container = document.getElementById('orders-list');
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fa fa-spinner fa-spin"></i>
                    <p>${texts[lang].loading}</p>
                </div>
            `;
        }

        /**
         * 显示订单明细加载状态
         */
        showDetailsLoadingState() {
            // 仅显示顶部的加载指示器，不破坏既有表格结构
            const headerLoading = document.getElementById('details-loading');
            if (headerLoading) headerLoading.style.display = 'block';
            // 隐藏表格和汇总，避免闪烁
            const infoBlock = document.getElementById('order-info');
            const tableBlock = document.getElementById('order-details-table');
            const summaryBlock = document.getElementById('order-summary');
            if (infoBlock) infoBlock.style.display = 'none';
            if (tableBlock) tableBlock.style.display = 'none';
            if (summaryBlock) summaryBlock.style.display = 'none';
        }

        /**
         * 显示订单列表错误状态
         */
        showOrdersErrorState(errorMessage) {
            const container = document.getElementById('orders-list');
            container.innerHTML = `
                <div class="error-state">
                    <i class="fa fa-exclamation-triangle"></i>
                    <p>${errorMessage || texts[lang].loadOrdersError}</p>
                    <button class="btn btn-primary" onclick="orderManager.getOrdersList()">
                        ${texts[lang].retry}
                    </button>
                </div>
            `;
        }

        /**
         * 显示订单明细错误状态
         */
        showDetailsErrorState(errorMessage) {
            // Do not replace the container; toggle the error block and keep structure
            const headerLoading = document.getElementById('details-loading');
            if (headerLoading) headerLoading.style.display = 'none';

            const defaultBlock = document.getElementById('default-details-state');
            const infoBlock = document.getElementById('order-info');
            const tableBlock = document.getElementById('order-details-table');
            const summaryBlock = document.getElementById('order-summary');
            const emptyDetails = document.getElementById('empty-details');

            if (defaultBlock) defaultBlock.style.display = 'none';
            if (infoBlock) infoBlock.style.display = 'none';
            if (tableBlock) tableBlock.style.display = 'none';
            if (summaryBlock) summaryBlock.style.display = 'none';
            if (emptyDetails) {
                emptyDetails.style.display = 'block';
                const emptyMsg = emptyDetails.querySelector('.empty-message');
                if (emptyMsg) emptyMsg.textContent = errorMessage || texts[lang].loadDetailsError;
            }
        }

        /**
         * 获取订单状态样式类
         */
        getOrderStatusClass(status) {
            switch (status) {
                case 'pending':
                    return 'status-pending';
                case 'done':
                    return 'status-done';
                default:
                    return 'status-unknown';
            }
        }

        /**
         * 获取订单状态文本
         */
        getOrderStatusText(status) {
            switch (status) {
                case 'pending':
                    return texts[lang].statusPending;
                case 'done':
                    return texts[lang].statusDone;
                default:
                    return status || '';
            }
        }

        /**
         * 格式化日期
         */
        formatDate(dateString) {
            if (!dateString) return '';

            try {
                const date = new Date(dateString);
                return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US');
            } catch (error) {
                return dateString;
            }
        }
    }

    /**
     * 页面控制器类
     * MyOrdersPageController Class
     */
    class MyOrdersPageController {
        constructor() {
            this.orderManager = new OrderManager();
        }

        /**
         * 初始化页面
         */
        async initPage() {
            // 设置页面标题
            document.title = texts[lang].pageTitle;

            // 更新页面文本
            this.updatePageTexts();

            // 绑定事件监听器
            this.bindEventListeners();

            // 初始化订单管理器
            await this.orderManager.init();

            // 显示默认提示
            this.showDefaultPrompt();
        }

        /**
         * 更新页面文本元素
         */
        updatePageTexts() {
            // 更新页面标题
            const pageTitle = document.querySelector('.myorders-title');
            if (pageTitle) {
                pageTitle.innerHTML = `<i class="fa fa-list-alt"></i>${texts[lang].pageTitle}`;
            }

            // 更新刷新按钮
            const refreshBtn = document.querySelector('#refresh-orders-btn');
            if (refreshBtn) {
                refreshBtn.innerHTML = `<i class="fa fa-refresh"></i>${texts[lang].refresh}`;
            }

            // 更新订单列表标题
            const ordersListHeader = document.querySelector('.orders-list-section h3');
            if (ordersListHeader) {
                ordersListHeader.textContent = texts[lang].ordersList;
            }

            // 更新搜索框和翻页文本
            this.updateSearchAndPaginationTexts();

            // 更新订单明细标题
            const orderDetailsTitle = document.querySelector('#order-details-title');
            if (orderDetailsTitle) {
                orderDetailsTitle.textContent = texts[lang].orderDetails;
            }

            // 更新表格头部
            this.updateTableHeaders();

            // 更新空状态和默认状态文本
            this.updateEmptyStates();
        }

        /**
         * 更新搜索框和翻页文本
         */
        updateSearchAndPaginationTexts() {
            // 更新搜索框
            const searchInput = document.getElementById('order-search-input');
            if (searchInput) {
                searchInput.placeholder = lang === 'en' ? 'Search orders' : '搜索订单';
            }

            // 更新翻页控件
            const pageInfo = document.querySelector('.orders-pagination .page-info');
            if (pageInfo) {
                pageInfo.innerHTML = lang === 'en' 
                    ? `<span>Page</span><input type="text" class="form-control" id="orders-page-input" value="1">
                       <span>of</span><span id="orders-pages"></span><span>pages</span>`
                    : `<span>第</span><input type="text" class="form-control" id="orders-page-input" value="1">
                       <span>页，共</span><span id="orders-pages"></span><span>页</span>`;
            }

            // 更新翻页按钮标题
            const firstBtn = document.getElementById('orders-first');
            const prevBtn = document.getElementById('orders-pre');
            const nextBtn = document.getElementById('orders-aft');
            const lastBtn = document.getElementById('orders-last');
            
            if (firstBtn) firstBtn.title = lang === 'en' ? 'First' : '首页';
            if (prevBtn) prevBtn.title = lang === 'en' ? 'Pre' : '前一页';
            if (nextBtn) nextBtn.title = lang === 'en' ? 'Next' : '后一页';
            if (lastBtn) lastBtn.title = lang === 'en' ? 'Last' : '尾页';

            // 更新总记录数文本
            const totalRecords = document.querySelector('.orders-pagination .table-info');
            if (totalRecords) {
                totalRecords.innerHTML = lang === 'en' 
                    ? `Total <span id="orders-total-records"></span> records`
                    : `共 <span id="orders-total-records"></span> 条`;
            }
        }

        /**
         * 更新表格头部文本
         */
        updateTableHeaders() {
            const tableHeaders = document.querySelectorAll('.order-details-table-container th');
            if (tableHeaders.length > 0) {
                const headerTexts = [
                    texts[lang].serialNumber,
                    texts[lang].productName,
                    texts[lang].materialNumber,
                    texts[lang].specification,
                    texts[lang].status,
                    texts[lang].standard,
                    texts[lang].manufacturer,
                    texts[lang].heatNumber,
                    texts[lang].stockLengthUnit,
                    texts[lang].stockWeightUnit,
                    texts[lang].quantity
                ];

                tableHeaders.forEach((header, index) => {
                    if (headerTexts[index]) {
                        header.textContent = headerTexts[index];
                    }
                });
            }
        }

        /**
         * 更新空状态和默认状态文本
         */
        updateEmptyStates() {
            // 更新空订单状态
            const emptyMessage = document.querySelector('#empty-orders .empty-message');
            const emptyDescription = document.querySelector('#empty-orders .empty-description');
            if (emptyMessage) emptyMessage.textContent = texts[lang].noOrders;
            if (emptyDescription) emptyDescription.textContent = texts[lang].noOrdersDescription;

            // 更新默认选择状态
            const defaultMessage = document.querySelector('#default-details-state .default-message');
            const defaultDescription = document.querySelector('#default-details-state .default-description');
            if (defaultMessage) defaultMessage.textContent = texts[lang].selectOrderPrompt;
            if (defaultDescription) defaultDescription.textContent = texts[lang].selectOrderDescription;

            // 更新订单明细加载失败状态
            const emptyDetailsMessage = document.querySelector('#empty-details .empty-message');
            const emptyDetailsDescription = document.querySelector('#empty-details .empty-description');
            if (emptyDetailsMessage) emptyDetailsMessage.textContent = texts[lang].orderDetailsLoadError;
            if (emptyDetailsDescription) emptyDetailsDescription.textContent = texts[lang].orderDetailsLoadErrorDescription;

            // 更新汇总信息标签
            const summaryLabels = document.querySelectorAll('.order-summary .summary-label');
            if (summaryLabels.length >= 3) {
                summaryLabels[0].textContent = texts[lang].totalItems + '：';
                summaryLabels[1].textContent = texts[lang].totalLength + '：';
                summaryLabels[2].textContent = texts[lang].totalWeight + '：';
            }
        }

        /**
         * 绑定事件监听器
         */
        bindEventListeners() {
            // 刷新按钮（如果存在）
            const refreshBtn = document.getElementById('refresh-orders-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.handlePageRefresh();
                });
            }

            // 搜索功能
            this.bindSearchListeners();

            // 翻页功能
            this.bindPaginationListeners();

            // ESC键清除选择
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSelection();
                }
            });

            // 窗口大小变化时重新调整布局
            window.addEventListener('resize', () => {
                this.adjustLayout();
            });
        }

        /**
         * 绑定搜索事件监听器
         */
        bindSearchListeners() {
            const searchInput = document.getElementById('order-search-input');

            if (searchInput) {
                // 回车键搜索
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleSearch();
                    }
                });

                // 实时搜索（防抖）
                let searchTimeout;
                searchInput.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.handleSearch();
                    }, 500);
                });
            }
        }

        /**
         * 绑定翻页事件监听器
         */
        bindPaginationListeners() {
            const firstBtn = document.getElementById('orders-first');
            const prevBtn = document.getElementById('orders-pre');
            const nextBtn = document.getElementById('orders-aft');
            const lastBtn = document.getElementById('orders-last');
            const pageInput = document.getElementById('orders-page-input');

            if (firstBtn) {
                firstBtn.addEventListener('click', () => this.orderManager.firstPage());
            }
            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.orderManager.prevPage());
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.orderManager.nextPage());
            }
            if (lastBtn) {
                lastBtn.addEventListener('click', () => this.orderManager.lastPage());
            }

            if (pageInput) {
                pageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const page = parseInt(pageInput.value, 10);
                        if (!isNaN(page)) {
                            this.orderManager.goToPage(page);
                        }
                    }
                });
            }
        }

        /**
         * 处理搜索
         */
        async handleSearch() {
            const searchInput = document.getElementById('order-search-input');
            if (searchInput) {
                await this.orderManager.searchOrders(searchInput.value);
            }
        }

        /**
         * 处理页面刷新
         */
        async handlePageRefresh() {
            try {
                await this.orderManager.getOrdersList();
                this.showDefaultPrompt();
            } catch (error) {
                console.error('Error refreshing page:', error);
            }
        }

        /**
         * 显示默认提示
         */
        showDefaultPrompt() {
            if (!this.orderManager.selectedOrder) {
                // Show default prompt block within existing structure, don't destroy the DOM
                const headerLoading = document.getElementById('details-loading');
                if (headerLoading) headerLoading.style.display = 'none';

                const defaultBlock = document.getElementById('default-details-state');
                const infoBlock = document.getElementById('order-info');
                const tableBlock = document.getElementById('order-details-table');
                const summaryBlock = document.getElementById('order-summary');
                const emptyDetails = document.getElementById('empty-details');

                if (defaultBlock) defaultBlock.style.display = 'block';
                if (infoBlock) infoBlock.style.display = 'none';
                if (tableBlock) tableBlock.style.display = 'none';
                if (summaryBlock) summaryBlock.style.display = 'none';
                if (emptyDetails) emptyDetails.style.display = 'none';
            }
        }

        /**
         * 清除选择
         */
        clearSelection() {
            this.orderManager.selectedOrder = null;
            this.orderManager.selectedOrderDetails = null;
            this.orderManager.updateOrderSelection();
            this.showDefaultPrompt();
        }

        /**
         * 调整布局
         */
        adjustLayout() {
            // 窗口尺寸变化时，重新计算每页显示条目数
            this.orderManager.calculateRecordsPerPage();
            
            // 窗口尺寸变化时，重新对齐表头，参照购物车实现
            setTimeout(() => {
                try { fixOrderDetailsHeaderAlignment(); } catch (e) { }
                try { syncOrderDetailsTableHeight(); } catch (e) { }
            }, 100);
        }

    }

    // 全局变量
    let orderManager = null;
    let pageController = null;

    // 初始化页面
    async function initPage() {
        pageController = new MyOrdersPageController();
        orderManager = pageController.orderManager;

        // 初始化顶部购物车（保持角标与点击可用）
        try {
            if (typeof CartManager !== 'undefined') {
                window._cartManager = new CartManager();
                await window._cartManager.init();
            }
        } catch (e) {
            console.warn('Cart init failed on MyOrders:', e);
        }

        // 初始化订单角标管理器
        try {
            if (typeof OrdersManager !== 'undefined') {
                window._ordersManager = new OrdersManager();
                await window._ordersManager.init();
            }
        } catch (e) {
            console.warn('Orders manager init failed on MyOrders:', e);
        }

        // 将orderManager暴露到全局作用域，供HTML中的onclick使用
        window.orderManager = orderManager;

        pageController.initPage();
    }

    function fixOrderDetailsHeaderAlignment() {
        const table = document.querySelector('#order-details-table table');
        if (!table) return;
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        if (!thead || !tbody) return;

        const adjust = () => {
            const scrollbarWidth = tbody.offsetWidth - tbody.clientWidth;
            if (scrollbarWidth > 0) {
                thead.style.width = `calc(100% - ${scrollbarWidth}px)`;
            } else {
                thead.style.width = '100%';
            }
        };

        // 初次调整
        adjust();

        // 监听变化
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(adjust);
            resizeObserver.observe(tbody);
        }

        // 当表体滚动时同步水平滚动（保险）
        tbody.addEventListener('scroll', () => {
            thead.scrollLeft = tbody.scrollLeft;
        });
    }

    function syncOrderDetailsTableHeight() {
        const outer = document.querySelector('.order-details-table-container');
        const inner = document.querySelector('.order-details-table-container .table-container.table-order-details');
        if (!outer || !inner) return;
        const rect = outer.getBoundingClientRect();
        const height = Math.max(0, Math.floor(rect.height));
        if (height > 0) {
            inner.style.height = height + 'px';
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }

    // 监听语言变化事件（如果有的话）
    window.addEventListener('languageChanged', function (event) {
        if (pageController) {
            // 重新初始化页面文本
            pageController.updatePageTexts();

            // 重新渲染订单列表和明细
            if (orderManager) {
                orderManager.renderOrdersList();
                if (orderManager.selectedOrderDetails) {
                    orderManager.renderOrderDetails(orderManager.selectedOrderDetails);
                }
            }
        }
    });

    // 返回公共接口
    return {
        orderManager: () => orderManager,
        pageController: () => pageController,
        texts: texts,
        updateLanguage: function (newLang) {
            if (texts[newLang]) {
                localStorage.setItem('language', newLang);
                window.location.reload(); // 简单的重新加载页面来应用新语言
            }
        }
    };
}();