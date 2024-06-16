var service = function () {
    var table_fields;

    /**
     * 根据显示字段创建表头
     * @param {} table_container 表格容器
     * @param {} custom_fields 自定义字段数组 [{name:'序号', width: 3}...]
     * @param {} table_fields  自动生成字段 [{field_name:'日期', show_name:'日期', data_type:'文本' ...}...]
     * @param {} last_fields  自定义表格最后部分的字段数组 [{name:'库存', field: '库存', width: 3}...]
     * @param {} table_name  表名，为了避免联合查询时出现名称冲突
     */
    let build_table_header = function (table_container, custom_fields, table_fields, last_fields, table_name) {
        let all_width = 0;
        for (let item of custom_fields) {
            all_width += item.width;
        }

        if (last_fields) {
            for (let item of last_fields) {
                all_width += item.width;
            }
        }

        for (let item of table_fields) {
            all_width += item.show_width;
        }

        let table_width = table_container.clientWidth;
        let width_raio = table_width / all_width;
        let row = "";

        //当可用屏幕宽度小于字段总宽度的18倍时，则按实际px显示，这样会横向滚动
        if (width_raio < 18) {
            for (let item of custom_fields) {
                row += `<th width='${item.width * 18}px'>${item.name}</th>`;
            }

            table_container.style.width = table_width;
            table_container.querySelector('.table-ctrl').style.cssText = `
            position: absolute;
            width: ${table_width + 2}px;
            margin-top: 11px;
            border: 1px solid #edf5fb;
            margin-left: -2px;`;
        } else {
            for (let item of custom_fields) {
                row += `<th width='${item.width * 100 / all_width}%'>${item.name}</th>`;
            }
        }

        let header_names = {};
        for (let th of custom_fields) {
            header_names[th.name] = th.field;
        }

        for (let th of table_fields) {
            row += width_raio > 18 ? `<th width="${(th.show_width * 100 / all_width).toFixed(1)}%">${th.show_name}</th>` :
                `<th width="${th.show_width * 18}px">${th.show_name}</th>`;

            header_names[th.show_name] = `${table_name}.${th.field_name}`;
        }

        if (last_fields) {
            for (let item of last_fields) {
                row += width_raio < 18 ? `<th width='${item.width * 18}px'>${item.name}</th>` : `<th width='${item.width * 100 / all_width}%'>${item.name}</th>`;
                header_names[item.name] = item.field;
            }
        }

        return {
            th_row: row,
            header_names: header_names,
        };
    }

    /**
     * 计算钢材理论重量
     * @param {
     * data
     * long: 长度，单位毫米，如 7688，
     * num: 支数，
     * name: 名称，如圆钢或无缝钢管，
     * cz: 材质，如 17-4，
     * gg: 规格，如 120 或 123*80}
     * @returns 两位小数的字符串
     */
    let calc_weight = function (data) {
        let tech, cz = data.cz.trim();
        if (cz == "718") {
            tech = 1.05;
        } else if (cz == "17-4" || cz == "Super13Cr") {
            tech = 1.0064;
        } else {
            tech = 1;
        }

        let weight = 0;
        if (data.name == "圆钢") {
            weight = data.gg * data.gg * 0.00617 * data.long * data.num * tech / 1000;
        } else {
            let pipe = data.gg.split('*');
            weight = 0.02466 * pipe[1] * (pipe[0] - pipe[1]) * data.long * data.num * tech / 1000;
        }

        return weight.toFixed(1);
    }

    //保存时，读取头部字段内容
    let build_save_header = function (all_values, table_fields) {
        let n = 0;
        let save_str = "";
        for (let f of table_fields) {
            if (f.data_type == "文本") {
                save_str += `${all_values[n].value}${SPLITER}`;
            } else if (f.data_type == "整数" || f.data_type == "实数") {
                let value = all_values[n].value ? all_values[n].value : 0;
                save_str += `${value}${SPLITER}`;
            } else {
                save_str += `${all_values[n].checked ? "是" : "否"}${SPLITER}`;
            }
            n++;
        }
        return save_str;
    }

    // 保存时，读取表格明细，n 为去除隐藏列及序号列的个数
    let build_save_items = function (name, row, show_names) {
        let n = show_names.findIndex(item => item.name == name);
        if (n == -1) return "";
        let save_str = "";
        let len = show_names.length;
        for (let i = n; i < len; i++) {
            if (show_names[i].is_save) {
                if (show_names[i].type == "autocomplete" && show_names[i].save && show_names[i].save != "id") {
                    let value = row.querySelector(`.${show_names[i].class}`).value;
                    save_str += `${value}${SPLITER}`;
                } else if (show_names[i].type == "autocomplete") {
                    let value = row.querySelector(`.${show_names[i].class}`).getAttribute('data').split(SPLITER)[0];
                    save_str += `${value}${SPLITER}`;
                } else if (show_names[i].type == "普通输入" || show_names[i].type == "下拉列表") {     // 下拉列表和二值选一未测试
                    let value = row.querySelector(`.${show_names[i].class}`).value;
                    if (!value) value = row.querySelector(`.${show_names[i].class}`).textContent;
                    save_str += `${value.trim()}${SPLITER}`;
                } else {
                    let value = row.querySelector(`.${show_names[i].class}`).checked ? "是" : "否";
                    save_str += `${value}${SPLITER}`;
                }
            }
        }
        return save_str;
    }

    // 放置提交审核按钮, 在单据头部
    let set_sumit_shen = function () {
        let sumit_shen = document.createElement("Button");
        sumit_shen.setAttribute('id', 'sumit-shen');
        sumit_shen.classList.add("btn-info");
        sumit_shen.classList.add("btn");
        sumit_shen.classList.add("btn-sm");
        sumit_shen.classList.add("button-shen");
        sumit_shen.textContent = '提交审核';
        document.querySelector('.fields-show').appendChild(sumit_shen);
    }

    // 审核单据
    let make_formal = function (data) {
        if (data.button.textContent.trim() == "已审核") {
            return false;
        }

        if (data.dh == "新单据" || data.edited) {
            notifier.show('请先保存单据', 'danger');
            return false;
        }

        if (document.querySelector('#sumit-shen') &&
            document.querySelector('#sumit-shen').textContent == "提交审核") {
            notifier.show('该单还未提交审核', 'danger');
            return false;
        }

        alert_confirm("确认审核吗？", {
            confirmText: "确认",
            cancelText: "取消",
            confirmCallBack: () => {
                fetch(`/make_formal`, {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cate: data.document_name,
                        dh: data.dh,
                    }),
                })
                    .then(response => response.json())
                    .then(content => {
                        if (content != -1) {
                            data.button.textContent = '已审核';
                            data.button.classList.add('remembered');
                            if (typeof (data.readonly_fun) == "function") {
                                data.readonly_fun();
                            }

                            if (data.after_shen_fun) {
                                data.after_shen_fun();
                            }

                            if (typeof (data.after_func) == "function") {
                                data.after_func(data.xsdh, data.dh);
                            }

                            notifier.show('审核完成', 'success');
                        } else {
                            notifier.show('权限不够', 'danger');
                        }
                    });
            }
        });
    }

    //提交审核
    let sumit_shen = function (data) {
        if (data.button.textContent == "已提审核") {
            return false;
        }

        if (data.dh == "新单据" || data.edited) {
            notifier.show('请先保存单据', 'danger');
            return false;
        }

        document.querySelector('#save-button').click();

        alert_confirm("确认提交审核吗？", {
            confirmText: "确认",
            cancelText: "取消",
            confirmCallBack: () => {
                fetch(`/make_sumit_shen`, {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cate: data.document_name,
                        dh: data.dh,
                    }),
                })
                    .then(response => response.json())
                    .then(content => {
                        if (content != -1) {
                            data.button.textContent = '已提审核';
                            data.button.classList.add('remembered');
                            notifier.show('提交完成', 'success');
                            setTimeout(() => {
                                let l = location.toString().lastIndexOf("/");
                                location = location.toString().substring(0, l + 1) + 'new';
                            }, 1000);
                        } else {
                            notifier.show('权限不够', 'danger');
                        }
                    });
            }
        });
    }

    //设置只读: 提交审核、审核以及用户
    let set_shens_owner = function (data) {
        let values = data.content.split(SPLITER);
        let len = values.length;
        document.querySelector('#owner').textContent = `[ ${values[len - 1]} ]`;
        only_worker(values[len - 1], data.readonly_fun);
        let shen = document.querySelector('#sumit-shen');
        if (values[len - 5] == "true") {
            shen.textContent = "已提审核";
            shen.classList.add('remembered');
        } else {
            shen.textContent = "提交审核";
            shen.classList.remove('remembered');
        }

        let rem = document.querySelector('#remember-button');
        if (values[len - 2] != "") {
            rem.textContent = "已审核";
            rem.classList.add('remembered');
            data.readonly_fun();
        } else {
            rem.textContent = "审核";
            rem.classList.remove('remembered');
        }
        if (rem.textContent == "审核" && data.focus_fun && typeof data.focus_fun == "function") {
            data.focus_fun();
        }
    }

    //使编辑表格的功能键只读
    let edit_button_disabled = function () {
        document.querySelector('#row-insert').disabled = true;
        document.querySelector('#row-del').disabled = true;
        document.querySelector('#row-up').disabled = true;
        document.querySelector('#row-down').disabled = true;
    }

    // 非经办人只能查看
    let only_worker = function (worker, set_readonly) {
        if (document.querySelector('#user-name').textContent.indexOf(worker) == -1) {
            set_readonly();
            let all_edit = document.querySelectorAll('.fields-show input');
            for (let edit of all_edit) {
                edit.disabled = true;
            }
            document.querySelector('#save-button').disabled = true;
        }
    }

    //保存前的错误排查, 检查表头的日期和整数、实数、空表的输入错误
    let header_error_check = function (document_table_fields, all_rows) {
        let da = document.querySelector('#日期');
        if (da && da.value.trim() != "" && !regDate.test(document.querySelector('#日期').value)) {
            notifier.show('日期输入错误', 'danger');
            return false;
        }

        let all_values = document.querySelectorAll('.document-value');
        for (let i = 0; i < document_table_fields.length; i++) {
            if (document_table_fields[i].data_type == "整数") {
                if (all_values[i].value && !regInt.test(all_values[i].value)) {
                    notifier.show(`${document_table_fields[i].show_name}输入错误`, 'danger');
                    return false;
                }
            } else if (document_table_fields[i].data_type == "实数") {
                if (all_values[i].value && !regReal.test(all_values[i].value)) {
                    notifier.show(`${document_table_fields[i].show_name}输入错误`, 'danger');
                    return false;
                }
            }
        }

        if (all_rows.length == 0) {
            notifier.show(`表格不能为空`, 'danger');
            return false;
        }
        return true;
    }

    //依据显示字段，创建表格内容行
    let build_row_from_string = function (rec, row, table_fields, n) {
        if (!n) n = 2;
        for (let name of table_fields) {

            if (name.data_type == "文本") {
                row += `<td class="${name.show_name}" title='${rec[n]}'>${rec[n]}</td>`;
            } else if (name.data_type == "整数" || name.data_type == "实数") {
                row += `<td class="${name.show_name}">${rec[n]}</td>`;
            } else {
                row += `<td class="${name.show_name}">${rec[n]}</td>`;
            }
            n++;
        }
        row += "</tr>";
        return row;
    }

    //依据显示字段，创建表格空行
    let build_blank_from_fields = function (row, table_fields) {
        for (let _f of table_fields) {
            row += "<td></td>";
        }
        row += "</tr>";
        return row;
    }

    //依据显示字段，建立编辑类型 form
    let build_edit_form = function (num, table_fields, chosed) {
        let form = "<form>";
        for (let name of table_fields) {
            let control;
            if (name.ctr_type == "普通输入") {
                let value = chosed.querySelector(`td:nth-child(${num})`).textContent;
                control = `<div class="form-group">
                            <div class="form-label">
                                <label>${name.show_name}</label>
                            </div>
                            <input class="form-control input-sm has-value" type="text" value="${value}">
                        </div>`;
            } else if (name.ctr_type == "二值选一") {
                let value = chosed.querySelector(`td:nth-child(${num})`).textContent;
                let options = name.option_value.split('_');
                let check = value == options[0] ? "checked" : "";

                control = `<div class="form-group">
                            <div class="form-label">                                    
                                <label>${name.show_name}</label>
                            </div>
                            <label class="check-radio"><input class="has-value" type="checkbox" ${check}><span class="checkmark"></span>
                            </label>
                        </div>`;
            } else {
                let show_value = chosed.querySelector(`td:nth-child(${num})`).textContent;
                control = `<div class="form-group">
                            <div class="form-label">                                    
                                <label>${name.show_name}</label>
                            </div>
                            <select class='select-sm has-value'>`;

                let options = name.option_value.split('_');
                for (let value of options) {
                    if (value == show_value) {
                        control += `<option value="${value}" selected>${value}</option>`;
                    } else {
                        control += `<option value="${value}">${value}</option>`;
                    }
                }

                control += "</select></div>";
            }

            form += control;
            num++;
        }
        form += "</form>";

        return form;
    }

    //依据显示字段，建立添加类型 form, 用于 modal 弹出框
    let build_add_form = function (table_fields) {
        let form = "<form>";

        for (let name of table_fields) {
            let control;
            if (name.ctr_type == "普通输入") {
                control = `<div class="form-group">
                                <div class="form-label">
                                    <label>${name.show_name}</label>
                                </div>
                                <input class="form-control input-sm has-value" type="text">
                            </div>`;
            } else if (name.ctr_type == "二值选一") {
                let checked = name.option_value.split('_')[0] == name.default_value ? 'checked' : '';
                control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <label class="check-radio">
                                    <input class="has-value" type="checkbox" ${checked}>
                                    <span class="checkmark"></span>
                                </label>
                            </div>`;
            } else {
                control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <select class='select-sm has-value'>`;

                let options = name.option_value.split('_');
                for (let value of options) {
                    let selected = value == name.default_value ? 'selected' : '';
                    control += `<option value="${value}" ${selected}>${value}</option>`;
                }
                control += "</select></div>";
            }

            form += control;
        }
        form += "</form>";

        return form;
    }

    //依据显示字段，建立表头字段, 用于进出货输入
    let build_inout_form = function (table_fields, data) {
        let values = data ? data.split(SPLITER) : "";
        let form = "";
        let idx_n = 1;
        let n = 0;
        for (let name of table_fields) {
            let control;
            let id = `id="${name.field_name}"`;
            let value = values ? values[n] : "";

            if (name.ctr_type == "普通输入") {
                value = value === "0" ? "" : value;
                control = `<div class="form-group">
                                <div class="form-label">
                                    <label>${name.show_name}</label>
                                </div>
                                <div class="form-input">
                                    <input class="form-control input-sm document-value" value='${value}' idx="${idx_n++}" type="text" ${id}
                                        style="width: ${name.show_width * 20}px;" />
                                </div>
                            </div>`;
            } else if (name.ctr_type == "二值选一") {
                let has_value = value ? value : name.default_value;
                let checked = name.option_value.split('_')[0] == has_value ? 'checked' : '';
                control = `<div class="form-group" style="display: flex;">
                                <div class="form-label">                                    
                                    <label class='check-label' for='${name.show_name}'>${name.show_name}</label>
                                </div>
                                <label class="check-radio">
                                    <input class="document-value" id='${name.show_name}' type="checkbox"  idx="${idx_n++}" ${id} ${checked}>
                                    <span class="checkmark"></span>
                                </label>
                            </div>`;
            } else {
                control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <select class='select-sm document-value' style="width: ${name.show_width * 20}px;" ${id}>`;

                let options = name.option_value.split('_');
                let has_value = value ? value : name.default_value;
                for (let value of options) {
                    let selected = value == has_value ? 'selected' : '';
                    control += `<option value="${value}" ${selected}>${value}</option>`;
                }
                control += "</select></div>";
            }

            form += control;
            n++;
        }

        return form;
    }

    // 销售用商品规格表
    let sales_products = function (modal_title) {
        if (!document.querySelector('.product-content') || modal_title != document.querySelector('.modal-title').textContent.trim()) {
            document.querySelector('.modal-title').textContent = modal_title;
            let width = document.querySelector('body').clientWidth * 0.8;
            let height = document.querySelector('body').clientHeight * 0.8;
            let tbody_height = height - 270;

            let html = `
            <div class="product-content">
                <div class="tree-show">
                    <div class="autocomplete table-top">
                        <input type="text" class="form-control search-input" id="auto_input" placeholder="商品搜索">
                        <button id="auto_search" class="btn btn-info btn-sm"><img src="/assets/img/zoom.png"
                                width="20px"></button>
                    </div>
                    <div class="tree-title">商品分类</div>
                    <div class="tree-container">
                        <ul id="tree">
                        </ul>
                    </div>
                </div>
                <div id="product-show">
                    <div class="table-top">
                        <div class="autocomplete product-search">
                            <input type="text" class="form-control search-input" id="search-input" placeholder="规格搜索">
                            <button class="btn btn-info btn-sm" id="serach-button">搜索</button>
                            <span id="product-name"></span><span id="product-id"></span>
                        </div>
                        <div class="table-tools">
                        </div>
                    </div>
        
                    <div class="table-container table-product">
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                        <div class="table-ctrl">
                            <div class="tools-button"></div>
                            <div class="table-button">
                                <button class="page-button btn" id="first" title="首页"><img src="/assets/img/backward.png"
                                        width="12px"></button>
                                <button class="page-button btn" id="pre" title="前一页"><img src="/assets/img/backward2.png"
                                        width="12px"></button>
                                <p class="seperator"></p>
                                <span>第</span><input type="text" class="form-control" id="page-input" value="1">
                                <span>页，共</span><span id="pages"></span><span>页</span>
                                <p class="seperator"></p>
                                <button class="page-button btn" id="aft" title="后一页"><img src="/assets/img/forward2.png"
                                        width="12px"></button>
                                <button class="page-button btn" id="last" title="尾页"><img src="/assets/img/forward.png"
                                        width="12px"></button>
                            </div>
        
                            <div class="table-info">
                                共 <span id="total-records"></span> 条记录
                            </div>
        
                        </div>
                    </div>
                </div>
                <div class="hide"><span id="context-menu"></span><span id="zhezhao"></span>
                    <span id="context-add"></span><span id="context-edit"></span><span id="context-del"></span>
                </div>
            </div>`;

            document.querySelector('.modal-body').innerHTML = html;
            document.querySelector('.tree-container').style.height = (height - 240) + "px";

            let tree_data = {
                node_num: "",
                leaf_click: (id, name) => {
                    document.querySelector('#product-name').textContent = name;
                    document.querySelector('#product-id').textContent = id;

                    let post_data = {
                        cate: name + " " + id,   // 使用 cate 传送物料名和id
                        id: id,
                        name: '',
                        page: 1,
                        done: '否',
                    };

                    Object.assign(tool_table.table_data().post_data, post_data);

                    tool_table.fetch_table();
                }
            }

            tool_tree.tree_init(tree_data);
            tool_tree.fetch_tree();

            let input = document.querySelector('#auto_input');

            document.querySelector("#auto_search").addEventListener('click', () => {
                tool_tree.tree_search(input.value);
            });

            let row_num = Math.floor(tbody_height / 30);
            build_product_buyin(row_num);

            document.querySelector('.modal-dialog').style.cssText = `max-width: ${width}px; height: ${height}px;`;
            document.querySelector('.modal-content').style.cssText = `height: 100%;`;
        }

        document.querySelector('.modal').style.display = "block";
    }

    // 构建采购商品表
    let build_product_buyin = function (row_num) {
        let init_data = {
            container: '.table-product',
            url: '/fetch_product_buyin',
            header_names: {
                "名称": "split_part(node_name,' ',2)",
                "材质": "split_part(node_name,' ',1)",
                "规格": "p.规格型号",
                "状态": "p.文本字段2",
                "执行标准": "p.文本字段3",
            },
            post_data: {
                id: "",
                name: '',
                sort: "node_name",
                rec: row_num,
                cate: '',
                filter: '',
            },
            edit: false,

            blank_cells: 7,
            row_fn: table_row,
        };

        setTimeout(() => {
            let table = document.querySelector('.table-product');
            let th_header = [
                {name: '序号', width: 3},
                {name: '名称', width: 4},
                {name: '材质', width: 6},
                {name: '规格', width: 6},
                {name: '状态', width: 6},
                {name: '执行标准', width: 8}
            ];

            let header = build_table_header(table, th_header, [], "", "products");
            table.querySelector('thead tr').innerHTML = header.th_row;
            tool_table.table_init(init_data);
            tool_table.fetch_table();
        }, 100);

        function table_row(tr) {
            let row = `<tr><td>${tr.序号}</td><td class="id" hidden>${tr.id}</td><td class='名称'>${tr.名称}</td>
                <td class='材质'>${tr.材质}</td><td class='规格'>${tr.规格}</td><td class='状态'>${tr.状态}</td>
                <td class='执行标准'>${tr.执行标准}</td></tr>`;

            return row;
        }

        document.querySelector('#serach-button').addEventListener('click', function () {
            let search = document.querySelector('#search-input').value;
            Object.assign(tool_table.table_data().post_data, {name: search, page: 1});
            tool_table.fetch_table();
        });
    }

    // 检查是否超过库存
    let check_ku = function (dh, save) {
        let ku = new Map();
        let all_rows = document.querySelectorAll('.table-items .has-input');

        for (let row of all_rows) {
            let cz = row.querySelector('.材质').textContent.trim();
            if (cz != "" && cz != "--") {
                let key = `${row.querySelector('.物料号').textContent.trim()}`;
                let num1 = row.querySelector('.num');
                let num = num1 ? num1.value : 1;
                let long = row.querySelector('.long').value;

                let now_num = 0;
                if (long && regReal.test(long) && num && regReal.test(num)) {
                    now_num = long * num;
                }

                if (ku.has(key)) {
                    ku.set(key, ku.get(key) + now_num);
                } else {
                    ku.set(key, now_num);
                }
            }
        }

        let ku_str = "";
        for (var [key, value] of ku) {
            ku_str += `${key}：${value}${SPLITER}`;
        }

        ku_str = ku_str.substring(0, ku_str.lastIndexOf(SPLITER));
        ku_str += "##" + dh;

        fetch(`/check_ku`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: ku_str
        })
            .then(response => response.json())
            .then(content => {
                if (content == 1) {
                    for (let row of all_rows) {
                        row.classList.remove('ku_danger');
                    }
                    save();
                } else if (content == -1) {
                    notifier.show('权限不够', 'danger');
                } else {
                    for (let row of all_rows) {
                        row.classList.remove('ku_danger');
                    }
                    for (let wu_num of content) {
                        for (let row of all_rows) {
                            if (row.querySelector('.物料号').textContent.trim() == wu_num) {
                                row.classList.add('ku_danger');
                            }
                        }
                    }
                    notifier.show('销售数量超过库存', 'danger');
                }
            });
    }

    //选择行数据并退出
    let chose_exit = function (selected_row, cb) {
        let id = selected_row.children[1].textContent;
        if (id) {
            fetch(`/fetch_one_product`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(id),
            })
                .then(response => response.json())
                .then(content => {
                    let input = document.querySelector('.inputting .auto-input');
                    input.value = content.split(SPLITER)[1];
                    input.setAttribute("data", content);
                    if (typeof cb == "function") {
                        cb();
                    }
                    close_modal();
                });
        } else {
            notifier.show('请先选择记录', 'danger');
        }
    }

    //创建商品规格型号表，供“商品设置”以及出入库输入时的商品查找使用，从 cb 开始都是回调函数
    let build_product_table = function (row_num, cb, more, more2) {
        let init_data = {
            container: '.table-product',
            url: '/fetch_product',
            post_data: {
                id: "",
                name: '',
                sort: "products.物料号 ASC",
                rec: row_num,
                cate: '正常销售',
                page: 1,
                filter: '',
            },
            header_names: {
                "名称": "split_part(node_name,' ',2)",
                "材质": "split_part(node_name,' ',1)",
                "物料号": "products.物料号",
                "规格": "规格型号",
                "状态": "products.文本字段2",
                "执行标准": "products.文本字段3",
                "生产厂家": "products.文本字段5",
                "炉号": "products.文本字段4",
                "库存长度": "COALESCE(foo.库存长度,0)",
                "库存重量": "COALESCE(foo.理论重量,0)",
                "备注": "products.备注",
            },
            edit: false,

            blank_cells: 18,
            row_fn: table_row,
        };

        let custom_fields = [
            {name: '序号', width: 2},
            {name: '名称', width: 4},
            {name: '材质', width: 4},
            {name: '物料号', width: 4},
            {name: '规格', width: 4},
            {name: '状态', width: 4},
            {name: '执行标准', width: 6},
            {name: '生产厂家', width: 4},
            {name: '炉号', width: 5},
            {name: '库存长度', width: 3},
            {name: '库存重量', width: 3},
            {name: '备注', width: 5},
        ];
        let table = document.querySelector('.table-product');
        let header = build_table_header(table, custom_fields, "", "", "products");
        table.querySelector('thead tr').innerHTML = header.th_row;

        tool_table.table_init(init_data);
        tool_table.fetch_table((content) => {
            if (cb) {
                cb(table);
            }
            if (more) {
                more();
            }
            if (more2) {
                more2(content);
            }
        });
    };

    function table_row(tr) {
        let rec = tr.split(SPLITER);
        let name = rec[1].split(" ");
        let row = `<tr><td>${rec[0]}</td><td>${name[1]}</td><td>${name[0]}</td><td>${rec[2]}</td><td>${rec[3]}</td>
                            <td>${rec[4]}</td><td title="${rec[5]}">${rec[5]}</td><td>${rec[6]}</td><td title="${rec[7]}">${rec[7]}</td>
                            <td>${rec[8]}</td><td>${rec[9]}</td><td>${rec[10]}</td></tr>`;
        return row;
    }

    document.querySelector('#serach-button').addEventListener('click', function () {
        search_table();
    });

    function search_table() {
        let search = document.querySelector('#search-input').value;
        Object.assign(tool_table.table_data().post_data, {name: search, page: 1});

        //加cb回调函数，是为了在出入库商品搜索时，加上行的双击事件
        let table = document.querySelector('.table-product');
        tool_table.fetch_table((content) => {
            if (cb) {
                cb(table);
            }
            if (more) {
                more();
            }
            if (more2) {
                more2(content);
            }
        });
    }


//出入库时，获取单据列表
    let get_materials_docs = function (url, cate, build_func) {
        fetch(url, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(cate),
        })
            .then(response => response.json())
            .then(content => {
                let title = document.querySelector(".table-docs thead th");
                title.innerHTML = title.textContent + " " + content.length + " 单";

                let tr = "";
                content.forEach(obj => {
                    tr += `<tr><td>${obj.label}</td></tr>`;
                });

                document.querySelector(".table-docs tbody").innerHTML = tr;

                let lines = document.querySelectorAll(".table-docs tbody tr");
                for (let l of lines) {
                    l.addEventListener("dblclick", () => {
                        if (document.querySelector('#remember-button').textContent == "已审核" ||
                            document.querySelector('#save-button').disabled == true) {
                            return false;
                        }
                        let dh = l.querySelector('td:nth-child(1)').textContent.split('　')[0];
                        document.querySelector('#文本字段6').value = dh;
                        build_func(dh);
                        lines.forEach(l => {
                            l.classList.remove('has-bak')
                        })
                        l.classList.add('has-bak');
                        document.querySelector('#文本字段6').focus();
                    });
                }
            });
    }

// 业务报表设置起始日期
    let set_date = function () {
        let date1 = document.querySelector('#search-date1');
        let date2 = document.querySelector('#search-date2');

        var dateTime = new Date();
        let d1 = dateTime.setDate(dateTime.getDate() - 30);
        date1.value = new Date(d1).Format("yyyy-MM-dd");
        date2.value = new Date().Format("yyyy-MM-dd");

        laydate.render({
            elem: date1,
            showBottom: false,
            // theme: 'molv',
            // value: '2021-05-02'
            // theme: '#62468d',
        });

        laydate.render({
            elem: date2,
            showBottom: false,
        });
    }

    let handle_pic = function (dh_div, save_url) {
        let fileBtn = document.getElementById('pic_upload');
        // 点击传图
        document.querySelector('#pic-button').addEventListener('click', function (e) {
            // let that = this;
            if (dh_div.textContent == "新单据") {
                notifier.show('请先保存单据', 'danger');
                return false;
            }
            e.preventDefault();
            fileBtn.click();
        });

        //图片上传
        fileBtn.addEventListener('change', () => {
            document.querySelector('#pic-button').disabled = "true";
            const fd = new FormData();
            fd.append('file', fileBtn.files[0]);
            fetch(`/pic_in`, {
                method: 'POST',
                body: fd,
            })
                .then(res => res.json())
                .then(content => {
                    fetch(save_url, {
                        method: 'post',
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(`${dh_div.textContent}${SPLITER}${content.substr(1, content.length - 1)}`),
                    })
                        .then(response => response.json())
                        .then(content => {
                            if (content == -1) {
                                notifier.show('权限不够', 'danger');
                            } else if (content == -2) {
                                notifier.show('图片保存出错', 'danger');
                            } else {
                                document.querySelector('#upload-pic').src = `${content}?${Math.random()}`;
                                document.querySelector('#pic-button').disabled = "";
                                notifier.show('图片成功保存', 'success');
                            }
                        });
                });
        });

        // 放大图片
        document.querySelector('#upload-pic').addEventListener('click', () => {
            let pic = document.querySelector('#upload-pic').src;
            let show = pic.split("?")[0].replace("min_", "pic_") + `?${Math.random()}`;
            let pic_html = `<div class = "form-input show-pic">
                                <img width = "1190px" src = "${show}" alt = "签字图">
                            </div>`;

            document.querySelector('.modal-body').innerHTML = pic_html;
            document.querySelector('.modal-title').textContent = "签字图";
            document.querySelector('.modal-dialog').style.cssText = "max-width: 1230px;"
            document.querySelector('.modal').style.display = "block";
            document.querySelector('#modal-sumit-button').style.display = "none";
        })
    }

    let get_data = function () {
        return table_fields;
    }
// 作废单据设为只读
    let fei_readonly = function (fei_bool, container) {
        if (fei_bool == "true") {
            setTimeout(() => {
                document.querySelectorAll(`.${container} button`).forEach(button => {
                    button.setAttribute('disabled', 'disabled');
                });
                document.querySelectorAll(`.${container} input`).forEach(input => {
                    input.setAttribute('disabled', 'disabled');
                });
                document.querySelectorAll(`.${container} select`).forEach(input => {
                    input.setAttribute('disabled', 'disabled');
                });
            }, 200)
        }
    }

/// 获取炉号
    let get_lu = function (trs) {
        let lus_arr = [];
        for (let tr of trs) {
            let lu = tr.querySelector('.炉号');
            if (lu && lu.textContent.trim() != '' && lu.textContent.trim() != '--') {
                // 不可换行
                let da = `${tr.querySelector('.材质').textContent.trim()}_${tr.querySelector('.规格').textContent.trim()}_${lu.textContent.trim()}`;
                lus_arr.push(da);
            } else {
                break;
            }
        }

        // console.log(lus_arr);

        if (lus_arr.length > 0) {
            fetch("/fetch_lu", {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(lus_arr),
            })
                .then(response => response.json())
                .then(content => {
                    for (let tr of trs) {
                        let lu = tr.querySelector('.炉号');
                        if (!lu) break;
                        for (let cont of content) {
                            let da = `${tr.querySelector('.材质').textContent.trim()}_${tr.querySelector('.规格').textContent.trim()}_${lu.textContent.trim()}`;
                            if (cont.indexOf(da) != -1) {
                                lu.innerHTML = `<a href="${cont}" title="点击下载质保书">${lu.textContent.trim()}</a>`;
                                break;
                            }
                        }
                    }
                })
        }
    }

    return {
        table_fields: get_data,
        build_table_header: build_table_header,
        calc_weight: calc_weight,
        build_save_header: build_save_header,
        build_save_items: build_save_items,
        set_sumit_shen: set_sumit_shen,
        make_formal: make_formal,
        sumit_shen: sumit_shen,
        set_shens_owner: set_shens_owner,
        edit_button_disabled: edit_button_disabled,
        only_worker: only_worker,
        header_error_check: header_error_check,
        build_row_from_string: build_row_from_string,
        build_blank_from_fields: build_blank_from_fields,
        build_edit_form: build_edit_form,
        build_add_form: build_add_form,
        build_inout_form: build_inout_form,
        sales_products: sales_products,
        check_ku: check_ku,
        chose_exit: chose_exit,
        build_product_table: build_product_table,
        get_materials_docs: get_materials_docs,
        set_date: set_date,
        handle_pic: handle_pic,
        fei_readonly: fei_readonly,
        get_lu: get_lu,
    }
}
();
