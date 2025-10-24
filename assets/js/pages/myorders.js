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
        async getOrdersList() {
            if (this.isLoading) return;

            try {
                this.isLoading = true;
                this.showOrdersLoadingState();

                const response = await fetch('/stock/get_user_orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: this.userId
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.orders = data.orders || [];
                        this.renderOrdersList();
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
                        <p>${texts[lang].noOrders}</p>
                    </div>
                `;
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
                            <div class="order-status ${statusClass}">${statusText}</div>
                        </div>
                        <div class="order-date">${this.formatDate(order.created_at)}</div>
                    </div>
                `;
            });
            html += '</div>';

            container.innerHTML = html;
        }

        /**
         * 渲染订单明细
         */
        renderOrderDetails(orderData) {
            const container = document.querySelector('.order-details-container');
            
            if (!orderData || !orderData.items) {
                container.innerHTML = `
                    <div class="details-prompt">
                        <i class="fa fa-info-circle"></i>
                        <p>${texts[lang].selectOrderPrompt}</p>
                    </div>
                `;
                return;
            }

            const statusClass = this.getOrderStatusClass(orderData.status);
            const statusText = this.getOrderStatusText(orderData.status);

            let html = `
                <div class="order-details">                  
                    <div class="order-items-table">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th width="4%">序号</th>
                                    <th>${texts[lang].productName}</th>
                                    <th>${texts[lang].materialNumber}</th>
                                    <th>${texts[lang].specification}</th>
                                    <th>${texts[lang].status}</th>
                                    <th width="15%">${texts[lang].standard}</th>
                                    <th>${texts[lang].manufacturer}</th>
                                    <th>${texts[lang].heatNumber}</th>
                                    <th>${texts[lang].stockLength}</th>
                                    <th>${texts[lang].stockWeight}</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            orderData.items.forEach((item, index) => {
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.product_name || ''}</td>
                        <td>${item.material_number || ''}</td>
                        <td>${item.specification || ''}</td>
                        <td>${item.status || ''}</td>
                        <td title="${item.standard || ''}">${item.standard || ''}</td>
                        <td>${item.manufacturer || ''}</td>
                        <td title="${item.heat_number || ''}">${item.heat_number || ''}</td>
                        <td>${item.stock_length || 0}</td>
                        <td>${(item.stock_weight || 0).toFixed(2)}</td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="order-summary">
                        <div class="summary-item">
                            <span class="summary-label">${texts[lang].totalItems}:</span>
                            <span class="summary-value">${orderData.summary?.total_items || 0}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">${texts[lang].totalWeight}:</span>
                            <span class="summary-value">${(orderData.summary?.total_weight || 0).toFixed(2)} kg</span>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = html;
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
            const container = document.querySelector('.order-details-container');
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fa fa-spinner fa-spin"></i>
                    <p>${texts[lang].loading}</p>
                </div>
            `;
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
            const container = document.querySelector('.order-details-container');
            container.innerHTML = `
                <div class="error-state">
                    <i class="fa fa-exclamation-triangle"></i>
                    <p>${errorMessage || texts[lang].loadDetailsError}</p>
                </div>
            `;
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
                    texts[lang].stockWeightUnit
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

            // 更新订单基本信息标签
            const infoLabels = document.querySelectorAll('.order-info .info-label');
            if (infoLabels.length >= 3) {
                infoLabels[0].textContent = texts[lang].orderNumber + '：';
                infoLabels[1].textContent = texts[lang].orderDate + '：';
                infoLabels[2].textContent = texts[lang].orderStatus + '：';
            }

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
         * 处理订单项点击
         */
        handleOrderItemClick(orderId) {
            this.orderManager.selectOrder(orderId);
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
                const container = document.querySelector('.order-details-container');
                container.innerHTML = `
                    <div class="details-prompt">
                        <i class="fa fa-info-circle"></i>
                        <p>${texts[lang].selectOrderPrompt}</p>
                    </div>
                `;
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
            // 可以在这里添加响应式布局调整逻辑
        }

        /**
         * 显示加载状态
         */
        showLoadingState() {
            this.orderManager.showOrdersLoadingState();
            this.orderManager.showDetailsLoadingState();
        }

        /**
         * 隐藏加载状态
         */
        hideLoadingState() {
            // 加载状态会在渲染时被替换
        }
    }

    // 全局变量
    let orderManager = null;
    let pageController = null;

    // 初始化页面
    function initPage() {
        pageController = new MyOrdersPageController();
        orderManager = pageController.orderManager;
        
        // 将orderManager暴露到全局作用域，供HTML中的onclick使用
        window.orderManager = orderManager;
        
        pageController.initPage();
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }

    // 监听语言变化事件（如果有的话）
    window.addEventListener('languageChanged', function(event) {
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
        updateLanguage: function(newLang) {
            if (texts[newLang]) {
                localStorage.setItem('language', newLang);
                window.location.reload(); // 简单的重新加载页面来应用新语言
            }
        }
    };
}();