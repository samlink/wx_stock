import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { fetch_tree, tree_init, tree_search } from '../parts/tree.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { auto_table, AutoInput } from '../parts/autocomplete.mjs';
import * as service from '../parts/service.mjs'
import { SPLITER, getHeight, regInt, regReal, regDate, moneyUppercase } from '../parts/tools.mjs';

let get_height = getHeight() - 138;
let row_num = Math.floor(get_height / 30);

//执行日期实例------------------------------------------------
laydate.render({
    elem: '#search-date1',
    showBottom: false,
    theme: 'molv',
    // value: '2021-05-02'
    // theme: '#62468d',
});

laydate.render({
    elem: '#search-date2',
    showBottom: false,
    theme: 'molv',
});

//客户供应商自动填充--------------------------------------------
let cate = document.querySelector('#auto_cate');

let auto_comp = new AutoInput(document.querySelector('#search-customer'),
    cate, "/customer_auto", () => {
    });

auto_comp.init();

//填充表格空行-------------------------------------------------
let blank_rows = "";
for (let i = 0; i < row_num; i++) {
    blank_rows += blank_row_fn();
}

document.querySelector('.table-container tbody').innerHTML = blank_rows;

//表格搜索----------------------------------------------------
let init_data = {
    container: '.table-container',
    url: "/fetch_business",
    post_data: {
        id: "",
        name: '',
        sort: "日期 DESC",
        rec: row_num,
        cate: cate,
    },
    edit: false,
    header_names: {
        
    },


    row_fn: row_fn,
    blank_row_fn: blank_row_fn,
};

document.querySelector('#serach-button').addEventListener('click', function () {
    let customer = document.querySelector('#search-customer').value;

    if (!customer) {
        notifier.show('客户供应商不能为空', 'danger');
        return;
    }

    let check_fields = document.querySelector('#checkbox-fields').checked;
    let check_date = document.querySelector('#checkbox-date').checked;

    let fields = check_fields ? document.querySelector('#search-fields').value : "";
    let date1 = check_date ? document.querySelector('#search-date1').value : "";
    let date2 = check_date ? document.querySelector('#search-date2').value : "";

    table_init(init_data);
    fetch_table();

});


function row_fn(tr) {
    let checked = tr.inout_show ? "checked" : "";
    let disabled = tr.all_edit ? "" : "disabled";
    let style = tr.all_edit ? "" : "style='background: lightgrey;border: none;'";

    return `<tr draggable="true"><td class='hide'>${tr.id}</td>
            <td width=20%>${tr.num}</td><td>${tr.show_name}</td>
            <td width=20%><label class="check-radio"><input type="checkbox" ${checked} ${disabled}>
            <span class="checkmark" ${style}></span></td></tr>`;
}

function blank_row_fn() {
    return `<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
}