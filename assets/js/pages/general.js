//去除字符串左右空格
String.prototype.trim = function (char, type) {
    if (char) {
        if (type == 'left') {
            return this.replace(new RegExp('^\\' + char + '+', 'g'), '');
        } else if (type == 'right') {
            return this.replace(new RegExp('\\' + char + '+$', 'g'), '');
        }
        return this.replace(new RegExp('^\\' + char + '+|\\' + char + '+$', 'g'), '');
    }
    return this.replace(/^\s+|\s+$/g, '');
};

//调用方法：var time2 = new Date().Format("yyyy-MM-dd HH:mm:ss");
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, // 月份
        "d+": this.getDate(), // 日
        "h+": this.getHours(), // 小时
        "m+": this.getMinutes(), // 分
        "s+": this.getSeconds(), // 秒
        "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
        "S": this.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + ""));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

var code = document.querySelector('#user-code').textContent;

let class_theme = document.querySelector('body').className;
let theme_name = class_theme.split('.')[0];
document.querySelector('#help-info img').setAttribute('src', `/${code}/assets/img/${theme_name}.png`);
document.querySelector('#logo img').setAttribute('src', `/${code}/assets/img/logo_${theme_name}.png`);

//帮助信息点击显示
document.querySelector('#help-info').addEventListener('click', function () {
    this.setAttribute('show', 'on');
    let name = document.querySelector('.top-title .t1').textContent.trim();

    fetch(`/${code}/fetch_help`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(name)
    })
        .then(response => response.json())
        .then(data => {
            if (data != -1) {
                let html = "<ol>";
                for (let info of data) {
                    html += `<li>${info}</li>`;
                }
                html += "</ol>";

                document.querySelector('.modal-body').innerHTML = html;

                document.querySelector('.modal-title').textContent = "帮助信息";
                document.querySelector('.modal-dialog').style.cssText = "max-width: 600px;"
                document.querySelector('#modal-sumit-button').style.cssText = "display: none;"
                document.querySelector('.modal').style.display = "block";
            }
        });
});

//返回建
document.querySelector('#modal-close-button').addEventListener('click', function () {
    let help = document.querySelector('#help-info');
    if (help.hasAttribute('show')) {
        close_help_modal(help);
    }
});

//右上角关闭键
document.querySelector('.top-close').addEventListener('click', function () {
    let help = document.querySelector('#help-info');
    if (help.hasAttribute('show')) {
        close_help_modal(help);
    }
});

//帮助信息显示时处理 esc 键
document.addEventListener('keydown', function (event) {
    let help = document.querySelector('#help-info');
    if (event && event.key == "Escape" && help.hasAttribute('show')) {
        close_help_modal(help);
    }
});

//帮助信息显示时, 点击其它位置关闭
document.addEventListener('click', function (event) {
    let help = document.querySelector('#help-info');
    if (event && event.target.id == "for-click-close" && help.hasAttribute('show')) {
        close_help_modal(help);
    }
});

//关闭帮助信息窗口
function close_help_modal(help) {
    document.querySelector('.modal').style.display = "none";
    document.querySelector('#modal-sumit-button').style.cssText = "";
    help.removeAttribute('show');
}