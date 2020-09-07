import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight } from '../parts/tools.mjs';

let top = document.querySelector('.table-top').clientHeight;
let ctrl = document.querySelector('.table-ctrl').clientHeight;

let get_height = getHeight(top, ctrl) - 70;
let row_num = Math.floor(get_height / 30) - 1;

document.querySelector('.table-product tbody').style.height = get_height;

//显示表格数据 ---------------------------------------
var data = {
    name: '商品规格'
};

function row_fn(tr) {
    let show = tr.is_show ? "是" : "否";

    return `<tr><td>${tr.num}</td><td>${tr.field_name}</td><td>${tr.data_type}</td><td>${tr.show_name}</td><td>${tr.show_width}</td>
                <td>${tr.ctr_type}</td><td>${tr.option_value}</td><td>${show}</td></tr>`;
}

function blank_row_fn() {
    return `<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
}

fetch("/fetch_fields", {
    method: 'post',
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
})
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            let rows = "";
            let count = 0;
            for (let tr of content[0]) {
                rows += row_fn(tr);
                count++;
            }

            for (let i = 0; i < row_num - count; i++) {
                rows += blank_row_fn();
            }

            let table_body = document.querySelector('.table-product tbody');
            table_body.innerHTML = rows;
            document.querySelector('#total-records').textContent = content[1];

            for (let tr of table_body.children) {
                tr.addEventListener('click', function (e) {
                    for (let r of table_body.children) {
                        r.classList.remove('focus');
                    }
                    this.classList.add('focus');

                    // table_data.row_click(tr);
                });
            }
        }
        else {
            alert("无此操作权限");
        }
    });




