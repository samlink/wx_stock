import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight } from '../parts/tools.mjs';

let global = {
    drag_id: "",
    drag_tr: "",
    edit: 0,
}

let top = document.querySelector('.table-top').clientHeight;
let ctrl = document.querySelector('.table-ctrl').clientHeight;

let get_height = getHeight(top, ctrl) - 70;
let row_num = Math.floor(get_height / 30) - 2;

document.querySelector('.table-product tbody').style.height = get_height;

//显示表格数据 ---------------------------------------
var data = {
    name: '商品规格'
};

function row_fn(tr) {
    let s1 = "";
    let s2 = "";
    let s3 = "";

    if (tr.ctr_type == "普通输入") {
        s1 = "selected";
    } else if (tr.ctr_type == "下拉列表") {
        s2 = "selected";
    } else {
        s3 = "selected";
    }

    let read_only = tr.ctr_type == "普通输入" ? "disabled" : "";

    let checked = tr.is_show ? "checked" : "";

    return `<tr draggable="true"><td width=6%>${tr.num}</td><td>${tr.field_name}</td><td width=10%>${tr.data_type}</td><td>
            <input class='form-control input-sm' type="text" value=${tr.show_name}></td>
            <td width=8%><input class='form-control input-sm' type="text" value=${tr.show_width}></td>
            <td><select class='select-sm'><option value="普通输入" ${s1}>普通输入</option><option value="下拉列表" ${s2}>下拉列表</option>
            <option value="二值选一" ${s3}>二值选一</option></select></td>
            <td width=20%><input class='form-control input-sm' type="text" ${read_only} value=${tr.option_value}></td>
            <td width=8%><label class="check-radio"><input type="checkbox" value="${tr.is_show}" ${checked}>
            <span class="checkmark"></span></td></tr>`;
}

function blank_row_fn() {
    return `<tr><td width=6%></td><td></td><td width=10%></td><td></td><td width=8%></td><td></td><td width=20%></td><td width=8%></td></tr>`;
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

            //拖拽功能
            for (let tr of table_body.children) {
                tr.addEventListener('dragstart', function (e) {
                    e.stopPropagation();
                    global.drag_tr = e.target;
                    console.log(global.drag_tr);
                });

                tr.addEventListener('dragover', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.cssText = "color: red; background-color: lightyellow; font-weight: 600;";

                });

                tr.addEventListener('dragleave', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.cssText = "";
                });

                tr.addEventListener('drop', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.cssText = "";
                    table_body.insertBefore(global.drag_tr, this);
                    global.edit = 1;
                });
            }
        }
        else {
            alert("无此操作权限");
        }
    });




