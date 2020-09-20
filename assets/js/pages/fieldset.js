import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { regReal, getHeight } from '../parts/tools.mjs';

let global = {
    drag_id: "",
    drag_tr: "",
    edit: 0,
}

let top = document.querySelector('.table-top').clientHeight;
let ctrl = document.querySelector('.table-ctrl').clientHeight;
let get_height = getHeight(top, ctrl) - 70;
document.querySelector('.table-product tbody').style.height = get_height;
document.querySelector('.table-inout tbody').style.height = get_height;

let sumit_button = document.querySelector('#sumit-button');
let sumit_button2 = document.querySelector('#sumit-button2');
sumit_button.disabled = true;
sumit_button2.disabled = true;

//显示表格数据 ---------------------------------------
// var data = {
//     name: '商品规格'
// };

// fetch_data(data);

document.querySelector('#table-choose').addEventListener('change', function () {
    let data = {
        name: this.value,
    };
    document.querySelector('#choose-info').classList.add('hide');
    fetch_data(data);
    fetch_data2(data);
})

function row_fn(tr) {
    let s1 = "";
    let s2 = "";

    if (tr.ctr_type == "普通输入") {
        s1 = "selected";
    } else if (tr.ctr_type == "下拉列表") {
        s2 = "selected";
    }

    let select = tr.data_type != "布尔" ? `<select class='select-sm'><option value="普通输入" ${s1}>普通输入</option>
                <option value="下拉列表" ${s2}>下拉列表</option></select></td>` :
        `<select class='select-sm'><option value="二值选一" selected>二值选一</option></select></td>`;

    let read_only = tr.ctr_type == "普通输入" ? "disabled" : "";


    let checked = tr.is_show ? "checked" : "";

    return `<tr draggable="true"><td class='hide'>${tr.id}</td><td width=6%>${tr.num}</td><td class='hide'>${tr.field_name}</td><td width=10%>${tr.data_type}</td><td>
            <input class='form-control input-sm' type="text" value=${tr.show_name}></td>
            <td width=8%><input class='form-control input-sm' type="text" value=${tr.show_width}></td>
            <td>${select}</td>
            <td width=30%><input class='form-control input-sm' type="text" ${read_only} value=${tr.option_value}></td>
            <td width=8%><label class="check-radio"><input type="checkbox" ${checked}>
            <span class="checkmark"></span></td></tr>`;
}

function blank_row_fn() {
    return `<tr><td width=6%></td><td class='hide'></td><td width=10%></td><td></td><td width=8%></td><td></td><td width=30%></td><td width=8%></td></tr>`;
}

function fetch_data(data) {
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

                //多输入两个空行，便于拖拽操作
                for (let i = 0; i < 2; i++) {
                    rows += blank_row_fn();
                }

                let table_body = document.querySelector('.table-product tbody');
                table_body.innerHTML = rows;
                document.querySelector('#total-records').textContent = content[1];

                //拖拽功能
                row_drag(table_body, sumit_button);

                //编辑时离开提醒
                let all_input = document.querySelectorAll('.table-product tbody input');
                for (let input of all_input) {
                    input.addEventListener('input', () => {
                        sumit_button.disabled = false;
                        global.edit = 1;
                    });
                }

                let all_select = document.querySelectorAll('.table-product tbody select');
                for (let select of all_select) {
                    select.addEventListener('change', function () {
                        document.querySelector('#sumit-button').disabled = false;
                        global.edit = 1;
                        if (this.value != "普通输入") {
                            this.parentNode.nextElementSibling.querySelector('input').disabled = false;
                            this.parentNode.nextElementSibling.querySelector('input').focus();
                        }
                        else {
                            this.parentNode.nextElementSibling.querySelector('input').disabled = true;
                        }
                    });
                }
            }
            else {
                alert("无此操作权限");
            }
        });
}

function fetch_data2(data) {
    fetch("/fetch_fields2", {
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
                    rows += row_fn2(tr);
                    count++;
                }

                //多输入两个空行，便于拖拽操作
                for (let i = 0; i < 2; i++) {
                    rows += blank_row_fn2();
                }

                let table_body = document.querySelector('.table-inout tbody');
                table_body.innerHTML = rows;
                document.querySelector('#total-records2').textContent = content[1];

                //拖拽功能
                row_drag(table_body, sumit_button2);

                //编辑时离开提醒
                let all_input = document.querySelectorAll('.table-inout tbody input');
                for (let input of all_input) {
                    input.addEventListener('input', () => {
                        sumit_button2.disabled = false;
                        global.edit = 1;
                    });
                }
            }
            else {
                alert("无此操作权限");
            }
        });
}

function row_fn2(tr) {
    let checked = tr.inout_show ? "checked" : "";

    return `<tr draggable="true"><td class='hide'>${tr.id}</td>
            <td width=20%>${tr.num}</td><td>${tr.show_name}</td>
            <td width=20%><label class="check-radio"><input type="checkbox" ${checked}>
            <span class="checkmark"></span></td></tr>`;
}

function blank_row_fn2() {
    return `<tr><td width=20%></td><td></td><td width=20%></td></tr>`;
}

function row_drag(table_body, sumit_button) {
    for (let tr of table_body.children) {
        tr.addEventListener('dragstart', function (e) {
            e.stopPropagation();
            global.drag_tr = e.target;
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
            sumit_button.disabled = false;
            global.edit = 1;
        });
    }
}

sumit_button.addEventListener('click', () => {
    let data = [];
    let order = 1;
    let table_body = document.querySelector('.table-product tbody');

    for (let tr of table_body.children) {
        if (tr.querySelector('td:nth-child(1)').textContent != "") {
            if (!regReal.test(Number(tr.querySelector('td:nth-child(6) input').value))) {
                notifier.show('宽度输入有错误', 'danger');
                return false;
            }
            let select = tr.querySelector('select');
            if (select.value != "普通输入" && select.parentNode.nextElementSibling.querySelector('input').value == "") {
                notifier.show('可选值还未输入', 'danger');
                return false;
            }
        }
    }

    for (let tr of table_body.children) {
        if (tr.querySelector('td:nth-child(1)').textContent != "") {
            let tr_data = {
                id: Number(tr.querySelector('td:nth-child(1)').textContent),
                show_name: tr.querySelector('td:nth-child(5) input').value,
                show_width: Number(tr.querySelector('td:nth-child(6) input').value),
                ctr_type: tr.querySelector('td:nth-child(7) select').value,
                option_value: tr.querySelector('td:nth-child(8) input').value,
                is_show: tr.querySelector('td:nth-child(9) input').checked,
                show_order: order,
            }
            order++;
            data.push(tr_data);
        }
    }

    fetch("/update_tableset", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content == 1) {
                global.edit = 0;
                // fetch_data2(data)
                document.querySelector('#sumit-button').disabled = true;
                notifier.show('字段修改成功', 'success');
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });

});

window.onbeforeunload = function (e) {
    if (global.edit == 1) {
        var e = window.event || e;
        e.returnValue = ("编辑未保存提醒");
    }
}

