// 本地运行测试用
setCookie("wxok", "ok", 3);
localStorage.setItem('language', 'en'); // zh en

const lang = localStorage.getItem('language') || 'zh';

document.querySelector('#title-show').textContent = lang === 'zh' ? '客户服务' : 'Customer Service';
document.querySelector('#title').textContent = lang === 'zh' ? '客户服务系统' : 'Customer Service System';
document.querySelector('#logon a').textContent = lang === 'zh' ? '公司主页' : 'Home';
document.querySelector('#login-name').placeholder = lang === 'zh' ? '请输入用户名' : 'Please enter your username';
document.querySelector('#login-pass').placeholder = lang === 'zh' ? '请输入密码' : 'Please enter your password';
document.querySelector('#login-button').textContent = lang === 'zh' ? '登录' : 'Login';
document.querySelector('#my-company').textContent = lang === 'zh' ? '五星（天津）石油装备有限公司' : 'Five Star (Tianjin) Petroleum Equipment Co., Ltd.';
document.querySelector('#label-name').textContent = lang === 'zh' ? '用户名' : 'Username';
document.querySelector('#label-pass').textContent = lang === 'zh' ? '密码' : 'Password';

let area = lang === 'zh' ? '天津' : 'Tianjin';
let mess1 = lang === 'zh' ? '用户名或密码不能为空' : 'Username or password cannot be empty';
let mess2 = lang === 'zh' ? '用户不存在' : 'User does not exist';
let mess3 = lang === 'zh' ? '等待管理员确认' : 'Waiting for administrator confirmation';
let mess4 = lang === 'zh' ? '密码错误' : 'Wrong password';
let mess5 = lang === 'zh' ? '还有 ' : 'There are ';
let mess6 = lang === 'zh' ? ' 次机会' : ' chances';
let mess8 = lang === 'zh' ? '还有 1 次机会 ' : 'There is only one chance left';
let mess7 = lang === 'zh' ? '帐户被锁定，请联系管理员' : 'Account locked, please co1ntact administrator';

//登录按钮
document.querySelector('#login-button').addEventListener('click', function (event) {
    event.preventDefault();
    var name = document.querySelector('#login-name').value.trim();
    var login_pass = document.querySelector('#login-pass').value.trim();

    if (name == "" || login_pass == "") {
        notifier.show(mess1, 'danger');
        return false;
    }

    var user = {
        area: area,
        name: name,
        password: login_pass
    }

    let MAX_FAILED = 6;

    fetch(`/stock/login`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
    })
        .then(res => res.json())
        .then(data => {
            if (data == -1) {
                notifier.show(mess2, 'danger');
            }
            else if (data == -2) {
                notifier.show(mess3, 'warning');
            }
            else if (data != 0 && data < MAX_FAILED) {
                notifier.show(mess4, 'danger');
                if (data == 1) {
                    setTimeout(() => notifier.show(mess8, 'warning'), 500);
                } else {
                    setTimeout(() => notifier.show(mess5 + data + mess6, 'warning'), 500);
                }
            }
            else if (data == 0 || data >= MAX_FAILED) {
                notifier.show(mess7, 'danger');
            }
            else {
                window.location = `/stock/`;
            }
        });
});


