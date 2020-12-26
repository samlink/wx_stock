import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { AutoInput } from '../parts/autocomplete.mjs';
import { regInt, regReal, getHeight, SPLITER, download_file, checkFileType } from '../parts/tools.mjs';
import * as service from '../parts/service.mjs';

let cate = document.querySelector('#category').textContent;

let get_height = getHeight() - 138;
let row_num = Math.floor(get_height / 30);

let init_data = {
    container: '.table-limit',
    url: "/fetch_limit",
    post_data: {
        id: "",
        name: '',
        sort: "node_name,规格型号",
        rec: row_num,
        cate: cate,
    },
    edit: false,
    header_names: {
        "名称": "node_name",
        "规格型号": "规格型号",
        "单位": "单位",
        "仓库": "name",
        "库位": "库位",
        "库存下限": "库存下限",
        "库存": "库存",
    },

    row_fn: table_row,
    blank_row_fn: blank_row,
};

table_init(init_data);
fetch_table();

function table_row(tr) {
    let rec = tr.split(SPLITER);
    let row = `<tr><td style="text-align: center;">${rec[0]}</td>
        <td title='${rec[1]}'>${rec[1]}</td>
        <td style="text-align: center;">${rec[2]}</td>
        <td style="text-align: center;">${rec[3]}</td>
        <td style="text-align: center;">${rec[4]}</td>
        <td style="text-align: center;">${rec[5]}</td></tr>`;

    return row;
}

function blank_row() {
    return "<tr><td></td><td></td><td></td><td></td><td></td><td></td>";     //与上面的 table_row() 中的 row 变量保持一致
}

document.querySelector('#serach-button').addEventListener('click', function () {
    search_table();
});

function search_table() {
    let search = document.querySelector('#search-input').value;
    Object.assign(table_data.post_data, { name: search, page: 1 });
    fetch_table();
}



