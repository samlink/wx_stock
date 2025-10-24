/**
 * 订单管理器 - 处理订单相关的操作
 * Orders Manager - Handles all orders operations
 */
class OrdersManager {
    constructor() {
        this.pendingCount = 0;
        this.isLoading = false;
        this.lang = localStorage.getItem('language') || 'zh';

        // 文本映射
        this.texts = {
            zh: {
                networkError: '网络连接失败',
                serverError: '服务器错误',
                loginRequired: '请先登录'
            },
            en: {
                networkError: 'Network connection failed',
                serverError: 'Server error',
                loginRequired: 'Please login first'
            }
        };
    }

    /**
     * 初始化订单管理器
     * Initialize orders manager
     */
    async init() {
        try {
            // 获取当前未处理订单数量
            await this.getPendingOrdersCount();

            // 初始化订单UI
            this.initOrdersUI();

        } catch (error) {
            console.error('Failed to initialize OrdersManager:', error);
        }
    }

    /**
     * 初始化订单UI组件
     * Initialize orders UI components
     */
    initOrdersUI() {
        this.updateOrdersDisplay(this.pendingCount);
    }

    /**
     * 获取未处理订单数量
     * Get pending orders count
     */
    async getPendingOrdersCount() {
        if (this.isLoading) return this.pendingCount;

        try {
            this.isLoading = true;

            const userId = document.querySelector('#user-id');
            if (!userId || !userId.textContent.trim()) {
                console.warn('User ID not found');
                return 0;
            }

            const response = await fetch('/stock/get_pending_orders_count', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: Number(userId.textContent.trim())
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.pendingCount = result.count || 0;
                    return this.pendingCount;
                } else {
                    console.warn('Failed to get pending orders count:', result.message);
                    return 0;
                }
            } else if (response.status === 401) {
                console.warn('User not authenticated');
                return 0;
            } else {
                console.warn('Failed to get pending orders count:', response.status);
                return 0;
            }
        } catch (error) {
            console.error('Error getting pending orders count:', error);
            return 0;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 更新订单数量显示
     * Update orders display
     * @param {number} count - 订单数量
     */
    updateOrdersDisplay(count) {
        const ordersBadge = document.querySelector('#orders-count');
        if (!ordersBadge) return;

        this.pendingCount = count;

        if (count > 0) {
            ordersBadge.textContent = count;
            // 使用 flex 以便数字在圆内完全居中
            ordersBadge.style.display = 'flex';
        } else {
            ordersBadge.style.display = 'none';
        }
    }

    /**
     * 刷新订单数量
     * Refresh orders count
     */
    async refreshOrdersCount() {
        const count = await this.getPendingOrdersCount();
        this.updateOrdersDisplay(count);
        return count;
    }

    /**
     * 获取当前未处理订单数量
     * Get current pending orders count
     */
    getCurrentPendingCount() {
        return this.pendingCount;
    }

    /**
     * 重置订单状态
     * Reset orders state
     */
    reset() {
        this.pendingCount = 0;
        this.isLoading = false;
        this.updateOrdersDisplay(0);
    }

    /**
     * 订单状态更新后的回调
     * Callback after order status update
     */
    onOrderStatusChanged() {
        // 延迟刷新，确保数据库已更新
        setTimeout(() => {
            this.refreshOrdersCount();
        }, 1000);
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OrdersManager };
}