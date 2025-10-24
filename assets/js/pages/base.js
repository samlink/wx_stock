const lang = localStorage.getItem('language') || 'zh';
if (lang == "en") {
    document.querySelector('#title-show').textContent = 'Inventory Inquiry';
    document.querySelector('#title').textContent = 'Five Star (Tianjin) Petroleum Equipment Co., Ltd.';
    document.querySelector('#title-name').innerHTML = '<p><i class="nav-icon fa fa-search"></i>Inventory Inquiry System</p>';
    document.querySelector('#my-orders').innerHTML = '<i class="nav-icon fa fa-list-alt"></i>My Orders';
    document.querySelector('#change-pwd').innerHTML = '<i class="nav-icon fa fa-user"></i>Change password</a>';
    document.querySelector('#logout').title = 'Log out';
    document.querySelector('#modal-sumit-button').textContent = 'Submit';
    document.querySelector('#modal-close-button').textContent = 'Cancel';
    document.querySelector('#my-company').textContent = lang == 'zh' ?
    "五星（天津）石油装备有限公司" :
    'Five Star (Tianjin) Petroleum Equipment Co., Ltd.';
}

// Handle My Orders button click
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
});