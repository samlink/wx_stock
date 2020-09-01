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
            rec: 15,
        },

        row_fn: function (tr) {
            return `<tr><td>${tr.name}</td><td>${tr.phone}</td><td title='${tr.rights}'>${tr.rights}</td><td>${tr.confirm}</td></tr>`;
        },
    }

    data_table.init(data);
    data_table.fetch_table(data.post_data);   //每次调用（如自动完成功能），只需设置 post_data

    document.querySelector('#serach-button').addEventListener('click', function () {
        let search = document.querySelector('#search-input').value;
        Object.assign(data.post_data, { name: search });
        data_table.fetch_table(data.post_data);
    });
})();
