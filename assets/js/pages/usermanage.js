(function () {
    document.querySelector('#function-set').classList.add('show-bottom');

    var data = {
        container: '.table-users',
        header_names: {                                                         //排序可选,若不需要排序,去掉此属性
            '用户名': 'name',
            '手机号': 'phone',
            '工作权限': 'rights',
            '确认状态': 'confirm',
        },
        url: "/fetch_users",
        post_data: {
            name: '',
            sort: "confirm ASC",
        },

        row_fn: function (tr) {
            return `<tr><td>${tr.name}</td><td>${tr.phone}</td><td title='${tr.rights}'>${tr.rights}</td><td>${tr.confirm}</td></tr>`;
        },
    }

    table.init(data);
    table.fetch_table(data)
    // table_control(table);
})();
