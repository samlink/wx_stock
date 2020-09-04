import { notifier } from './notifier.mjs';
import { alert_confirm } from './alert.mjs';

var global = {
    tree_leaf: "",
    node_num: "",
    is_saved: true,
};

var selected_node;
var input_html = '<input type="text" id="input_node" value="新节点">';

var menu = document.querySelector('#context-menu');
var zhezhao = document.querySelector('#zhezhao');

//从数据库获取 tree 数据
export var fetch_tree = function () {
    fetch('/tree')
        .then(response => response.json())
        .then(data => {
            var tree = document.querySelector('#tree');
            gener_tree(tree, data);

            var toggle = document.querySelectorAll(".item");

            for (let i = 0; i < toggle.length; i++) {
                toggle[i].addEventListener('click', function (event) {
                    if (event.target.tagName !== 'INPUT') {
                        this.parentNode.querySelector(".nested").classList.toggle("active");
                        this.classList.toggle("item-down");
                        this.classList.toggle("item");
                    }
                });
            }

            var leaves = document.querySelectorAll('.leaf');

            for (let leaf of leaves) {
                leaf.addEventListener('click', leaf_click);
            }
        });
}

export var tree_event = function () {
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

    document.onkeydown = function (event) {
        if (event && event.keyCode == 13) {
            var has_input = document.querySelector('#input_node');
            tree_edit(has_input, selected_node);
        }
    }

    menu.addEventListener('click', function (event) {
        var event = event || window.event;
        selected_node.classList.remove('selected');
        this.style.display = 'none';
        event.stopPropagation();
    });

    document.querySelector('#context-add').addEventListener('click', function (event) {
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
        else if (selected_node.classList.contains('sidebar') ||
            selected_node.tagName == 'LI' && selected_node.querySelector('.leaf')) {

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

    document.querySelector('#context-edit').addEventListener('click', function (event) {
        var value = selected_node.innerHTML;
        selected_node.innerHTML = '<input type="text" id="input_node" value="' + value + '">'
        selected_node.firstChild.focus();
        zhezhao.style.display = "block";
    });

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
                                parent_node.removeChild(selected_node);

                                if (parent_node.children.length == 0) {
                                    var pp_node = parent_node.parentNode;
                                    var num2 = pp_node.firstChild.dataset.num;
                                    pp_node.removeChild(parent_node);
                                    pp_node.innerHTML = pp_node.firstChild.innerHTML;
                                    pp_node.classList.add('leaf');
                                    pp_node.setAttribute('data-num', num2);
                                    pp_node.addEventListener('click', leaf_click);
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

    //右键菜单
    document.oncontextmenu = function (event) {
        var event = event || window.event;
        selected_node = event.target || event.srcElement;

        if (selected_node.classList.contains('leaf') ||
            selected_node.classList.contains('item') ||
            selected_node.classList.contains('item-down')) {

            selected_node.classList.add('selected');
            return show_menu(event, "block");

        }
        else if (selected_node.classList.contains('sidebar') ||
            selected_node.tagName == 'LI' && selected_node.querySelector('.leaf')) {

            return show_menu(event, "none");
        }
    }
}

// 生成树
function gener_tree(tree_node, data) {
    if (data.length > 0) {
        for (let i in data) {
            var node = document.createElement('li');
            if (data[i].children.length > 0) {
                node.innerHTML = '<span class="item" data-num="' + data[i].num + '">' + data[i].node_name + '</span>';
                var ul = document.createElement('ul');
                ul.classList.add('nested');
                var child = gener_tree(ul, data[i].children);
                node.appendChild(child);
            }
            else {
                node.innerText = data[i].node_name;
                node.classList.add('leaf');
                node.setAttribute('data-num', data[i].num)
            }

            tree_node.appendChild(node);
        }
        return tree_node;
    }
}

// tree 叶节点点击调入内容
function leaf_click() {
    if (event.target.tagName == 'INPUT') {
        return false;
    }

    let self = this;
    if (global.node_num == this.dataset.num) {          //全局变量， 在 init.js 中定义
        // match_screen();
        return false;
    }

    let get_new = function () {
        global.is_saved = true;
        global.tree_leaf = self.innerText;
        global.node_num = self.dataset.num;

        var num = {
            num: global.node_num,
        }
        alert("加载商品");
        // fetch_content(num);  //获取商品信息

        var leaves = document.querySelectorAll('.leaf');
        for (let leaf of leaves) {
            leaf.classList.remove('is-selected');
        }

        self.classList.add('is-selected');
    }

    if (!global.is_saved) {
        let options = {
            confirmCallBack: get_new
        }

        alert_confirm('编辑还未保存，是否加载新内容？', options);
    }
    else {
        get_new();
    }
}

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

function tree_edit(has_input, selected_node) {
    if (has_input) {
        zhezhao.style.display = "none";
        var has_num = "";
        if (selected_node.dataset.num) {
            has_num = selected_node.dataset.num;
        }
        var num = {
            pnum: has_num,
            node_name: has_input.value,
        };

        if (has_input.parentNode.dataset.num) {
            save_edit(num);
        }
        else {
            save_add(num, has_input.parentNode);
        }

        has_input.parentNode.innerHTML = has_input.value;
    }
}

function save_add(num, new_node) {
    fetch("/tree_add", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(num),
    }).then(response => response.json())
        .then(data => {
            new_node.setAttribute('data-num', data);
            new_node.click();
        });
}

function save_edit(num) {
    fetch("/tree_edit", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(num),
    }).then(response => {
        if (response.ok && global.node_num == num.pnum) {
            global.tree_leaf = num.node_name;
            // global.title_box.innerHTML = global.tree_leaf + '<span class="edit-time">' + global.edit_time + ' 修改</span>';
        }
    });
}

