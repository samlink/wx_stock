let class_theme = document.querySelector('body').className;
let theme_name = class_theme.split('.')[0];
document.querySelector('#help-info img').setAttribute('src', `/assets/img/${theme_name}.png`);
document.querySelector('#logo img').setAttribute('src', `/assets/img/logo_${theme_name}.png`);

document.styleSheets[0].insertRule(`#tree .item::before{content:url("/assets/img/folder_${theme_name}.png")}`, document.styleSheets[0].cssRules.length);
document.styleSheets[0].insertRule(`#tree .item-down::before{content:url("/assets/img/folder_${theme_name}2.png")}`, document.styleSheets[0].cssRules.length);

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

//表格列宽调整(与table.mjs 中的函数一样)
function table_resize(table) {
    var tTD; //用来存储当前更改宽度的Table Cell,避免快速移动鼠标的问题
    for (let j = 0; j < table.rows[0].cells.length; j++) {
        table.rows[0].cells[j].onmousedown = function (event) {
            //记录单元格
            tTD = this;
            if (event.offsetX > tTD.offsetWidth - 10) {
                tTD.mouseDown = true;
                tTD.oldX = event.x;
                tTD.oldWidth = tTD.offsetWidth;
            }
            //记录Table宽度
            //table = tTD; while (table.tagName != ‘TABLE') table = table.parentElement;
            //tTD.tableWidth = table.offsetWidth;
        };

        table.rows[0].cells[j].onmouseup = function (event) {
            //结束宽度调整
            if (tTD == undefined) tTD = this;
            tTD.mouseDown = false;
            tTD.style.cursor = 'defalt';
        };

        table.rows[0].cells[j].onmousemove = function (event) {
            //更改鼠标样式
            if (event.offsetX > this.offsetWidth - 10)
                this.style.cursor = 'col-resize';
            else
                this.style.cursor = 'pointer';
            //取出暂存的Table Cell
            if (tTD == undefined) tTD = this;
            //调整宽度
            if (tTD.mouseDown != null && tTD.mouseDown == true) {
                tTD.style.cursor = 'pointer';
                if (tTD.oldWidth + (event.x - tTD.oldX) > 0)
                    tTD.width = tTD.oldWidth + (event.x - tTD.oldX);
                //调整列宽
                tTD.style.width = tTD.width;
                tTD.style.cursor = 'col-resize';
                //调整该列中的每个Cell
                table = tTD;
                while (table.tagName != 'TABLE') table = table.parentElement;
                for (j = 0; j < table.rows.length; j++) {
                    table.rows[j].cells[tTD.cellIndex].width = tTD.width;
                }
                //调整整个表
                //table.width = tTD.tableWidth + (tTD.offsetWidth – tTD.oldWidth);
                //table.style.width = table.width;
            }

        };
    }
}

