//帮助信息点击显示
document.querySelector('#help-info').addEventListener('click', function () {
    this.setAttribute('show', 'on');
    let name = document.querySelector('.top-title .t1').textContent.trim();

    fetch('/fetch_help', {
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
                document.querySelector('.modal-dialog').style.cssText = "max-width: 500px;"
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
    console.log(event.target.id);
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