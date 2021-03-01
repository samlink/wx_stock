import { MakeTable } from '../parts/table_class.mjs';
import { notifier } from '../parts/notifier.mjs';
import { regInt, getHeight, SPLITER } from '../parts/tools.mjs';

//设置菜单 
document.querySelector('#goods-in .nav-icon').classList.add('show-chosed');
document.querySelector('#goods-in .menu-text').classList.add('show-chosed');

let get_height = getHeight() - 138;
let row_num = Math.floor(get_height / 30);

let container = '.table-limit';
let init_data = {
    table: document.querySelector(container + ' table'),
    header: document.querySelector(container + ' thead tr'),                 //排序可选,若不需要排序功能,则去掉此属性
    body: document.querySelector(container + ' tbody'),
    page_input: document.querySelector(container + ' #page-input'),
    page_first: document.querySelector(container + ' #first'),
    page_pre: document.querySelector(container + ' #pre'),
    page_aft: document.querySelector(container + ' #aft'),
    page_last: document.querySelector(container + ' #last'),
    total_pages: document.querySelector(container + ' #pages'),
    total_records: document.querySelector(container + ' #total-records'),

    url: `/${code}/fetch_limit`,
    post_data: {
        id: "",
        name: '',
        sort: "node_name,规格型号",
        rec: row_num,
        cate: "",
    },
    edit: false,
    header_names: {
        "名称": "node_name",
        "规格型号": "规格型号",
        "单位": "单位",
        "仓库": "name",
        "库位": "库位",
        "库存下限": "库存下限",
        "库存": "库存",
    },

    row_fn: table_row,
    blank_row_fn: blank_row,
};

let table = new MakeTable(init_data);

table.init();
table.fetch_table();

//调整列宽
table_resize(document.querySelector(container + ' table'));

function table_row(tr) {
    let rec = tr.split(SPLITER);
    let row = `<tr><td style="text-align: center;">${rec[0]}</td>
        <td title='${rec[1]}'>${rec[1]}</td>
        <td>${rec[2]}</td>
        <td style="text-align: center;">${rec[3]}</td>
        <td style="text-align: center;">${rec[4]}</td>
        <td style="text-align: center;">${rec[5]}</td>
        <td style="text-align: center;">${rec[6]}</td>
        <td style="text-align: center;">${rec[7]}</td></tr>`;

    return row;
}

function blank_row() {
    return "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>";     //与上面的 table_row() 中的 row 变量保持一致
}

document.querySelector('#serach-button').addEventListener('click', function () {
    search_table();
});

function search_table() {
    let search = document.querySelector('#search-input').value;
    table.change_data({ name: search, page: 1 });
    table.fetch_table();
}

container = '.table-stay';

let init_data2 = {
    table: document.querySelector(container + ' table'),
    header: document.querySelector(container + ' thead tr'),                 //排序可选,若不需要排序功能,则去掉此属性
    body: document.querySelector(container + ' tbody'),
    page_input: document.querySelector(container + ' #page-input2'),
    page_first: document.querySelector(container + ' #first2'),
    page_pre: document.querySelector(container + ' #pre2'),
    page_aft: document.querySelector(container + ' #aft2'),
    page_last: document.querySelector(container + ' #last2'),
    total_pages: document.querySelector(container + ' #pages2'),
    total_records: document.querySelector(container + ' #total-records2'),

    url: `/${code}/fetch_stay`,
    post_data: {
        id: "",
        name: '',
        sort: "node_name,规格型号",
        rec: row_num,
        cate: "3",  //借用这个 key, 用于滞库月数，需根据参数设置动态调整
    },
    edit: false,
    header_names: {
        "名称": "node_name",
        "规格型号": "规格型号",
        "单位": "单位",
        "仓库": "name",
        "库位": "库位",
        "库存": "库存",
        "最近销售": "日期"
    },

    row_fn: table_row2,
    blank_row_fn: blank_row2,
};

let table2 = new MakeTable(init_data2);

table2.init();
table2.fetch_table();

//调整列宽
table_resize(document.querySelector(container + ' table'));

function table_row2(tr) {
    let rec = tr.split(SPLITER);
    let row = `<tr><td style="text-align: center;">${rec[0]}</td>
        <td title='${rec[1]}'>${rec[1]}</td>
        <td>${rec[2]}</td>
        <td style="text-align: center;">${rec[3]}</td>
        <td style="text-align: center;">${rec[4]}</td>
        <td style="text-align: center;">${rec[5]}</td>
        <td style="text-align: center;">${rec[6]}</td>
        <td style="text-align: center;">${rec[7]}</td></tr>`;

    return row;
}

function blank_row2() {
    return "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>";
}

document.querySelector('#serach-button2').addEventListener('click', function () {
    search_table2();
});

function search_table2() {
    let search = document.querySelector('#search-input2').value;
    table2.change_data({ name: search, page: 1 });
    table2.fetch_table();
}

document.querySelector('#month-button').addEventListener('click', function () {
    let mon = document.querySelector('#month-input').value;
    if (regInt.test(mon)) {
        table2.change_data({ cate: mon });
        table2.fetch_table();
    }
    else {
        notifier.show('月份输入错误', 'danger');
    }
});
