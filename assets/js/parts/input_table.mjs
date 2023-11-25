import { table_data, fetch_table } from '../parts/table.mjs';
import { fetch_tree, tree_init, tree_search } from '../parts/tree.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { auto_table, AutoInput } from '../parts/autocomplete.mjs';
import * as service from '../parts/service.mjs'
import { SPLITER, regReal, open_node } from '../parts/tools.mjs';
import { close_modal } from '../parts/modal.mjs';

let all_width;

var input_data = {
    container: document.querySelector('.table-items'),
    width: document.querySelector('.content').clientWidth - document.querySelector('.table-history').clientWidth - 15,
    show_names: "",
    dh: "新单据",
    document: "采购单据",
}

export var input_table_outdata = {};

export function input_table_init(data) {
    Object.assign(input_data, data);
    build_blank_table();

    //插入行
    document.querySelector('#row-insert').addEventListener('click', function (e) {
        let edit = document.querySelector('.inputting');
        if (edit) {
            let table_body = document.querySelector('.table-items tbody');            
            let input_row = build_input_row(input_data.show_names, all_width);

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
                        let new_row = build_input_row(input_data.show_names, all_width);
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
}

//构造表主体结构-----------
function build_blank_table() {
    let line_height = 33; //行高，与 css 设置一致
    input_data.container.style.width = input_data.width;

    // 构建表头和一个空表行
    all_width = 0;
    input_data.show_names.forEach(obj => {
        all_width += obj.width;
    });

    let th = "<tr>";
    let blank = "<tr>";
    input_data.show_names.forEach(obj => {
        th += `<th width=${obj.width * 100 / all_width}%>${obj.name}</th>`;
        blank += `<td width=${obj.width * 100 / all_width}%></td>`;
    });

    th += "</tr>";
    blank += "</tr>";

    input_data.container.querySelector('thead').innerHTML = th;


    let tbody = input_data.container.querySelector('tbody');

    if (input_data.dh == "新单据") {
        let input_row = build_input_row(input_data.show_names, all_width);
        tbody.appendChild(input_row);

        let rows = "";
        for (let i = 0; i < input_data.lines - 1; i++) {
            rows += blank;
        }

        tbody.querySelector('.has-input').insertAdjacentHTML('afterend', rows);
    }
    else {
        
    }

    tbody.style.height = input_data.lines * line_height + "px";    //这里设置高度，为了实现Y轴滚动

    //这部分是解决滚动时， 自动完成功能可正常使用-----
    input_data.container.querySelector('tbody').addEventListener('scroll', function () {
        remove_absolute();
    });
}

//创建新的输入行，参数 num 是序号
function build_input_row(show_names, all_width, num) {
    if (!num) num = 1;
    let input_row = document.createElement("tr");
    input_row.classList.add("has-input");
    let control = "";
    for (let obj of show_names) {
        if (obj.type == "普通输入" && obj.editable) {
            control += `<td width=${obj.width * 100 / all_width}% class="editable">
            <input class="form-control input-sm has-value ${obj.class}" type="text"></td>`;
        }
        else if (obj.type == "普通输入" && !obj.editable) {
            control += `<td width=${obj.width * 100 / all_width}% class='${obj.class}'></td >`;
        } else if (obj.type == "二值选一" && obj.editable) {
            let checked = obj.default.split('_')[0] == obj.default ? 'checked' : '';
            control += `<td width=${obj.width * 100 / all_width}% class="editable"><label class="check-radio">
                                <input class="has-value" type="checkbox" ${checked}>
                                <span class="checkmark"></span>
                            </label>
                        </td>`;
        } else if (obj.type == "二值选一" && !obj.editable) {
            control += `<td width=${obj.width * 100 / all_width}%></td >`;
        }
        else if (obj.type == "下拉列表" && obj.editable) {
            control += `<td width=${obj.width * 100 / all_width}% class="editable"><select class='select-sm has-value'>`;
            let options = obj.default.split('_');
            for (let value of options) {
                control += `<option value="${value}">${value}</option>`;
            }
            control += "</select></td>";
        } else if (obj.type == "下拉列表" && !obj.editable) {
            control += `<td width=${obj.width * 100 / all_width}%></td >`;
        } else if (obj.type == "autocomplete" && obj.editable) {
            control += `
            <td width=${obj.width * 100 / all_width}% class="editable" >
                <div class="form-input autocomplete" style="z-index: 900;">
                    <input class="form-control input-sm has-value auto-input" type="text" />
                    <button class="btn btn-info btn-sm product-search-button"> ... </button>
                </div>
            </td>`;
        }
    }

    input_row.innerHTML = control;

    let auto_input = input_row.querySelector('.auto-input');
    let auto_td = input_row.querySelector('td:nth-child(2)');
    let auto_th = document.querySelector('.table-items th:nth-child(2)');
    auto_input.style.width = (auto_th.clientWidth - 36) + "px";

    auto_td.addEventListener('click', function () {
        element_position(this, 7.4, 1);
        auto_input.focus();
    });

    input_row.querySelector(`td:nth-child(1)`).textContent = num;

    auto_table(auto_input, "", `/buyin_auto`, input_data.auto_th, () => {
        fill_gg(auto_input, input_data.show_names, 3); // 3 为填充规格的单元数
    });

    input_row.addEventListener('click', function () {
        remove_inputting();
        this.classList.add("inputting");
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
                            <div class="tree-title">商品分类</div>
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
            fetch_tree(open_node);

            let input = document.querySelector('#auto_input');

            let auto_com = new AutoInput(input, "", `/tree_auto`, () => {
                tree_search(input.value);
            });

            auto_com.init();

            document.querySelector("#auto_search").addEventListener('click', () => {
                tree_search(input.value);
            });

            let row_num = Math.floor(tbody_height / 30);
            service.build_product_table(row_num, row_dbclick);

            document.querySelector('.modal-title').textContent = "选择商品";
            document.querySelector('.modal-dialog').style.cssText = `max-width: ${width}px; height: ${height}px;`
            document.querySelector('.modal-content').style.cssText = `height: 100%;`
        }

        document.querySelector('.modal').style.display = "block";
    });

    return input_row;
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

//填充规格字段
function fill_gg(auto_input, show_names, num) {
    let field_values = auto_input.getAttribute("data").split(SPLITER);
    let n = 3;  //从第 3 列开始填入数据
    for (let i = 2; i < 2 + num; i++) {     //不计末尾的库存和售价两个字段
        let val = field_values[i];
        // console.log(shown);
        if (show_names[i].type == "普通输入" && show_names[i].editable) {
            document.querySelector(`.inputting td:nth-child(${n}) input`).value = val;
        }
        else if (show_names[i].type == "普通输入" && !show_names[i].editable) {
            document.querySelector(`.inputting td:nth-child(${n})`).textContent = val;
        }
        else if (show_names[i].type == "下拉列表" && show_names[i].editable) {
            document.querySelector(`.inputting td:nth-child(${n}) select`).value = val;
        } else if (show_names[i].type == "下拉列表" && !show_names[i].editable) {
            document.querySelector(`.inputting td:nth-child(${n})`).textContent = val;
        }
        // if (product_table_fields[i - 2].ctr_type == "二值选一") {
        //     val = val == "true" ? product_table_fields[i - 2].option_value.split('_')[0] : product_table_fields[i - 2].option_value.split('_')[1];
        // }

        n++;
    }

    let price_input = document.querySelector(`.inputting .price`);
    // let price = field_values[field_values.length - 1];

    price_input.focus();

    add_line(input_data.show_names, all_width);
    input_table_outdata.edited = true;
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

    element.querySelector('.autocomplete').classList.add('auto-edit');
}

//追加新的输入空行
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
    sum_records();
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

//给行加上双击事件
function row_dbclick(table) {
    let rows = table.querySelectorAll('body tr');
    for (let row of rows) {
        row.addEventListener('dblclick', function () {
            chose_exit(this);
        });
    }
}

//选择行数据并退出
function chose_exit(selected_row) {
    let id = selected_row.children[1].textContent;
    if (id) {
        fetch(`/fetch_one_product`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(Number(id)),
        })
            .then(response => response.json())
            .then(content => {
                let input = document.querySelector('.inputting .auto-input');
                input.value = content.split(SPLITER)[1];
                input.setAttribute("data", content);
                fill_gg(input, input_data.show_names, 3);  // 3 是填入规格数据的数量
                close_modal();
            });
    }
    else {
        notifier.show('请先选择记录', 'danger');
    }
}