/**
 * 购物车管理器 - 处理购物车的所有操作
 * Shopping Cart Manager - Handles all shopping cart operations
 */
class CartManager {
    constructor() {
        this.cartCount = 0;
        this.isLoading = false;
        this.lang = localStorage.getItem('language') || 'zh';
        this.animationController = new AnimationController();

        // 文本映射
        this.texts = {
            zh: {
                addToCart: '添加到购物车',
                addSuccess: '商品已添加到购物车',
                addError: '添加失败，请重试',
                networkError: '网络连接失败',
                serverError: '服务器错误',
                loginRequired: '请先登录',
                alreadyInCart: '商品已在购物车中'
            },
            en: {
                addToCart: 'Add to Cart',
                addSuccess: 'Item added to cart',
                addError: 'Failed to add, please try again',
                networkError: 'Network connection failed',
                serverError: 'Server error',
                loginRequired: 'Please login first',
                alreadyInCart: 'Item already in cart'
            }
        };
    }

    /**
     * 初始化购物车管理器
     * Initialize cart manager
     */
    async init() {
        try {
            // 获取当前购物车数量
            await this.getCartCount();

            // 初始化购物车UI
            this.initCartUI();

            // 绑定事件监听器
            this.bindEventListeners();

            console.log('CartManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CartManager:', error);
        }
    }

    /**
     * 初始化购物车UI组件
     * Initialize cart UI components
     */
    initCartUI() {
        // 更新购物车显示
        this.updateCartDisplay(this.cartCount);

        // 绑定购物车图标点击事件
        this.bindCartIconEvents();
    }

    /**
     * 绑定购物车图标事件
     * Bind cart icon events
     */
    bindCartIconEvents() {
        const cartContainer = document.querySelector('#shopping-cart');
        if (cartContainer) {
            cartContainer.addEventListener('click', () => {
                // 这里可以添加点击购物车图标的处理逻辑
                // 比如显示购物车详情页面或弹窗
                console.log('购物车被点击，当前商品数量:', this.cartCount);

                // 可以在这里添加跳转到购物车页面的逻辑
                // window.location.href = '/stock/cart';
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

                // 显示成功消息
                notifier.show(
                    result.message || this.texts[this.lang].addSuccess,
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
        let message = this.texts[this.lang].addError;

        if (status === 401) {
            message = this.texts[this.lang].loginRequired;
            // 可以考虑跳转到登录页面
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else if (status === 409) {
            message = this.texts[this.lang].alreadyInCart;
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
            this.texts[this.lang].networkError,
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
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fa fa-spinner fa-spin';
            }
        } else {
            button.disabled = false;
            button.classList.remove('loading');
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
            cartBadge.style.display = 'inline-block';
        } else {
            cartBadge.style.display = 'none';
        }
    }

    /**
     * 获取购物车数量
     * Get cart count
     */
    async getCartCount() {
        try {
            const response = await fetch('/stock/get_cart_count', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: document.querySelector('#user-id').textContent.trim() })
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