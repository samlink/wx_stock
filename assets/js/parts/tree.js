var tool_tree = function () {
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

    var selected_node, menu, zhezhao;
    var input_html = '<input type="text" id="input_node" value="新节点">';

    const lang = localStorage.getItem('language') || 'zh';

    //从数据库获取 tree 数据
    var fetch_tree = function (func) {
        fetch(`/stock/tree`)
            .then(response => response.json())
            .then(data => {
                if (lang == "en") {
                    data[0].node_name = "Bar";
                    data[1].node_name = "Pipe";

                    data[0].children.forEach(element => {
                        element.node_name = element.node_name.replace("圆钢", "Bar")
                            .replace("铜镍锡合金", "CNTin-Alloy ")
                            .replace("号钢", "Steel");
                    });

                    data[1].children.forEach(element => {
                        element.node_name = element.node_name.replace("无缝钢管", "Pipe").replace("套管接箍料", "Casing Coupling");
                    });
                }

                var tree = document.querySelector('#tree');
                tree.innerHTML = "";
                gener_tree(tree, data);

                var toggle = document.querySelectorAll(".item");

                for (let i = 0; i < toggle.length; i++) {
                    // 直接打开节点
                    toggle[i].classList.remove("item");
                    toggle[i].classList.add("item-down");
                    toggle[i].parentNode.querySelector(".nested").classList.add("active");
                }

                if (typeof func == "function") {
                    func();
                }
            });
    }

    var tree_init = function (data) {
        Object.assign(global, data);

        menu = document.querySelector('#context-menu');
        zhezhao = document.querySelector('#zhezhao');

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
    }

    //搜索树
    let tree_search = function (value) {
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
                leaf.parentNode.prepend(leaf);
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
                node.setAttribute('id', 't_' + data[i].num);
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

    return {
        tree_init: tree_init,
        fetch_tree: fetch_tree,
        tree_search: tree_search,
    }
}();
