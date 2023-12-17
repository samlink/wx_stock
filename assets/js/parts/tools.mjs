export var SPLITER = '<`*_*`>';
export var regInt = /^[+]{0,1}(\d+)$/;
export var regReal = /^-?\d+(\.\d+)?$/;
// export var regReal = /^-?[1-9]\d*.\d*|0.\d*[1-9]\d*$/;
export var regDate = /(([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})-(((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))|((0[469]|11)-(0[1-9]|[12][0-9]|30))|(02-(0[1-9]|[1][0-9]|2[0-8]))))|((([0-9]{2})(0[48]|[2468][048]|[13579][26])|((0[48]|[2468][048]|[3579][26])00))-02-29)/;

//左侧补零
export function padZero(num, length) {
    return (Array(length).join('0') + num).slice(-length);
}

//获得控件的高度
export function getHeight() {
    // let header = document.querySelector('.header');
    // let footer = document.querySelector('footer');
    // let title = document.querySelector('.top-title');

    let content_height = document.body.clientHeight - 138;  //138 是 header，footer 和 top-title 的高度和
    var sum = 0;
    for (let i = 0; i < arguments.length; i++) {
        sum += arguments[i];
    }
    return content_height - sum;
}

//下载文件，url 是下载地址
export function download_file(url) {
    var downloadLink = document.createElement("a");
    downloadLink.href = url;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

//检查上传文件类型，input 是输入控件
export function checkFileType(input) {
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
export function append_blanks(len, m) {
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
export function append_cells(m) {
    let tds = "";
    for (let j = 0; j < m; j++) {
        tds += '<td></td>';
    }
    return tds;
}

// 聚焦到指定 tabindex 的 input。由 enterToTab() 等函数调用
// 返回聚焦的 input
export function goto_tabindex(row, idx) {
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
export function enterToTab(row, input, max_idx) {
    var tabindex = input.getAttribute('idx');
    goto_tabindex(row, ++tabindex);
    return tabindex;
}

/// 用于表格头部字段的键移动控制
/// all_input 所有包含的 input 输入元素
/// form 是 all_input 容器
/// max_n 是最大个数
export function set_key_move(all_input, form, max_n) {
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
export function getLeft(element, parent) {
    var left = element.offsetLeft;
    var current = element.offsetParent;

    while (current !== null) {
        left += current.offsetLeft;
        current = current.offsetParent;
    }

    return left - parent.scrollLeft;
}

//获取距屏幕上边值
export function getTop(element, parent) {
    var actualTop = element.offsetTop;
    var current = element.offsetParent;

    while (current !== null) {
        actualTop += current.offsetTop;
        current = current.offsetParent;
    }

    return actualTop - parent.scrollTop;
}

//金额转中文大写
export function moneyUppercase(n) {
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

//金额转大写第二种方法
export function moneyUppercase2(money) {
    //汉字的数字
    var cnNums = new Array('零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖');
    //基本单位
    var cnIntRadice = new Array('', '拾', '佰', '仟');
    //对应整数部分扩展单位
    var cnIntUnits = new Array('', '万', '亿', '兆');
    //对应小数部分单位
    var cnDecUnits = new Array('角', '分', '厘', '毫');
    //整数金额时后面跟的字符
    var cnInteger = '整';
    //整型完以后的单位
    var cnIntLast = '元';
    //最大处理的数字
    var maxNum = 999999999999999.9999;
    //金额整数部分
    var integerNum;
    //金额小数部分
    var decimalNum;
    //输出的中文金额字符串
    var chineseStr = '';
    //分离金额后用的数组，预定义
    var parts;
    if (money == '') {
        return '';
    }
    money = parseFloat(money);
    if (money >= maxNum) {
        //超出最大处理数字
        return '';
    }
    if (money == 0) {
        chineseStr = cnNums[0] + cnIntLast + cnInteger;
        return chineseStr;
    }
    //转换为字符串
    money = money.toString();
    if (money.indexOf('.') == -1) {
        integerNum = money;
        decimalNum = '';
    } else {
        parts = money.split('.');
        integerNum = parts[0];
        decimalNum = parts[1].substr(0, 4);
    }
    //获取整型部分转换
    if (parseInt(integerNum, 10) > 0) {
        var zeroCount = 0;
        var IntLen = integerNum.length;
        for (var i = 0; i < IntLen; i++) {
            var n = integerNum.substr(i, 1);
            var p = IntLen - i - 1;
            var q = p / 4;
            var m = p % 4;
            if (n == '0') {
                zeroCount++;
            } else {
                if (zeroCount > 0) {
                    chineseStr += cnNums[0];
                }
                //归零
                zeroCount = 0;
                chineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
            }
            if (m == 0 && zeroCount < 4) {
                chineseStr += cnIntUnits[q];
            }
        }
        chineseStr += cnIntLast;
    }
    //小数部分
    if (decimalNum != '') {
        var decLen = decimalNum.length;
        for (var i = 0; i < decLen; i++) {
            var n = decimalNum.substr(i, 1);
            if (n != '0') {
                chineseStr += cnNums[Number(n)] + cnDecUnits[i];
            }
        }
    }
    if (chineseStr == '') {
        chineseStr += cnNums[0] + cnIntLast + cnInteger;
    } else if (decimalNum == '') {
        chineseStr += cnInteger;
    }
    return chineseStr;
}

// 打开树的节点
export function open_node() {
    document.querySelector('#t_4 span').click();
    document.querySelector('#t_3 span').click();
    document.querySelector('#t_4_101').click();
}