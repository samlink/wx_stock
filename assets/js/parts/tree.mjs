import { notifier } from './notifier.mjs';
import { alert_confirm } from './alert.mjs';

var global = {
    tree_leaf: "",
    node_num: "",
    is_saved: true, //右侧表格编辑是否保存
    name_save: "",  //名称，ESC键复原用
    edit_cate: "",  //编辑类型，ESC键复原用
    drag_id: "",    //拖拽的 li 的 id
    home_id: "",    //拖入的 li 的 id
    drag_list: [],  //记住拖拽的所有 li，防止放置自身或子类
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
            tree.innerHTML = "";
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

            if (typeof global.fech_call == "function") {
                fech_call();
            }
        });
}

export var tree_init = function (data) {
    Object.assign(global, data);
    //页面点击事件
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

    //按键事件
    document.addEventListener('keydown', function (event) {
        if (event && event.key == "Enter") {        //回车键
            var has_input = document.querySelector('#input_node');
            tree_edit(has_input, selected_node);
        }
        else if (event && event.key == "Escape") {         //ESC 键
            var has_input = document.querySelector('#input_node');
            if (has_input && global.edit_cate == "编辑") {
                zhezhao.style.display = "none";
                has_input.parentNode.innerHTML = global.name_save;
            } else if (has_input && global.edit_cate == "增加") {
                var parent_node = has_input.parentNode.parentNode;
                parent_node.removeChild(has_input.parentNode);
                leaf_caret(parent_node);
                zhezhao.style.display = "none";
            }
        }
    });

    //右键菜单点击事件
    menu.addEventListener('click', function (event) {
        var event = event || window.event;
        selected_node.classList.remove('selected');
        this.style.display = 'none';
        event.stopPropagation();
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
        else if (selected_node.classList.contains('tree-title')) {

            return show_menu(event, "none");
        }
    }

    let tree_title = document.querySelector('.tree-title');
    tree_title.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.cssText = "color: red; font-weight: 600;";
    });

    tree_title.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.cssText = "";
    });

    tree_title.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.cssText = "";
        global.home_id = "#";
        alert_confirm("确认移动到根路径下吗？", { confirmCallBack: tree_drag });
    });
}

//搜索树
export function tree_search(value) {
    value = value.toLowerCase();
    var tree = document.querySelector('#tree');
    var spans = tree.querySelectorAll('span');
    var leaves = tree.querySelectorAll('.leaf');
    var items = tree.querySelectorAll('.item-down');

    //关闭打开的节点
    for (let item of items) {
        item.click();
    }

    for (let span of spans) {
        span.classList.remove('found-color');

        if (value != "" && span.innerText.toLowerCase().includes(value)) {
            span.classList.add('found-color');
            span.classList.remove('item');
            span.classList.add('item-down');
            span.nextElementSibling.classList.add('active');
            tree_change(span);
            find_root(span);
        }
    }

    for (let leaf of leaves) {
        leaf.classList.remove('found-color');
        if (value != "" && leaf.innerText.toLowerCase().includes(value)) {
            leaf.classList.add('found-color');
            leaf.parentNode.classList.add('active');
            leaf.parentNode.previousElementSibling.classList.remove('item');
            leaf.parentNode.previousElementSibling.classList.add('item-down');
            tree_change(leaf.parentNode);
            find_root(leaf.parentNode);
        }
    }
}

//茎转换为叶
function leaf_caret(parent_node) {
    if (parent_node.children.length == 0) {
        var pp_node = parent_node.parentNode;
        var num2 = pp_node.firstChild.dataset.num;
        pp_node.removeChild(parent_node);
        pp_node.innerHTML = pp_node.firstChild.innerHTML;
        pp_node.classList.add('leaf');
        pp_node.setAttribute('data-num', num2);
        pp_node.addEventListener('click', leaf_click);
    }
}

//搜索树时改变显示
function tree_change(node) {
    if (!node.parentNode.parentNode.hasAttribute('id')) {
        node.parentNode.parentNode.classList.add('active');
        node.parentNode.parentNode.previousElementSibling.classList.remove('item');
        node.parentNode.parentNode.previousElementSibling.classList.add('item-down');
        tree_change(node.parentNode.parentNode);        //递归调用
    }
}

//将搜索到的节点移动到最前面
function find_root(node) {
    let id = node.parentNode.getAttribute('id');
    if (id && id == "tree") {
        node.parentNode.insertAdjacentElement('afterbegin', node);
    }
    else {
        let node_new = node.parentNode;
        find_root(node_new);
    }
}

// 生成树
function gener_tree(tree_node, data) {
    if (data.length > 0) {
        for (let i in data) {
            var node = document.createElement('li');
            node.setAttribute('id', data[i].num);
            node.setAttribute('draggable', 'true');
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
                node.setAttribute('data-num', data[i].num);
                node.addEventListener('click', leaf_click);
            }

            //以下均为拖拽事件
            node.addEventListener('dragstart', function (e) {
                e.stopPropagation();
                let has_input = this.querySelector('input');
                if (!has_input) {
                    global.drag_id = e.target.id;
                    global.drag_list = [];
                    let list = this.querySelectorAll('li');
                    for (let item of list) {
                        global.drag_list.push(item);
                    }
                    global.drag_list.push(this);
                    global.drag_list.push(this.parentNode.parentNode);
                }
                else {
                    e.preventDefault();
                }

            });

            node.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.stopPropagation();

                let not_leaf = this.querySelector('span');
                if (not_leaf) {
                    not_leaf.style.cssText = "color: red; background-color: lightyellow; font-weight: 600;";
                    let opened = this.querySelector('.item-down');
                    if (!opened) {
                        not_leaf.click();
                    }
                }
                else {
                    this.style.cssText = "color: red; background-color: lightyellow; font-weight: 600;";
                }
            });

            node.addEventListener('dragleave', function (e) {
                e.preventDefault();
                e.stopPropagation();
                let not_leaf = this.querySelector('span');
                if (not_leaf) {
                    not_leaf.style.cssText = "";
                }
                else {
                    this.style.cssText = "";
                }
            });

            node.addEventListener('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();

                let not_leaf = this.querySelector('span');
                let name;
                if (not_leaf) {
                    not_leaf.style.cssText = "";
                    name = this.querySelector('span').textContent;
                }
                else {
                    this.style.cssText = "";
                    name = this.textContent;
                }

                if (global.drag_list.includes(this)) {
                    notifier.show('不能拖拽至此处', 'danger');
                    return;
                }

                global.home_id = this.getAttribute("id");
                alert_confirm("确认移动到 “" + name + "” 下吗？", { confirmCallBack: tree_drag });
            });

            tree_node.appendChild(node);
        }
        return tree_node;
    }
}

//拖拽信息传回后台数据库
function tree_drag() {
    let drag = document.getElementById(global.drag_id);
    let caret = drag.querySelector('span');
    let name = caret ? caret.textContent : drag.textContent;

    var num = {
        pnum: global.home_id,
        num: global.drag_id,
    };

    fetch("/tree_drag", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(num),
    }).then(res => res.json())
        .then(data => {
            if (data == 1) {
                fetch_tree(() => {
                    tree_search(name);
                });
            }
            else {
                notifier.show('权限不够，无法修改', 'danger');
            }
        });
}

// tree 叶节点点击调入内容
function leaf_click() {
    if (event.target.tagName == 'INPUT') {
        return false;
    }

    let self = this;
    if (global.node_num == this.dataset.num) {
        return false;
    }

    let get_new = function () {
        global.is_saved = true;
        global.tree_leaf = self.innerText;
        global.node_num = self.dataset.num;

        if (typeof global.leaf_click == "function") {
            global.leaf_click(global.node_num, self.textContent);
        }

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

//编辑节点，增加或编辑
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

//保存增加的数据到后台
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

//保存编辑的数据到后台
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
        }
    });
}

