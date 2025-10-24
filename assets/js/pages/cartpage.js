/**
 * 购物车页面控制器
 * Shopping Cart Page Controller
 */
let page_cart = function () {
    // 检查用户登录状态
    if (!getCookie("wxok")) {
        window.location.href = "/";
        return;
    }

    // 全局变量
    let cartData = {
        items: [],
        total_count: 0,
        total_length: 0,
        total_weight: 0.0
    };

    let currentDeleteItem = null;
    let isLoading = false;

    // 多语言支持
    const lang = localStorage.getItem('language') || 'zh';
    const texts = {
        zh: {
            cartTitle: '购物车',
            totalItems: '商品总数：',
            totalLength: '总长度：',
            totalWeight: '总重量：',
            submitOrder: '提交订购',
            clearCart: '清空购物车',
            refresh: '刷新',
            confirmDelete: '确认删除',
            confirmDeleteMsg: '确定要从购物车中删除这个商品吗？',
            confirmClear: '确认清空',
            confirmClearMsg: '确定要清空整个购物车吗？此操作不可撤销。',
            confirmSubmit: '确认提交订单',
            confirmSubmitMsg: '确定要提交这个订单吗？',
            orderSuccess: '订单提交成功',
            orderSuccessMsg: '您的订单已成功提交！',
            orderNumber: '订单号：',
            orderTime: '提交时间：',
            cancel: '取消',
            delete: '删除',
            clear: '清空',
            confirm: '确定',
            loading: '加载中...',
            noItems: '购物车为空',
            networkError: '网络连接失败',
            serverError: '服务器错误',
            operationSuccess: '操作成功',
            operationFailed: '操作失败',
            stockInsufficient: '库存不足',
            quantityUpdated: '数量已更新',
            itemRemoved: '商品已删除',
            cartCleared: '购物车已清空',
            orderSubmitted: '订单已提交'
        },
        en: {
            cartTitle: 'Shopping Cart',
            totalItems: 'Total Items:',
            totalLength: 'Total Length:',
            totalWeight: 'Total Weight:',
            submitOrder: 'Submit Order',
            clearCart: 'Clear Cart',
            refresh: 'Refresh',
            confirmDelete: 'Confirm Delete',
            confirmDeleteMsg: 'Are you sure you want to remove this item from cart?',
            confirmClear: 'Confirm Clear',
            confirmClearMsg: 'Are you sure you want to clear the entire cart? This action cannot be undone.',
            confirmSubmit: 'Confirm Submit Order',
            confirmSubmitMsg: 'Are you sure you want to submit this order?',
            orderSuccess: 'Order Submitted Successfully',
            orderSuccessMsg: 'Your order has been submitted successfully!',
            orderNumber: 'Order Number:',
            orderTime: 'Submit Time:',
            cancel: 'Cancel',
            delete: 'Delete',
            clear: 'Clear',
            confirm: 'Confirm',
            loading: 'Loading...',
            noItems: 'Cart is empty',
            networkError: 'Network connection failed',
            serverError: 'Server error',
            operationSuccess: 'Operation successful',
            operationFailed: 'Operation failed',
            stockInsufficient: 'Insufficient stock',
            quantityUpdated: 'Quantity updated',
            itemRemoved: 'Item removed',
            cartCleared: 'Cart cleared',
            orderSubmitted: 'Order submitted'
        }
    };

    // 初始化页面
    function initPage() {
        // 设置页面标题
        document.title = texts[lang].cartTitle;

        // 更新页面静态文本
        updatePageText();

        // 绑定事件监听器
        bindEventListeners();

        // 加载购物车数据
        loadCartData();

        // 确保角标在页面加载时正确显示
        initCartBadge();

        // 初始化订单角标管理器
        initOrdersBadge();
    }

    /**
     * 更新页面静态文本为对应语言
     * Update page static text to corresponding language
     */
    function updatePageText() {
        if (lang === 'en') {
            // 页面标题
            const cartTitle = document.querySelector('.cart-title');
            if (cartTitle) {
                cartTitle.innerHTML = '<i class="fa fa-shopping-cart"></i> Shopping Cart';
            }

            // 按钮文本
            const clearCartBtn = document.querySelector('#clear-cart-btn');
            if (clearCartBtn) {
                clearCartBtn.innerHTML = '<i class="fa fa-trash"></i> Clear Cart';
            }

            const refreshCartBtn = document.querySelector('#refresh-cart-btn');
            if (refreshCartBtn) {
                refreshCartBtn.innerHTML = '<i class="fa fa-refresh"></i> Refresh';
            }

            const submitOrderBtn = document.querySelector('#submit-order-btn');
            if (submitOrderBtn) {
                submitOrderBtn.innerHTML = '<i class="fa fa-check"></i> Submit Order';
            }

            // 表头翻译
            const tableHeaders = document.querySelectorAll('.table-cart thead th');
            const headerTexts = ['No.', 'Product Name', 'Stock No.', 'Dia./OD*WT mm', 'Condition',
                                'Standard', 'Manufacturer', 'Heat No.', 'Length (mm)',
                                'Weight (kg)', 'Added Time', 'Actions'];
            tableHeaders.forEach((th, index) => {
                if (index < headerTexts.length) {
                    th.textContent = headerTexts[index];
                }
            });

            // 汇总信息标签
            const summaryLabels = document.querySelectorAll('.summary-label');
            if (summaryLabels[0]) summaryLabels[0].textContent = 'Total Items:';
            if (summaryLabels[1]) summaryLabels[1].textContent = 'Total Length:';
            if (summaryLabels[2]) summaryLabels[2].textContent = 'Total Weight:';

            // 确认删除对话框
            updateModalText('#confirm-delete-modal', {
                title: 'Confirm Delete',
                body: 'Are you sure you want to remove this item from cart?',
                cancel: 'Cancel',
                confirm: 'Delete'
            });

            // 确认清空对话框
            updateModalText('#confirm-clear-modal', {
                title: 'Confirm Clear',
                body: 'Are you sure you want to clear the entire cart? This action cannot be undone.',
                cancel: 'Cancel',
                confirm: 'Clear'
            });

            // 确认提交订单对话框
            updateModalText('#confirm-submit-modal', {
                title: 'Confirm Submit Order',
                body: 'Are you sure you want to submit this order?',
                cancel: 'Cancel',
                confirm: 'Confirm'
            });

            // 确认提交订单对话框中的汇总信息标签
            const submitModalLabels = document.querySelectorAll('#confirm-submit-modal .label');
            if (submitModalLabels[0]) submitModalLabels[0].textContent = 'Total Items:';
            if (submitModalLabels[1]) submitModalLabels[1].textContent = 'Total Length:';
            if (submitModalLabels[2]) submitModalLabels[2].textContent = 'Total Weight:';

            // 订单提交成功对话框
            updateModalText('#order-success-modal', {
                title: 'Order Submitted Successfully',
                body: 'Your order has been submitted successfully!',
                confirm: 'OK'
            });

            // 更新订单成功对话框中的标签
            const orderInfoLabels = document.querySelectorAll('#order-success-modal strong');
            if (orderInfoLabels[0]) orderInfoLabels[0].textContent = 'Order Number:';
            if (orderInfoLabels[1]) orderInfoLabels[1].textContent = 'Submit Time:';
        }
    }

    /**
     * 更新模态框文本
     * Update modal text
     */
    function updateModalText(modalId, texts) {
        const modal = document.querySelector(modalId);
        if (!modal) return;

        const title = modal.querySelector('.modal-header h3');
        if (title && texts.title) title.textContent = texts.title;

        const body = modal.querySelector('.modal-body p');
        if (body && texts.body) body.textContent = texts.body;

        const cancelBtn = modal.querySelector('.btn-secondary');
        if (cancelBtn && texts.cancel) cancelBtn.textContent = texts.cancel;

        const confirmBtn = modal.querySelector('.btn-danger, .btn-success, .btn-primary');
        if (confirmBtn && texts.confirm) confirmBtn.textContent = texts.confirm;
    }

    // 初始化购物车角标
    function initCartBadge() {
        // 确保角标在购物车页面始终可见（如果有商品）
        const cartBadge = document.querySelector('#cart-count');
        if (cartBadge && cartBadge.style.display === 'none') {
            // 如果角标被隐藏，但我们在购物车页面，需要根据实际数据显示
            setTimeout(() => {
                if (cartData.total_count > 0) {
                    updateCartBadge(cartData.total_count);
                }
            }, 100);
        }
    }

    // 初始化订单角标
    function initOrdersBadge() {
        // 初始化订单角标管理器（如果可用）
        if (typeof OrdersManager !== 'undefined') {
            try {
                // 创建全局订单管理器实例
                if (typeof ordersManager === 'undefined' || !ordersManager) {
                    window.ordersManager = new OrdersManager();
                    ordersManager.init().catch(error => {
                        console.warn('Failed to initialize orders manager in cart page:', error);
                    });
                }
            } catch (error) {
                console.warn('OrdersManager not available in cart page:', error);
            }
        }
    }

    // 绑定事件监听器
    function bindEventListeners() {
        // 刷新按钮
        document.getElementById('refresh-cart-btn').addEventListener('click', () => {
            loadCartData();
        });

        // 清空购物车按钮
        document.getElementById('clear-cart-btn').addEventListener('click', () => {
            showClearConfirmModal();
        });

        // 提交订单按钮
        document.getElementById('submit-order-btn').addEventListener('click', () => {
            showSubmitConfirmModal();
        });

        // 删除确认对话框
        document.getElementById('cancel-delete').addEventListener('click', () => {
            hideDeleteConfirmModal();
        });

        document.getElementById('confirm-delete').addEventListener('click', () => {
            if (currentDeleteItem) {
                removeItemFromCart(currentDeleteItem);
            }
        });

        document.getElementById('close-delete-modal').addEventListener('click', () => {
            hideDeleteConfirmModal();
        });

        // 清空确认对话框
        document.getElementById('cancel-clear').addEventListener('click', () => {
            hideClearConfirmModal();
        });

        document.getElementById('confirm-clear').addEventListener('click', () => {
            clearCart();
        });

        document.getElementById('close-clear-modal').addEventListener('click', () => {
            hideClearConfirmModal();
        });

        // 确认提交订单对话框
        document.getElementById('cancel-submit').addEventListener('click', () => {
            hideSubmitConfirmModal();
        });

        document.getElementById('confirm-submit').addEventListener('click', () => {
            submitOrder();
        });

        document.getElementById('close-submit-modal').addEventListener('click', () => {
            hideSubmitConfirmModal();
        });

        // 订单成功对话框
        document.getElementById('close-success-modal').addEventListener('click', () => {
            hideOrderSuccessModal();
        });

        document.getElementById('close-success').addEventListener('click', () => {
            hideOrderSuccessModal();
        });

        // 点击模态框外部关闭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                hideAllModals();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideAllModals();
            }
        });
    }

    // 加载购物车数据
    async function loadCartData() {
        if (isLoading) return;

        try {
            isLoading = true;
            showLoadingState();

            const response = await fetch('/stock/get_cart_detail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: Number(document.querySelector('#user-id').textContent.trim())
                })
            });

            if (response.ok) {
                const data = await response.json();
                cartData = data;
                renderCartTable();
                updateSummary();
                // 确保角标显示正确
                updateCartBadge(cartData.total_count || 0);
            } else {
                console.error('Failed to load cart data:', response.status);
                notifier.show(texts[lang].serverError, 'danger', 4000);
            }
        } catch (error) {
            console.error('Error loading cart data:', error);
            notifier.show(texts[lang].networkError, 'danger', 4000);
        } finally {
            isLoading = false;
            hideLoadingState();
        }
    }

    // 渲染购物车表格
    function renderCartTable() {
        const tbody = document.getElementById('cart-items-tbody');

        if (cartData.items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="empty-cart">
                        <div class="empty-cart-content">
                            <i class="fa fa-shopping-cart"></i>
                            <p>${texts[lang].noItems}</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const deleteText = lang === 'en' ? 'Delete' : '删除';
        let html = '';
        cartData.items.forEach((item, index) => {
            // 如果库存不足，添加高亮类
            const lowStockClass = item.low_stock ? 'low-stock-warning' : '';
            const stockLengthDisplay = item.low_stock ? `<span class="low-stock-indicator">${item.stock_length}</span>` : item.stock_length;
            
            // 翻译状态和厂家字段（如果需要）
            const translatedStatus = lang === 'en' && typeof Translator !== 'undefined'
                ? Translator.translateStatus(item.status, 'en')
                : item.status;
            const translatedManufacturer = lang === 'en' && typeof Translator !== 'undefined'
                ? Translator.translateManufacturer(item.manufacturer, 'en')
                : item.manufacturer;
            
            html += `
                <tr data-material="${item.material_number}" class="${lowStockClass}">
                    <td width="4%">${index + 1}</td>
                    <td>${item.product_name}</td>
                    <td>${item.material_number}</td>
                    <td>${item.specification}</td>
                    <td>${translatedStatus}</td>
                    <td width="15%">${item.standard}</td>
                    <td>${translatedManufacturer}</td>
                    <td>${item.heat_number}</td>
                    <td>${stockLengthDisplay}</td>
                    <td>${item.stock_weight.toFixed(2)}</td>
                    <td width="12%">${item.added_at}</td>
                    <td>
                        <button class="btn btn-sm btn-danger"
                                onclick="showDeleteConfirmModal('${item.material_number}', '${item.product_name}', '${item.specification}')">
                            <i class="fa fa-trash"></i>
                            ${deleteText}
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // 修复表头对齐问题
        fixTableHeaderAlignment();
    }

    // 修复表头对齐问题
    function fixTableHeaderAlignment() {
        const table = document.querySelector('.table-cart table');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        if (!thead || !tbody) return;

        // 获取表体的滚动条宽度
        const scrollbarWidth = tbody.offsetWidth - tbody.clientWidth;

        // 调整表头宽度以匹配表体宽度
        if (scrollbarWidth > 0) {
            thead.style.width = `calc(100% - ${scrollbarWidth}px)`;
        } else {
            thead.style.width = '100%';
        }

        // 监听滚动条变化
        const resizeObserver = new ResizeObserver(() => {
            const newScrollbarWidth = tbody.offsetWidth - tbody.clientWidth;
            if (newScrollbarWidth > 0) {
                thead.style.width = `calc(100% - ${newScrollbarWidth}px)`;
            } else {
                thead.style.width = '100%';
            }
        });

        resizeObserver.observe(tbody);
    }


    // 显示删除确认对话框
    function showDeleteConfirmModal(materialNumber, productName, productSize) {
        currentDeleteItem = materialNumber;

        const itemInfo = document.getElementById('delete-item-info');
        if (lang === 'en') {
            itemInfo.innerHTML = `
                <div class="item-details">
                    <strong>Product Name:</strong> ${productName}<br>
                    <strong>Specification:</strong> ${productSize}<br>
                    <strong>Stock No.:</strong> ${materialNumber}
                </div>
            `;
        } else {
            itemInfo.innerHTML = `
                <div class="item-details">
                    <strong>商品名称：</strong>${productName}<br>
                    <strong>规格型号：</strong>${productSize}<br>
                    <strong>物料号：</strong>${materialNumber}
                </div>
            `;
        }

        document.getElementById('confirm-delete-modal').style.display = 'block';
    }

    // 隐藏删除确认对话框
    function hideDeleteConfirmModal() {
        document.getElementById('confirm-delete-modal').style.display = 'none';
        currentDeleteItem = null;
    }

    // 显示清空确认对话框
    function showClearConfirmModal() {
        document.getElementById('confirm-clear-modal').style.display = 'block';
    }

    // 隐藏清空确认对话框
    function hideClearConfirmModal() {
        document.getElementById('confirm-clear-modal').style.display = 'none';
    }

    // 显示订单成功对话框
    function showOrderSuccessModal(orderId) {
        document.getElementById('order-number').textContent = orderId;
        document.getElementById('order-time').textContent = new Date().toLocaleString();
        document.getElementById('order-success-modal').style.display = 'block';
    }

    // 隐藏订单成功对话框
    function hideOrderSuccessModal() {
        document.getElementById('order-success-modal').style.display = 'none';
    }

    // 显示确认提交订单对话框
    function showSubmitConfirmModal() {
        if (cartData.items.length === 0) {
            notifier.show(texts[lang].noItems, 'warning', 3000);
            return;
        }

        // 更新确认对话框中的汇总信息
        document.getElementById('submit-total-items').textContent = cartData.total_count || 0;
        document.getElementById('submit-total-length').textContent = `${cartData.total_length || 0} mm`;
        document.getElementById('submit-total-weight').textContent = `${(cartData.total_weight || 0).toFixed(2)} kg`;

        document.getElementById('confirm-submit-modal').style.display = 'block';
    }

    // 隐藏确认提交订单对话框
    function hideSubmitConfirmModal() {
        document.getElementById('confirm-submit-modal').style.display = 'none';
    }

    // 隐藏所有模态框
    function hideAllModals() {
        hideDeleteConfirmModal();
        hideClearConfirmModal();
        hideSubmitConfirmModal();
        hideOrderSuccessModal();
    }

    // 从购物车中删除商品
    async function removeItemFromCart(materialNumber) {
        if (isLoading) return;

        try {
            hideDeleteConfirmModal();

            const response = await fetch('/stock/remove_from_cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: Number(document.querySelector('#user-id').textContent.trim()),
                    material_number: materialNumber
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // 先更新角标动画（减1）
                    const currentCount = cartData.total_count || 0;
                    if (currentCount > 1) {
                        animateCartBadgeDecrease(currentCount - 1);
                    } else {
                        // 如果删除后购物车为空，使用清空动画
                        animateCartBadgeClear();
                    }

                    // 延迟重新加载购物车数据，让动画完成
                    setTimeout(async () => {
                        await loadCartData();
                    }, 200);

                    notifier.show(texts[lang].itemRemoved, 'success', 2000);
                } else {
                    notifier.show(result.message || texts[lang].operationFailed, 'danger', 4000);
                }
            } else {
                console.error('Remove item failed with status:', response.status);
                notifier.show(texts[lang].serverError, 'danger', 4000);
            }
        } catch (error) {
            console.error('Error removing item:', error);
            notifier.show(texts[lang].networkError, 'danger', 4000);
        }
    }

    // 清空购物车
    async function clearCart() {
        if (isLoading) return;

        try {
            hideClearConfirmModal();

            const response = await fetch('/stock/clear_cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: Number(document.querySelector('#user-id').textContent.trim())
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // 先隐藏角标（清空动画）
                    animateCartBadgeClear();

                    // 延迟重新加载购物车数据，让动画完成
                    setTimeout(async () => {
                        await loadCartData();
                    }, 350);

                    notifier.show(texts[lang].cartCleared, 'success', 2000);
                } else {
                    notifier.show(result.message || texts[lang].operationFailed, 'danger', 4000);
                }
            } else {
                console.error('Clear cart failed with status:', response.status);
                notifier.show(texts[lang].serverError, 'danger', 4000);
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            notifier.show(texts[lang].networkError, 'danger', 4000);
        }
    }

    // 提交订单
    async function submitOrder() {
        if (isLoading) return;

        try {
            isLoading = true;
            hideSubmitConfirmModal();
            showLoadingState();

            const orderItems = cartData.items.map(item => ({
                material_number: item.material_number,
            }));

            const response = await fetch('/stock/submit_order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: Number(document.querySelector('#user-id').textContent.trim()),
                    items: orderItems
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // 先隐藏角标（订单提交成功，购物车清空）
                    animateCartBadgeClear();

                    // 刷新订单角标（新增了一个待处理订单）
                    refreshOrdersBadge();

                    // 显示订单成功对话框
                    showOrderSuccessModal(result.order_id);
                    notifier.show(texts[lang].orderSubmitted, 'success', 3000);

                    // 延迟重新加载购物车数据，让动画完成
                    setTimeout(async () => {
                        await loadCartData();
                    }, 350);
                } else {
                    notifier.show(result.message || texts[lang].operationFailed, 'danger', 4000);
                    // 刷新购物车数据
                    setTimeout(async () => {
                        await loadCartData();
                        // document.querySelector('#refresh-cart-btn').click();
                    }, 350);
                }
            } else {
                notifier.show(texts[lang].serverError, 'danger', 4000);
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            notifier.show(texts[lang].networkError, 'danger', 4000);
        } finally {
            isLoading = false;
            hideLoadingState();
        }
    }

    // 更新汇总信息
    function updateSummary() {
        document.getElementById('total-items').textContent = cartData.total_count || 0;
        document.getElementById('total-length').textContent = `${cartData.total_length || 0} mm`;
        document.getElementById('total-weight').textContent = `${(cartData.total_weight || 0).toFixed(2)} kg`;

        // 更新顶部购物车角标
        updateCartBadge(cartData.total_count || 0);
    }

    // 更新购物车角标
    function updateCartBadge(count) {
        const cartBadge = document.querySelector('#cart-count');
        if (!cartBadge) return;

        if (count > 0) {
            cartBadge.textContent = count;
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
    }

    // 角标减少动画
    function animateCartBadgeDecrease(newCount) {
        const cartBadge = document.querySelector('#cart-count');
        if (!cartBadge) return;

        // 添加动画类
        cartBadge.classList.add('cart-count-animate');

        // 更新数字
        setTimeout(() => {
            if (newCount > 0) {
                cartBadge.textContent = newCount;
            } else {
                cartBadge.style.display = 'none';
            }
        }, 150);

        // 移除动画类
        setTimeout(() => {
            cartBadge.classList.remove('cart-count-animate');
        }, 600);
    }

    // 角标清空动画
    function animateCartBadgeClear() {
        const cartBadge = document.querySelector('#cart-count');
        if (!cartBadge) return;

        // 添加清空动画类
        cartBadge.classList.add('cart-count-clear');

        // 隐藏角标
        setTimeout(() => {
            cartBadge.style.display = 'none';
            cartBadge.classList.remove('cart-count-clear');
        }, 300);
    }

    // 显示加载状态
    function showLoadingState() {
        const tbody = document.getElementById('cart-items-tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="loading-state">
                    <div class="loading-content">
                        <i class="fa fa-spinner fa-spin"></i>
                        <p>${texts[lang].loading}</p>
                    </div>
                </td>
            </tr>
        `;
    }

    // 隐藏加载状态
    function hideLoadingState() {
        // 加载状态会在renderCartTable中被替换
    }

    // 刷新订单角标
    function refreshOrdersBadge() {
        // 检查是否有全局的订单管理器实例
        if (typeof ordersManager !== 'undefined' && ordersManager) {
            // 延迟刷新，确保订单已经保存到数据库
            setTimeout(() => {
                ordersManager.refreshOrdersCount().catch(error => {
                    console.warn('Failed to refresh orders badge:', error);
                });
            }, 500);
        } else if (typeof OrdersManager !== 'undefined') {
            // 如果没有全局实例，创建一个临时实例来刷新
            setTimeout(async () => {
                try {
                    const tempOrdersManager = new OrdersManager();
                    await tempOrdersManager.getPendingOrdersCount();
                    tempOrdersManager.updateOrdersDisplay(tempOrdersManager.getCurrentPendingCount());
                } catch (error) {
                    console.warn('Failed to refresh orders badge with temp instance:', error);
                }
            }, 500);
        }
    }

    // 将函数暴露到全局作用域
    window.showDeleteConfirmModal = showDeleteConfirmModal;

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }

    // 监听窗口大小变化，重新调整表头对齐
    window.addEventListener('resize', () => {
        setTimeout(fixTableHeaderAlignment, 100);
    });
}();
