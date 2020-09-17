import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight } from '../parts/tools.mjs';

let global = {
    edit_cate: '',
    name_save: '',
};

var selected_node;

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
            li.classList.remove('selected');
        }
        selected_node.classList.add('selected');
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
        var has_input = document.querySelector('#input_node');
        if (has_input) {
            let id = global.edit_cate == "增加" ? 0 : Number(selected_node.getAttribute('data'));
            let data = {
                id: id,
                name: has_input.value,
                cate: global.edit_cate,
            }
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
    selected_node.style.cssText = 'z-index: 1001;';
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
                let list = "";
                for (let d of data) {
                    list += `<li data='${d.id}'>${d.name}</li>`;
                }
                var house = document.querySelector('#house-list');
                house.innerHTML = list;

                let all_li = house.querySelectorAll('li');
                for (let li of all_li) {
                    li.addEventListener('click', function () {
                        const newLocal = this;

                        let lis = document.querySelector('#house-list').querySelectorAll('li');
                        for (let li of lis) {
                            li.classList.remove('selected');
                        }
                        newLocal.classList.add('selected');
                    });
                }
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }

        });
}
