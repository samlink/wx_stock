import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { fetch_tree, tree_init, tree_search } from '../parts/tree.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { auto_table, AutoInput } from '../parts/autocomplete.mjs';
import * as service from '../parts/service.mjs'
import { SPLITER } from '../parts/tools.mjs';

let table_fields;

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
            let html = service.build_inout_form(content);
            document.querySelector('.has-auto').insertAdjacentHTML('afterend', html);

            let date = document.querySelector('#采购日期');
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
                    has_auto.style.cssText = "position: relative; left: -5;";
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
let auto_comp = new AutoInput(document.querySelector('#supplier-input'), "", "/supplier_auto", () => {
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
                            <input type="text" class="form-control search-input" id="search-input" placeholder="供应商搜索">
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
            body: JSON.stringify("供应商"),
        })
            .then(response => response.json())
            .then(content => {
                table_fields = content;
                let table = document.querySelector('.table-customer');
                let data = service.build_table_header(table, table_fields);
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
                        cate: "供应商",
                    },
                    edit: false,

                    row_fn: table_row,
                    blank_row_fn: blank_row,
                };

                table_init(init_data);
                fetch_table(() => {
                    row_dbclick(table);
                });
            });

        let auto_comp = new AutoInput(document.querySelector('#search-input'), "", "/supplier_auto", () => {
            search_table();
        });
        auto_comp.init();

        document.querySelector('#serach-button').onclick = function () {
            search_table();
        };

        document.querySelector('.modal-title').textContent = "选择供应商";
        document.querySelector('.modal-dialog').style.cssText = `max-width: ${width}px; height: ${height}px;`
        document.querySelector('.modal-content').style.cssText = `height: 100%;`
    }

    document.querySelector('.modal').style.display = "block";
});

//表格输入部分 -----------------------------------------------------------------------

let show_names, all_width, ware_option;

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
        let line_height = 33; //行高，与 css 设置一致
        let count = Math.floor((document.querySelector('body').clientHeight - 370) / line_height);

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

        all_width = all_width * 18 + 54 + 140 + 80 + 80 + 100 + 80 + 100;

        let th_row = `<tr><th width=${54 * 100 / all_width}%>序号</th><th width=${140 * 100 / all_width}%>名称</th>`;
        let blank_row = `<tr><td width=${54 * 100 / all_width}%></td><td width=${140 * 100 / all_width}%></td>`;

        for (let th of content) {
            th_row += `<th width=${th.show_width * 18 * 100 / all_width}%>${th.show_name}</th>`;
            blank_row += `<td width=${th.show_width * 18 * 100 / all_width}%></td>`;
        }

        th_row += `<th width=${80 * 100 / all_width}%>单价</th><th width=${80 * 100 / all_width}%>数量</th>
                    <th width=${100 * 100 / all_width}%>仓库</th><th width=${80 * 100 / all_width}%>库位</th>
                    <th width=${100 * 100 / all_width}%>备注</th></tr>`;

        table_container.querySelector('thead').innerHTML = th_row;

        blank_row += `<td width=${80 * 100 / all_width}%></td><td width=${80 * 100 / all_width}%></td>
                    <td width=${100 * 100 / all_width}%></td><td width=${80 * 100 / all_width}%></td>
                    <td width=${100 * 100 / all_width}%></td></tr>`;

        let input_row = build_input_row(show_names, all_width);

        let tbody = table_container.querySelector('tbody');
        tbody.appendChild(input_row);

        let rows = "";
        for (let i = 0; i < count - 1; i++) {
            rows += blank_row;
        }

        tbody.querySelector('.has-input').insertAdjacentHTML('afterend', rows);

        tbody.style.height = count * line_height + "px";    //这里设置高度，为了实现Y轴滚动

        //构造第二张历史记录表----------
        let row2 = "<tr><td></td><td></td><td></td></tr>";
        let rows2 = "";
        for (let i = 0; i < count; i++) {
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
    e.preventDefault();
    e.stopPropagation();
    let edit = document.querySelector('.inputting');
    if (edit) {
        let table_body = document.querySelector('.table-items tbody');
        let input_row = build_input_row(show_names, all_width);

        remove_absolute();
        remove_inputting();

        table_body.insertBefore(input_row, edit);

        rebuild_index();

        input_row.querySelector('td:nth-child(2)').click();
    }
    else {
        notifier.show('请先选择行', 'danger');
    }
});

//共用事件和函数 ---------------------------------------------------------------------

//重建索引
function rebuild_index() {
    let all_input = document.querySelectorAll('.has-input');
    for (let i = 0; i < all_input.length; i++) {
        all_input[i].querySelector('td:nth-child(1)').textContent = i + 1;
        all_input[i].querySelector('td:nth-child(2) .autocomplete').style.zIndex = 900 - i;
        all_input[i].querySelector('td:nth-last-child(2) .autocomplete').style.zIndex = 500 - i;
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

    let row = `<td width=${54 * 100 / all_width}%>1</td><td width=${140 * 100 / all_width}%>
                <div class="form-input autocomplete" style="z-index: 900;">
                    <input class="form-control input-sm has-value auto-input" type="text" />
                    <button class="btn btn-info btn-sm product-search-button"> ... </button>
                </div>
              </td>`;

    for (let i = 1; i < show_names.length; i++) {
        row += `<td width=${show_names[i].width * 100 / all_width}%></td>`;
    }

    row += `
        <td width=${80 * 100 / all_width}%>
            <div class="form-input">
                <input class="form-control input-sm has-value" type="text" />
            </div>
        </td><td width=${80 * 100 / all_width}%}>
            <div class="form-input">
                <input class="form-control input-sm has-value" type="text" />
            </div>
        </td><td width=${100 * 100 / all_width}%></td>
        <td class="position" width=${80 * 100 / all_width}%>
            <div class="form-input autocomplete">
                <input class="form-control input-sm has-value ware-position" type="text" />
            </div>
        </td><td width=${100 * 100 / all_width}%>
            <div class="form-input">
                <input class="form-control input-sm has-value" type="text" />
            </div>
        </td>`;

    input_row.innerHTML = row;

    let auto_input = input_row.querySelector('.auto-input');
    let auto_td = input_row.querySelector('td:nth-child(2)');
    let auto_th = document.querySelector('.table-items th:nth-child(2)');
    auto_input.style.width = auto_th.clientWidth - 24;

    auto_td.addEventListener('click', function () {
        element_position(this, 7.4, 15.2);
        auto_input.focus();
    });

    input_row.addEventListener('click', function () {
        remove_inputting();
        this.classList.add("inputting");
    });

    //构造商品规格自动完成------------
    auto_table(auto_input, "", "/buyin_auto", show_names, () => {
        let field_values = auto_input.getAttribute("data").split(SPLITER);
        let n = 3;
        for (let i = 2; i < field_values.length; i++) {
            document.querySelector(`.inputting td:nth-child(${n})`).textContent = field_values[i];
            n++;
        }

        document.querySelector(`.inputting td:nth-child(${n}) input`).focus();

        add_line(show_names, all_width);
    });
    //----------------------------

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
            document.querySelector('.tree-container').style.height = height - 240;

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

    ware_house_select.addEventListener('change', function () {
        let id = document.createElement('p');
        id.textContent = this.value;
        auto_comp.cate = id;     //对象中的元素可以赋值，如果是变量则不可以
    });

    //加入自动完成
    let id = document.createElement('p');
    id.textContent = ware_house_select.value;
    let position_input = input_row.querySelector('.ware-position');

    let auto_comp = new AutoInput(position_input, id, "/position_auto", () => { });
    auto_comp.init();

    let position_th = document.querySelector('.table-items thead th:nth-last-child(2)');
    position_input.style.width = (position_th.clientWidth - 12) + "px";

    let position_td = input_row.querySelector('.position');
    position_td.addEventListener('click', function () {
        element_position(this, 6.5, 16.5);
        let tbody = document.querySelector('.table-items tbody');
        let y = getTop(this, tbody);
        let body_height = document.querySelector('body').clientHeight;
        auto_comp.space = body_height - y
        position_input.focus();
    });

    input_row.querySelector('td:nth-last-child(3)').appendChild(ware_house_select);
    input_row.querySelector('.position .autocomplete').style.cssText = `z-index: 500;`;
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
    auto_div.style.left = x + add_x;
    auto_div.style.top = y + add_y;

    remove_absolute();

    element.querySelector('.autocomplete').classList.add('auto-edit');
}

//增加新的输入行
function add_line(show_names, all_width) {
    let new_row = build_input_row(show_names, all_width);
    let next = document.querySelector(`.inputting + tr`);

    if (next && next.querySelector('td:nth-child(1)').textContent == "") {
        next.parentNode.replaceChild(new_row, next);
    }
    else if (!next) {
        document.querySelector('.table-items tbody').appendChild(new_row);
    }

    rebuild_index();
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

//自动完成点击后，展示供应商数据
function supplier_auto_show() {
    fetch("/fetch_supplier", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(document.querySelector('#supplier-input').getAttribute('data')),
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
function table_row(tr) {
    let rec = tr.split(SPLITER);
    let row = `<tr><td style="text-align: center;">${rec[1]}</td><td hidden>${rec[0]}</td>`;
    return service.build_row_from_string(rec, row, table_fields);
}

//显示空行数据
function blank_row() {
    let row = "<tr><td></td><td hidden></td>";
    return service.build_blank_from_fields(row, table_fields);
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