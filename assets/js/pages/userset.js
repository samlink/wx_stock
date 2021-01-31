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

    fetch('/change_pass', {
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

    fetch('/phone_number', {
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

            fetch('/change_theme', {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(theme_name),
            })
                .then(res => res.json())
                .then(data => {
                    change_themes(this.dataset.theme);
                    notifier.show('主题设置成功', 'success');
                });
        });
    }
}

function change_themes(theme) {
    const app_themes = {
        light: {
            logo: 'logo.png',
            book: 'main.png'
        },
        pink: {
            logo: 'logo4.png',
            book: 'pink2.png'
        },
        orange: {
            logo: 'logo1.png',
            book: 'blue.png',
        },
        red: {
            logo: 'logo3.png',
            book: 'red2.png'
        },
        green: {
            logo: 'logo1.png',
            book: 'main.png'
        },
        blue: {
            logo: 'logo1.png',
            book: 'main.png'
        },
        dark: {
            logo: 'logo1.png',
            book: 'main.png'
        }
    }

    document.body.removeAttribute('class');
    document.body.classList.add(theme);
    let name = theme.split('-')[1];
    document.querySelector('#logo img').setAttribute('src', '/assets/img/' + app_themes[name].logo);
    document.styleSheets[0].insertRule('.caret::before {content: url("/assets/img/close-' + app_themes[name].book + '")}', document.styleSheets[0].cssRules.length);
    document.styleSheets[0].insertRule('.caret-down::before {content: url("/assets/img/open-' + app_themes[name].book + '")}', document.styleSheets[0].cssRules.length);
    let menu = document.querySelector('#menu-bar img');
    let search = document.querySelector('#phone-query img');
    if (theme == "theme-light") {
        menu.setAttribute('src', '/assets/img/menu-1.png');
        search.setAttribute('src', '/assets/img/search-1.png');
    }
    else {
        menu.setAttribute('src', '/assets/img/menu-2.png');
        search.setAttribute('src', '/assets/img/search-2.png');
    }
}