(function () {
    document.querySelector('#function-set').classList.add('show-bottom');

    var data = {
        container: '.table-users',
        header_names: {
            '序号': 'confirm',                                                     //排序可选,若不需要排序,去掉此属性
            '用户名': 'name',
            '手机号': 'phone',
            '工作权限': 'rights',
            '是否确认': 'confirm',
        },
        url: "/fetch_users",
        post_data: {
            name: '',
            sort: "confirm ASC",
            rec: 16,
        },

        row_fn: function (tr) {
            let con = "已确认";
            let color = "green";
            if (tr.confirm == false) {
                con = "未确认";
                color = "red";
            }
            return `<tr><td>${tr.num}</td><td>${tr.name}</td><td>${tr.phone}</td><td title='${tr.rights}'>${tr.rights}</td>
            <td><span class='confirm-info ${color}'>${con}</span></td></tr>`;
        },

        blank_row_fn: function () {
            return `<tr><td></td><td></td><td></td><td></td><td></td></tr>`;
        },
    }

    data_table.init(data);
    data_table.fetch_table(data.post_data);   //每次调用（如搜索功能），只需设置 post_data

    document.querySelector('#serach-button').addEventListener('click', function () {
        let search = document.querySelector('#search-input').value;
        Object.assign(data.post_data, { name: search });
        data_table.fetch_table(data.post_data);
    });

    var rights = {
        goods_in: ['采购进货', '销售退货', '库存调入', '库存盘盈', '入库查询', '库存查询'],
        goods_out: ['库存销售', '商品直销', '采购退货', '库存调出', '库存盘亏', '出库查询'],
        customers: ['客户管理', '供应商管理', '业务往来', '债务结算', '客户消费'],
        statistic: ['综合分析', '商品统计', '月度销售', '费用统计'],
        setup: ['功能设置', '用户设置', '销售人员', '仓库设置', '系统参数'],
        other: ['单据确认', '锁定修改', '导出数据'],
    };

    let rows = "";
    for (let i = 0; i < 16; i++) {
        let goods_in = rights.goods_in.hasOwnProperty(i) ? rights.goods_in[i] : "";
        let goods_out = rights.goods_out.hasOwnProperty(i) ? rights.goods_out[i] : "";
        let customers = rights.customers.hasOwnProperty(i) ? rights.customers[i] : "";
        let statics = rights.statistic.hasOwnProperty(i) ? rights.statistic[i] : "";
        let setup = rights.setup.hasOwnProperty(i) ? rights.setup[i] : "";
        let other = rights.other.hasOwnProperty(i) ? rights.other[i] : "";

        let goods_in_chk = goods_in != "" ? `<label class="check-radio"><input type="checkbox" class="goods_in" value="${goods_in}">
                            <span class="checkmark"></span>${goods_in}</label>` : "";

        let goods_out_chk = goods_out != "" ? `<label class="check-radio"><input type="checkbox" class="goods_out" value="${goods_out}">
                            <span class="checkmark"></span>${goods_out}</label>` : "";

        let customers_chk = customers != "" ? `<label class="check-radio"><input type="checkbox" class="customers" value="${customers}">
                            <span class="checkmark"></span>${customers}</label>` : "";

        let statics_chk = statics != "" ? `<label class="check-radio"><input type="checkbox" class="statics" value="${statics}">
                            <span class="checkmark"></span>${statics}</label>` : "";

        let setup_chk = setup != "" ? `<label class="check-radio"><input type="checkbox" class="setup" value="${setup}">
                            <span class="checkmark"></span>${setup}</label>` : "";

        let other_chk = other != "" ? `<label class="check-radio"><input type="checkbox" class="other" value="${other}">
                            <span class="checkmark"></span>${other}</label>` : "";


        rows += `<tr><td>${goods_in_chk}</td><td>${goods_out_chk}</td><td>${customers_chk}</td><td>${statics_chk}</td>
        <td>${setup_chk}</td><td>${other_chk}</td></tr>`;
    }

    document.querySelector('.rights-show table tbody').innerHTML = rows;

})();
