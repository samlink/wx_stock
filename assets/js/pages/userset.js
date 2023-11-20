import { notifier } from '../parts/notifier.mjs';

//设置密码
document.querySelector('#pass-button').addEventListener('click', function (event) {
    event.preventDefault();
    var old_pass = document.querySelector('#old-pass').value.trim();
    var new_pass = document.querySelector('#new-pass').value.trim();
    var confirm_pass = document.querySelector('#confirm-pass').value.trim();

    if (old_pass == "" || new_pass == "" || confirm_pass == "") {
        notifier.show('密码不能为空', 'danger');
        return false;
    }

    if (new_pass != confirm_pass) {
        notifier.show('两次密码输入不一致', 'danger');
        return false;
    }
    var password = {
        old_pass: old_pass,
        new_pass: new_pass
    }

    fetch(`/change_pass`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(password),
    })
        .then(res => res.json())
        .then(data => {
            if (data != 0) {
                notifier.show('密码修改成功', 'success');
            }
            else {
                notifier.show('原密码输入有误', 'danger');
            }
        });
});

theme_set();

//设置手机
document.querySelector('#phone-button').addEventListener('click', function (event) {
    event.preventDefault();
    var phone_number = document.querySelector('#phone').value.trim();

    if (phone_number != "" &&
        !phone_number.match(/^(13[0-9]|14[579]|15[0-3,5-9]|16[6]|17[0135678]|18[0-9]|19[89])\d{8}$/)) {

        notifier.show('手机号码错误', 'danger');
        return false;
    }

    var phone = {
        phone_number: phone_number,
    }

    fetch(`/phone_number`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(phone),
    })
        .then(res => res.json())
        .then(data => {
            if (data != 0) {
                notifier.show('手机号设置成功', 'success');
            }
            else {
                notifier.show('手机号设置错误', 'danger');
            }
        });
});

//设置主题
function theme_set() {
    let themes = document.querySelectorAll('.themes');
    for (let theme of themes) {
        theme.addEventListener('click', function () {
            var theme_name = {
                name: this.dataset.theme,
            }

            fetch(`/change_theme`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(theme_name),
            })
                .then(res => res.json())
                .then(data => {
                    location.reload();
                });
        });
    }
}