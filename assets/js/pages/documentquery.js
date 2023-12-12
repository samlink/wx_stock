import {table_data, table_init, fetch_table} from '../parts/table.mjs';
import {notifier} from '../parts/notifier.mjs';
import {alert_confirm} from '../parts/alert.mjs';
import {getHeight, SPLITER} from '../parts/tools.mjs';
import * as service from '../parts/service.mjs';

let cate = document.querySelector('#category').textContent;
let limit = document.querySelector('#limit').textContent;


let get_height = getHeight() - 168;
let row_num = Math.floor(get_height / 30);

let document_cate;
if (cate == "采购查询") {
    document_cate = "采购单据";
} else if (cate == "销售查询") {
    document_cate = "销售单据";
} else if (cate == "入库查询") {
    document_cate = "入库单据";
} else if (cate == "出库查询") {
    document_cate = "出库单据";
} else if (cate == "发货查询") {
    document_cate = "发货单据";
} else if (cate == "调入查询") {
    document_cate = "库存调入";
} else if (cate == "调出查询") {
    document_cate = "库存调出";
}

let table_fields;

let init_data = {
    container: '.table-documents',
    url: `/fetch_all_documents`,
    post_data: {
        id: "",
        name: '',
        sort: "开单时间 DESC",
        rec: row_num,
        cate: cate + ' ' + limit,
    },
    edit: false,

    row_fn: table_row,
    blank_row_fn: blank_row,
};

fetch(`/fetch_show_fields`, {
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
                {name: '序号', field: '-', width: 2},  //field 是用于排序的字段
                {name: '单号', field: '单号', width: 7},
                {name: '类别', field: 'documents.类别', width: 4},
                {name: cate == '销售查询' ? '客户' : '供应商', field: 'customers.名称', width: 10},
            ];

            // 对于出入库的表格, 不需要供应商列, 要去除
            if (cate.indexOf("销售") == -1 && cate.indexOf("采购") == -1) {
                custom_fields = [
                    {name: '序号', field: '-', width: 2},  //field 是用于排序的字段
                    {name: '单号', field: '单号', width: 7},
                    {name: '类别', field: 'documents.类别', width: 4},
                ];
            }

            let table = document.querySelector('.table-documents');
            let data = service.build_table_header(table, custom_fields, table_fields, "", "documents");
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
        <td style="text-align: center;">${rec[3]}</td>`;

    //第三列的供应商对于出入库表不需要
    if (cate.indexOf("销售") == -1 && cate.indexOf("采购") == -1) {
        row = `<tr class='${border_left} ${bk_color}'><td style="text-align: center;">${rec[0]}</td>
        <td title='${rec[1]}'>${rec[1]}</td>
        <td style="text-align: center;">${rec[2]}</td>`;
    }

    return service.build_row_from_string(rec, row, table_fields, 4);
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
    Object.assign(table_data.post_data, {name: search, page: 1});
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
        rights: "记账编辑",
        base: document.querySelector('#base').textContent,
    }

    if (id != "") {
        alert_confirm(`确认删除单据 ${id} 吗？`, {
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
