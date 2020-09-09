import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { fetch_tree, tree_init, tree_search } from '../parts/tree.mjs';
import { autocomplete } from '../parts/autocomplete.mjs';
import { getHeight } from '../parts/tools.mjs';

let auto = document.querySelector('.autocomplete');
let title = document.querySelector('.tree-title');
let tree = document.querySelector('.tree-container');

let get_height = getHeight(auto.clientHeight, title.clientHeight) - 35;
tree.style.height = get_height + "px";

let ctrl_height = document.querySelector('.table-ctrl').clientHeight;
let row_num = Math.floor((get_height - ctrl_height) / 30);

let tree_data = {
    leaf_click: (id, name) => {
        document.querySelector('#product-name').textContent = name;
        var data = {
            container: '.table-product',
            header_names: header_names,
            url: "/fetch_product",
            post_data: {
                id: id,
                name: '',
                sort: "规格型号 ASC",
                rec: row_num,
            },
            edit: false,

            row_fn: table_row,
            blank_row_fn: blank_row,

            row_click: function (tr) {
            }
        }

        table_init(data);
        fetch_table();
    }
}

tree_init(tree_data);
fetch_tree();

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


//显示表格数据 ---------------------------------------

let table_name = {
    name: "商品规格"
};

let table_fields;
let header_names = {};

fetch("/fetch_fields", {
    method: 'post',
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(table_name),
})
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            table_fields = content[0].filter((item) => {
                return item.is_show;
            });

            let all_width = 0;
            for (let item of table_fields) {
                all_width += item.show_width;
            }

            all_width += 3;  //序号列的宽度

            console.log(all_width);

            let table_width = document.querySelector('.table-product').clientWidth;
            console.log(table_width);

            let rows = `<th hidden></th><th width='${300 / all_width}%'>序号</th>`;

            let width = table_width / all_width;

            console.log(width);

            if (width < 18) {
                rows = `<th hidden></th><th width='${3 * 18}px'>序号</th>`;
                document.querySelector('.table-product').style.width = table_width;
                document.querySelector('.table-product .table-ctrl').style.cssText = `
                position: absolute;
                width: ${table_width + 2}px;
                margin-top: 11px;
                border: 1px solid #edf5fb;
                margin-left: -2px;`;
            }

            for (let th of table_fields) {
                rows += width > 18 ? `<th width="${(th.show_width * 100 / all_width).toFixed(1)}%">${th.show_name}</th>` :
                    `<th width="${th.show_width * 18}px">${th.show_name}</th>`;

                let key = th.show_name;
                let value = th.field_name;
                header_names[key] = value;
            }

            document.querySelector('.table-product thead tr').innerHTML = rows;

            let row = blank_row();

            rows = "";
            for (let i = 0; i < row_num; i++) {
                rows += row;
            }

            document.querySelector('.table-product tbody').innerHTML = rows;
        }
    });

function table_row(tr) {
    let row = `<tr><td hidden>${tr.id}</td><td style="text-align: center;">${tr.num}</td>`;
    for (let name of table_fields) {
        if (name.data_type == "文本") {
            row += `<td title='${tr[name.rust_name]}'>${tr[name.rust_name]}</td>`;
        }
        else {
            row += `<td>${tr[name.rust_name]}</td>`;
        }
    }
    row += "</tr>";

    return row;
}

function blank_row() {
    let row = "<tr><td hidden></td><td></td>";
    for (let _f of table_fields) {
        row += "<td></td>";
    }
    row += "</tr>";
    return row;
}


// //搜索用户
// document.querySelector('#serach-button').addEventListener('click', function () {
//     if (!table_data.edit) {
//         let search = document.querySelector('#search-input').value;
//         Object.assign(table_data.post_data, { name: search });
//         fetch_table();
//     }
// });


