import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { autocomplete } from '../parts/autocomplete.mjs';
import * as service from '../parts/service.mjs'
import { SPLITER } from '../parts/tools.mjs';

let table_fields;

//表头构造显示，并添加事件处理 -----------------------------------------------------------

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
autocomplete(document.querySelector('#supplier-input'), "", "/supplier_auto", () => {
    supplier_auto_show();
});

//供应商查找按钮
document.querySelector('#supplier-serach').addEventListener('click', function () {
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

    autocomplete(document.querySelector('#search-input'), "", "/supplier_auto", () => {
        search_table();
    });

    document.querySelector('#serach-button').onclick = function () {
        search_table();
    };

    document.querySelector('.modal-title').textContent = "选择供应商";
    document.querySelector('.modal-dialog').style.cssText = `max-width: ${width}px; height: ${height}px;`
    document.querySelector('.modal-content').style.cssText = `height: 100%;`

    document.querySelector('.modal').style.display = "block";
});

//表格输入部分 -----------------------------------------------------------------------

let ware_house_select;

fetch("/fetch_inout_fields", {
    method: 'post',
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify("商品规格"),
})
    .then(response => response.json())
    .then(content => {
        let line_height = 33; //行高，与 css 设置一致
        let all_width = 0;
        for (let item of content) {
            all_width += item.show_width;
        }
        let table_container = document.querySelector('.table-items');
        let table_width = document.querySelector('.content').clientWidth -
            document.querySelector('.table-history').clientWidth - 15;

        table_container.style.width = table_width;

        if (all_width * 23 + 680 > table_width) {
            table_container.querySelector('.table-ctrl').style.cssText = `
                position: absolute;
                width: ${table_width + 2}px;
                margin-top: 11px;
                border: 1px solid #edf5fb;
                margin-left: -2px;`;

            document.querySelector('.table-history .table-ctrl').style.height = "61px";
        }

        let th_row = `<th width=54px>序号</th><th width=140px>名称</th>`;
        for (let th of content) {
            th_row += `<th width=${th.show_width * 18}px>${th.show_name}</th>`;
        }
        table_container.querySelector('#price').insertAdjacentHTML('beforebegin', th_row);

        let headers = table_container.querySelectorAll('th');
        let blank_row = "<tr>";
        for (let th of headers) {
            blank_row += "<td></td>";
        }

        blank_row += "</tr>";

        let row = `<tr class='has-input inputting'><td>1</td><td>
                <div class="form-input autocomplete">
                    <input class="form-control input-sm has-value auto-input" type="text" style='width:100%' />
                    <button class="btn btn-info btn-sm auto-button" title="搜索"> ... </button>
                </div>
              </td>`;

        for (let item of content) {
            row += "<td></td>";
        }

        row += `<td>
                    <div class="form-input">
                        <input class="form-control input-sm has-value" type="text" />
                    </div>
                </td><td>
                    <div class="form-input">
                        <input class="form-control input-sm has-value" type="text" />
                    </div>
                </td><td></td><td>
                    <div class="form-input">
                        <input class="form-control input-sm has-value" type="text" />
                    </div>
            </td></tr>`;

        let row2 = "<tr><td></td><td></td><td></td></tr>";

        let count = Math.floor((document.querySelector('body').clientHeight - 370) / line_height);

        let rows = row;
        let rows2 = "";
        for (let i = 0; i < count - 1; i++) {
            rows += blank_row;
            rows2 += row2;
        }

        rows2 += row2;

        let tbody = table_container.querySelector('tbody');
        let tbody2 = document.querySelector('.table-history tbody');
        tbody.style.height = count * line_height + "px";
        tbody.innerHTML = rows;
        tbody2.innerHTML = rows2;

        document.querySelector('.auto-input').focus();

        //构造仓库下拉选单
        fetch("/fetch_house")
            .then(response => response.json())
            .then(content => {
                ware_house_select = ` <select class='select-sm has-value'>`;

                for (let house of content) {
                    ware_house_select += `<option value="${house.id}">${house.name}</option>`;
                }

                ware_house_select += "</select>";

                document.querySelector('.inputting td:nth-last-child(2)').innerHTML = ware_house_select;

            });

            autocomplete(document.querySelector('.auto-input'), "", "/supplier_auto", () => {
                // search_table();
            });

    });


//共用事件和函数 ---------------------------------------------------------------------

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
        notifier.show('请先选择供应商', 'danger');
    }

});

//自动完成点击后，展示数据
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
        let name = selected_row.children[2].textContent;
        let supplier = document.querySelector('#supplier-input');
        supplier.value = name;
        supplier.setAttribute('data', id);
        supplier_auto_show();
        close_modal();
    }
    else {
        notifier.show('请先选择供应商', 'danger');
    }
}