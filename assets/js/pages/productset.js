import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { fetch_tree, tree_init, tree_search } from '../parts/tree.mjs';
import { autocomplete } from '../parts/autocomplete.mjs';
import { regInt, regReal, getHeight, download_file } from '../parts/tools.mjs';

let global = {
    id: 0,
    edit: 0,
    eidt_cate: "",
}

//配置自动完成和树的显示 ---------------------------------------------------

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
        document.querySelector('#product-id').textContent = id;

        let post_data = {
            id: id,
        };

        Object.assign(table_data.post_data, post_data);
        fetch_table();
    }
}

tree_init(tree_data);
fetch_tree();

let input = document.querySelector('#auto_input');

autocomplete(input, "", "/tree_auto", () => {
    tree_search(input.value);
});

document.querySelector("#auto_search").addEventListener('click', () => {
    tree_search(input.value);
});

document.querySelector(".tree-title").addEventListener('click', () => {
    fetch_tree();
});

//商品规格表格数据 -------------------------------------------------------------------

let table_name = {
    name: "商品规格"
};

let table_fields;
let header_names = {};

let init_data = {
    container: '.table-product',
    header_names: header_names,
    url: "/fetch_blank",
    post_data: {
        id: "",
        name: '',
        sort: "规格型号 ASC",
        rec: row_num,
    },
    edit: false,

    row_fn: table_row,
    blank_row_fn: blank_row,
};

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

            console.log(table_fields);


            all_width += 3;  //序号列的宽度
            let table_width = document.querySelector('.table-product').clientWidth;
            let width = table_width / all_width;
            let rows = `<th hidden></th><th width='${300 / all_width}%'>序号</th>`;

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

            table_init(init_data);
            fetch_table();

            let data = {
                url: "/fetch_product",
                page: 1,
            }

            Object.assign(table_data, data);
        }
    });

function table_row(tr) {
    let row = `<tr><td hidden>${tr.id}</td><td style="text-align: center;">${tr.num}</td>`;
    for (let name of table_fields) {
        if (name.data_type == "文本") {
            row += `<td title='${tr[name.rust_name]}'>${tr[name.rust_name]}</td>`;
        } else if (name.data_type == "布尔") {
            let show = name.option_value.split('_');
            row += tr[name.rust_name] == true ? `<td style="text-align: center;">${show[0]}</td>` :
                `<td style="text-align: center;">${show[1]}</td>`;
        } else if (name.data_type == "整数" || name.data_type == "实数") {
            row += `<td style="text-align: right;">${tr[name.rust_name]}</td>`;
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

//搜索规格
let search_input = document.querySelector('#search-input');
let cate = document.querySelector('#product-id');
autocomplete(search_input, cate, "/product_auto", () => {
    search_table();
});

document.querySelector('#serach-button').addEventListener('click', function () {
    search_table();
});

function search_table() {
    let search = document.querySelector('#search-input').value;
    Object.assign(table_data.post_data, { name: search, page: 1 });
    fetch_table();
}

//增加按键
document.querySelector('#add-button').addEventListener('click', function () {
    global.eidt_cate = "add";

    let name = document.querySelector('#product-name').textContent;
    if (name != "") {
        let form = "<form>";

        for (let name of table_fields) {
            let control;
            if (name.ctr_type == "普通输入") {
                control = `<div class="form-group">
                                <div class="form-label">
                                    <label>${name.show_name}</label>
                                </div>
                                <input class="form-control input-sm has-value" type="text">
                            </div>`;
            } else if (name.ctr_type == "二值选一") {
                control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <label class="check-radio"><input class="has-value" type="checkbox"><span class="checkmark"></span>
                                </label>
                            </div>`;
            } else {
                control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <select class='select-sm has-value'>`;

                let options = name.option_value.split('_');
                for (let value of options) {
                    control += `<option value="${value}">${value}</option>`;
                }
                control += "</select></div>";

            }

            form += control;
        }
        form += "</form>";

        document.querySelector('.modal-body').innerHTML = form;

        document.querySelector('.modal-title').textContent = document.querySelector('#product-name').textContent;
        document.querySelector('#product-modal').style.display = "block";
        document.querySelector('.modal-body input').focus();
        leave_alert();
    }
    else {
        notifier.show('请先选择商品', 'danger');
    }

});

//编辑按键
document.querySelector('#edit-button').addEventListener('click', function () {
    global.eidt_cate = "edit";

    let name = document.querySelector('#product-name').textContent;
    let chosed = document.querySelector('tbody .focus');
    let id = chosed ? chosed.querySelector('td:nth-child(1)').textContent : "";
    if (name != "" && id != "") {
        global.id = id;

        let form = "<form>";
        let num = 3;
        for (let name of table_fields) {
            let control;
            if (name.ctr_type == "普通输入") {
                let value = chosed.querySelector(`td:nth-child(${num})`).textContent;
                control = `<div class="form-group">
                                <div class="form-label">
                                    <label>${name.show_name}</label>
                                </div>
                                <input class="form-control input-sm has-value" type="text" value="${value}">
                            </div>`;
            } else if (name.ctr_type == "二值选一") {
                let value = chosed.querySelector(`td:nth-child(${num})`).textContent;
                let options = name.option_value.split('_');
                let check = value == options[0] ? "checked" : "";

                control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <label class="check-radio"><input class="has-value" type="checkbox" ${check}><span class="checkmark"></span>
                                </label>
                            </div>`;
            } else {
                let show_value = chosed.querySelector(`td:nth-child(${num})`).textContent;
                control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <select class='select-sm has-value'>`;

                let options = name.option_value.split('_');
                for (let value of options) {
                    if (value == show_value) {
                        control += `<option value="${value}" selected>${value}</option>`;
                    }
                    else {
                        control += `<option value="${value}">${value}</option>`;
                    }
                }

                control += "</select></div>";
            }

            form += control;
            num++;
        }
        form += "</form>";

        document.querySelector('.modal-body').innerHTML = form;

        document.querySelector('.modal-title').textContent = document.querySelector('#product-name').textContent;
        document.querySelector('#product-modal').style.display = "block";
        document.querySelector('.modal-body input').focus();
        leave_alert();
    }
    else {
        notifier.show('请先选择商品规格', 'danger');
    }
});

//提交按键
document.querySelector('#modal-sumit-button').addEventListener('click', function () {
    let all_input = document.querySelectorAll('.has-value');
    let num = 0;
    let data = {
        num: 0,
        id: Number(global.id),  //自身ID
        name_id: document.querySelector('#product-id').textContent, //品名ID
        p_type: "",
        price: 0,
        p_limit: 0,
        not_use: false,
        note: "",
        unit: "",
        text1: "",
        text2: "",
        text3: "",
        text4: "",
        text5: "",
        text6: "",
        text7: "",
        text8: "",
        text9: "",
        text10: "",
        integer1: 0,
        integer2: 0,
        integer3: 0,
        integer4: 0,
        integer5: 0,
        integer6: 0,
        real1: 0,
        real2: 0,
        real3: 0,
        real4: 0,
        real5: 0,
        real6: 0,
        bool1: false,
        bool2: false,
        bool3: false,
    }

    for (let input of all_input) {
        if (table_fields[num].data_type == "整数" && !regInt.test(input.value)
            || table_fields[num].data_type == "实数" && !regReal.test(input.value)) {
            notifier.show('数字字段输入错误', 'danger');
            return false;
        }
        num++;
    }

    num = 0;
    for (let input of all_input) {
        let value;
        if (input.parentNode.className.indexOf('check-radio') == -1) {
            value = input.value;
        }
        else {
            value = input.checked;
        }

        if (table_fields[num].data_type == "整数" || table_fields[num].data_type == "实数") {
            value = Number(value);
        }

        data[table_fields[num].rust_name] = value;
        num++;
    }

    let url = global.eidt_cate == "edit" ? "/update_product" : "/add_product";

    fetch(url, {
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
                notifier.show('商品修改成功', 'success');
                fetch_table();
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
});


//关闭按键
document.querySelector('#modal-close-button').addEventListener('click', function () {
    close_modal();
});

//关闭按键
document.querySelector('.top-close').addEventListener('click', function () {
    close_modal();
});

//关闭函数
function close_modal() {
    if (global.edit == 1) {
        alert_confirm('编辑还未保存，确认退出吗？', {
            confirmCallBack: () => {
                global.edit = 0;
                document.querySelector('#zhezhao').style.cssText = "display:none;";
                document.querySelector('#product-modal').style.display = "none";
            }
        });
    } else {
        document.querySelector('#zhezhao').style.cssText = "display:none;";
        document.querySelector('#product-modal').style.display = "none";
    }
}

//编辑离开提醒事件
function leave_alert() {
    let all_input = document.querySelectorAll('#product-modal input');
    for (let input of all_input) {
        input.addEventListener('input', () => {
            global.edit = 1;
        });
    }

    let all_select = document.querySelectorAll('#product-modal select');
    for (let select of all_select) {
        select.addEventListener('change', function () {
            global.edit = 1;
        });
    }
}

//数据导入和导出 ------------------------------------------------------------------------------

document.querySelector('#data-out').addEventListener('click', function () {
    let name = document.querySelector('#product-name').textContent;
    if (name != "") {
        let name_id = document.querySelector('#product-id').textContent;

        let data = {
            id: name_id,
            name: name,
        };

        fetch("/product_out", {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(content => {
                if (content != -1) {
                    download_file(`/download/${content}.xlsx`);
                    // notifier.show('成功导出至 Excel 文件', 'success');
                }
                else {
                    notifier.show('权限不够，操作失败', 'danger');
                }
            });
    }
    else {
        notifier.show('请先选择商品', 'danger');
    }
});