import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight, SPLITER } from '../parts/tools.mjs';
import * as service from '../parts/service.mjs';

// let cate = document.querySelector('#category').textContent;
let limit = document.querySelector('#limit').textContent;


let get_height = getHeight() - 168;
let row_num = Math.floor(get_height / 30);

let table_fields;

let init_data = {
    container: '.table-documents',
    url: `/fetch_a_documents`,
    post_data: {
        id: "",
        name: '',
        sort: "开单时间 DESC",
        rec: row_num,
        cate: limit,
    },
    edit: false,

    row_fn: table_row,
    blank_row_fn: blank_row,
};

let custom_fields = [
    { name: '序号', field: '-', width: 2 },  //field 是用于排序的字段
    { name: '单号', field: '单号', width: 4 },
    { name: '类别', field: 'documents.类别', width: 4 },
    { name: '日期', field: 'documents.日期', width: 4 },
    { name: '经办人', field: 'documents.经办人', width: 3 },
    { name: '备注', field: 'documents.备注', width: 8 },
];

let table = document.querySelector('.table-documents');
let data = service.build_table_header(table, custom_fields, "", "", "documents");
console.log(data);
table.querySelector('thead tr').innerHTML = data.th_row;

init_data.header_names = data.header_names;
console.log(init_data);
table_init(init_data);
fetch_table();


function table_row(tr) {
    let rec = tr.split(SPLITER);
    let len = rec.length;

    let row = `<tr'>
        <td style="text-align: center;">${rec[0]}</td>
        <td title='${rec[1]}'>${rec[1]}</td>
        <td style="text-align: center;">${rec[2]}</td>
        <td style="text-align: center;">${rec[3]}</td>
        <td style="text-align: center;">${rec[4]}</td>
        <td style="text-align: center;">${rec[5]}</td>
        </tr>`;
    return row;
}

function blank_row() {
    let row = "<tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>";     //与上面的 table_row() 中的 row 变量保持一致
    return row;
}

document.querySelector('#serach-button').addEventListener('click', function () {
    search_table();
});

function search_table() {
    let search = document.querySelector('#search-input').value;
    Object.assign(table_data.post_data, { name: search, page: 1 });
    fetch_table();
}

//编辑按键
document.querySelector('#edit-button').addEventListener('click', function () {
    let chosed = document.querySelector('tbody .focus');
    if (chosed) {
        let id = chosed.querySelector('td:nth-child(2)').textContent;
        let cate = chosed.querySelector('td:nth-child(3)').textContent;
        let address;
        if (cate == "材料采购") {
            address = `/buy_in/`;
        } else if (cate == "采购退货") {
            address = '/buy_back/';
        } else if (cate == "商品销售") {
            address = `/sale/`;
        } else if (cate == "销售退货") {
            address = '/saleback/';
        } else if (cate == "采购入库") {
            address = `/material_in/`;
        } else if (cate == "销售出库") {
            address = `/material_out/`;
        } else if (cate == "运输发货") {
            address = `/transport/`;
        } else if (cate == "调整入库") {
            address = `/stock_change_in/`;
        } else if (cate == "调整出库") {
            address = `/stock_change_out/`;
        } else if (cate == "销售开票") {
            address = `/kp/`;
        }
        window.location = address + id;
    } else {
        notifier.show('请先选择单据', 'danger');
    }
});

//删除按键
document.querySelector('#del-button').addEventListener('click', function () {
    let chosed = document.querySelector('tbody .focus');
    let id = chosed ? chosed.querySelector('td:nth-child(2)').textContent : "";

    let del = {
        id: id,
        rights: "删除单据",
        base: document.querySelector('#base').textContent,
    }

    if (id != "") {
        alert_confirm(`单据 ${id} 删除后无法恢复，确认删除吗？`, {
            confirmCallBack: () => {
                fetch(`/documents_del`, {
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
                        } else {
                            notifier.show('权限不够，操作失败', 'danger');
                        }
                    });
            }
        });
    } else {
        notifier.show('请先选择单据', 'danger');
    }
});
