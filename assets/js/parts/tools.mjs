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
}

/**
 * 单据上部信息编辑回车向右移动
 * @param {any} dic 字典对象: { 姓名: "_电话", 电话: "_邮箱", 邮箱:"... }
 */
function topOnkeyDown(dic) {
    document.onkeydown = function (event) {                     //回车键
        if ((event.target.type === 'text' || event.target.type === 'select-one') && event.code === "Enter") {
            var getId = $(event.target).attr('id');
            var getIt = '#' + dic[getId];
            $(getIt).focus();
            $(getIt).select();
        }
    };
}

//KeyboardEvent: key='Enter' | code='Enter'
//KeyboardEvent: key='Escape' | code='Escape'
//KeyboardEvent: key='ArrowUp' | code='ArrowUp'
//KeyboardEvent: key='ArrowDown' | code='ArrowDown'
//KeyboardEvent: key='ArrowLeft' | code='ArrowLeft'
//KeyboardEvent: key='ArrowRight' | code='ArrowRight'
//KeyboardEvent: key='Meta' | code='MetaLeft'
//KeyboardEvent: key='c' | code='KeyC'
//

/**
 * jqgrid 编辑按回车键焦点向右移动
 * @param {any} dic 字典对象: { 姓名: "_电话", 电话: "_邮箱", 邮箱:"... }
 * @param {any} table jqgrid 表名: "jqgrid-table"
 */
function EnterMoveRight(dic, table) {
    document.onkeydown = function (event) {
        if ($(event.srcElement).parents('table').attr('id') === table && event.srcElement.type !== 'submit' && event.srcElement.type !== 'image' &&
            event.srcElement.type !== 'textarea' && event.srcElement.parentNode.nodeName === "TD" && event.keyCode === 13) {
            var getName = $(event.srcElement).attr('id');
            var next = getName.split('_');
            var getIt = '#' + next[0] + dic[next[1]];
            $(getIt).focus();
            $(getIt).select();
        }
    };
}

/**
 * jqgrid 表格编辑时，回车键向右移动, 上下箭头键移动行，及自动跳入下行
 * @param {any} dic 表列的字典
 * @param {number} count 表格的总行数
 * @param {any} table 表格的名称："jqgrid-table" 等
 * @param {any} myfunc  行保存函数
 * 另，表格中用到了全局变量：currentId，选择的行ID
 */
function jqgridOnkeyDown(dic, count, table, myfunc) {

    document.onkeydown = function (event) {                     //回车键
        if ($(event.srcElement).parents('table').attr('id') === "jqgrid-table" && event.srcElement.type !== 'submit' && event.srcElement.type !== 'image' &&
            event.srcElement.type !== 'textarea' && event.srcElement.parentNode.nodeName === "TD" && event.keyCode === 13) {
            var getName = $(event.srcElement).attr('id');
            var next = getName.split('_');

            var numId;

            if (dic[next[1]] !== "END") {
                var getIt = '#' + next[0] + dic[next[1]];
                $(getIt).focus();
                $(getIt).select();
            } else {
                numId = Number(currentId);
                if (numId < count) {
                    jQuery(table).jqGrid("setSelection", ++numId, true);
                } else {
                    myfunc(numId, "rs");
                }
            }
        } else if (event.keyCode === 38) {            //向上箭头
            numId = Number(currentId);
            if (numId > 1) {
                myfunc(numId);
                jQuery(table).jqGrid("setSelection", --numId, true);
            }
        } else if (event.keyCode === 40) {            //向下箭头
            numId = Number(currentId);
            if (numId < count && numId !== -1) {
                myfunc(numId);
                jQuery(table).jqGrid("setSelection", ++numId, true);
            }
        }
    };
}

/**
 * jqgrid 表格编辑时，对鼠标按键事件的判断
 * @param {any} dic 单据上部编辑框的字典对象
 * @param {any} myfunc  行保存函数
 * 另，表格中用到了全局变量：currentId，选择的行ID
 */
function jqgridOnclick(dic, myfunc) {
    document.onclick = function (event) {                                   //鼠标点击非表格部分, 则保存当前编辑的行数据
        event = event ? event : window.event;
        var obj = event.srcElement ? event.srcElement : event.target;
        if (!(obj.parentNode.nodeName === 'LI' || obj.parentNode.nodeName === 'TD' ||
            obj.parentNode.nodeName === 'TR' || obj.parentNode.nodeName === 'SPAN' ||
            obj.parentNode.nodeName === 'LABEL')) {
            myfunc(currentId, "rs");
            topOnkeyDown(dic);
        }
    };
}
