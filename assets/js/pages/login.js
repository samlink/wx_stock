// var login_show = document.querySelector('#login-form');
// var logon_show = document.querySelector('#logon-form');
// var login = document.querySelector('#login');
// var logon = document.querySelector('#logon');

//登录按钮
document.querySelector('#login-button').addEventListener('click', function (event) {
    event.preventDefault();    
    var name = document.querySelector('#login-name').value.trim();
    var login_pass = document.querySelector('#login-pass').value.trim();

    if (name == "" || login_pass == "") {
        notifier.show('用户名或密码不能为空', 'danger');
        return false;
    }

    var user = {
        area: "天津",
        name: name,
        password: login_pass
    }

    let MAX_FAILED = 6;

    fetch(`/login`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
    })
        .then(res => res.json())
        .then(data => {
            if (data == -1) {
                notifier.show('用户不存在', 'danger');
            }
            else if (data == -2) {
                notifier.show('等待管理员确认', 'warning');
            }
            else if (data != 0 && data < MAX_FAILED) {
                notifier.show('密码错误', 'danger');
                setTimeout(() => notifier.show('还有 ' + data + ' 次机会', 'warning'), 500);
            }
            else if (data == 0 || data >= MAX_FAILED) {
                notifier.show('帐户被锁定，请联系管理员', 'danger');
            }
            else {
                window.location = `/`;
            }
        });
});

//找回密码
document.querySelector('#forget-pass').addEventListener('click', function () {
    let name = document.querySelector('#login-name').value.trim();
    if (name == "") {
        notifier.show('用户名不能为空', 'danger');
        return false;
    }

    var user = {
        area: "",
        name: name,
        password: ""
    }

    fetch(`/forget_pass`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
    })
        .then(res => res.json())
        .then(data => {
            if (data == -1) {
                notifier.show('用户不存在或待确认', 'danger');
            }
            else if (data == -2) {
                notifier.show('用户没有预留手机号', 'danger');
            }
            else if (data == -3) {
                notifier.show('找回密码机会已用完', 'danger');
            }
            else if (data == -4) {
                notifier.show('帐户被锁定，请联系管理员', 'danger');
            }
            else {
                notifier.show('新密码已发送至预留手机号', 'success');
                setTimeout(() => notifier.show('还有 ' + data + ' 次找回密码的机会', 'info'), 500);
            }
        });
});

