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
        totalCount: 0,
        totalQuantity: 0,
        totalPrice: 0.0
    };

    let currentDeleteItem = null;
    let isLoading = false;

    // 多语言支持
    const lang = localStorage.getItem('language') || 'zh';
    const texts = {
        zh: {
            cartTitle: '购物车',
            totalItems: '商品总数：',
            totalQuantity: '总数量：',
            totalPrice: '总金额：',
            submitOrder: '提交订购',
            clearCart: '清空购物车',
            refresh: '刷新',
            confirmDelete: '确认删除',
            confirmDeleteMsg: '确定要从购物车中删除这个商品吗？',
            confirmClear: '确认清空',
            confirmClearMsg: '确定要清空整个购物车吗？此操作不可撤销。',
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
            totalQuantity: 'Total Quantity:',
            totalPrice: 'Total Price:',
            submitOrder: 'Submit Order',
            clearCart: 'Clear Cart',
            refresh: 'Refresh',
            confirmDelete: 'Confirm Delete',
            confirmDeleteMsg: 'Are you sure you want to remove this item from cart?',
            confirmClear: 'Confirm Clear',
            confirmClearMsg: 'Are you sure you want to clear the entire cart? This action cannot be undone.',
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
        
        // 绑定事件监听器
        bindEventListeners();
        
        // 加载购物车数据
        loadCartData();
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
            submitOrder();
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

        let html = '';
        cartData.items.forEach((item, index) => {
            html += `
                <tr data-material="${item.material_number}">
                    <td>${index + 1}</td>
                    <td>${item.product_name}</td>
                    <td>${item.material_number}</td>
                    <td>${item.specification}</td>
                    <td>${item.status}</td>
                    <td>${item.standard}</td>
                    <td>${item.manufacturer}</td>
                    <td>${item.heat_number}</td>
                    <td>${item.stock_length}</td>
                    <td>${item.stock_weight.toFixed(2)}</td>
                    <td>${item.added_at}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" 
                                onclick="showDeleteConfirmModal('${item.material_number}', '${item.product_name}')">
                            <i class="fa fa-trash"></i>
                            删除
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
    function showDeleteConfirmModal(materialNumber, productName) {
        currentDeleteItem = materialNumber;
        
        const itemInfo = document.getElementById('delete-item-info');
        itemInfo.innerHTML = `
            <div class="item-details">
                <strong>商品名称：</strong>${productName}<br>
                <strong>物料号：</strong>${materialNumber}
            </div>
        `;
        
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

    // 隐藏所有模态框
    function hideAllModals() {
        hideDeleteConfirmModal();
        hideClearConfirmModal();
        hideOrderSuccessModal();
    }

    // 从购物车中删除商品
    async function removeItemFromCart(materialNumber) {
        if (isLoading) return;

        try {
            isLoading = true;
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
                    // 重新加载购物车数据
                    await loadCartData();
                    notifier.show(texts[lang].itemRemoved, 'success', 2000);
                } else {
                    notifier.show(result.message || texts[lang].operationFailed, 'danger', 4000);
                }
            } else {
                notifier.show(texts[lang].serverError, 'danger', 4000);
            }
        } catch (error) {
            console.error('Error removing item:', error);
            notifier.show(texts[lang].networkError, 'danger', 4000);
        } finally {
            isLoading = false;
        }
    }

    // 清空购物车
    async function clearCart() {
        if (isLoading) return;

        try {
            isLoading = true;
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
                    // 重新加载购物车数据
                    await loadCartData();
                    notifier.show(texts[lang].cartCleared, 'success', 2000);
                } else {
                    notifier.show(result.message || texts[lang].operationFailed, 'danger', 4000);
                }
            } else {
                notifier.show(texts[lang].serverError, 'danger', 4000);
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            notifier.show(texts[lang].networkError, 'danger', 4000);
        } finally {
            isLoading = false;
        }
    }

    // 提交订单
    async function submitOrder() {
        if (isLoading) return;

        if (cartData.items.length === 0) {
            notifier.show(texts[lang].noItems, 'warning', 3000);
            return;
        }

        try {
            isLoading = true;
            showLoadingState();

            const orderItems = cartData.items.map(item => ({
                material_number: item.material_number,
                quantity: item.quantity
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
                    // 显示订单成功对话框
                    showOrderSuccessModal(result.order_id);
                    notifier.show(texts[lang].orderSubmitted, 'success', 3000);
                    
                    // 重新加载购物车数据（应该为空）
                    await loadCartData();
                } else {
                    notifier.show(result.message || texts[lang].operationFailed, 'danger', 4000);
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
        document.getElementById('total-items').textContent = cartData.total_count;
        document.getElementById('total-quantity').textContent = cartData.total_quantity;
        document.getElementById('total-price').textContent = `¥${cartData.total_price.toFixed(2)}`;
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
