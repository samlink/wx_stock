/**
 * 购物车管理器 - 处理购物车的所有操作
 * Shopping Cart Manager - Handles all shopping cart operations
 */
class CartManager {
    constructor() {
        this.cartCount = 0;
        this.cartMaterials = []; // 购物车中的物料号数组
        this.isLoading = false;
        this.lang = localStorage.getItem('language') || 'zh';
        this.animationController = new AnimationController();

        // 购物车相关文本映射
        this.texts = {
            zh: {
                // 购物车图标和标题
                cartTitle: '购物车',
                cartTooltip: '查看购物车',
                
                // 添加按钮相关
                addToCart: '添加到购物车',
                addToCartShort: '加入购物车',
                
                // 操作成功消息
                addSuccess: '商品已添加到购物车',
                itemAdded: '已添加到购物车',
                
                // 错误消息
                addError: '添加失败，请重试',
                networkError: '网络连接失败，请检查网络连接',
                serverError: '服务器错误，请稍后重试',
                loginRequired: '请先登录后再操作',
                alreadyInCart: '商品已在购物车中',
                invalidItem: '无效的商品信息',
                operationFailed: '操作失败',
                
                // 状态提示
                loading: '正在添加...',
                processing: '处理中...',
                
                // 购物车状态
                emptyCart: '购物车为空',
                cartCount: '购物车商品数量',
                itemsInCart: '购物车中有 {count} 件商品',
                
                // 按钮状态
                buttonDisabled: '按钮已禁用',
                pleaseWait: '请稍候...'
            },
            en: {
                // 购物车图标和标题
                cartTitle: 'Shopping Cart',
                cartTooltip: 'View Cart',
                
                // 添加按钮相关
                addToCart: 'Add to Cart',
                addToCartShort: 'Add to Cart',
                
                // 操作成功消息
                addSuccess: 'Item added to cart successfully',
                itemAdded: 'Added to cart',
                
                // 错误消息
                addError: 'Failed to add item, please try again',
                networkError: 'Network connection failed, please check your connection',
                serverError: 'Server error, please try again later',
                loginRequired: 'Please login first to continue',
                alreadyInCart: 'Item is already in cart',
                invalidItem: 'Invalid item information',
                operationFailed: 'Operation failed',
                
                // 状态提示
                loading: 'Adding...',
                processing: 'Processing...',
                
                // 购物车状态
                emptyCart: 'Cart is empty',
                cartCount: 'Cart item count',
                itemsInCart: '{count} item(s) in cart',
                
                // 按钮状态
                buttonDisabled: 'Button disabled',
                pleaseWait: 'Please wait...'
            }
        };
    }

    /**
     * 获取本地化文本
     * Get localized text
     * @param {string} key - 文本键
     * @param {object} params - 参数对象，用于文本插值
     * @returns {string} 本地化文本
     */
    getText(key, params = {}) {
        let text = this.texts[this.lang][key] || this.texts['zh'][key] || key;
        
        // 简单的文本插值
        if (params && typeof text === 'string') {
            Object.keys(params).forEach(param => {
                text = text.replace(`{${param}}`, params[param]);
            });
        }
        
        return text;
    }

    /**
     * 初始化购物车管理器
     * Initialize cart manager
     */
    async init() {
        try {
            // 获取当前购物车物料号列表和数量
            await this.getCartMaterials();

            // 初始化购物车UI
            this.initCartUI();

            // 绑定事件监听器
            this.bindEventListeners();

            this.highlightCartItems();

        } catch (error) {
            console.error('Failed to initialize CartManager:', error);
        }
    }

    /**
     * 初始化购物车UI组件
     * Initialize cart UI components
     */
    initCartUI() {
        this.updateCartDisplay(this.cartCount);
        this.bindCartIconEvents();
    }

    /**
     * 绑定购物车图标事件
     * Bind cart icon events
     */
    bindCartIconEvents() {
        const cartContainer = document.querySelector('#shopping-cart');
        if (cartContainer) {
            // 设置购物车图标的标题和提示
            cartContainer.title = this.getText('cartTooltip');
            
            cartContainer.addEventListener('click', () => {
                // 跳转到购物车页面
                window.location.href = '/stock/cart';
            });
        }
    }

    /**
     * 绑定事件监听器
     * Bind event listeners
     */
    bindEventListeners() {
        // 使用事件委托处理动态添加的按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-add-cart')) {
                e.preventDefault();
                e.stopPropagation();

                const button = e.target.closest('.btn-add-cart');
                const materialNumber = button.getAttribute('data-material');

                if (materialNumber && !this.isLoading) {
                    this.addToCart(materialNumber, button);
                }
            }
        });
    }

    /**
     * 添加商品到购物车
     * Add item to cart
     * @param {string} materialNumber - 物料号
     * @param {HTMLElement} buttonElement - 按钮元素
     */
    async addToCart(materialNumber, buttonElement) {
        if (this.isLoading) return;

        try {
            this.isLoading = true;

            // 显示加载状态
            this.setButtonLoading(buttonElement, true);

            // 播放按钮点击动画
            this.animationController.playButtonFeedback(buttonElement);

            // 发送API请求
            const response = await fetch('/stock/add_to_cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: Number(document.querySelector('#user-id').textContent.trim()),
                    material_number: materialNumber,
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // 成功添加
                this.cartCount = result.cart_count || this.cartCount + 1;

                // 更新物料号列表
                if (!this.cartMaterials.includes(materialNumber)) {
                    this.cartMaterials.push(materialNumber);
                }

                // 播放飞行动画
                const cartIcon = document.querySelector('#shopping-cart');
                if (cartIcon) {
                    await this.animationController.playFlyAnimation(buttonElement, cartIcon);
                }

                // 更新购物车显示
                this.updateCartDisplay(this.cartCount);

                // 播放数量增加动画
                const cartBadge = document.querySelector('#cart-count');
                if (cartBadge) {
                    this.animationController.playCountAnimation(cartBadge);
                }

                // 重新高亮显示表格条目
                this.highlightCartItems();

                // 显示成功消息
                notifier.show(
                    result.message || this.getText('addSuccess'),
                    'success',
                    3000
                );

            } else {
                // 处理业务错误
                this.handleAddError(result, response.status);
            }

        } catch (error) {
            console.error('Add to cart error:', error);
            this.handleNetworkError();
        } finally {
            this.isLoading = false;
            this.setButtonLoading(buttonElement, false);
        }
    }

    /**
     * 处理添加错误
     * Handle add error
     */
    handleAddError(result, status) {
        let message = this.getText('addError');

        if (status === 401) {
            message = this.getText('loginRequired');
            // 可以考虑跳转到登录页面
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else if (status === 409) {
            message = this.getText('alreadyInCart');
        } else if (status === 400) {
            message = this.getText('invalidItem');
        } else if (status >= 500) {
            message = this.getText('serverError');
        } else if (result.message) {
            message = result.message;
        }

        notifier.show(message, 'danger', 4000);
    }

    /**
     * 处理网络错误
     * Handle network error
     */
    handleNetworkError() {
        notifier.show(
            this.getText('networkError'),
            'danger',
            4000
        );
    }

    /**
     * 设置按钮加载状态
     * Set button loading state
     */
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            button.title = this.getText('loading');
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fa fa-spinner fa-spin';
            }
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            button.title = this.getText('addToCart');
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fa fa-plus';
            }
        }
    }

    /**
     * 更新购物车数量显示
     * Update cart display
     * @param {number} count - 商品数量
     */
    updateCartDisplay(count) {
        const cartBadge = document.querySelector('#cart-count');
        if (!cartBadge) return;

        this.cartCount = count;

        if (count > 0) {
            cartBadge.textContent = count;
            cartBadge.title = this.getText('itemsInCart', { count: count });
            // 使用 flex 以便数字在圆内完全居中
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
            cartBadge.title = this.getText('emptyCart');
        }

        // 更新购物车图标的提示文本
        const cartContainer = document.querySelector('#shopping-cart');
        if (cartContainer) {
            cartContainer.title = count > 0 
                ? this.getText('itemsInCart', { count: count })
                : this.getText('cartTooltip');
        }
    }

    /**
     * 获取购物车物料号列表和数量
     * Get cart materials and count
     */
    async getCartMaterials() {
        try {
            const response = await fetch('/stock/get_cart_materials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: Number(document.querySelector('#user-id').textContent.trim()) })
            });

            if (response.ok) {
                const result = await response.json();
                this.cartMaterials = result.materials || [];
                this.cartCount = result.count || 0;
                return { materials: this.cartMaterials, count: this.cartCount };
            } else {
                console.warn('Failed to get cart materials:', response.status);
                this.cartMaterials = [];
                this.cartCount = 0;
                return { materials: [], count: 0 };
            }
        } catch (error) {
            console.error('Error getting cart materials:', error);
            this.cartMaterials = [];
            this.cartCount = 0;
            return { materials: [], count: 0 };
        }
    }

    /**
     * 获取购物车数量（保留向后兼容）
     * Get cart count (for backward compatibility)
     */
    async getCartCount() {
        try {
            const response = await fetch('/stock/get_cart_count', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: Number(document.querySelector('#user-id').textContent.trim()) })
            });

            if (response.ok) {
                const result = await response.json();
                this.cartCount = result.count || 0;
                return this.cartCount;
            } else {
                console.warn('Failed to get cart count:', response.status);
                return 0;
            }
        } catch (error) {
            console.error('Error getting cart count:', error);
            return 0;
        }
    }

    /**
     * 获取当前购物车数量
     * Get current cart count
     */
    getCurrentCount() {
        return this.cartCount;
    }

    /**
     * 获取当前购物车物料号列表
     * Get current cart materials
     */
    getCurrentMaterials() {
        return this.cartMaterials;
    }

    /**
     * 高亮显示表格中在购物车中的条目
     * Highlight table rows that are in cart
     */
    highlightCartItems() {
        if (!this.cartMaterials || this.cartMaterials.length === 0) {
            return;
        }

        // 查找所有表格行
        const tableRows = document.querySelectorAll('.table-container tbody tr');

        tableRows.forEach(row => {
            const materialCell = row.querySelector('.物料号');

            if (materialCell) {
                const materialNumber = materialCell.textContent.trim();
                // 检查是否在购物车中
                if (this.cartMaterials.includes(materialNumber)) {
                    row.classList.add('cart-item-highlight');
                } else {
                    row.classList.remove('cart-item-highlight');

                    // 移除购物车图标指示
                    const indicator = row.querySelector('.cart-indicator');
                    if (indicator) {
                        indicator.remove();
                    }
                }
            }
        });
    }

    /**
     * 清除所有高亮显示
     * Clear all highlights
     */
    clearHighlights() {
        const highlightedRows = document.querySelectorAll('.cart-item-highlight');
        highlightedRows.forEach(row => {
            row.classList.remove('cart-item-highlight');
            const indicator = row.querySelector('.cart-indicator');
            if (indicator) {
                indicator.remove();
            }
        });
    }

    /**
     * 更新语言设置
     * Update language setting
     * @param {string} newLang - 新的语言代码 ('zh' 或 'en')
     */
    updateLanguage(newLang) {
        if (newLang && (newLang === 'zh' || newLang === 'en')) {
            this.lang = newLang;
            
            // 更新所有按钮的标题
            this.updateButtonTitles();
            
            // 更新购物车显示
            this.updateCartDisplay(this.cartCount);
        }
    }

    /**
     * 更新所有购物车按钮的标题
     * Update all cart button titles
     */
    updateButtonTitles() {
        const addButtons = document.querySelectorAll('.btn-add-cart');
        addButtons.forEach(button => {
            if (!button.classList.contains('loading')) {
                button.title = this.getText('addToCart');
            }
        });
    }

    /**
     * 重置购物车状态
     * Reset cart state
     */
    reset() {
        this.cartCount = 0;
        this.isLoading = false;
        this.updateCartDisplay(0);
    }
}

/**
 * 动画控制器 - 处理各种动画效果
 * Animation Controller - Handles various animation effects
 */
class AnimationController {
    constructor() {
        this.animationDuration = 1000; // 1秒动画时长
        this.isAnimating = false;

        // 检查用户是否偏好减少动画
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * 播放飞行动画
     * Play fly animation
     * @param {HTMLElement} fromElement - 起始元素
     * @param {HTMLElement} toElement - 目标元素
     */
    async playFlyAnimation(fromElement, toElement) {
        // 如果用户偏好减少动画，直接返回
        if (this.prefersReducedMotion) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            try {
                // 创建飞行元素
                const flyElement = this.createFlyElement();

                // 获取起始和目标位置
                const fromRect = fromElement.getBoundingClientRect();
                const toRect = toElement.getBoundingClientRect();

                // 计算中心点
                const fromCenterX = fromRect.left + fromRect.width / 2;
                const fromCenterY = fromRect.top + fromRect.height / 2;
                const toCenterX = toRect.left + toRect.width / 2;
                const toCenterY = toRect.top + toRect.height / 2;

                // 设置起始位置
                flyElement.style.left = fromCenterX + 'px';
                flyElement.style.top = fromCenterY + 'px';

                document.body.appendChild(flyElement);

                // 强制重绘
                flyElement.offsetHeight;

                // 计算移动距离
                const deltaX = toCenterX - fromCenterX;
                const deltaY = toCenterY - fromCenterY;

                // 开始动画 - 使用贝塞尔曲线创建抛物线效果
                flyElement.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3) rotate(360deg)`;
                flyElement.style.opacity = '0';

                // 动画结束后清理
                setTimeout(() => {
                    if (flyElement.parentNode) {
                        flyElement.parentNode.removeChild(flyElement);
                    }
                    resolve();
                }, this.animationDuration);

            } catch (error) {
                console.error('Animation error:', error);
                resolve();
            }
        });
    }

    /**
     * 创建飞行元素
     * Create fly element
     */
    createFlyElement() {
        const element = document.createElement('div');
        element.className = 'cart-fly-item';
        element.innerHTML = '<i class="fa fa-cube"></i>';

        // 使用CSS类而不是内联样式
        element.style.cssText = `
            position: fixed;
            z-index: 9999;
            pointer-events: none;
            font-size: 16px;
            color: #007bff;
            transition: all ${this.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform: scale(1) rotate(0deg);
            opacity: 1;
            margin-left: -8px;
            margin-top: -8px;
        `;

        return element;
    }

    /**
     * 播放数量增加动画
     * Play count animation
     * @param {HTMLElement} element - 数量显示元素
     */
    playCountAnimation(element) {
        if (this.prefersReducedMotion || !element) return;

        // 移除之前的动画类（如果存在）
        element.classList.remove('cart-count-animate');

        // 强制重绘
        element.offsetHeight;

        // 添加动画类
        element.classList.add('cart-count-animate');

        // 动画结束后移除类
        setTimeout(() => {
            element.classList.remove('cart-count-animate');
        }, 600);
    }

    /**
     * 播放按钮反馈动画
     * Play button feedback animation
     * @param {HTMLElement} buttonElement - 按钮元素
     */
    playButtonFeedback(buttonElement) {
        if (this.prefersReducedMotion || !buttonElement) return;

        // 移除之前的动画类
        buttonElement.classList.remove('btn-clicked');

        // 强制重绘
        buttonElement.offsetHeight;

        // 添加点击反馈类
        buttonElement.classList.add('btn-clicked');

        // 短暂延迟后移除
        setTimeout(() => {
            buttonElement.classList.remove('btn-clicked');
        }, 200);
    }

    /**
     * 播放加载状态动画
     * Play loading state animation
     * @param {HTMLElement} element - 元素
     * @param {boolean} show - 是否显示加载状态
     */
    playLoadingAnimation(element, show) {
        if (!element) return;

        if (show) {
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    }

    /**
     * 创建成功反馈动画
     * Create success feedback animation
     * @param {HTMLElement} element - 目标元素
     */
    playSuccessAnimation(element) {
        if (this.prefersReducedMotion || !element) return;

        // 创建成功提示元素
        const successElement = document.createElement('div');
        successElement.className = 'cart-success-indicator';
        successElement.innerHTML = '<i class="fa fa-check"></i>';
        successElement.style.cssText = `
            position: absolute;
            top: -10px;
            right: -10px;
            background-color: #28a745;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            z-index: 10;
            animation: successPop 1s ease-out forwards;
        `;

        // 添加到父元素
        const parent = element.closest('td') || element.parentNode;
        if (parent) {
            parent.style.position = 'relative';
            parent.appendChild(successElement);

            // 1秒后移除
            setTimeout(() => {
                if (successElement.parentNode) {
                    successElement.parentNode.removeChild(successElement);
                }
            }, 1000);
        }
    }

    /**
     * 设置动画偏好
     * Set animation preference
     * @param {boolean} reduced - 是否减少动画
     */
    setReducedMotion(reduced) {
        this.prefersReducedMotion = reduced;
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CartManager, AnimationController };
}