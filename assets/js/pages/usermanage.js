(function () {
    document.querySelector('#function-set').classList.add('show-bottom');

    var table = {
        header: document.querySelector('#home-focus thead tr'),                 //排序可选,若不需要排序功能,则去掉此属性
        body: document.querySelector('#home-focus tbody'),
        page_input: document.querySelector('#focus-page-input'),
        page_first: document.getElementById("focus-first"),
        page_pre: document.querySelector('#focus-pre'),
        page_aft: document.querySelector('#focus-aft'),
        page_last: document.querySelector('#focus-last'),
        total_pages: document.querySelector('#focus-pages'),
        header_names: {                                                         //排序可选,若不需要排序,去掉此属性
            '用户名': 'name',
            '手机号': 'phone',
            '工作权限': 'rights',
            '确认状态': 'confirm',
        },
        url: "/users",
        post_data: {
            page: 1,
            sort: "confirm DESC",
        },

        row_fn: function (tr) {
            return `<tr><td>${tr.name}</td><td>${tr.phone}</td><td>${tr.rights}</td><td>${tr.confirm}</td></tr>`;
        },
    }

    // table_control(table);
})();