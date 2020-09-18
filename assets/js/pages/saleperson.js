import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight, SPLITER } from '../parts/tools.mjs';

let global = {
    row_id: 0,
    edit: 0,
    eidt_cate: "",
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
    let search = document.querySelector('#search-input').value;
    Object.assign(table_data.post_data, { name: search });
    fetch_table();
});

//编辑用户数据 ------------------------------------

//编辑按钮
document.querySelector('#edit-button').addEventListener('click', function () {
    global.eidt_cate = "edit";
    let focus = document.querySelector('.table-users .focus');
    if (!focus) {
        notifier.show('请先选择人员', 'danger');
    }
    else {
        let name_save = focus.children[1].textContent;
        let phone_save = focus.children[2].textContent;
        let note_save = focus.children[3].textContent;
        global.row_id = focus.children[4].textContent;

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
        document.querySelector('.modal-body').innerHTML = control;
        document.querySelector('.modal-title').textContent = "编辑销售人员";
        document.querySelector('.modal-dialog').style.cssText = "max-width: 500px; margin-top: 240px;"
        document.querySelector('.modal').style.display = "block";
        document.querySelector('.modal-body input').focus();
        document.querySelector('.modal-body input').select();
        leave_alert();
    }
});

//增加按钮
document.querySelector('#add-button').addEventListener('click', function () {
    global.eidt_cate = "add";
    let control = `
                <form>
                    <div class="form-group">
                        <div class="form-label">
                            <label>姓名</label>
                        </div>
                        <input class="form-control input-sm has-value" type="text">
                    </div>
                    <div class="form-group">
                        <div class="form-label">
                            <label>电话</label>
                        </div>
                        <input class="form-control input-sm has-value" type="text">
                    </div>
                    <div class="form-group">
                        <div class="form-label">
                            <label>备注</label>
                        </div>
                        <input class="form-control input-sm has-value" type="text">
                    </div>
                </form>`;

    document.querySelector('.modal-body').innerHTML = control;
    document.querySelector('.modal-title').textContent = "增加销售人员";
    document.querySelector('.modal-dialog').style.cssText = "max-width: 500px; margin-top: 240px;"
    document.querySelector('.modal').style.display = "block";
    document.querySelector('.modal-body input').focus();
    leave_alert();
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

//提交按键
document.querySelector('#modal-sumit-button').addEventListener('click', function () {
    let all_input = document.querySelectorAll('.has-value');
    if (all_input[0].value != "") {

        let saler = "";

        for (let input of all_input) {
            saler += `${input.value}${SPLITER}`
        }

        saler += global.row_id;

        let data = {
            saler: saler,
            cate: global.eidt_cate,
        };

        fetch('/edit_saler', {
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
                    notifier.show('销售人员修改成功', 'success');
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
        notifier.show('姓名不能为空', 'danger');
    }

});

//删除按钮
document.querySelector('#del-button').addEventListener('click', function () {
    let focus = document.querySelector('.table-users .focus');
    if (!focus) {
        notifier.show('请选择用户', 'danger');
    }
    else {

        alert_confirm('确认删除 ' + focus.children[1].textContent + ' 吗？', {
            confirmCallBack: () => {
                let data = {
                    saler: focus.children[4].textContent,
                    cate: 'del',
                };

                fetch('/edit_saler', {
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
                            notifier.show('删除完成', 'success');
                        }
                        else {
                            notifier.show('权限不够，操作失败', 'danger');
                        }
                    });
            }
        });
    }
});

window.onbeforeunload = function (e) {
    document.querySelector('.modal-dialog').style.cssText = "";
}
