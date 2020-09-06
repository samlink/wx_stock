import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { fetch_tree, tree_event, tree_search } from '../parts/tree.mjs';
import { autocomplete } from '../parts/autocomplete.mjs';
import { getHeight } from '../parts/tools.mjs';

let auto = document.querySelector('.autocomplete');
let title = document.querySelector('.tree-title');
let tree = document.querySelector('.tree-container');

let get_height = getHeight(auto.clientHeight, title.clientHeight) - 35;
tree.style.height = get_height + "px";

fetch_tree();
tree_event();

let input = document.querySelector('#auto_input');
autocomplete(input, "/tree_auto", () => {
    tree_search(input.value);
});

document.querySelector("#auto_search").addEventListener('click', () => {
    tree_search(input.value);
});

document.querySelector(".tree-title").addEventListener('click', () => {
    fetch_tree();
});

let ctrl_height = document.querySelector('.table-ctrl').clientHeight;
let row_num = Math.floor((get_height - ctrl_height) / 30);

//显示表格数据 ---------------------------------------
var data = {
    container: '.table-product',
    header_names: {
        '序号': 'confirm',
        '用户名': 'name',
        '手机号': 'phone',
        '工作权限': 'rights',
        '是否确认': 'confirm',
    },
    url: "/fetch_product",
    post_data: {
        name: '',
        sort: "规格型号 ASC",
        rec: row_num,
    },
    edit: false,

    row_fn: function (tr) {
        let con = "已确认";
        let color = "green";
        if (tr.confirm == false) {
            con = "未确认";
            color = "red";
        }
        return `<tr><td>${tr.num}</td><td>${tr.name}</td><td>${tr.phone}</td><td title='${tr.rights}'>${tr.rights}</td>
            <td><span class='confirm-info ${color}'>${con}</span></td></tr>`;
    },

    blank_row_fn: function () {
        return `<tr><td></td><td></td><td></td><td></td><td></td></tr>`;
    },

    row_click: function (tr) {
    }
}

table_init(data);
fetch_table();

//搜索用户
document.querySelector('#serach-button').addEventListener('click', function () {
    if (!table_data.edit) {
        let search = document.querySelector('#search-input').value;
        Object.assign(table_data.post_data, { name: search });
        fetch_table();
    }
});


