var SPLITER = '<`*_*`>';
var regInt = /^[+]{0,1}(\d+)$/;
var regReal = /^-?\d+(\.\d+)?$/;
var regDate = /(([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})-(((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))|((0[469]|11)-(0[1-9]|[12][0-9]|30))|(02-(0[1-9]|[1][0-9]|2[0-8]))))|((([0-9]{2})(0[48]|[2468][048]|[13579][26])|((0[48]|[2468][048]|[3579][26])00))-02-29)/;

//左侧补零
function padZero(num, length) {
    return (Array(length).join('0') + num).slice(-length);
}

//获得控件的高度
function getHeight() {
    let content_height = document.body.clientHeight - 138;  //138 是 header，footer 和 top-title 的高度和
    var sum = 0;
    for (let i = 0; i < arguments.length; i++) {
        sum += arguments[i];
    }
    return content_height - sum;
}

//下载文件，url 是下载地址
function download_file(url) {
    var downloadLink = document.createElement("a");
    downloadLink.href = url;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

//检查上传文件类型，input 是输入控件
function checkFileType(input) {
    var acceptType = input.getAttribute('accept');
    var selectedFile = input.value;
    var fileType = selectedFile.substring(selectedFile.indexOf('.') + 1, selectedFile.length);
    var location = acceptType.indexOf(fileType);
    if (location > -1) {
        return true;
    } else {
        return false;
    }
}

// 补空行
function append_blanks(len, m) {
    let trs = "";
    for (let i = 0; i < len; i++) {
        trs += '<tr>';
        for (let j = 0; j < m; j++) {
            trs += '<td>　</td>';   //此处是全角空格，使空行高度与内容行一致
        }
        trs += '</tr>';
    }
    return trs;
}

//追加空单元格，用在打印中
function append_cells(m) {
    let tds = "";
    for (let j = 0; j < m; j++) {
        tds += '<td></td>';
    }
    return tds;
}

// 聚焦到指定 tabindex 的 input。由 enterToTab() 等函数调用
// 返回聚焦的 input
function goto_tabindex(row, idx) {
    var inputs = row.getElementsByTagName('input');
    for (var i = 0, j = inputs.length; i < j; i++) {
        if (inputs[i].getAttribute('idx') == idx) {
            inputs[i].focus();
            break;
        }
    }
    return inputs[i];
}

/// 回车变成tab键功能
/// row 是容器 Dom，里面有很多 input
/// input 是本身
function enterToTab(row, input, max_idx) {
    var tabindex = input.getAttribute('idx');
    goto_tabindex(row, ++tabindex);
    return tabindex;
}

/// 用于表格头部字段的键移动控制
/// all_input 所有包含的 input 输入元素
/// form 是 all_input 容器
/// max_n 是最大个数
function set_key_move(all_input, form, max_n) {
    all_input.forEach((input) => {
        input.onkeydown = function (e) {
            var e = event ? event : window.event;
            if (e.code == 'Enter' || e.code == 'NumpadEnter') {
                let idx = enterToTab(form, input, all_input.length);
                // idx 是返回值，最后一个是 max_n + 1
                if (idx == max_n + 1) {
                    goto_tabindex(form, 1);
                }
            }
            // 与自动完成有冲突
            // else if (e.code == 'ArrowUp') {
            //     let tabindex = input.getAttribute('idx')
            //     if (tabindex != '1') {
            //         goto_tabindex(form, --tabindex);
            //     } else {
            //         goto_tabindex(form, max_n);
            //     }
            // } else if (e.code == 'ArrowDown') {
            //     let tabindex = input.getAttribute('idx');
            //     if (tabindex != max_n) {
            //         goto_tabindex(form, ++tabindex);
            //     } else {
            //         goto_tabindex(form, 1);
            //     }
            // }
        }
    })
}

//获取距屏幕左边值
function getLeft(element, parent) {
    var left = element.offsetLeft;
    var current = element.offsetParent;

    while (current !== null) {
        left += current.offsetLeft;
        current = current.offsetParent;
    }

    return left - parent.scrollLeft;
}

//获取距屏幕上边值
function getTop(element, parent) {
    var actualTop = element.offsetTop;
    var current = element.offsetParent;

    while (current !== null) {
        actualTop += current.offsetTop;
        current = current.offsetParent;
    }

    return actualTop - parent.scrollTop;
}

//金额转中文大写
function moneyUppercase(n) {
    var fraction = ['角', '分', '厘', '毫'];
    var digit = [
        '零', '壹', '贰', '叁', '肆',
        '伍', '陆', '柒', '捌', '玖'
    ];
    var unit = [
        ['元', '万', '亿'],
        ['', '拾', '佰', '仟']
    ];
    var head = n < 0 ? '欠' : '';
    n = Math.abs(n);
    var s = '';
    for (var i = 0; i < fraction.length; i++) {
        s += (digit[Math.floor(n * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
    }
    s = s || '整';
    n = Math.floor(n);
    for (var i = 0; i < unit[0].length && n > 0; i++) {
        var p = '';
        for (var j = 0; j < unit[1].length && n > 0; j++) {
            p = digit[n % 10] + unit[1][j] + p;
            n = Math.floor(n / 10);
        }
        s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
    }
    return head + s.replace(/(零.)*零元/, '元')
        .replace(/(零.)+/g, '零')
        .replace(/^整$/, '零元整');
};

// // 打开树的节点
// function open_node() {
//     document.querySelector('#t_4 span').click();
//     document.querySelector('#t_3 span').click();
// }