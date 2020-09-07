import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight } from '../parts/tools.mjs';

let top = document.querySelector('.table-top').clientHeight;
let ctrl = document.querySelector('.table-ctrl').clientHeight;

let get_height = getHeight(top, ctrl) - 50;
let row_num = Math.floor(get_height / 30);

//显示表格数据 ---------------------------------------
var data = {
    container: '.table-product',
    url: "/fetch_product",
    post_data: {
        name: '',
        sort: "规格型号 ASC",
        rec: row_num,
    },
    edit: false,

    row_fn: function (tr) {
        return `<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    },

    blank_row_fn: function () {
        return `<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    },

    row_click: function (tr) {
    }
}

table_init(data);
fetch_table();



