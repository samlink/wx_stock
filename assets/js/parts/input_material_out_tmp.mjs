import {table_data, fetch_table} from './table.mjs';
import {fetch_tree, tree_init, tree_search} from './tree.mjs';
import {notifier} from './notifier.mjs';
import {alert_confirm} from './alert.mjs';
import {auto_table, AutoInput} from './autocomplete.mjs';
import * as service from './service.mjs'
import {SPLITER, regReal, open_node, regInt, padZero} from './tools.mjs';
import {close_modal} from './modal.mjs';

let all_width;

var input_data = {
    container: document.querySelector('.table-items'),
    width: document.querySelector('.content').clientWidth - document.querySelector('.table-history').clientWidth - 15,
    show_names: "",
    document: "入库单据",
}

export var input_table_outdata = {};

function add_event_handle() {
    //插入行
    document.querySelector('#row-insert').addEventListener('click', function (e) {
        let edit = document.querySelector('.inputting');
        if (edit) {
            let table_body = document.querySelector('.table-items tbody');
            let input_row = build_input_row(input_data.show_names, all_width);
            remove_inputting();
            table_body.insertBefore(input_row, edit);
            rebuild_index();
            sum_records();
            keep_up();
            input_row.querySelector('td:nth-child(2)').click();
        } else {
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
                    sum_records();
                    sum_weight();
                    rebuild_index();
                    keep_up();
                }
            });
        } else {
            notifier.show('请先选择行', 'danger');
        }
    });

    //上移行
    document.querySelector('#row-up').addEventListener('click', function (e) {
        let edit = document.querySelector('.inputting');
        if (edit) {
            if (edit.previousElementSibling) {
                edit.parentNode.insertBefore(edit, edit.previousElementSibling);
                rebuild_index();
            }
        } else {
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
                rebuild_index();
            }
        } else {
            notifier.show('请先选择行', 'danger');
        }
    });
}

//构造表主体结构-----------
export function build_blank_table(data) {
    Object.assign(input_data, data);
    let line_height = 33; //行高，与 css 设置一致
    build_blank_th();

    let tbody = input_data.container.querySelector('tbody');
    let rows = "";
    for (let i = 0; i < input_data.lines; i++) {
        rows += input_data.blank_row;
    }

    tbody.innerHTML = rows;
    tbody.style.height = input_data.lines * line_height + "px";    //这里设置高度，为了实现Y轴滚动
}

export function build_out_table(data) {
    Object.assign(input_data, data);
    let line_height = 33; //行高，与 css 设置一致
    let tbody = input_data.container.querySelector('tbody');
    let trs = tbody.querySelectorAll('tr');
    for (let tr of trs) {
        if (!tr.classList.contains('has-input')) {
            tr.parentNode.removeChild(tr);
        }
    }

    let has_input = tbody.querySelectorAll('.has-input');
    let num = has_input.length + 1;
    let input_row = build_input_row(input_data.show_names, all_width, num);
    tbody.appendChild(input_row);
    num += 1;

    tbody.style.height = input_data.lines * line_height + "px";    //这里设置高度，为了实现Y轴滚动

    append_blanks(tbody, num);
    add_event_handle();
}

//建立表头及一个空行
function build_blank_th() {
    input_data.container.style.width = input_data.width;
    all_width = 0;
    input_data.show_names.forEach(obj => {
        all_width += obj.width;
    });

    let th = "<tr>";
    let blank = "<tr>";
    input_data.show_names.forEach(obj => {
        let hidden = obj.css ? obj.css : "";
        th += `<th width=${obj.width * 100 / all_width} ${hidden}>${obj.name}</th>`;
        blank += `<td width=${obj.width * 100 / all_width} ${hidden}></td>`;
    });

    th += "</tr>";
    blank += "</tr>";

    input_data.container.querySelector('thead').innerHTML = th;
    input_data.blank_row = blank;
}

// 建立已有订单的明细表
export function build_items_table(data) {
    Object.assign(input_data, data);
    let line_height = 33; //行高，与 css 设置一致
    build_blank_th();

    let tbody = input_data.container.querySelector('tbody');
    let num = 1;
    for (let row of input_data.rows) {
        let row_data = row.split(SPLITER);
        for (let i = 1; i < input_data.show_names.length; i++) {
            input_data.show_names[i].value = row_data[i - 1];
        }
        let input_row = build_input_row(input_data.show_names, all_width, num);
        tbody.appendChild(input_row);
        num += 1;
    }

    tbody.style.height = input_data.lines * line_height + "px";    //这里设置高度，为了实现Y轴滚动

    append_blanks(tbody, num);
    add_event_handle();
}

function append_blanks(tbody, num) {
    //清空数据
    for (let i in input_data.show_names) {
        input_data.show_names[i].value = "";
    }

    keep_up();

    let rows = "";
    for (let i = 0; i < input_data.lines - num + 1; i++) {
        rows += input_data.blank_row;
    }
    tbody.querySelector('tr:nth-last-child(1)').insertAdjacentHTML('afterend', rows);

    setTimeout(() => {
        sum_records();
    }, 100);
}

//创建新的输入行，参数 num 是序号
function build_input_row(show_names, all_width, num) {
    if (!num) num = 1;
    let input_row = document.createElement("tr");
    input_row.classList.add("has-input");
    let control = "";
    for (let obj of show_names) {
        let hidden = obj.css ? obj.css : "";
        if (obj.type == "普通输入" && obj.editable) {
            control += `<td width=${obj.width * 100 / all_width} class="editable" ${hidden}>
            <input class="form-control input-sm has-value ${obj.class}" type="text" value = ${obj.value ? obj.value : ''}></td>`;
        } else if (obj.type == "普通输入" && !obj.editable) {
            control += `<td width=${obj.width * 100 / all_width} class='${obj.class}' ${hidden}>${obj.value ? obj.value : ''} </td >`;
        } else if (obj.type == "二值选一" && obj.editable) {
            let checked;
            if (obj.value) {
                checked = obj.value;
            } else {
                checked = obj.default.split('_')[0] == obj.default ? 'checked' : '';
            }
            control += `<td width=${obj.width * 100 / all_width} class="editable" ${hidden}><label class="check-radio">
                                <input class="has-value" type="checkbox" ${checked}>
                                <span class="checkmark"></span>
                            </label>
                        </td>`;
        } else if (obj.type == "二值选一" && !obj.editable) {
            control += `<td width=${obj.width * 100 / all_width}>${obj.value ? obj.value : ''} ${hidden}</td >`;
        } else if (obj.type == "下拉列表" && obj.editable) {
            control += `<td width=${obj.width * 100 / all_width} class="editable" ${hidden}><select class='select-sm has-value'>`;
            let options = obj.default.split('_');
            for (let value of options) {
                let select = value == obj.value ? 'select' : '';
                control += `<option value="${value}" ${select}>${value}</option>`;
            }
            control += "</select></td>";
        } else if (obj.type == "下拉列表" && !obj.editable) {
            control += `<td width=${obj.width * 100 / all_width}>${obj.value ? obj.value : ''} ${hidden}</td >`;
        } else if (obj.type == "autocomplete" && obj.editable) {
            let button = obj.no_button ? "" : "<button class='btn btn-info btn-sm product-search-button'> ... </button>";
            control += `
            <td width=${obj.width * 100 / all_width} class="editable" >
                <div class="form-input autocomplete" style="z-index: 900; position: inherit">
                    <input class="form-control input-sm has-value auto-input" type="text" 
                        value="${obj.value ? obj.value.split(' ')[1] : ''}" data="${obj.value ? obj.value.split(' ')[0] : ''}"/>                        
                    ${button}
                </div>
            </td>`;
        }
    }

    input_row.innerHTML = control;

    let auto_input = input_row.querySelector('.auto-input');
    let auto_td = input_row.querySelector('td:nth-child(10)');
    let auto_th = document.querySelector('.table-items th:nth-child(10)');
    auto_input.style.width = (auto_th.clientWidth - 36) + "px";

    auto_td.addEventListener('click', function () {
        element_position(this, 7.4, 1);
        auto_input.focus();
    });

    auto_input.addEventListener('focus', function () {
        remove_inputting();
        this.parentNode.parentNode.parentNode.classList.add("inputting");
    });

    auto_table(auto_input, "", `/material_auto_out`, input_data.auto_th, () => {
        fill_gg(auto_input, input_data.show_names, input_data.gg_n);
    }, ()=> {
        return document.querySelector('.table-items .inputting td:nth-child(13)').textContent;
    });

    input_row.addEventListener('click', function () {
        remove_inputting();
        this.classList.add("inputting");
    });

    input_row.querySelector(`td:nth-child(1)`).textContent = num;

    //商品规格查找按钮
    if (input_row.querySelector('.product-search-button')) {
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
                            cate: input_data.document,
                            id: id,
                            name: '',
                            page: 1,
                            done: '否',
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
    }
    return input_row;
}

// 销售时使用的理论重量计算
function weight() {
    let input_row = document.querySelector('.inputting');
    let data = {
        long: input_row.querySelector('.长度').value.trim(),
        num: 1,
        name: input_row.querySelector('.名称').textContent.trim(),
        cz: input_row.querySelector('.材质').textContent.trim(),
        gg: input_row.querySelector('.规格').textContent.trim(),
    }

    if (regInt.test(data.long) && regInt.test(data.num)) {
        input_row.querySelector('.重量').textContent = service.calc_weight(data);
    } else {
        input_row.querySelector('.重量').textContent = 0;
    }
}

//计算合计理论重量
function sum_weight() {
    let all_input = document.querySelectorAll('.has-input');
    let sum = 0;
    for (let i = 0; i < all_input.length; i++) {
        sum += Number(all_input[i].querySelector('.重量').textContent);
    }

    document.querySelector('#实数字段3').value = sum.toFixed(Number(0));
}

//计算记录数
function sum_records() {
    document.querySelector('#total-records').innerHTML = document.querySelectorAll('.has-input').length;
}

//重建索引
function rebuild_index() {
    let all_input = document.querySelectorAll('.has-input');
    for (let i = 0; i < all_input.length; i++) {
        all_input[i].querySelector('td:nth-child(1)').textContent = i + 1;
    }
}

//避免表头错位（出现滚动条时）
function keep_up() {
    if (document.querySelectorAll(".table-items tbody tr").length > input_data.lines) {
        document.querySelector(".table-items thead").style.width = "calc(100% - 1.07em)";
    } else {
        document.querySelector(".table-items thead").style.width = "100%";
    }
}

//移除行编辑标记
function remove_inputting() {
    let all_has_input = document.querySelectorAll('.has-input');
    for (let input of all_has_input) {
        input.classList.remove("inputting");
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

//填充规格字段
function fill_gg(auto_input, show_names, num) {
    let field_values = auto_input.getAttribute("data").split(SPLITER);
    let lh_input = document.querySelector(`.inputting .炉号`).textContent=field_values[6];
    document.querySelector(`.inputting .重量`).focus();
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

//点击提交按钮
document.querySelector('#modal-sumit-button').addEventListener('click', function (e) {
    if (document.querySelector('.modal-title').textContent == "选择商品") {
        e.stopImmediatePropagation();
        let selected_row = document.querySelector('table .focus');
        if (selected_row) {
            chose_exit(selected_row);
        } else {
            notifier.show('请先选择再提交', 'danger');
        }
    }
}, false);

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
                fill_gg(input, input_data.show_names, input_data.gg_n);  // 3 是填入规格数据的数量
                close_modal();
            });
    } else {
        notifier.show('请先选择记录', 'danger');
    }
}