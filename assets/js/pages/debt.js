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

function row_fn(tr) {
    let row = tr.split(SPLITER);
    let num = document.querySelector('#num_position').textContent.split(',');
    let center = "style='text-align:center'";
    let right = "style='text-align:right'";

    return `<tr><td ${center}>${row[0]}</td><td ${center}>${row[1]}</td><td>${row[2]}</td><td ${center}>${row[3]}</td>
            <td ${right}>${Number(row[4]).toFixed(num[1])}</td><td>${row[5]}</td><td>${row[6]}</td><td ${center}>${row[7]}</td>
            <td ${right}>${Number(row[8]).toFixed(num[0])}</td><td ${right}>${row[9]}</td><td>${row[10]}</td></tr>`;
}

function blank_row_fn() {
    return `<tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
}