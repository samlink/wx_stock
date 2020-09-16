import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight } from '../parts/tools.mjs';

let global = {
    row_id: 0,
    edit: 0,
}
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
        sort: "name ASC",
        rec: row_num,
    },
    edit: false,

    row_fn: function (tr) {
        return `<tr><td>${tr.num}</td><td>${tr.name}</td><td>${tr.phone}</td>
                <td title='${tr.note}'>${tr.note}</td><td hidden>${tr.id}</td></tr>`;
    },

    blank_row_fn: function () {
        return `<tr><td></td><td></td><td></td><td></td><td hidden></td></tr>`;
    },
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

//编辑用户数据 ------------------------------------
let confirm_save;  //取消时，恢复数据用

//编辑按钮
document.querySelector('#edit-button').addEventListener('click', function () {
    let focus = document.querySelector('.table-users .focus');
    if (!focus) {
        notifier.show('请先选择人员', 'danger');
    }
    else {
        let name_save = focus.children[1].textContent;
        let phone_save = focus.children[2].textContent;
        let note_save = focus.children[3].textContent;

        let control = `
                <form>
                    <div class="form-group">
                        <div class="form-label">
                            <label>姓名</label>
                        </div>
                        <input class="form-control input-sm has-value" type="text" value=${name_save}>
                    </div>
                    <div class="form-group">
                        <div class="form-label">
                            <label>电话</label>
                        </div>
                        <input class="form-control input-sm has-value" type="text" value=${phone_save}>
                    </div>
                    <div class="form-group">
                        <div class="form-label">
                            <label>备注</label>
                        </div>
                        <input class="form-control input-sm has-value" type="text" value=${note_save}>
                    </div>
                </form>`;

        global.row_id = focus.children[4].textContent;
        console.log(global.row_id);
        document.querySelector('.modal-body').innerHTML = control;
        document.querySelector('.modal-title').textContent = "编辑销售人员";
        document.querySelector('.modal-dialog').style.cssText = "max-width: 500px; margin-top: 260px;"
        document.querySelector('.modal').style.display = "block";
        document.querySelector('.modal-body input').focus();
        leave_alert();
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

function leave_alert() {
    let all_input = document.querySelectorAll('.modal input');
    for (let input of all_input) {
        input.addEventListener('input', () => {
            global.edit = 1;
        });
    }
}

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

window.onbeforeunload = function (e) {
    document.querySelector('.modal-dialog').style.cssText = "";
}
