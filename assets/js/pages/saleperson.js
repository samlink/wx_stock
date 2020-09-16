import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight } from '../parts/tools.mjs';

//设置菜单 
document.querySelector('#function-set').classList.add('show-bottom');

//设置表格行数、高度
let top_table = document.querySelector('.table-top').clientHeight;
let th_table = document.querySelector('.table-users thead').clientHeight;
let bottom_table = document.querySelector('.table-ctrl').clientHeight;

let get_height = getHeight(top_table, th_table, bottom_table) - 30;
let row_num = Math.floor(get_height / 30);  //30 是表格 css 高度，需根据 css 调整

//显示表格数据 ---------------------------------------
var data = {
    container: '.table-users',
    header_names: {
        '姓名': 'name',
        '手机号': 'phone',
        '备注': 'note',
    },
    url: "/pull_salers",
    post_data: {
        name: '',
        sort: "confirm ASC",
        rec: row_num,
    },
    edit: false,

    row_fn: function (tr) {
        return `<tr><td>${tr.num}</td><td>${tr.name}</td><td>${tr.phone}</td><td title='${tr.rights}'>${tr.rights}</td></tr>`;
    },

    blank_row_fn: function () {
        return `<tr><td></td><td></td><td></td><td></td></tr>`;
    },

}

table_init(data);
fetch_table(() => {
    let right_show = document.querySelector('.rights-show');
    let table_height = document.querySelector('.table-users').clientHeight;
    right_show.style.height = table_height;

}); 

//搜索用户
document.querySelector('#serach-button').addEventListener('click', function () {
    if (!table_data.edit) {
        let search = document.querySelector('#search-input').value;
        Object.assign(table_data.post_data, { name: search });
        fetch_table();
    }
});

//编辑用户数据 ------------------------------------
let confirm_save;  //取消时，恢复数据用

//编辑按钮
document.querySelector('#edit-button').addEventListener('click', function () {
    let focus = document.querySelector('.table-users .focus');
    if (!focus) {
        notifier.show('请先选择用户', 'danger');
    }
    else {
        let name = focus.children[1].textContent;
        if (name == "admin") {
            notifier.show('不能编辑管理员信息', 'danger');
        }
        else {
            document.querySelector('#edit-button').classList.add("hide");
            document.querySelector('#del-button').classList.add("hide");
            document.querySelector('#sumit-button').classList.remove("hide");
            document.querySelector('#cancel-button').classList.remove("hide");

            for (let mark of marks) {
                mark.removeAttribute("style");
            }

            for (let check of all_checks) {
                check.disabled = false;
            }

            table_data.edit = true;

            confirm_save = focus.children[4].textContent;

            let confirm = confirm_save == "未确认" ? "" : "checked";

            focus.children[4].innerHTML = `<label class="check-radio"><input type="checkbox" ${confirm}>
                                                <span class="checkmark"></span></label>`;

            focus.children[4].setAttribute("style", "padding-top: 0;");
        }
    }
});

//取消按钮
document.querySelector('#cancel-button').addEventListener('click', function () {
    let focus = document.querySelector('.table-users .focus');
    document.querySelector('#edit-button').classList.remove("hide");
    document.querySelector('#del-button').classList.remove("hide");
    document.querySelector('#sumit-button').classList.add("hide");
    document.querySelector('#cancel-button').classList.add("hide");

    for (let mark of marks) {
        mark.setAttribute("style", "background: lightgrey; border: none;")
    }

    for (let check of all_checks) {
        check.disabled = true;
    }

    table_data.edit = false;

    let confirm = confirm_save == "未确认" ? '<span class="confirm-info red">未确认</span>' : '<span class="confirm-info green">已确认</span>';

    focus.children[4].innerHTML = confirm;
    focus.children[4].removeAttribute("style");

    focus.click();
});

//提交按钮
document.querySelector('#sumit-button').addEventListener('click', function () {
    let focus = document.querySelector('.table-users .focus');
    let confirm = focus.children[4].querySelector('input').checked;
    let rights_checks = document.querySelectorAll('.rights-show tbody input[type=checkbox');
    let rights = "";
    for (let check of rights_checks) {
        if (check.checked == true) {
            rights += check.value + "，";
        }
    }

    let data = {
        name: focus.children[1].textContent,
        confirm: confirm,
        rights: rights,
    };

    fetch("/edit_user", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content == 1) {
                confirm_save = confirm ? '已确认' : '未确认';
                focus.children[3].innerHTML = rights;
                focus.children[3].setAttribute("title", rights);
                document.querySelector('#cancel-button').click();
                notifier.show('用户修改成功', 'success');
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
});

//删除按钮
document.querySelector('#del-button').addEventListener('click', function () {
    let focus = document.querySelector('.table-users .focus');
    if (!focus) {
        notifier.show('请选择用户', 'danger');
    }
    else {
        let name = focus.children[1].textContent;
        if (name == "admin") {
            notifier.show('无法删除管理员', 'danger');
        }
        else if (name == document.querySelector('#user-name').textContent) {
            notifier.show('无法删除用户自己', 'danger');
        }
        else {
            alert_confirm('确认删除用户 ' + name + ' 吗？', {
                confirmCallBack: () => {
                    let data = {
                        name: name,
                    }

                    fetch('/del_user', {
                        method: 'post',
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data),
                    })
                        .then(response => response.json())
                        .then(content => {
                            if (content == 1) {
                                fetch_table(table_data.post_data);
                                notifier.show('用户删除完成', 'success');
                            }
                            else {
                                notifier.show('权限不够，操作失败', 'danger');
                            }
                        });
                }
            });
        }
    }
});

