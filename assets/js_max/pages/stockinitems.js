import {table_init, fetch_table} from '../parts/table.mjs';
import {notifier} from '../parts/notifier.mjs';
import {AutoInput} from '../parts/autocomplete.mjs';
import {SPLITER, getHeight, download_file} from '../parts/tools.mjs';
import {set_date} from "../parts/service.mjs";

let get_height = getHeight() - 133;
let row_num = Math.floor(get_height / 33);

//执行日期实例------------------------------------------------
set_date();
let date1 =  document.querySelector('#search-date1').value;
let date2 = document.querySelector('#search-date2').value;

//填充表格空行-------------------------------------------------
let blank_rows = "";
for (let i = 0; i < row_num; i++) {
    blank_rows += blank_row_fn();
}

document.querySelector('.table-container tbody').innerHTML = blank_rows;

//表格搜索----------------------------------------------------
let init_data = {
    container: '.table-container',
    url: `/get_stockin_items`,
    post_data: {
        id: "",
        name: '',
        sort: "单号 DESC",
        rec: row_num,
    },
    edit: false,
    header_names: {
        "到货日期": "documents.文本字段5",
        "入库日期": "documents.日期",
        "入库单号": "documents.单号",
        "名称": "split_part(node_name,' ',2)",
        "物料号": "products.文本字段1",
        "材质": "split_part(node_name,' ',1)",
        "规格": "规格型号",
        "状态": "products.文本字段2",
        "炉号": "products.文本字段4",
        "长度": "products.整数字段1",
        "执行标准": "products.文本字段3",
        "生产厂家": "products.文本字段5",
        "重量": "库存下限",
        "备注": "documents.备注"
    },

    row_fn: row_fn,
    blank_row_fn: blank_row_fn,
};

init_data.post_data.cate = `${date1}${SPLITER}${date2}`;

table_init(init_data);
fetch_table();

//点击搜索按钮
document.querySelector('#serach-button').addEventListener('click', function () {
    let fields = document.querySelector('#search-fields').value;
    let date1 =  document.querySelector('#search-date1').value;
    let date2 = document.querySelector('#search-date2').value;

    init_data.post_data.name = fields;
    init_data.post_data.cate = `${date1}${SPLITER}${date2}`;

    // table_init(init_data);
    fetch_table();
});

function row_fn(tr) {
    let row = tr.split(SPLITER);
    return `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td>${row[5]}</td>
            <td>${row[6]}</td><td>${row[7]}</td><td>${row[8]}</td><td>${row[9]}</td><td>${row[10]}</td>
            <td>${row[11]}</td><td>${row[12]}</td><td>${row[13]}</td><td>${row[14]}</td></tr>`;
}

function blank_row_fn() {
    return `<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td><td></td></tr>`;
}

document.querySelector('#data-out').addEventListener('click', ()=> {
    let da1 = document.querySelector('#search-date1').value;
    let da2 = document.querySelector('#search-date2').value;
    let name = document.querySelector('#search-fields').value;
    let data = `${da1}${SPLITER}${da2}${SPLITER}${name}`;
    fetch(`/stockin_excel`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                download_file(`/download/入库明细表.xlsx`);
                notifier.show('成功导出至 Excel 文件', 'success');
            } else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
});