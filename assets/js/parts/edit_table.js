// import { notifier } from './notifier.mjs';
// import { alert_confirm } from './alert.mjs';
// import { auto_table, AutoInput } from './autocomplete.mjs';
// import * as service from './service.mjs';
// import { SPLITER, getLeft, getTop, goto_tabindex, enterToTab } from './tools.js';
// import { close_modal, modal_init } from './modal.mjs';

let edit_table = function () {
    if (!document.querySelector('.table-history')) return;

    let all_width;
    input_data = {
        container: document.querySelector('.table-items'),
        width: document.querySelector('.content').clientWidth - document.querySelector('.table-history').clientWidth - 15,
        show_names: "",
        document: "入库单据",
    }

    var input_table_outdata = {};

    //插入行
    document.querySelector('#row-insert').addEventListener('click', function (e) {
        let edit = document.querySelector('.inputting');
        if (edit) {
            let table_body = document.querySelector('.table-items tbody');
            let input_row = build_input_row(input_data.show_names, all_width);
            remove_inputting();
            table_body.insertBefore(input_row, edit);
            rebuild_index();
            sum_records();
            keep_up();
            input_row.querySelector('td:nth-child(2)').click();
        } else {
            notifier.show('请先选择行', 'danger');
        }
    });

    //删除行
    document.querySelector('#row-del').addEventListener('click', function (e) {
        let edit = document.querySelector('.inputting');
        if (edit) {
            alert_confirm('确认删除行吗？', {
                confirmCallBack: () => {
                    edit.parentNode.removeChild(edit);
                    sum_records();
                    rebuild_index();
                    keep_up();
                    if (typeof input_data.change_func == "function") {
                        input_data.change_func();
                    }
                }
            });
        } else {
            notifier.show('请先选择行', 'danger');
        }
    });

    //上移行
    document.querySelector('#row-up').addEventListener('click', function (e) {
        let edit = document.querySelector('.inputting');
        if (edit) {
            if (edit.previousElementSibling) {
                edit.parentNode.insertBefore(edit, edit.previousElementSibling);
                rebuild_index();
            }
        } else {
            notifier.show('请先选择行', 'danger');
        }
    });

    //下移行
    document.querySelector('#row-down').addEventListener('click', function (e) {
        let edit = document.querySelector('.inputting');
        if (edit) {
            if (edit.nextElementSibling &&
                edit.nextElementSibling.querySelector('td:nth-child(1)').textContent != "") {
                edit.parentNode.insertBefore(edit.nextElementSibling, edit);
                rebuild_index();
            }
        } else {
            notifier.show('请先选择行', 'danger');
        }
    });


    //构造表主体结构-----------
    let build_blank_table = function (data) {
        Object.assign(input_data, data);
        let line_height = 33; //行高，与 css 设置一致
        build_blank_th();

        let tbody = input_data.container.querySelector('tbody');
        let rows = "";
        for (let i = 0; i < input_data.lines; i++) {
            rows += input_data.blank_row;
        }

        tbody.innerHTML = rows;
        tbody.style.height = input_data.lines * line_height + "px";    //这里设置高度，为了实现Y轴滚动
    }

    /// 输出明细表（带内容）
    let build_out_table = function (data) {
        Object.assign(input_data, data);
        let tbody = input_data.container.querySelector('tbody');
        let trs = tbody.querySelectorAll('tr');
        for (let tr of trs) {
            if (!tr.classList.contains('has-input')) {
                tr.parentNode.removeChild(tr);
            }
        }

        let has_input = tbody.querySelectorAll('.has-input');
        let num = has_input.length + 1;
        let n = input_data.num ? input_data.num : 1;
        for (let i = 0; i < n; i++) {
            if (typeof input_data.show_names_fn == "function") {
                input_data.show_names_fn(i);
            }
            let input_row = build_input_row(input_data.show_names, all_width, num);
            tbody.appendChild(input_row);
            num += 1;
        }

        append_blanks(tbody, num);
    }

    // 添加一个编辑行
    let appand_edit_row = function () {
        let tbody = input_data.container.querySelector('tbody');
        let trs = tbody.querySelectorAll('tr');
        for (let tr of trs) {
            if (!tr.classList.contains('has-input')) {
                tr.parentNode.removeChild(tr);
            }
        }

        //清空数据
        for (let i in input_data.show_names) {
            input_data.show_names[i].value = input_data.show_names[i].default ? input_data.show_names[i].default : "";
        }

        let has_input = tbody.querySelectorAll('.has-input');
        let num = has_input.length + 1;
        let input_row = build_input_row(input_data.show_names, all_width, num);
        tbody.appendChild(input_row);
        num += 1;

        append_blanks(tbody, num);

        return input_row;
    }

    //建立表头及一个空行
    function build_blank_th() {
        input_data.container.style.width = input_data.width;
        all_width = 0;
        input_data.show_names.forEach(obj => {
            all_width += obj.width;
        });

        let th = "<tr>";
        let blank = "<tr>";
        input_data.show_names.forEach(obj => {
            let hidden = obj.css ? obj.css : "";
            th += `<th width=${obj.width * 100 / all_width} ${hidden}>${obj.name}</th>`;
            blank += `<td width=${obj.width * 100 / all_width} ${hidden}></td>`;
        });

        th += "</tr>";
        blank += "</tr>";

        input_data.container.querySelector('thead').innerHTML = th;
        input_data.blank_row = blank;
    }

    // 建立已有订单的明细表
    let build_items_table = function (data) {
        Object.assign(input_data, data);
        let line_height = 33; //行高，与 css 设置一致
        build_blank_th();

        let tbody = input_data.container.querySelector('tbody');
        let num = 1;

        for (let row of input_data.rows) {
            let row_data = row.split(SPLITER);
            for (let i = 1; i < input_data.show_names.length; i++) {
                input_data.show_names[i].value = row_data[i - 1];
            }

            let input_row = build_input_row(input_data.show_names, all_width, num);
            tbody.appendChild(input_row);
            num += 1;
        }

        tbody.style.height = input_data.lines * line_height + "px";    //这里设置高度，为了实现Y轴滚动

        append_blanks(tbody, num);

        //明细加载后,自动计算一些公式
        if (typeof input_data.change_func == "function") {
            input_data.change_func();
        }
    }

    function append_blanks(tbody, num) {
        //清空数据
        for (let i in input_data.show_names) {
            if (typeof input_data.show_names[i].value == "undefined") {
                input_data.show_names[i].value = "";
            }
        }

        keep_up();

        let rows = "";
        for (let i = 0; i < input_data.lines - num + 1; i++) {
            rows += input_data.blank_row;
        }
        tbody.querySelector('tr:nth-last-child(1)').insertAdjacentHTML('afterend', rows);

        setTimeout(() => {
            sum_records();
        }, 100);
    }

    function build_edit_string(show_names, all_width) {
        let control = "";
        let m_id = show_names[show_names.length - 1].value;
        let idx = 1;
        for (let obj of show_names) {
            let hidden = obj.css ? obj.css : "";
            if (obj.type == "普通输入" && obj.editable) {
                let va = obj.value ? obj.value : '';
                control += `<td width=${obj.width * 100 / all_width} class="editable" ${hidden}>
            <input class="form-control input-sm has-value ${obj.class}" type="text" idx="${idx++}" value="${va}"></td>`;
            } else if (obj.type == "普通输入" && !obj.editable) {
                control += `<td width=${obj.width * 100 / all_width} class='${obj.class}' ${hidden}>${obj.value ? obj.value : ''} </td>`;
            } else if (obj.type == "二值选一" && obj.editable) {
                let checked;
                if (obj.value) {
                    checked = obj.value;
                } else {
                    checked = '';
                }
                control += `<td width=${obj.width * 100 / all_width} class="editable" ${hidden}><label class="check-radio">
                                <input class="has-value ${obj.class}" type="checkbox" ${checked}>
                                <span class="checkmark"></span>
                            </label>
                        </td>`;
            } else if (obj.type == "二值选一" && !obj.editable) {
                control += `<td width=${obj.width * 100 / all_width}>${obj.value ? obj.value : ''} ${hidden}</td>`;
            } else if (obj.type == "下拉列表" && obj.editable) {
                control += `<td width=${obj.width * 100 / all_width} class="editable" ${hidden}><select class='select-sm has-value ${obj.class}'>`;
                let options = obj.default.split('_');
                for (let value of options) {
                    let select = value == obj.value ? 'selected' : '';
                    control += `<option value="${value}" ${select}>${value}</option>`;
                }
                control += "</select></td>";
            } else if (obj.type == "下拉列表" && !obj.editable) {
                control += `<td width=${obj.width * 100 / all_width}>${obj.value ? obj.value : ''} ${hidden}</td>`;
            } else if (obj.type == "autocomplete" && obj.editable) {
                let button = obj.no_button ? "" : "<button class='btn btn-info btn-sm product-search-button'> ... </button>";

                control += `
            <td width=${obj.width * 100 / all_width} class="editable" >
                <div class="form-input autocomplete" style="z-index: 900; position: inherit">
                    <input class="form-control input-sm has-value auto-input ${obj.class}" type="text" 
                        value="${obj.value}" idx="${idx++}" data="${m_id}">                        
                    ${button}
                </div>
            </td>`;
            }
        }

        return control;
    }

    // 左右方向键移动
    function leftright_key_move(event, row, input) {
        var e = event ? event : window.event;
        if (e.code == 'ArrowLeft') {
            if (input.selectionStart == 0) {
                let tabindex = input.getAttribute('idx');
                let focus = goto_tabindex(row, --tabindex);
            }
        } else if (e.code == 'ArrowRight') {
            if (input.selectionEnd == input.value.length) {
                let tabindex = input.getAttribute('idx');
                let focus = goto_tabindex(row, ++tabindex);
            }
        }
    }

    // 上下方向键移动
    function updown_key_move(event, row, input, all_inputs) {
        var e = event ? event : window.event;
        if (e.code == 'ArrowUp') {
            let n = row.querySelector('td:nth-child(1)').textContent;
            if (n != '1') {
                let tr = all_inputs[n - 2];
                let tabindex = input.getAttribute('idx');
                goto_tabindex(tr, tabindex);
                remove_inputting();
                tr.classList.add('inputting');
            }
        } else if (e.code == 'ArrowDown') {
            let n = row.querySelector('td:nth-child(1)').textContent;
            if (n != all_inputs.length) {
                let tr = all_inputs[n];
                let tabindex = input.getAttribute('idx');
                goto_tabindex(tr, tabindex);
                remove_inputting();
                tr.classList.add('inputting');
            }
        }
    }

    //回车键移动
    function enter_key_move(event, row, input, next_tr, max_idx) {
        var e = event ? event : window.event;
        if (e.code == 'Enter' || e.code == 'NumpadEnter') {
            let idx = enterToTab(row, input, max_idx);
            if (idx > max_idx) {
                if (next_tr.classList.contains('has-input')) {
                    goto_tabindex(next_tr, 1);
                } else {
                    goto_tabindex(row, 1);
                }
            }
        }
    }

    //设置自动输入单元格
    function auto_input_handle(input_row, auto_data) {
        for (let auto of auto_data) {
            let th = document.querySelector(`.table-items th:nth-child(${auto.n})`);
            let td = input_row.querySelector(`td:nth-child(${auto.n})`);
            let data = {
                auto_th: th,
                auto_td: td,
                auto_input: td.querySelector('.auto-input'),
            }

            Object.assign(auto, data);
            // auto.auto_input.style.width = auto.auto_th.clientWidth - 36 + "px";

            auto.auto_td.addEventListener('click', function () {
                element_position(this, 7.4, 1);
                // auto.auto_input.focus();
            });

            auto.auto_input.addEventListener('focus', function () {
                remove_inputting();
                this.parentNode.parentNode.parentNode.classList.add("inputting");
            });
            //表格中只能使用此种形式, 那种简单模式涉及 position 及宽度的调整, 很麻烦
            if (auto.type && auto.type != "table") {
                let auto_comp = new AutoInput(auto.auto_input, auto.cate, auto.auto_url, "", auto.width);
                auto_comp.init();
            } else {
                auto_table(auto.auto_input, auto.cate, auto.auto_url, auto.show_th, auto.cb, auto.cf);
            }
        }
    }

    //创建新的输入行，参数 num 是序号
    function build_input_row(show_names, all_width, num) {
        if (!num) num = 1;
        let input_row = document.createElement("tr");
        input_row.classList.add("has-input");
        input_row.innerHTML = build_edit_string(show_names, all_width);

        //初始化自动输入
        if (input_data.auto_data) {
            auto_input_handle(input_row, input_data.auto_data);
        }

        input_row.addEventListener('click', function () {
            remove_inputting();
            this.classList.add("inputting");
        });

        input_row.querySelector(`td:nth-child(1)`).textContent = num;

        //商品规格查找按钮
        if (input_row.querySelector('.product-search-button')) {
            input_row.querySelector('.product-search-button').addEventListener('click', function () {
                if (!this.parentNode.parentNode.parentNode.classList.contains('inputting')) {
                    return false;
                }

                service.sales_products("选择商品");
            });
        }

        if (typeof (input_data.calc_func) == "function") {
            input_data.calc_func(input_row);
        }

        if (typeof (input_data.calc_func2) == "function") {
            input_data.calc_func2(input_row);
        }

        let max_n = input_row.querySelectorAll('input').length;

        input_row.querySelectorAll('input').forEach(input => (
            input.onkeydown = (e) => {
                let inputs = document.querySelectorAll('.table-items .has-input');
                let next_tr = document.querySelector('.table-items .inputting+tr');
                enter_key_move(e, input_row, input, next_tr, max_n);
                // updown_key_move(e, input_row, input, inputs);    //与自动完成菜单选择有冲突
                leftright_key_move(e, input_row, input);
            })
        );

        return input_row;
    }

    //计算记录数
    function sum_records() {
        let all_input = document.querySelectorAll('.has-input');
        let num = 0;
        for (let i = 0; i < all_input.length; i++) {
            if (all_input[i].querySelector('td:nth-child(3)').textContent.trim() != ""
                || all_input[i].querySelector('td:nth-child(2) input').value.trim() != "") {
                num++;
            }
        }

        if (input_data.change_func) {
            input_data.change_func();
        }

        document.querySelector('#total-records').innerHTML = num;
    }

    //重建索引
    function rebuild_index() {
        let all_input = document.querySelectorAll('.has-input');
        for (let i = 0; i < all_input.length; i++) {
            all_input[i].querySelector('td:nth-child(1)').textContent = i + 1;
        }
    }

    //避免表头错位（出现滚动条时）
    function keep_up() {
        if (document.querySelectorAll(".table-items tbody tr").length > input_data.lines) {
            document.querySelector(".table-items thead").style.width = "calc(100% - 1.07em)";
        } else {
            document.querySelector(".table-items thead").style.width = "100%";
        }
    }

    //移除行编辑标记
    function remove_inputting() {
        let all_has_input = document.querySelectorAll('.has-input');
        for (let input of all_has_input) {
            input.classList.remove("inputting");
        }
    }

    //去除绝对定位
    function remove_absolute() {
        let all_auto = document.querySelectorAll('.table-items .autocomplete');
        for (let auto of all_auto) {
            auto.classList.remove('auto-edit');     //去掉绝对定位
            auto.style.left = "";
            auto.style.top = "";
        }
    }

    //设置元素的位置
    function element_position(element, add_x, add_y) {
        if (element.querySelector('.autocomplete').classList.contains("auto-edit")) {
            return false;
        }
        let tbody = document.querySelector('.table-items tbody');
        let x = getLeft(element, tbody);
        let y = getTop(element, tbody);

        let auto_div = element.querySelector('.autocomplete');
        auto_div.style.left = (x + add_x) + "px";
        auto_div.style.top = (y + add_y) + "px";

        element.querySelector('.autocomplete').classList.add('auto-edit');
    }

    //点击提交按钮
    document.querySelector('#modal-sumit-button').addEventListener('click', function (e) {
        if (document.querySelector('.modal-title').textContent == "选择商品") {
            e.stopImmediatePropagation();
            let selected_row = document.querySelector('table .focus');
            if (selected_row) {
                service.chose_exit(selected_row, input_data.auto_data[0].cb);
            } else {
                notifier.show('请先选择再提交', 'danger');
            }
        }
    }, false);

    modal_init();

    let get_data = function () {
        return input_table_outdata;
    }

    return {
        input_table_outdata: get_data,
        build_blank_table: build_blank_table,
        build_out_table: build_out_table,
        appand_edit_row: appand_edit_row,
        build_items_table: build_items_table
    }
}();