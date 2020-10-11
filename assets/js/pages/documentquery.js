import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { AutoInput } from '../parts/autocomplete.mjs';
import { regInt, regReal, getHeight, SPLITER, download_file, checkFileType } from '../parts/tools.mjs';
import * as service from '../parts/service.mjs';

let cate = document.querySelector('#category').textContent;

let global = {
    row_id: 0,
    edit: 0,
    eidt_cate: "",
}

let get_height = getHeight() - 138;
let row_num = Math.floor(get_height / 30);

let document_cate;
if (cate == "采购查询") {
    document_cate = "采购单据";
}
else if (cate == "销售查询") {
    document_cate = "销售单据";
}
else {
    document_cate = "库存调整";
}

let table_fields;

let init_data = {
    container: '.table-documents',
    url: "/fetch_all_documents",
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

fetch("/fetch_inout_fields", {
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

            let table = document.querySelector('.table-documents');
            let data = service.build_table_header(table, table_fields);
            table.querySelector('thead tr').innerHTML = data.th_row;
            // table.querySelector('thead tr th:nth-child(2)').setAttribute('hidden', 'true');

            init_data.header_names = data.header_names;

            table_init(init_data);
            fetch_table();
        }
    });

function table_row(tr) {
    let rec = tr.split(SPLITER);
    let row = `<tr><td style="text-align: center;">${rec[0]}</td><td>${rec[1]}</td>`;
    return service.build_row_from_string(rec, row, table_fields);
}

function blank_row() {
    let row = "<tr><td></td><td hidden></td>";
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

});

//编辑按键
document.querySelector('#edit-button').addEventListener('click', function () {
    global.eidt_cate = "edit";

    let chosed = document.querySelector('tbody .focus');
    let id = chosed ? chosed.querySelector('td:nth-child(2)').textContent : "";
    if (id != "") {

    }
    else {
        notifier.show('请先选择' + cate, 'danger');
    }
});

