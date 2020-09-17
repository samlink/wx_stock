import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { getHeight } from '../parts/tools.mjs';

var selected_node;
var menu = document.querySelector('#context-menu');
var zhezhao = document.querySelector('#zhezhao');
var input_html = '<input type="text" id="input_node" value="新仓库">';

let all_li = document.querySelectorAll('li');
for (let li of all_li) {
    li.addEventListener('click', function () {
        // selected_node = this;

        for (let li of all_li) {
            li.classList.remove('selected');
        }
        this.classList.add('selected');
    })
}

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
        return show_menu(event, "block");

    }
    else if (selected_node.classList.contains('tree-title')) {

        return show_menu(event, "none");
    }
}

//显示右键菜单
function show_menu(event, display) {
    var lis = menu.querySelectorAll('li');
    lis[1].style.display = display;
    lis[2].style.display = display;

    menu.style.display = 'block';
    zhezhao.style.display = "block";

    menu.style.left = event.clientX - 10 + 'px';
    menu.style.top = event.clientY - 10 + 'px';

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
        tree_edit(has_input, selected_node);
    }
    else if (selected_node && event.target.tagName !== 'INPUT') {
        selected_node.classList.remove('selected');
        menu.style.display = 'none';
        zhezhao.style.display = "none";
    }
});

//右键菜单增加
document.querySelector('#context-add').addEventListener('click', function (event) {
    global.edit_cate = "增加";
    var new_li = document.createElement("li");

    if (selected_node.classList.contains('leaf')) {
        selected_node.classList.remove('leaf');
        selected_node.removeEventListener('click', leaf_click);

        var new_ul = document.createElement("ul");
        var new_span = document.createElement("SPAN");

        new_span.classList.add('item-down');
        new_span.setAttribute('data-num', selected_node.dataset.num);
        // selected_node.removeAttribute('data-num');
        new_span.innerHTML = selected_node.innerHTML;
        selected_node.innerHTML = "";

        new_ul.classList.add('nested', 'active');

        new_ul.appendChild(new_li);
        selected_node.appendChild(new_span);
        selected_node.appendChild(new_ul);

        new_span.addEventListener('click', function () {
            this.parentNode.querySelector(".nested").classList.toggle("active");
            this.classList.toggle("item-down");
            this.classList.toggle("item");
        });
    }
    else if (selected_node.classList.contains('item') ||
        selected_node.classList.contains('item-down')) {

        var next_node = selected_node.nextElementSibling;
        next_node.appendChild(new_li);

        if (!next_node.classList.contains('active')) {
            selected_node.classList.remove('item');
            selected_node.classList.add('item-down');
            next_node.classList.add('active');
        }
    }
    else if (selected_node.classList.contains('tree-title')) {

        var tree = document.querySelector('#tree');
        tree.appendChild(new_li);
    }

    new_li.classList.add('leaf');
    new_li.innerHTML = input_html;
    new_li.addEventListener('click', leaf_click);

    new_li.firstChild.focus();
    new_li.firstChild.select();

    zhezhao.style.display = "block";
});

//右键菜单编辑
document.querySelector('#context-edit').addEventListener('click', function (event) {
    var value = selected_node.innerHTML;
    global.edit_cate = "编辑";
    global.name_save = value;
    selected_node.innerHTML = '<input type="text" id="input_node" value="' + value + '">'
    selected_node.firstChild.focus();
    zhezhao.style.display = "block";
});

//右键菜单删除
document.querySelector('#context-del').addEventListener('click', function (event) {
    if (selected_node.classList.contains('leaf') ||
        selected_node.parentNode.querySelector('.leaf') === null) {
        let options = {
            confirmCallBack: function () {
                var num = {
                    pnum: selected_node.dataset.num,
                    node_name: ""
                };

                fetch("/tree_del", {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(num),
                }).then(res => res.json())
                    .then(data => {
                        if (data == 1) {
                            var parent_node = selected_node.parentNode;
                            if (parent_node) {
                                parent_node.removeChild(selected_node);
                                leaf_caret(parent_node);
                            }
                            // document.querySelector('.content').innerHTML = "";
                        }
                    });
            }
        }

        alert_confirm("删除后无法恢复，确认删除吗？", options);
    }
    else {
        notifier.show('有子节点，无法删除', 'danger');
    }

    zhezhao.style.display = "none";
});


