import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight } from '../parts/tools.mjs';

let global = {
    edit_cate: '',
    name_save: '',
    drag_id: 0,
    drag_name: '',
    to_id: 0,
    id_arr: [],
};

var selected_node;

//仓库部分-----------------------------------------------------------

fetch_house();

var menu = document.querySelector('#context-menu');
var zhezhao = document.querySelector('#zhezhao');
var input_html = '<input type="text" id="input_node" value="新仓库">';

//右键菜单
document.oncontextmenu = function (event) {
    var event = event || window.event;
    selected_node = event.target;

    if (selected_node.tagName == "LI") {
        let all_li = document.querySelectorAll('li');
        for (let li of all_li) {
            li.style.cssText = "";
        }
        selected_node.style.cssText = "background-color: #51adf6; color: white; z-index: 1001;";
        return show_menu(event, 1);
    }
    else if (selected_node.classList.contains('title')) {
        return show_menu(event, 2);
    }
}

//显示右键菜单
function show_menu(event, display) {
    var lis = menu.querySelectorAll('li');
    lis[0].style.display = display == 1 ? "none" : "block";
    lis[1].style.display = display == 1 ? "block" : "none";
    lis[2].style.display = display == 1 ? "block" : "none";

    menu.style.display = 'block';
    zhezhao.style.display = "block";

    menu.style.left = event.clientX - 10 + 'px';
    menu.style.top = event.clientY - 2 + 'px';

    return false;
}

//右键菜单点击事件
menu.addEventListener('click', function (event) {
    var event = event || window.event;
    this.style.display = 'none';
    event.stopPropagation();
});

//文档点击事件
document.addEventListener('click', function (event) {
    var has_input = document.querySelector('#input_node');
    if (has_input && event.target.tagName !== 'INPUT') {
        let id = global.edit_cate == "增加" ? 0 : Number(selected_node.getAttribute('data'));
        let data = {
            id: id,
            name: has_input.value,
            cate: global.edit_cate,
        }
        house_edit(data);
    }
    else if (selected_node && event.target.tagName !== 'INPUT') {
        selected_node.classList.remove('selected');
        menu.style.display = 'none';
        zhezhao.style.display = "none";
    }
});

//按键事件
document.addEventListener('keydown', function (event) {
    if (event && event.key == "Enter") {
        event.preventDefault();
        var has_input = document.querySelector('#input_node');
        if (has_input) {
            let id = global.edit_cate == "增加" ? 0 : Number(selected_node.getAttribute('data'));
            let data = {
                id: id,
                name: has_input.value,
                cate: global.edit_cate,
            }
            zhezhao.style.display = "none";

            house_edit(data);
        }
    }
    else if (event && event.key == "Escape") {
        var has_input = document.querySelector('#input_node');
        if (has_input && global.edit_cate == "编辑") {
            zhezhao.style.display = "none";
            has_input.parentNode.innerHTML = global.name_save;
        } else if (has_input && global.edit_cate == "增加") {
            var parent_node = has_input.parentNode.parentNode;
            parent_node.removeChild(has_input.parentNode);
            zhezhao.style.display = "none";
        } else {
            close_modal();  //关闭库位输入框
        }
    }
});

//右键菜单增加
document.querySelector('#context-add').addEventListener('click', function (event) {
    global.edit_cate = "增加";
    selected_node = document.createElement("li");
    selected_node.innerHTML = input_html;
    document.querySelector('#house-list').appendChild(selected_node);
    selected_node.style.cssText = 'z-index: 1001;';

    selected_node.firstChild.focus();
    selected_node.firstChild.select();

    zhezhao.style.display = "block";
});

//右键菜单编辑
document.querySelector('#context-edit').addEventListener('click', function (event) {
    global.edit_cate = "编辑";
    global.name_save = selected_node.textContent;
    selected_node.innerHTML = '<input type="text" id="input_node" value="' + selected_node.textContent + '">'
    // selected_node.style.cssText = 'z-index: 1001;';
    selected_node.firstChild.focus();
    zhezhao.style.display = "block";
});

//右键菜单删除
document.querySelector('#context-del').addEventListener('click', function (event) {
    let options = {
        confirmCallBack: function () {
            let data = {
                id: Number(selected_node.getAttribute('data')),
                name: "",
                cate: "删除",
            }

            house_edit(data);
        }
    }

    alert_confirm(`确认删除 ${selected_node.textContent} 吗？`, options);

    zhezhao.style.display = "none";
});

function house_edit(data) {
    fetch('/update_house', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            fetch_house();
            notifier.show('操作成功', 'success');
        });
}

function fetch_house() {
    fetch('/fetch_house')
        .then(response => response.json())
        .then(data => {
            if (data != -1) {
                var house = document.querySelector('#house-list');
                house.innerHTML = "";

                for (let d of data) {
                    var node = document.createElement('li');
                    node.setAttribute('data', d.id);
                    node.setAttribute('draggable', 'true');
                    node.textContent = d.name;

                    node.addEventListener('click', function (e) {
                        if (e.target.tagName != "INPUT") {
                            selected_node = this;

                            let lis = document.querySelectorAll('#house-list li');
                            for (let li of lis) {
                                li.style.cssText = "";
                            }

                            this.style.cssText = "background-color: #51adf6; color: white; z-index: 1001;"

                            house_click();
                        }
                    });

                    //以下均为拖拽事件
                    node.addEventListener('dragstart', function (e) {
                        e.stopPropagation();
                        let has_input = this.querySelector('input');
                        if (!has_input) {
                            global.id_arr = [];
                            let lists = document.querySelectorAll('#house-list li');
                            for (let li of lists) {
                                global.id_arr.push(li.getAttribute('data'));
                            }
                            global.drag_id = e.target.getAttribute('data');
                            global.drag_name = e.target.textContent;
                        }
                        else {
                            e.preventDefault();
                        }

                    });

                    node.addEventListener('dragover', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.style.cssText = "color: red; background-color: lightyellow; font-weight: 600;";
                    });

                    node.addEventListener('dragleave', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.style.cssText = "";
                    });

                    node.addEventListener('drop', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        global.to_id = e.target.getAttribute('data');

                        let drag_idx = global.id_arr.indexOf(global.drag_id);
                        let to_idx = global.id_arr.indexOf(global.to_id);
                        let position = drag_idx > to_idx ? "前" : "后";

                        alert_confirm(`确认将 ${global.drag_name} 移动到 ${e.target.textContent} ${position}吗？`,
                            {
                                confirmCallBack: () => {
                                    house_drag(drag_idx, to_idx);

                                }
                            });
                    });

                    house.appendChild(node);
                }
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }

        });
}

//拖拽信息传回后台数据库
function house_drag(drag_idx, to_idx) {
    arr_exchange(global.id_arr, drag_idx, to_idx);
    let data = global.id_arr.join(',');

    fetch("/house_drag", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then(res => res.json())
        .then(data => {
            if (data == 1) {
                fetch_house();
            }
            else {
                notifier.show('权限不够，无法修改', 'danger');
            }
        });
}

function arr_exchange(arr, index, tindex) {
    //如果当前元素在拖动目标位置的下方，先将当前元素从数组拿出，数组长度-1，我们直接给数组拖动目标位置的地方新增一个和当前元素值一样的元素，
    //我们再把数组之前的那个拖动的元素删除掉，所以要len+1
    if (index > tindex) {
        arr.splice(tindex, 0, arr[index]);
        arr.splice(index + 1, 1)
    }
    else {
        //如果当前元素在拖动目标位置的上方，先将当前元素从数组拿出，数组长度-1，我们直接给数组拖动目标位置+1的地方新增一个和当前元素值一样的元素，
        //这时，数组len不变，我们再把数组之前的那个拖动的元素删除掉，下标还是index
        arr.splice(tindex + 1, 0, arr[index]);
        arr.splice(index, 1)
    }
}

function house_click() {
    document.querySelector('.position-title').textContent = selected_node.textContent + " - 库位:";
    let id = Number(selected_node.getAttribute('data'));

    fetch("/fetch_position", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(id),
    }).then(res => res.json())
        .then(data => {
            if (data != -1) {
                // 按中文排序
                if (data != "") {
                    let position = data.split(",").sort((a, b) => a.localeCompare(b, 'zh'));
                    let html = "";
                    for (let p of position) {
                        html += `<p>${p}</p>`;
                    }

                    document.querySelector('.position-show').innerHTML = html;

                    let all_p = document.querySelectorAll('.position-show p');
                    for (let p of all_p) {
                        p.addEventListener('click', function () {
                            let ps = document.querySelectorAll('.position-show p');
                            for (let p of ps) {
                                p.classList.remove('selected');
                            }
                            this.classList.add('selected');
                        });
                    }
                }
            }
            else {
                notifier.show('权限不够，无法修改', 'danger');
            }
        });
}

//库位部分----------------------------------------------------------------------------

//增加按钮
document.querySelector('#add-button').addEventListener('click', function () {
    global.edit_cate = "add";
    if (selected_node) {

        let form = `<form>
                    <div class="form-group">
                        <div class="form-label">
                            <label>库位</label>
                        </div>
                        <input class="form-control input-sm has-value" type="text">
                    </div>
                </form>`;

        document.querySelector('.modal-body').innerHTML = form;
        document.querySelector('.modal-title').textContent = "增加库位";
        document.querySelector('.modal-dialog').style.cssText = "max-width: 500px; margin-top: 240px;"

        document.querySelector('.modal').style.display = "block";
        document.querySelector('.modal-body input').focus();
    }
    else {
        notifier.show('请先选择仓库', 'danger');
    }

});

//编辑按钮
document.querySelector('#edit-button').addEventListener('click', function () {
    global.edit_cate = "edit";
    let selected = document.querySelector('.position-show .selected');
    if (selected) {

        let form = `<form>
                    <div class="form-group">
                        <div class="form-label">
                            <label>库位</label>
                        </div>
                        <input class="form-control input-sm has-value" type="text" value=${selected.textContent}>
                    </div>
                </form>`;

        document.querySelector('.modal-body').innerHTML = form;
        document.querySelector('.modal-title').textContent = "编辑库位";
        document.querySelector('.modal-dialog').style.cssText = "max-width: 500px; margin-top: 240px;"

        document.querySelector('.modal').style.display = "block";
        document.querySelector('.modal-body input').focus();
        document.querySelector('.modal-body input').select();

    }
    else {
        notifier.show('请先选择库位', 'danger');
    }
});

//提交按键
document.querySelector('#modal-sumit-button').addEventListener('click', function () {
    let input = document.querySelector('.has-value');
    if (input && input.value != "") {
        if (global.edit_cate == "edit") {
            document.querySelector('.position-show .selected').textContent = input.value;
        } else if (global.edit_cate == "add") {
            let new_p = document.createElement("p");
            new_p.textContent = input.value;

            new_p.addEventListener('click', function () {
                let ps = document.querySelectorAll('.position-show p');
                for (let p of ps) {
                    p.classList.remove('selected');
                }
                this.classList.add('selected');
            })

            document.querySelector('.position-show').appendChild(new_p);
        }

        position_edit();
    }
    else {
        notifier.show('输入不能为空', 'danger');
    }
});

//删除按钮
document.querySelector('#del-button').addEventListener('click', function () {
    global.edit_cate = "del";
    let selected = document.querySelector('.position-show .selected');
    if (selected) {
        alert_confirm('确认删除 ' + selected.textContent + ' 吗？', {
            confirmCallBack: () => {
                selected.parentNode.removeChild(selected);
                position_edit();
            }
        });
    }
    else {
        notifier.show('请先选择库位', 'danger');
    }
});

function position_edit() {
    let all_position = document.querySelectorAll('.position-show p');
    let position = "";

    for (let p of all_position) {
        position += `${p.textContent},`
    }

    let data = {
        id: Number(selected_node.getAttribute("data")),
        name: position,
        cate: "",
    };

    fetch('/edit_position', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content == 1) {
                notifier.show('操作成功', 'success');
                if (global.edit_cate == "add") {
                    let input = document.querySelector('.has-value');
                    input.value = "";
                    input.focus();
                }
                else {
                    close_modal();
                }
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
}

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
    document.querySelector('.modal').style.display = "none";
    document.querySelector('#modal-info').innerHTML = "";
}

window.onbeforeunload = function (e) {
    document.querySelector('.modal-dialog').style.cssText = "";
}