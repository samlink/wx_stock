import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { fetch_tree, tree_init, tree_search } from '../parts/tree.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { auto_table, AutoInput } from '../parts/autocomplete.mjs';
import * as service from '../parts/service.mjs'
import { SPLITER, regInt, regReal, regDate, moneyUppercase } from '../parts/tools.mjs';

let customer_table_fields, document_table_fields;
let num_position = document.querySelector('#num_position').textContent.split(",");
let customer_supplier = document.querySelector('#customer-suplier');

//单据顶部信息构造显示，并添加事件处理 -----------------------------------------------------------

fetch("/fetch_inout_fields", {
    method: 'post',
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify("采购单据"),
})
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            document_table_fields = content;
            let html = service.build_inout_form(content);
            document.querySelector('.has-auto').insertAdjacentHTML('afterend', html);

            let date = document.querySelector('#日期');
            date.value = new Date().Format("yyyy-MM-dd");

            //执行一个laydate实例
            laydate.render({
                elem: date,
                showBottom: false,
                theme: 'molv',
                // theme: '#62468d',
            });

            let fields_show = document.querySelector('.fields-show');
            let has_auto = document.querySelector('.has-auto');
            let next_auto = document.querySelector('.has-auto+div');

            //加入滚动事件处理
            fields_show.addEventListener('scroll', function () {
                if (fields_show.scrollTop != 0) {
                    has_auto.style.cssText = "position: relative; left: 5px;";
                    next_auto.style.cssText = "margin-left: -3px;"
                }
                else {
                    has_auto.style.cssText = "";
                    next_auto.style.cssText = "";
                }
            });
        }
    });

//供应商自动完成
let auto_comp = new AutoInput(document.querySelector('#supplier-input'),
    customer_supplier, "/customer_auto", () => {
        supplier_auto_show();
    });

auto_comp.init();

//供应商查找按钮
document.querySelector('#supplier-serach').addEventListener('click', function () {
    if (!document.querySelector('#customer-show')) {
        let width = document.querySelector('body').clientWidth * 0.8;
        let height = document.querySelector('body').clientHeight * 0.8;
        let customer_height = height - 270;

        let html = `<div id="customer-show">
                    <div class="table-top">
                        <div class="autocomplete customer-search">
                            <input type="text" class="form-control search-input" id="search-input" placeholder="${customer_supplier.textContent}搜索">
                            <button class="btn btn-info btn-sm" id="serach-button">搜索</button>
                        </div>
                    </div>

                    <div class="table-container table-customer">
                        <table>
                            <thead>
                                <tr></tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                        <div class="table-ctrl">
                            <div class="tools-button"></div>
                            <div class="table-button">
                                <button class="page-button btn" id="first" title="首页"><img src="/assets/img/backward.png"
                                        width="12px"></button>
                                <button class="page-button btn" id="pre" title="前一页"><img src="/assets/img/backward2.png"
                                        width="12px"></button>
                                <p class="seperator"></p>
                                <span>第</span><input type="text" class="form-control" id="page-input" value="1">
                                <span>页，共</span><span id="pages"></span><span>页</span>
                                <p class="seperator"></p>
                                <button class="page-button btn" id="aft" title="后一页"><img src="/assets/img/forward2.png"
                                        width="12px"></button>
                                <button class="page-button btn" id="last" title="尾页"><img src="/assets/img/forward.png"
                                        width="12px"></button>
                            </div>

                            <div class="table-info">
                                共 <span id="total-records"></span> 条记录
                            </div>

                        </div>
                    </div>
                </div>`;

        document.querySelector('.modal-body').innerHTML = html;

        fetch("/fetch_inout_fields", {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(customer_supplier.textContent),
        })
            .then(response => response.json())
            .then(content => {
                customer_table_fields = content;
                let table = document.querySelector('.table-customer');
                let data = service.build_table_header(table, customer_table_fields);
                table.querySelector('thead tr').innerHTML = data.th_row;
                table.querySelector('thead tr th:nth-child(2)').setAttribute('hidden', 'true');

                let init_data = {
                    container: '.table-customer',
                    url: "/fetch_inout_customer",
                    header_names: data.header_names,
                    post_data: {
                        id: "",
                        name: '',
                        sort: "名称 ASC",
                        rec: Math.floor(customer_height / 30),
                        cate: customer_supplier.textContent,
                    },
                    edit: false,

                    row_fn: customer_table_row,
                    blank_row_fn: customer_blank_row,
                };

                table_init(init_data);
                fetch_table(() => {
                    row_dbclick(table);
                });
            });

        let auto_comp = new AutoInput(document.querySelector('#search-input'),
            customer_supplier, "/customer_auto", () => {
                search_table();
            });

        auto_comp.init();

        document.querySelector('#serach-button').onclick = function () {
            search_table();
        };

        document.querySelector('.modal-title').textContent = `选择${customer_supplier.textContent}`;
        document.querySelector('.modal-dialog').style.cssText = `max-width: ${width}px; height: ${height}px;`
        document.querySelector('.modal-content').style.cssText = `height: 100%;`
    }

    document.querySelector('.modal').style.display = "block";
});

//表格输入部分 -----------------------------------------------------------------------

let show_names, all_width, ware_option, ware_value, product_table_fields, table_lines;

fetch("/fetch_inout_fields", {
    method: 'post',
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify("商品规格"),
})
    .then(response => response.json())
    .then(content => {
        //构造表主体结构-----------
        product_table_fields = content;
        let line_height = 33; //行高，与 css 设置一致
        table_lines = Math.floor((document.querySelector('body').clientHeight - 370) / line_height);

        all_width = 0;
        show_names = [{ name: "名称", width: 140 }];    //显示字段，用于商品规格自动输入

        for (let item of content) {
            all_width += item.show_width;
            show_names.push({ name: item.show_name, width: item.show_width * 18 });
        }

        let table_container = document.querySelector('.table-items');
        let table_width = document.querySelector('.content').clientWidth -
            document.querySelector('.table-history').clientWidth - 15;

        table_container.style.width = table_width;

        //构造表头和空行------------

        all_width = all_width * 18 + 40 + 140 + 60 + 60 + 80 + 100 + 100;

        let th_row = `<tr><th width=${40 * 100 / all_width}%>序号</th><th width=${140 * 100 / all_width}%>名称</th>`;
        let blank_row = `<tr><td width=${40 * 100 / all_width}%></td><td width=${140 * 100 / all_width}%></td>`;

        for (let th of content) {
            th_row += `<th width=${th.show_width * 18 * 100 / all_width}%>${th.show_name}</th>`;
            blank_row += `<td width=${th.show_width * 18 * 100 / all_width}%></td>`;
        }

        th_row += `<th width=${60 * 100 / all_width}%>单价</th><th width=${60 * 100 / all_width}%>数量</th>
                <th width=${80 * 100 / all_width}%>金额</th><th width=${100 * 100 / all_width}%>仓库</th>
                <th width=${100 * 100 / all_width}%>备注</th></tr>`;

        table_container.querySelector('thead').innerHTML = th_row;

        blank_row += `<td width=${60 * 100 / all_width}%></td><td width=${60 * 100 / all_width}%></td>
                    <td width=${80 * 100 / all_width}%></td><td width=${100 * 100 / all_width}%></td>
                    <td width=${100 * 100 / all_width}%></td></tr>`;

        let input_row = build_input_row(show_names, all_width);

        let tbody = table_container.querySelector('tbody');
        tbody.appendChild(input_row);

        let rows = "";
        for (let i = 0; i < table_lines - 1; i++) {
            rows += blank_row;
        }

        tbody.querySelector('.has-input').insertAdjacentHTML('afterend', rows);

        tbody.style.height = table_lines * line_height + "px";    //这里设置高度，为了实现Y轴滚动

        //构造第二张历史记录表----------
        let row2 = "<tr><td></td><td></td><td></td></tr>";
        let rows2 = "";
        for (let i = 0; i < table_lines; i++) {
            rows2 += row2;
        }

        document.querySelector('.table-history tbody').innerHTML = rows2;
        //---------------------------------

        //这部分是解决滚动时， 自动完成功能可正常使用-----
        table_container.querySelector('tbody').addEventListener('scroll', function () {
            remove_absolute();
        });
    });

//表格操控 ------------------------------------------------------------------------

//插入行
document.querySelector('#row-insert').addEventListener('click', function (e) {
    let edit = document.querySelector('.inputting');
    if (edit) {
        let table_body = document.querySelector('.table-items tbody');
        let input_row = build_input_row(show_names, all_width);

        remove_absolute();
        remove_inputting();

        table_body.insertBefore(input_row, edit);

        rebuild_index();
        sum_records();

        input_row.querySelector('td:nth-child(2)').click();
    }
    else {
        notifier.show('请先选择行', 'danger');
    }
});

//删除行
document.querySelector('#row-del').addEventListener('click', function (e) {
    let edit = document.querySelector('.inputting');
    if (edit) {
        alert_confirm('确认删除行吗？', {
            confirmCallBack: () => {
                edit.parentNode.removeChild(edit);
                if (document.querySelector('.has-input')) {
                    remove_absolute();
                    remove_inputting();
                    rebuild_index();
                }
                else {
                    let new_row = build_input_row(show_names, all_width);
                    let first_child = document.querySelector('.table-items tbody tr');
                    if (first_child) {
                        document.querySelector('.table-items tbody').insertBefore(new_row, first_child);
                    }
                    else {
                        document.querySelector('.table-items tbody').appendChild(new_row);
                    }
                }

                sum_records();
                sum_money();
            }
        });
    }
    else {
        notifier.show('请先选择行', 'danger');
    }
});

//上移行
document.querySelector('#row-up').addEventListener('click', function (e) {
    let edit = document.querySelector('.inputting');
    if (edit) {
        if (edit.previousElementSibling) {
            edit.parentNode.insertBefore(edit, edit.previousElementSibling);
            remove_absolute();
            rebuild_index();
        }
    }
    else {
        notifier.show('请先选择行', 'danger');
    }
});

//下移行
document.querySelector('#row-down').addEventListener('click', function (e) {
    let edit = document.querySelector('.inputting');
    if (edit) {
        if (edit.nextElementSibling &&
            edit.nextElementSibling.querySelector('td:nth-child(1)').textContent != "") {
            edit.parentNode.insertBefore(edit.nextElementSibling, edit);
            remove_absolute();
            rebuild_index();
        }
    }
    else {
        notifier.show('请先选择行', 'danger');
    }
});

//保存、打印和记账 -------------------------------------------------------------------

//保存
document.querySelector('#save-button').addEventListener('click', function () {
    //错误勘察
    if (!error_check()) {
        return false;
    };

    let customer_id = document.querySelector('#supplier-input').getAttribute('data');
    let all_values = document.querySelectorAll('.document-value');

    //构建数据字符串
    let save_str = `${document.querySelector('#buy-cate').value}${SPLITER}${document.querySelector('#dh').textContent}${SPLITER}${customer_id}${SPLITER}`;
    let n = 0;
    for (let f of document_table_fields) {
        if (f.data_type == "文本") {
            save_str += `${all_values[n].value}${SPLITER}`;
        }
        else if (f.data_type == "整数" || f.data_type == "实数") {
            let value = all_values[n].value ? all_values[n].value : 0;
            save_str += `${value}${SPLITER}`;
        }
        else {
            save_str += `${all_values[n].checked ? "是" : "否"}${SPLITER}`;
        }
        n++;
    }

    let table_data = [];
    let all_rows = document.querySelectorAll('.table-items .has-input');
    for (let row of all_rows) {
        if (row.querySelector('td:nth-child(2) input').value != "") {
            let row_data = `${row.querySelector('td:nth-child(2) input').getAttribute('data').split(SPLITER)[0]}${SPLITER}`;
            row_data += `${row.querySelector('.price').value}${SPLITER}${row.querySelector('.mount').value}${SPLITER}`;
            row_data += `${row.querySelector('select').value}${SPLITER}${row.querySelector('td:nth-last-child(1) input').value}${SPLITER}`;
            table_data.push(row_data);
        }
    }

    let data = {
        rights: '商品采购',
        document: save_str,
        items: table_data,
    }

    fetch('/save_document', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                document.querySelector('#dh').textContent = content;
                notifier.show('单据保存成功', 'success');
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
});

//打印
document.querySelector('#print-button').addEventListener('click', function () {
    //错误勘察
    if (!error_check()) {
        return false;
    };

    let id = document.querySelector('#print-choose').value;
    fetch('/fetch_provider_model', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: Number(id),
    })
        .then(response => response.json())
        .then(content => {
            var configElementTypeProvider = (function () {
                return function (options) {

                    var addElementTypes = function (context) {
                        context.allElementTypes = [];   //在这里清空一次，否则会累积元素，且只有第一次写入的元素有效
                        context.testModule = [];

                        context.addPrintElementTypes(
                            "testModule",
                            [
                                new hiprint.PrintElementTypeGroup("常规", JSON.parse(content[0])),
                                new hiprint.PrintElementTypeGroup("自定义", [
                                    { tid: 'configModule.customText', title: '自定义文本', customText: '自定义文本', custom: true, type: 'text' },
                                    { tid: 'configModule.image', title: '图片', data: '/assets/img/book.jpg', type: 'image' },
                                    {
                                        tid: 'configModule.tableCustom',
                                        title: '表格',
                                        type: 'tableCustom',
                                        field: 'table',
                                        options: {
                                            width: 500,
                                        }
                                    },
                                ]),

                                new hiprint.PrintElementTypeGroup("辅助", [
                                    {
                                        tid: 'configModule.hline',
                                        title: '横线',
                                        type: 'hline'
                                    },
                                    {
                                        tid: 'configModule.vline',
                                        title: '竖线',
                                        type: 'vline'
                                    },
                                    {
                                        tid: 'configModule.rect',
                                        title: '矩形',
                                        type: 'rect'
                                    },
                                    {
                                        tid: 'configModule.oval',
                                        title: '椭圆',
                                        type: 'oval'
                                    }
                                ])
                            ]
                        );
                    };

                    return {
                        addElementTypes: addElementTypes
                    };
                };
            })();

            hiprint.init({
                providers: [new configElementTypeProvider()]
            });

            let hiprintTemplate = new hiprint.PrintTemplate({
                template: JSON.parse(content[1]),
            });

            var printData = {
                供应商: document.querySelector('#supplier-input').value,
                日期时间: new Date().Format("yyyy-MM-dd hh:mm"),
                dh: document.querySelector('#dh').textContent,
                maker: document.querySelector('#user-name').textContent,
                barCode: document.querySelector('#dh').textContent,
            };
            let show_fields = document.querySelectorAll('.document-value');
            let n = 0;
            for (let field of document_table_fields) {
                if (field.data_type == "布尔") {
                    printData[field.show_name] = show_fields[n].checked ? "是" : "否";
                }
                else {
                    printData[field.show_name] = show_fields[n].value;
                }
                n++;
            }

            let table_data = [];
            let all_rows = document.querySelectorAll('.table-items .has-input');
            let count = 0;
            let sum = 0;
            for (let row of all_rows) {
                if (row.querySelector('td:nth-child(2) input').value != "") {
                    let row_data = {};
                    row_data["序号"] = row.querySelector('td:nth-child(1)').textContent;
                    row_data["名称"] = row.querySelector('td:nth-child(2) input').value;

                    let n = 3;
                    for (let f of product_table_fields) {
                        row_data[f.show_name] = row.querySelector(`td:nth-child(${n})`).textContent;
                        n++
                    }

                    row_data["单价"] = row.querySelector(`td:nth-child(${n}) input`).value;
                    row_data["数量"] = row.querySelector(`td:nth-child(${++n}) input`).value;
                    row_data["金额"] = row.querySelector(`td:nth-child(${++n})`).textContent;

                    let ware_select = row.querySelector(`td:nth-child(${++n}) select`);
                    row_data["仓库"] = ware_select.options[ware_select.selectedIndex].textContent;

                    row_data["备注"] = row.querySelector(`td:nth-child(${++n}) input`).value;

                    table_data.push(row_data);

                    count += Number(row_data["数量"]);
                    sum += Number(row_data["金额"]);
                }
            }

            let row_data = {};
            row_data["序号"] = '合计';
            row_data["数量"] = count;
            row_data["金额"] = sum.toFixed(Number(num_position[1]));

            table_data.push(row_data);

            printData['chinese'] = moneyUppercase(Number(row_data['金额']))
            printData["table"] = table_data;

            hiprintTemplate.print(printData);
        });

});

let inout_cate = document.querySelector('#inout-cate');
fetch_print_models(inout_cate.value);

inout_cate.addEventListener('change', function () {
    fetch_print_models(this.value);
});

//共用事件和函数 ---------------------------------------------------------------------

//获取打印模板
function fetch_print_models(value) {
    let print_id;
    if (value == "采购入库") {
        print_id = 3;
    }
    else if (value == "退货出库") {
        print_id = 4;
    }
    else if (value == "销售出库" || value == "商品直销") {
        print_id = 1;
    }
    else if (value == "退货入库" || value == "直销退货") {
        print_id = 2;
    }
    else {
        print_id = 5;
    }

    fetch('/fetch_models', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: print_id,
    })
        .then(response => response.json())
        .then(content => {
            let model_options = "";
            for (let data of content) {
                model_options += `<option value="${data.id}">打印 - ${data.name}</option>`;
            }

            document.querySelector('#print-choose').innerHTML = model_options;
        });
}

//保存、打印和记账前的错误检查
function error_check() {
    let customer_id = document.querySelector('#supplier-input').getAttribute('data');
    if (customer_id == null) {
        notifier.show('客户或供应商不在库中', 'danger');
        return false;
    }

    if (!regDate.test(document.querySelector('#日期').value)) {
        notifier.show('日期输入错误', 'danger');
        return false;
    }

    let all_values = document.querySelectorAll('.document-value');
    for (let i = 0; i < document_table_fields.length; i++) {
        if (document_table_fields[i].data_type == "整数") {
            if (all_values[i].value && !regInt.test(all_values[i].value)) {
                notifier.show(`${document_table_fields[i].show_name}输入错误`, 'danger');
                return false;
            }
        }
        else if (document_table_fields[i].data_type == "实数") {
            if (all_values[i].value && !regReal.test(all_values[i].value)) {
                notifier.show(`${document_table_fields[i].show_name}输入错误`, 'danger');
                return false;
            }
        }
    }

    let all_rows = document.querySelectorAll('.table-items .has-input');
    for (let row of all_rows) {
        if (row.querySelector('td:nth-child(2) input').value != "") {
            if (!regReal.test(row.querySelector('.price').value) || !regReal.test(row.querySelector('.mount').value)) {
                notifier.show(`单价或数量输入错误`, 'danger');
                return false;
            }
        }
    }

    return true;
}

//计算行金额
function calc_money(input_row) {
    let price = input_row.querySelector('.price').value;
    let mount = input_row.querySelector('.mount').value;
    let money = "";
    if (price && regReal.test(price) && mount && regReal.test(mount)) {
        money = (price * mount).toFixed(Number(num_position[1]));
    }

    input_row.querySelector('.money').textContent = money;
}

//计算合计金额
function sum_money() {
    let all_input = document.querySelectorAll('.has-input');
    let sum = 0;
    for (let i = 0; i < all_input.length; i++) {
        let price = all_input[i].querySelector('.price').value;
        let mount = all_input[i].querySelector('.mount').value;
        if (all_input[i].querySelector('td:nth-child(2) .auto-input').value != "" &&
            price && regReal.test(price) && mount && regReal.test(mount)) {
            sum += price * mount;
        }
    }

    document.querySelector('#sum-money').innerHTML = `金额合计：${sum.toFixed(Number(num_position[1]))} 元`;
    document.querySelector('#应结金额').value = sum.toFixed(Number(num_position[1]));
}

//计算记录数
function sum_records() {
    let all_input = document.querySelectorAll('.has-input');
    let num = 0;
    for (let i = 0; i < all_input.length; i++) {
        if (all_input[i].querySelector('td:nth-child(2) .auto-input').value != "") {
            num++;
        }
    }

    document.querySelector('#total-records').innerHTML = num;
}

//重建索引
function rebuild_index() {
    let all_input = document.querySelectorAll('.has-input');
    for (let i = 0; i < all_input.length; i++) {
        all_input[i].querySelector('td:nth-child(1)').textContent = i + 1;
        all_input[i].querySelector('td:nth-child(2) .autocomplete').style.zIndex = 900 - i;
    }
}

//去除绝对定位
function remove_absolute() {
    let all_auto = document.querySelectorAll('.table-items .autocomplete');
    for (let auto of all_auto) {
        auto.classList.remove('auto-edit');     //去掉绝对定位
        auto.style.left = "";
        auto.style.top = "";
    }
}

//移除行编辑标记
function remove_inputting() {
    let all_has_input = document.querySelectorAll('.has-input');
    for (let input of all_has_input) {
        input.classList.remove("inputting");
    }
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

//创建新的输入行
function build_input_row(show_names, all_width) {
    let input_row = document.createElement("tr");
    input_row.classList.add("has-input");

    let row = `<td width=${40 * 100 / all_width}%>1</td><td width=${140 * 100 / all_width}%>
                <div class="form-input autocomplete" style="z-index: 900;">
                    <input class="form-control input-sm has-value auto-input" type="text" />
                    <button class="btn btn-info btn-sm product-search-button"> ... </button>
                </div>
              </td>`;

    for (let i = 1; i < show_names.length; i++) {
        row += `<td width=${show_names[i].width * 100 / all_width}%></td>`;
    }

    row += `
        <td width=${60 * 100 / all_width}%>
            <div class="form-input">
                <input class="form-control input-sm has-value price" type="text" />
            </div>
        </td><td width=${60 * 100 / all_width}%}>
            <div class="form-input">
                <input class="form-control input-sm has-value mount" type="text" />
            </div>
        </td><td class="money" width=${80 * 100 / all_width}%></td><td width=${100 * 100 / all_width}%></td>
        <td width=${100 * 100 / all_width}%>
            <div class="form-input">
                <input class="form-control input-sm has-value" type="text" />
            </div>
        </td>`;

    input_row.innerHTML = row;

    let auto_input = input_row.querySelector('.auto-input');
    let auto_td = input_row.querySelector('td:nth-child(2)');
    let auto_th = document.querySelector('.table-items th:nth-child(2)');
    auto_input.style.width = (auto_th.clientWidth - 36) + "px";

    auto_td.addEventListener('click', function () {
        element_position(this, 7.4, 1);
        auto_input.focus();
    });

    input_row.addEventListener('click', function () {
        remove_inputting();
        this.classList.add("inputting");
    });

    //构造商品规格自动完成
    auto_table(auto_input, "", "/buyin_auto", show_names, () => {
        let field_values = auto_input.getAttribute("data").split(SPLITER);
        let n = 3;
        for (let i = 2; i < field_values.length; i++) {
            document.querySelector(`.inputting td:nth-child(${n})`).textContent = field_values[i];
            n++;
        }

        document.querySelector(`.inputting td:nth-child(${n}) input`).focus();

        if (ware_value) {
            input_row.querySelector('select').value = ware_value;
        }

        add_line(show_names, all_width);
    });

    //添加价格和数量变化事件
    input_row.querySelector('.price').addEventListener('blur', function () {
        calc_money(input_row);
        sum_money();

    });

    input_row.querySelector('.mount').addEventListener('blur', function () {
        calc_money(input_row);
        sum_money();
    });

    //商品规格查找按钮
    input_row.querySelector('.product-search-button').addEventListener('click', function () {
        if (!this.parentNode.parentNode.parentNode.classList.contains('inputting')) {
            return false;
        }

        if (!document.querySelector('.product-content')) {
            let width = document.querySelector('body').clientWidth * 0.8;
            let height = document.querySelector('body').clientHeight * 0.8;
            let tbody_height = height - 270;

            let html = `
                    <div class="product-content">
                        <div class="tree-show">
                            <div class="autocomplete table-top">
                                <input type="text" class="form-control search-input" id="auto_input" placeholder="商品搜索">
                                <button id="auto_search" class="btn btn-info btn-sm"><img src="/assets/img/zoom.png"
                                        width="20px"></button>
                            </div>
                            <div class="tree-title">商品分类　<a href="javascript:;" title="刷新"><i class="fa fa-refresh fa-lg"></i></a></div>
                            <div class="tree-container">
                                <ul id="tree">
                                </ul>
                            </div>
                        </div>
                        <div id="product-show">
                            <div class="table-top">
                                <div class="autocomplete product-search">
                                    <input type="text" class="form-control search-input" id="search-input" placeholder="规格搜索">
                                    <button class="btn btn-info btn-sm" id="serach-button">搜索</button>
                                    <span id="product-name"></span><span id="product-id"></span>
                                </div>
                                <div class="table-tools">
                                </div>
                            </div>
                
                            <div class="table-container table-product">
                                <table>
                                    <thead>
                                        <tr>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                                <div class="table-ctrl">
                                    <div class="tools-button"></div>
                                    <div class="table-button">
                                        <button class="page-button btn" id="first" title="首页"><img src="/assets/img/backward.png"
                                                width="12px"></button>
                                        <button class="page-button btn" id="pre" title="前一页"><img src="/assets/img/backward2.png"
                                                width="12px"></button>
                                        <p class="seperator"></p>
                                        <span>第</span><input type="text" class="form-control" id="page-input" value="1">
                                        <span>页，共</span><span id="pages"></span><span>页</span>
                                        <p class="seperator"></p>
                                        <button class="page-button btn" id="aft" title="后一页"><img src="/assets/img/forward2.png"
                                                width="12px"></button>
                                        <button class="page-button btn" id="last" title="尾页"><img src="/assets/img/forward.png"
                                                width="12px"></button>
                                    </div>
                
                                    <div class="table-info">
                                        共 <span id="total-records"></span> 条记录
                                    </div>
                
                                </div>
                            </div>
                        </div>
                        <div class="hide"><span id="context-menu"></span><span id="zhezhao"></span>
                            <span id="context-add"></span><span id="context-edit"></span><span id="context-del"></span>
                        </div>
                    </div>`;

            document.querySelector('.modal-body').innerHTML = html;
            document.querySelector('.tree-container').style.height = (height - 240) + "px";

            let tree_data = {
                node_num: "",
                leaf_click: (id, name) => {

                    document.querySelector('#product-name').textContent = name;
                    document.querySelector('#product-id').textContent = id;

                    let post_data = {
                        id: id,
                        name: '',
                        page: 1,
                    };

                    Object.assign(table_data.post_data, post_data);

                    let table = document.querySelector('.table-product');

                    fetch_table(() => {
                        row_dbclick(table);
                    });
                }
            }

            tree_init(tree_data);
            fetch_tree();

            let input = document.querySelector('#auto_input');

            let auto_comp = new AutoInput(input, "", "/tree_auto", () => {
                tree_search(input.value);
            });

            auto_comp.init();

            document.querySelector("#auto_search").addEventListener('click', () => {
                tree_search(input.value);
            });

            document.querySelector(".tree-title").addEventListener('click', () => {
                fetch_tree();
            });

            let row_num = Math.floor(tbody_height / 30);
            service.build_product_table(row_num, row_dbclick);

            document.querySelector('.modal-title').textContent = "选择商品";
            document.querySelector('.modal-dialog').style.cssText = `max-width: ${width}px; height: ${height}px;`
            document.querySelector('.modal-content').style.cssText = `height: 100%;`
        }

        document.querySelector('.modal').style.display = "block";
    });

    if (!ware_option) {
        build_ware_house(input_row);
    }
    else {
        build_ware_position(ware_option, input_row);
    }

    return input_row;
}

//构造仓库下拉选单，并记住 option 内容
function build_ware_house(input_row) {
    fetch("/fetch_house")
        .then(response => response.json())
        .then(content => {
            ware_option = "";
            for (let house of content) {
                ware_option += `<option value="${house.id}">${house.name}</option>`;
            }

            build_ware_position(ware_option, input_row);
        });
}

//构建仓库和库位
function build_ware_position(ware_option, input_row) {
    let ware_house_select = document.createElement('select');
    ware_house_select.classList.add("select-sm");
    ware_house_select.classList.add("has-value");
    ware_house_select.innerHTML = ware_option;

    if (ware_value) {
        ware_house_select.value = ware_value;
    }

    ware_house_select.addEventListener('change', function () {
        ware_value = this.value;
    });

    // ware_house_select.addEventListener('change', function () {
    //     let id = document.createElement('p');
    //     id.textContent = this.value;
    //     auto_comp.cate = id;     //对象中的元素可以赋值，如果是变量则不可以
    // });

    //加入自动完成
    // let id = document.createElement('p');
    // id.textContent = ware_house_select.value;
    // let position_input = input_row.querySelector('.ware-position');

    // let auto_comp = new AutoInput(position_input, id, "/position_auto", () => { });
    // auto_comp.init();

    // let position_th = document.querySelector('.table-items thead th:nth-last-child(2)');
    // position_input.style.width = (position_th.clientWidth - 24) + "px";

    // let position_td = input_row.querySelector('.position');
    // position_td.addEventListener('click', function () {
    //     this.querySelector('.autocomplete').classList.add('auto-edit');
    //     // element_position(this, 6.5, 100.5);
    //     let tbody = document.querySelector('.table-items tbody');
    //     let y = getTop(this, tbody);
    //     let body_height = document.querySelector('body').clientHeight;
    //     auto_comp.space = body_height - y
    //     position_input.focus();
    // });

    input_row.querySelector('td:nth-last-child(2)').appendChild(ware_house_select);
    // input_row.querySelector('.position .autocomplete').style.cssText = `z-index: 500;`;
}

//设置元素的位置
function element_position(element, add_x, add_y) {
    if (element.querySelector('.autocomplete').classList.contains("auto-edit")) {
        return false;
    }
    let tbody = document.querySelector('.table-items tbody');
    let x = getLeft(element, tbody);
    let y = getTop(element, tbody);

    let auto_div = element.querySelector('.autocomplete');
    auto_div.style.left = (x + add_x) + "px";
    auto_div.style.top = (y + add_y) + "px";

    // remove_absolute();

    element.querySelector('.autocomplete').classList.add('auto-edit');
}

//增加新的输入行
function add_line(show_names, all_width) {
    let field_values = document.querySelector('.inputting input').getAttribute("data").split(SPLITER);
    let customer_id = document.querySelector('#supplier-input').getAttribute('data');

    let data = {
        customer_id: customer_id ? Number(customer_id) : 0,
        product_id: Number(field_values[0])
    }

    //获取历史交易记录
    fetch('/fetch_history', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                let num = document.querySelector('.inputting td:nth-child(1)').textContent;
                let name = document.querySelector('.inputting td:nth-child(2) input').value;
                document.querySelector('#history-info').textContent = `${num} - ${name}`;

                let tr = "";
                for (let row of content) {
                    tr += `<tr><td>${row.date}</td><td>${row.price}</td><td>${row.count}</td></tr>`;
                }

                let row2 = "<tr><td></td><td></td><td></td></tr>";
                let len = table_lines - content.length;

                for (let i = 0; i < len; i++) {
                    tr += row2;
                }

                document.querySelector('.table-history tbody').innerHTML = tr;

            }
            else {
                notifier.show('权限不够', 'danger');
            }


        });

    let new_row = build_input_row(show_names, all_width);
    let next = document.querySelector(`.inputting + tr`);

    if (next && next.querySelector('td:nth-child(1)').textContent == "") {
        next.parentNode.replaceChild(new_row, next);
    }
    else if (!next) {
        document.querySelector('.table-items tbody').appendChild(new_row);
    }

    rebuild_index();
    sum_records();
}

//关闭按键
document.querySelector('#modal-close-button').addEventListener('click', function () {
    close_modal();
});

//关闭按键
document.querySelector('.top-close').addEventListener('click', function () {
    close_modal();
});

//点击提交按钮
document.querySelector('#modal-sumit-button').addEventListener('click', function () {
    let selected_row = document.querySelector('table .focus');
    if (selected_row) {
        chose_exit(selected_row);
    }
    else {
        notifier.show('请先选择再提交', 'danger');
    }
});

//自动完成点击后，展示供应商（客户）数据
function supplier_auto_show() {
    let data = {
        rights: customer_supplier.textContent == "客户" ? "商品销售" : "商品采购",
        cate: customer_supplier.textContent,
        id: Number(document.querySelector('#supplier-input').getAttribute('data')),
    };

    fetch("/fetch_supplier", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            let supplier = content[1].split(SPLITER);
            let join_sup = "";
            for (let i = 0; i < content[0].length; i++) {
                join_sup += `${content[0][i].show_name}：${supplier[i]}； `;
            }

            document.querySelector('#supplier-info').textContent = join_sup;
        });
}

//显示行数据
function customer_table_row(tr) {
    let rec = tr.split(SPLITER);
    let row = `<tr><td style="text-align: center;">${rec[1]}</td><td hidden>${rec[0]}</td>`;
    return service.build_row_from_string(rec, row, customer_table_fields);
}

//显示空行数据
function customer_blank_row() {
    let row = "<tr><td></td><td hidden></td>";
    return service.build_blank_from_fields(row, customer_table_fields);
}

//给行加上双击事件
function row_dbclick(table) {
    let rows = table.querySelectorAll('body tr');
    for (let row of rows) {
        row.addEventListener('dblclick', function () {
            chose_exit(this);
        });
    }
}

//按搜索按钮后的辅助函数
function search_table() {
    let table = document.querySelector('.table-customer');
    let search = document.querySelector('#search-input').value;
    Object.assign(table_data.post_data, { name: search, page: 1 });
    fetch_table(() => {
        row_dbclick(table);
    });
}

//关闭函数
function close_modal() {
    document.querySelector('.modal').style.display = "none";
    document.querySelector('.modal-content').style.cssText = "";
    document.querySelector('#modal-info').innerHTML = "";
}

//选择行数据并退出
function chose_exit(selected_row) {
    let id = selected_row.children[1].textContent;
    if (id) {
        if (document.querySelector('.modal-title').textContent != "选择商品") {
            let name = selected_row.children[2].textContent;
            let supplier = document.querySelector('#supplier-input');
            supplier.value = name;
            supplier.setAttribute('data', id);
            supplier_auto_show();
            close_modal();
        }
        else {
            fetch("/fetch_one_product", {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(Number(id)),
            })
                .then(response => response.json())
                .then(content => {
                    let name = document.querySelector('#product-name').textContent;
                    let data = ` ${id}${SPLITER}${name}${SPLITER}${content}`;
                    let input = document.querySelector('.inputting .auto-input');
                    input.value = name;
                    input.setAttribute("data", data);

                    let field_values = content.split(SPLITER);

                    let n = 3;
                    for (let i = 0; i < field_values.length; i++) {
                        document.querySelector(`.inputting td:nth-child(${n})`).textContent = field_values[i];
                        n++;
                    }

                    document.querySelector(`.inputting td:nth-child(${n}) input`).focus();
                    close_modal();
                    add_line(show_names, all_width);
                });
        }
    }
    else {
        notifier.show('请先选择记录', 'danger');
    }
}