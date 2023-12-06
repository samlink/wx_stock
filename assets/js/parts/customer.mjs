import { SPLITER } from '../parts/tools.mjs';
import { AutoInput } from '../parts/autocomplete.mjs';
import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import * as service from '../parts/service.mjs'
import { close_modal, modal_init } from './modal.mjs';
import { notifier } from '../parts/notifier.mjs';

var customer_data = {
    input: document.querySelector('#supplier-input'),
    button: document.querySelector('#supplier-serach'),
    auto_url: `/customer_auto`,
    cate: document.querySelector('#customer-suplier'),
    info: document.querySelector('#supplier-info'),
}

export var out_data = {};

export function customer_init(data) {
    Object.assign(customer_data, data);

    //供应商自动完成
    let auto_comp = new AutoInput(customer_data.input, customer_data.cate, customer_data.auto_url, () => {
        // supplier_auto_show();
    });

    auto_comp.init();
    modal_init();

    //客户供应商查找按钮
    customer_data.button.addEventListener('click', function () {
        if (!document.querySelector('#customer-show')) {
            let width = document.querySelector('body').clientWidth * 0.8;
            let height = document.querySelector('body').clientHeight * 0.8;
            let customer_height = height - 270;

            let html = `<div id="customer-show">
                    <div class="table-top">
                        <div class="autocomplete customer-search">
                            <input type="text" class="form-control search-input" id="search-input" placeholder="${customer_data.cate.textContent}搜索">
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

            fetch(`/fetch_inout_fields`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(customer_data.cate.textContent),
            })
                .then(response => response.json())
                .then(content => {
                    out_data.customer_table_fields = content;
                    let table = document.querySelector('.table-customer');
                    let da = service.build_table_header(table, [{ name: '序号', width: 3 }], content);
                    table.querySelector('thead tr').innerHTML = da.th_row;
                    // table.querySelector('thead tr th:nth-child(2)').setAttribute('hidden', 'true');

                    let init_data = {
                        container: '.table-customer',
                        url: `/fetch_inout_customer`,
                        header_names: da.header_names,
                        post_data: {
                            id: "",
                            name: '',
                            sort: "名称 ASC",
                            rec: Math.floor(customer_height / 30),
                            cate: customer_data.cate.textContent,
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

            document.querySelector('#serach-button').onclick = function () {
                search_table();
            };

            document.querySelector('.modal-title').textContent = `选择${customer_data.cate.textContent}`;
            document.querySelector('.modal-dialog').style.cssText = `max-width: ${width}px; height: ${height}px;`
            document.querySelector('.modal-content').style.cssText = `height: 100%;`
        }

        document.querySelector('.modal').style.display = "block";
    });

    //点击提交按钮
    document.querySelector('#modal-sumit-button').addEventListener('click', function (e) {
        let cate = document.querySelector('.modal-title').textContent;
        if ( cate == "选择客户" || cate == "选择供应商") {
            let selected_row = document.querySelector('table .focus');
            if (selected_row) {
                chose_exit(selected_row);
            }
            else {
                notifier.show('请先选择再提交', 'danger');
            }
        }
    }, false);
}

//自动完成点击后，展示供应商（客户）数据
// function supplier_auto_show() {
//     let da = {
//         rights: customer_data.cate.textContent == "客户" ? "商品销售" : "材料采购",
//         cate: customer_data.cate.textContent,
//         id: Number(customer_data.input.getAttribute('data')),
//     };
//
//     fetch(`/fetch_supplier`, {
//         method: 'post',
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify(da),
//     })
//         .then(response => response.json())
//         .then(content => {
//             let supplier = content[1].split(SPLITER);
//             let join_sup = "";
//             for (let i = 0; i < content[0].length; i++) {
//                 join_sup += `${supplier[i]}　 `;
//             }
//
//             if (content[2].indexOf('差') != -1) {
//                 customer_data.info.style.cssText = "color: red; background-color: wheat;";
//             }
//             else {
//                 customer_data.info.style.cssText = "";
//             }
//
//             customer_data.info.textContent = join_sup;
//             out_data.sale_cut = content[3];      //全局变量：折扣优惠
//         });
// }

//显示行数据
function customer_table_row(tr) {
    let rec = tr.split(SPLITER);
    let row = `<tr><td style="text-align: center;">${rec[1]}</td><td hidden>${rec[0]}</td>`;
    return service.build_row_from_string(rec, row, out_data.customer_table_fields);
}

//显示空行数据
function customer_blank_row() {
    let row = "<tr><td></td><td hidden></td>";
    return service.build_blank_from_fields(row, out_data.customer_table_fields);
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

//选择行数据并退出
function chose_exit(selected_row) {
    let id = selected_row.children[1].textContent;
    if (id) {
        let name = selected_row.children[2].textContent;
        let supplier = document.querySelector('#supplier-input');
        supplier.value = name;
        supplier.setAttribute('data', id);
        // supplier_auto_show();
        close_modal();
    }
    else {
        notifier.show('请先选择记录', 'danger');
    }
}
