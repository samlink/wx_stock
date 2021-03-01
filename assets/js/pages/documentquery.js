import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight, SPLITER } from '../parts/tools.mjs';
import * as service from '../parts/service.mjs';

//设置菜单 
document.querySelector('#goods-in .nav-icon').classList.add('show-chosed');
document.querySelector('#goods-in .menu-text').classList.add('show-chosed');

let cate = document.querySelector('#category').textContent;

let get_height = getHeight() - 138;
let row_num = Math.floor(get_height / 30);

let document_cate, address;
if (cate == "采购查询") {
    document_cate = "采购单据";
    address = `/${code}/buy_in/`;
}
else if (cate == "销售查询") {
    document_cate = "销售单据";
    address = `/${code}/sale/`;
}
else {
    document_cate = "库存调整";
    address = `/${code}/stock_change/`;
}

let table_fields;

let init_data = {
    container: '.table-documents',
    url: `/${code}/fetch_all_documents`,
    post_data: {
        id: "",
        name: '',
        sort: "开单时间 DESC",
        rec: row_num,
        cate: cate,
    },
    edit: false,

    row_fn: table_row,
    blank_row_fn: blank_row,
};

fetch(`/${code}/fetch_inout_fields`, {
    method: 'post',
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(document_cate),
})
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            table_fields = content;
            let custom_fields = [
                { name: '序号', field: '-', width: 2 },  //field 是用于排序的字段
                { name: '单号', field: '单号', width: 7 },
                { name: '类别', field: 'documents.类别', width: 4 },
                { name: cate == '销售查询' ? '客户' : '供应商', field: 'customers.名称', width: 10 },
                { name: '已记账', field: '已记账', width: 3 },
                { name: '制单人', field: '制单人', width: 4 },
            ];

            let table = document.querySelector('.table-documents');
            let data = service.build_table_header(table, custom_fields, table_fields);
            table.querySelector('thead tr').innerHTML = data.th_row;

            init_data.header_names = data.header_names;

            table_init(init_data);
            fetch_table();
        }
    });

function table_row(tr) {
    let rec = tr.split(SPLITER);
    let len = rec.length;
    let border_left = "";
    if (rec[2].indexOf("退") != -1) {
        border_left = "has-border";
    }

    let bk_color = "";
    if (rec[len - 2] == "否") {
        bk_color = "not-confirm";
    }

    let row = `<tr class='${border_left} ${bk_color}'><td style="text-align: center;">${rec[0]}</td>
        <td title='${rec[1]}'>${rec[1]}</td>
        <td style="text-align: center;">${rec[2]}</td>
        <td style="text-align: left;" title='${rec[len - 3]}'>${rec[len - 3]}</td>
        <td style="text-align: center;">${rec[len - 2]}</td>
        <td style="text-align: center;">${rec[len - 1]}</td>`;

    return service.build_row_from_string(rec, row, table_fields, 3);
}

function blank_row() {
    let row = "<tr><td></td><td></td><td></td><td></td><td></td><td></td>";     //与上面的 table_row() 中的 row 变量保持一致
    return service.build_blank_from_fields(row, table_fields);
}

document.querySelector('#serach-button').addEventListener('click', function () {
    search_table();
});

function search_table() {
    let search = document.querySelector('#search-input').value;
    Object.assign(table_data.post_data, { name: search, page: 1 });
    fetch_table();
}

//记账按键
document.querySelector('#remember-button').addEventListener('click', function () {
    let chosed = document.querySelector('tbody .focus');
    let id = chosed ? chosed.querySelector('td:nth-child(2)').textContent : "";
    let checked = chosed ? chosed.querySelector('td:nth-child(5)').textContent : "";
    if (id != "") {
        let rem = {
            id: id,
            has: checked == "是" ? false : true,
            rights: "单据记账",
        }

        if (checked == "是") {
            alert_confirm(`单据 ${id} 已记账，是否撤销记账？`, {
                confirmCallBack: () => {
                    remember(rem);
                }
            });
        }
        else {
            alert_confirm(`确认记账单据 ${id} 吗？`, {
                confirmCallBack: () => {
                    remember(rem);
                }
            });
        }
    }
    else {
        notifier.show('请先选择单据', 'danger');
    }
});

function remember(rem) {
    fetch(`/${code}/update_rem`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(rem),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                search_table();
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
}

//编辑按键
document.querySelector('#edit-button').addEventListener('click', function () {
    let chosed = document.querySelector('tbody .focus');
    let id = chosed ? chosed.querySelector('td:nth-child(2)').textContent : "";
    if (id != "") {
        window.open(address + id);
    }
    else {
        notifier.show('请先选择单据', 'danger');
    }
});

//删除按键
document.querySelector('#del-button').addEventListener('click', function () {
    let chosed = document.querySelector('tbody .focus');
    let id = chosed ? chosed.querySelector('td:nth-child(2)').textContent : "";

    let del = {
        id: id,
        rights: "记账编辑",
    }

    if (id != "") {
        alert_confirm(`确认删除单据 ${id} 吗？`, {
            confirmCallBack: () => {
                fetch(`/${code}/documents_del`, {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(del),
                })
                    .then(response => response.json())
                    .then(content => {
                        if (content != -1) {
                            search_table();
                        }
                        else {
                            notifier.show('权限不够，操作失败', 'danger');
                        }
                    });
            }
        });
    }
    else {
        notifier.show('请先选择单据', 'danger');
    }
});
