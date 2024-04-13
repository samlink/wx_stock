// import {notifier} from '/assets/js/parts/notifier.mjs';
// import {alert_confirm} from "/assets/js/parts/alert.mjs";

let page_general = function () {

    document.querySelector('#help-info img').setAttribute('src', `/assets/img/blue.png`);

    document.querySelector('#quick-1').onclick = () => {
        window.location.href = "/buy_in/new";
    }
    document.querySelector('#quick-2').onclick = () => {
        window.location.href = "/sale/new";
    }
    document.querySelector('#quick-3').onclick = () => {
        window.location.href = "/transport/new";
    }
    document.querySelector('#quick-4').onclick = () => {
        window.location.href = "/product_set";
    }
    document.querySelector('#quick-5').onclick = () => {
        window.location.href = "/material_in/new";
    }
    document.querySelector('#quick-6').onclick = () => {
        window.location.href = "/material_out/new";
    }
    document.querySelector('#quick-7').onclick = () => {
        window.location.href = "/stockin_items";
    }
    document.querySelector('#quick-8').onclick = () => {
        window.location.href = "/stockout_items";
    }
    document.querySelector('#quick-9').onclick = () => {
        window.location.href = "/kp/new";
    }

    // 反审单据
    document.querySelector('#anti-shen').onclick = () => {
        if (!document.querySelector('#dh')) {
            notifier.show('请先进入单据页面', 'danger');
        } else {
            let dh = document.querySelector('#dh');
            if (dh.textContent == "新单据" || document.querySelector('#remember-button').textContent == "审核") {
                notifier.show('单据还未审核', 'danger');
                return false;
            } else {
                alert_confirm("确认反审核吗？", {
                    confirmText: "确认",
                    cancelText: "取消",
                    confirmCallBack: () => {
                        fetch(`/anti_formal`, {
                            method: 'post',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: dh.textContent,
                        })
                            .then(response => response.json())
                            .then(content => {
                                if (content != -1) {
                                    location.reload();
                                } else {
                                    notifier.show('权限不够', 'danger');
                                }
                            });
                    }
                });
            }
        }
    }


    //帮助信息点击显示
    document.querySelector('#help-info').addEventListener('click', function () {
        this.setAttribute('show', 'on');
        let name = document.querySelector('.top-title .t1').textContent.trim();

        fetch(`/fetch_help`, {
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
                    document.querySelector('.modal-dialog').style.cssText = "max-width: 600px;";
                    document.querySelector('#modal-sumit-button').style.cssText = "display: none;";
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
}();
