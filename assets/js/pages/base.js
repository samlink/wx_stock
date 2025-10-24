const lang = localStorage.getItem('language') || 'zh';
if (lang == "en") {
    document.querySelector('#title-show').textContent = 'Inventory Inquiry';
    document.querySelector('#title').textContent = 'Five Star (Tianjin) Petroleum Equipment Co., Ltd.';
    document.querySelector('#title-name').innerHTML = '<p><i class="nav-icon fa fa-search"></i>Inventory Inquiry System</p>';
    document.querySelector('#orders-text').textContent = 'My Orders';
    document.querySelector('#cart-text').textContent = 'Shopping Cart';

    document.querySelector('#change-pwd').innerHTML = '<i class="nav-icon fa fa-user"></i>Change password</a>';
    document.querySelector('#logout').title = 'Log out';
    document.querySelector('#modal-sumit-button').textContent = 'Submit';
    document.querySelector('#modal-close-button').textContent = 'Cancel';
    document.querySelector('#my-company').textContent = 'Five Star (Tianjin) Petroleum Equipment Co., Ltd.';
}

// 全局订单管理器实例
let ordersManager = null;

// Handle My Orders button click and initialize orders manager
document.addEventListener('DOMContentLoaded', function() {
    const myOrdersBtn = document.querySelector('#my-orders');
    const userId = document.querySelector('#user-id');
    
    if (myOrdersBtn) {
        myOrdersBtn.addEventListener('click', function(e) {
            // Check if user is logged in
            if (!userId || !userId.textContent.trim()) {
                e.preventDefault();
                // Redirect to login page if not logged in
                window.location.href = '/stock/login';
                return;
            }
            // If logged in, allow normal navigation to my orders page
        });
    }

    // 初始化订单管理器（仅在用户已登录时）
    if (userId && userId.textContent.trim()) {
        // 确保OrdersManager类已加载
        if (typeof OrdersManager !== 'undefined') {
            ordersManager = new OrdersManager();
            ordersManager.init().catch(error => {
                console.error('Failed to initialize orders manager:', error);
            });
        } else {
            console.warn('OrdersManager class not found');
        }
    }
});