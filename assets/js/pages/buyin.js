import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { autocomplete } from '../parts/autocomplete.mjs';
import { build_inout_form } from '../parts/service.mjs'
import { SPLITER } from '../parts/tools.mjs';

var table_fields;
let header_names = {};
let row_num;

let init_data = {
    container: '.table-customer',
    header_names: header_names,
    url: "/fetch_customer",
    post_data: {
        id: "",
        name: '',
        sort: "名称 ASC",
        rec: row_num,
    },
    edit: false,

    row_fn: table_row,
    blank_row_fn: blank_row,
};

fetch("/fetch_buyin_fields", {
    method: 'post',
})
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            table_fields = content;
            let html = build_inout_form(table_fields);
            document.querySelector('.has-auto').insertAdjacentHTML('afterend', html);


            let fields_show = document.querySelector('.fields-show');
            let has_auto = document.querySelector('.has-auto');
            let next_auto = document.querySelector('.has-auto+div');

            //加入滚动事件处理
            fields_show.addEventListener('scroll', function () {
                if (fields_show.scrollTop != 0) {
                    has_auto.style.cssText = "position: relative;";
                    next_auto.style.cssText = "margin-left: -3px;"
                }
                else {
                    has_auto.style.cssText = "";
                    next_auto.style.cssText = "";
                }
            });
        }
    });

//自动完成
let search_input = document.querySelector('#supplier-input');
autocomplete(search_input, "", "/supplier_auto", () => {
    fetch("/fetch_supplier", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(search_input.getAttribute('data')),
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
});

document.querySelector('#supplier-serach').addEventListener('click', function () {
    let width = document.querySelector('body').clientWidth * 0.8;
    let height = document.querySelector('body').clientHeight * 0.8;
    let customer_height = height - 100;
    row_num = Math.floor(customer_height / 30);

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
                </div>`;

    document.querySelector('.modal-body').innerHTML = html;

    fetch("/fetch_fields", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(table_name),
    })
        .then(response => response.json())
        .then(content => {
            let table_fields = content[0];
            let all_width = 0;
            for (let item of table_fields) {
                all_width += item.show_width;
            }

            all_width += 3;  //序号列的宽度
            let table_width = document.querySelector('.table-customer').clientWidth;
            let width_raio = table_width / all_width;
            let rows = `<th width='${300 / all_width}%'>序号</th><th hidden>编号</th>`;

            if (width_raio < 18) {
                rows = `<th width='${3 * 18}px'>序号</th><th hidden>编号</th>`;
                document.querySelector('.table-customer').style.width = table_width;
                document.querySelector('.table-customer .table-ctrl').style.cssText = `
                        position: absolute;
                        width: ${table_width + 2}px;
                        margin-top: 11px;
                        border: 1px solid #edf5fb;
                        margin-left: -2px;`;
            }

            for (let th of table_fields) {
                rows += width_raio > 18 ? `<th width="${(th.show_width * 100 / all_width).toFixed(1)}%">${th.show_name}</th>` :
                    `<th width="${th.show_width * 18}px">${th.show_name}</th>`;

                let key = th.show_name;
                let value = th.field_name;
                header_names[key] = value;
            }

            document.querySelector('.table-customer thead tr').innerHTML = rows;
        });

    document.querySelector('.modal-title').textContent = "选择供应商";
    document.querySelector('.modal-dialog').style.cssText = `max-width: ${width}px; height: ${height}px;`
    document.querySelector('.modal-content').style.cssText = `height: 100%;`

    document.querySelector('.modal').style.display = "block";
});

function table_row(tr) {
    let rec = tr.split(SPLITER);
    let row = `<tr><td style="text-align: center;">${rec[1]}</td><td hidden>${rec[0]}</td>`;
    return service.build_row_from_string(rec, row, table_fields);
}

function blank_row() {
    let row = "<tr><td></td><td hidden></td>";
    return service.build_blank_from_fields(row, table_fields);
}

//关闭按键
document.querySelector('#modal-close-button').addEventListener('click', function () {
    close_modal();
});

//关闭按键
document.querySelector('.top-close').addEventListener('click', function () {
    close_modal();
});

//关闭函数
function close_modal() {
    document.querySelector('.modal').style.display = "none";
    document.querySelector('.modal-content').style.cssText = "";
    document.querySelector('#modal-info').innerHTML = "";
}