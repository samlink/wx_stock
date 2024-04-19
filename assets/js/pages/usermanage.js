let page_usermanage = function () {
    //设置表格行数、高度
    let get_height = getHeight() - 178;
    let row_num = Math.floor(get_height / 30);  //30 是表格 css 高度，需根据 css 调整

    //显示表格数据 ---------------------------------------

    var data = {
        container: '.table-users',
        header_names: {
            '序号': 'confirm',                                                     //排序可选,若不需要排序,去掉此属性
            '用户名': 'name',
            '职务': 'duty',
            '手机号': 'phone',
            '区域': 'area',
            '工作权限': 'rights',
            '是否确认': 'confirm',
        },
        url: `/pull_users`,
        post_data: {
            id: '',
            name: '',
            sort: "confirm ASC, duty DESC",
            rec: row_num,
            cate: '',
        },
        edit: false,

        row_fn: function (tr) {
            let con = "已确认";
            let color = "green";
            if (tr.confirm == false) {
                con = "未确认";
                color = "red";
            }

            return `<tr><td>${tr.num}</td><td>${tr.name}</td>
                <td>${tr.duty}</td><td>${tr.phone}</td><td>${tr.area}</td>
                <td title='${tr.rights}'>${tr.rights}</td><td><span class='confirm-info ${color}'>${con}</span></td></tr>`;
        },

        blank_row_fn: function () {
            return `<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
        },

        row_click: function (tr) {
            document.querySelector('.rights-top').textContent = `工作权限 - ${tr.children[1].textContent}：`;
            let rights = tr.children[5].textContent;
            let rights_arr = rights.split("，");
            let rights_checks = document.querySelectorAll('.rights-show table input[type=checkbox');
            for (let check of rights_checks) {
                check.checked = false;
                check.parentNode.removeAttribute("style");
            }
            for (let right of rights_arr) {
                for (let check of rights_checks) {
                    if (right == check.value) {
                        check.checked = true;
                        check.parentNode.setAttribute("style", "font-weight: 600;color:#36ad82");
                        break;
                    }
                }
            }
        }
    }

    tool_table.table_init(data);
    tool_table.fetch_table(() => {
        let right_show = document.querySelector('.rights-show');
        let table_height = document.querySelector('.table-users').clientHeight;
        right_show.style.height = table_height;

    });   //每次调用（如搜索功能），只需设置 post_data

    //搜索用户
    document.querySelector('#serach-button').addEventListener('click', function () {
        if (!tool_table.table_data().edit) {
            let search = document.querySelector('#search-input').value;
            Object.assign(tool_table.table_data().post_data, { name: search });
            tool_table.fetch_table();
        }
    });

    //用户权限显示 ---------------------------------------

    var rights = {
        goods_buy: ['材料采购', '采购查询'],
        goods_sale: ['商品销售', '销售查询', '跨区查库存', '财务开票'],
        goods_manage: ['库存状态', '采购入库', '销售出库', '调整库存', '入库查询', '出库查询', '调库查询'],
        customers: ['客户管理', '供应商管理'],
        statics: ['入库明细', '出库明细', '业务往来'],
        setup: ['用户设置', '库存设置', '单据审核', "反审单据", '批量导入', '导出数据'],
    };

    let rows = "";
    for (let i = 0; i < row_num; i++) {
        let goods_buy = rights.goods_buy.hasOwnProperty(i) ? rights.goods_buy[i] : "";
        let goods_sale = rights.goods_sale.hasOwnProperty(i) ? rights.goods_sale[i] : "";
        let goods_manage = rights.goods_manage.hasOwnProperty(i) ? rights.goods_manage[i] : "";
        let customers = rights.customers.hasOwnProperty(i) ? rights.customers[i] : "";
        let statics = rights.statics.hasOwnProperty(i) ? rights.statics[i] : "";
        let setup = rights.setup.hasOwnProperty(i) ? rights.setup[i] : "";

        let goods_buy_chk = goods_buy != "" ? `<label class="check-radio"><input type="checkbox" class="um_goods_buy" value="${goods_buy}">
                            <span class="checkmark"></span>${goods_buy}</label>` : "";

        let goods_sale_chk = goods_sale != "" ? `<label class="check-radio"><input type="checkbox" class="um_goods_sale" value="${goods_sale}">
                            <span class="checkmark"></span>${goods_sale}</label>` : "";

        let goods_manage_chk = goods_manage != "" ? `<label class="check-radio"><input type="checkbox" class="um_goods_manage" value="${goods_manage}">
                            <span class="checkmark"></span>${goods_manage}</label>` : "";

        let customers_chk = customers != "" ? `<label class="check-radio"><input type="checkbox" class="um_customers" value="${customers}">
                            <span class="checkmark"></span>${customers}</label>` : "";

        let statics_chk = statics != "" ? `<label class="check-radio"><input type="checkbox" class="um_statics" value="${statics}">
                            <span class="checkmark"></span>${statics}</label>` : "";

        let setup_chk = setup != "" ? `<label class="check-radio"><input type="checkbox" class="um_setup" value="${setup}">
                            <span class="checkmark"></span>${setup}</label>` : "";

        rows += `<tr><td>${goods_buy_chk}</td><td>${goods_sale_chk}</td><td>${goods_manage_chk}</td><td>${customers_chk}</td>
            <td>${statics_chk}</td><td>${setup_chk}</td></tr>`;
    }

    document.querySelector('.rights-show table tbody').innerHTML = rows;

    Object.keys(rights).forEach(function (key) {
        document.querySelector('#um_' + key).addEventListener('click', function () {
            let cate = document.querySelector('#um_' + key);
            let all = document.querySelectorAll('.um_' + key);
            for (let item of all) {
                item.checked = cate.checked ? true : false;
            }
        });
    });

    let all_checks = document.querySelectorAll('.rights-show table input[type=checkbox]');
    for (let check of all_checks) {
        check.disabled = true;
    }

    let marks = document.querySelectorAll('.rights-show .checkmark');
    for (let mark of marks) {
        mark.setAttribute("style", "background: lightgrey; border: none;");
    }

    //编辑用户数据 -----------------------------------------------------------

    let confirm_save, select_save;  //取消时，恢复数据用

    //编辑按钮
    document.querySelector('#edit-button').addEventListener('click', function () {
        let focus = document.querySelector('.table-users .focus');
        if (!focus) {
            notifier.show('请先选择用户', 'danger');
        } else {
            document.querySelector('#edit-button').classList.add("hide");
            document.querySelector('#del-button').classList.add("hide");
            document.querySelector('#sumit-button').classList.remove("hide");
            document.querySelector('#cancel-button').classList.remove("hide");

            for (let mark of marks) {
                mark.removeAttribute("style");
            }

            for (let check of all_checks) {
                check.disabled = false;
            }

            tool_table.table_data().edit = true;

            confirm_save = focus.children[6].textContent;
            select_save = focus.children[2].textContent;

            let select = "<select class='select-sm'>";
            let user_id = document.querySelector('#user-name').textContent.split('　')[1];
            let options = user_id == "admin" ? ["总经理", "主管", "销售", "库管", "质检", "财务"] : ["主管", "销售", "库管", "质检", "财务"];
            for (let value of options) {
                let selected = value == select_save ? 'selected' : '';
                select += `<option value="${value}" ${selected}>${value}</option>`;
            }
            select += "</select>";

            focus.children[2].innerHTML = select;

            let confirm = confirm_save == "未确认" ? "" : "checked";

            focus.children[6].innerHTML = `<label class="check-radio"><input type="checkbox" ${confirm}>
                                                <span class="checkmark"></span></label>`;

            focus.children[6].setAttribute("style", "padding-top: 0;");
        }
    });

    //取消按钮
    document.querySelector('#cancel-button').addEventListener('click', function () {
        let focus = document.querySelector('.table-users .focus');
        document.querySelector('#edit-button').classList.remove("hide");
        document.querySelector('#del-button').classList.remove("hide");
        document.querySelector('#sumit-button').classList.add("hide");
        document.querySelector('#cancel-button').classList.add("hide");

        for (let mark of marks) {
            mark.setAttribute("style", "background: lightgrey; border: none;");
        }

        for (let check of all_checks) {
            check.disabled = true;
        }

        tool_table.table_data().edit = false;

        focus.children[2].innerHTML = select_save;

        let confirm = confirm_save == "未确认" ? '<span class="confirm-info red">未确认</span>' : '<span class="confirm-info green">已确认</span>';

        focus.children[6].innerHTML = confirm;
        focus.children[6].removeAttribute("style");

        focus.click();
    });

    //提交按钮
    document.querySelector('#sumit-button').addEventListener('click', function () {
        let focus = document.querySelector('.table-users .focus');
        select_save = focus.querySelector('select').value;
        let confirm = focus.children[6].querySelector('input').checked;
        let rights_checks = document.querySelectorAll('.rights-show tbody input[type=checkbox');
        let rights = "";
        for (let check of rights_checks) {
            if (check.checked == true) {
                rights += check.value + "，";
            }
        }

        let data = {
            name: focus.children[1].textContent,
            duty: select_save,
            confirm: confirm,
            rights: rights,
        };

        fetch(`/edit_user`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(content => {
                if (content == 1) {
                    confirm_save = confirm ? '已确认' : '未确认';
                    focus.children[5].innerHTML = rights;
                    focus.children[5].setAttribute("title", rights);
                    document.querySelector('#cancel-button').click();
                    notifier.show('用户修改成功', 'success');
                } else {
                    notifier.show('权限不够，操作失败', 'danger');
                }
            });
    });

    //删除按钮
    document.querySelector('#del-button').addEventListener('click', function () {
        let focus = document.querySelector('.table-users .focus');
        if (!focus) {
            notifier.show('请选择用户', 'danger');
        } else {
            let name = focus.children[1].textContent;
            if (focus.children[2].textContent == "总经理") {
                notifier.show('无法删除超级用户', 'danger');
            } else if (name == document.querySelector('#user-name').textContent) {
                notifier.show('无法删除用户自己', 'danger');
            } else {
                alert_confirm('确认删除用户 ' + name + ' 吗？', {
                    confirmCallBack: () => {
                        let data = {
                            name: name,
                        }

                        fetch(`/del_user`, {
                            method: 'post',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(data),
                        })
                            .then(response => response.json())
                            .then(content => {
                                if (content == 1) {
                                    tool_table.fetch_table(tool_table.table_data().post_data);
                                    notifier.show('用户删除完成', 'success');
                                } else {
                                    notifier.show('权限不够，操作失败', 'danger');
                                }
                            });
                    }
                });
            }
        }
    });
}();
