import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { fetch_tree, tree_init, tree_search } from '../parts/tree.mjs';
import { AutoInput } from '../parts/autocomplete.mjs';
import { regInt, regReal, getHeight, SPLITER, download_file, checkFileType } from '../parts/tools.mjs';
import * as service from '../parts/service.mjs';

//设置菜单 
document.querySelector('#function-set .nav-icon').classList.add('show-chosed');
document.querySelector('#function-set .menu-text').classList.add('show-chosed');

let global = {
    row_id: 0,
    edit: 0,
    eidt_cate: "",
    product_id: "",
    product_name: "",
}

//配置自动完成和树的显示 ---------------------------------------------------

let tree_height = document.querySelector('.tree-container').clientHeight;
let row_num = Math.floor((tree_height - 50) / 30);

let tree_data = {
    leaf_click: (id, name) => {
        global.product_name = name;
        global.product_id = id;

        document.querySelector('#product-name').textContent = name;
        document.querySelector('#product-id').textContent = id;

        let post_data = {
            id: id,
            name: '',
            // sort: "规格型号 ASC",
            page: 1,
        };

        Object.assign(table_data.post_data, post_data);
        fetch_table();
    }
}

tree_init(tree_data);
fetch_tree(open_node);

function open_node() {
    document.querySelector('#t_4 span').click();
    document.querySelector('#t_3 span').click();
}

let input = document.querySelector('#auto_input');

let auto_comp = new AutoInput(input, "", `/tree_auto`, () => {
    tree_search(input.value);
});

auto_comp.init();

document.querySelector("#auto_search").addEventListener('click', () => {
    tree_search(input.value);
});

// document.querySelector(".tree-title").addEventListener('click', () => {
//     fetch_tree();
// });

//商品规格表格数据 -------------------------------------------------------------------

service.build_product_table(row_num);

//增加按键
document.querySelector('#add-button').addEventListener('click', function () {
    global.eidt_cate = "add";

    if (global.product_name != "") {
        document.querySelector('.modal-body').innerHTML = service.build_add_form(service.table_fields);
        document.querySelector('.modal-title').textContent = global.product_name;
        document.querySelector('.modal-dialog').style.cssText = "max-width: 500px;"
        document.querySelector('.modal').style.display = "block";
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

    let chosed = document.querySelector('tbody .focus');
    let id = chosed ? chosed.querySelector('td:nth-child(2)').textContent : "";
    if (global.product_name != "" && id != "") {
        global.row_id = id;
        document.querySelector('.modal-body').innerHTML = service.build_edit_form(3, service.table_fields, chosed); //3 是起始位置
        document.querySelector('.modal-title').textContent = global.product_name;
        document.querySelector('.modal-dialog').style.cssText = "max-width: 500px;"
        document.querySelector('.modal').style.display = "block";
        document.querySelector('.modal-body input').focus();
        leave_alert();
    }
    else {
        notifier.show('请先选择商品规格', 'danger');
    }
});

//提交按键
document.querySelector('#modal-sumit-button').addEventListener('click', function () {
    if (global.eidt_cate == "add" || global.eidt_cate == "edit") {
        let all_input = document.querySelectorAll('.has-value');
        if (all_input[0].value != "") {
            let num = 0;
            for (let input of all_input) {
                if (service.table_fields[num].data_type == "整数" && !regInt.test(input.value)
                    || service.table_fields[num].data_type == "实数" && !regReal.test(input.value)) {
                    notifier.show('数字字段输入错误', 'danger');
                    return false;
                }
                num++;
            }
            let product = `${global.row_id}${SPLITER}${global.product_id}${SPLITER}`;

            num = 0;

            for (let input of all_input) {
                let value;
                if (input.parentNode.className.indexOf('check-radio') == -1) {
                    value = input.value;
                }
                else {
                    value = input.checked;
                }

                if (service.table_fields[num].data_type == "整数" || service.table_fields[num].data_type == "实数") {
                    value = Number(value);
                }

                product += `${value}${SPLITER}`;
                num++;
            }

            let data = {
                data: product,
            };

            let url = global.eidt_cate == "edit" ? `/update_product` : `/add_product`;

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
                        if (global.eidt_cate == "add") {
                            for (let input of all_input) {
                                input.value = "";
                            }
                        }
                    }
                    else {
                        notifier.show('权限不够，操作失败', 'danger');
                    }
                });
        }
        else {
            notifier.show('空值不能提交', 'danger');

        }
    }
    else {
        let url = global.eidt_cate == "批量导入" ? `/product_datain` : `/product_updatein`;
        fetch(url, {
            method: 'post',
        })
            .then(response => response.json())
            .then(content => {
                if (content == 1) {
                    notifier.show('批量操作成功', 'success');
                    fetch_table();
                    close_modal();
                }
                else {
                    notifier.show('权限不够，操作失败', 'danger');
                }
            });
    }
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
                document.querySelector('.modal').style.display = "none";
            }
        });
    } else {
        document.querySelector('.modal').style.display = "none";
    }

    document.querySelector('#modal-info').innerHTML = "";
}

//编辑离开提醒事件
function leave_alert() {
    let all_input = document.querySelectorAll('.modal input');
    for (let input of all_input) {
        input.addEventListener('input', () => {
            global.edit = 1;
        });
    }

    let all_select = document.querySelectorAll('.modal select');
    for (let select of all_select) {
        select.addEventListener('change', function () {
            global.edit = 1;
        });
    }
}

//数据导入和导出 ------------------------------------------------------------------------------

document.querySelector('#data-out').addEventListener('click', function () {
    if (global.product_name != "") {
        let data = {
            id: global.product_id,
            name: global.product_name,
        };

        fetch(`/product_out`, {
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
                    notifier.show('成功导出至 Excel 文件', 'success');
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

//批量导入
let fileBtn = document.getElementById('choose_file');

document.getElementById('data-in').addEventListener('click', function () {
    fileBtn.click();
});

fileBtn.addEventListener('change', () => {
    data_in(fileBtn, "将追加", "追加新数据，同时保留原数据", "批量导入");
});

//批量更新
let fileBtn_update = document.getElementById('choose_file2');

document.getElementById('data-update').addEventListener('click', function () {
    fileBtn_update.click();
});

fileBtn_update.addEventListener('change', () => {
    data_in(fileBtn_update, "将更新", "更新数据，原数据将被替换，请谨慎操作！", "批量更新");
});

function data_in(fileBtn, info1, info2, cate) {
    if (checkFileType(fileBtn)) {
        const fd = new FormData();
        fd.append('file', fileBtn.files[0]);
        fetch(`/product_in`, {
            method: 'POST',
            body: fd,
        })
            .then(res => res.json())
            .then(content => {
                if (content != -1 && content != -2) {
                    let rows = "<div class='table-container table-product'><table style='font-size: 12px;'><thead>"
                    let n = 1;
                    for (let item of content[0]) {
                        let arr_p = item.split("<`*_*`>");
                        let row;
                        if (n == 1) {
                            row = `<tr>`;
                            for (let i = 0; i < arr_p.length - 1; i++) {
                                row += `<th>${arr_p[i]}</th}>`;
                            }
                            row += "</tr></thead><tbody>";
                            n = 2;
                        } else {
                            row = `<tr>`;
                            for (let i = 0; i < arr_p.length - 1; i++) {
                                row += `<td>${arr_p[i]}</td>`;
                            }
                            row += "</tr>";
                        }

                        rows += row;
                    }
                    rows += "</tbody></table></div>";
                    document.querySelector('.modal-body').innerHTML = rows;

                    let message = content[2] > 50 ? " (仅显示前 50 条）" : "";
                    document.querySelector('.modal-title').innerHTML = `${content[1]} ${info1} ${content[2]} 条数据${message}：`;
                    document.querySelector('#modal-info').innerHTML = `${content[1]} ${info2}`;

                    global.eidt_cate = cate;

                    document.querySelector('.modal-dialog').style.cssText = "max-width: 1200px;"
                    document.querySelector('.modal').style.cssText = "display: block";
                    fileBtn.value = "";

                } else if (content == -1) {
                    notifier.show('缺少操作权限', 'danger');
                } else {
                    notifier.show('excel 表列数不符合', 'danger');
                }
            });
    }
    else {
        notifier.show('需要 excel 文件', 'danger');
    }
}
