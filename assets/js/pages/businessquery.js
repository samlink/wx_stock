import {table_init, fetch_table} from '../parts/table.mjs';
import {notifier} from '../parts/notifier.mjs';
import {AutoInput} from '../parts/autocomplete.mjs';
import {SPLITER, getHeight, download_file} from '../parts/tools.mjs';
import {set_date} from "../parts/service.mjs";


let get_height = getHeight() - 138;
let row_num = Math.floor(get_height / 33);

//执行日期实例------------------------------------------------
set_date();

//填充表格空行-------------------------------------------------
let blank_rows = "";
for (let i = 0; i < row_num; i++) {
    blank_rows += blank_row_fn();
}

document.querySelector('.table-container tbody').innerHTML = blank_rows;

let date1 = document.querySelector('#search-date1').value;
let date2 = document.querySelector('#search-date2').value;

//表格搜索----------------------------------------------------
let init_data = {
    container: '.table-container',
    url: `/fetch_business`,
    post_data: {
        id: "",
        name: '',
        sort: "单号 DESC",
        rec: row_num,
        cate: `${date1}${SPLITER}${date2}`,
    },
    edit: false,
    header_names: {
        "日期": "日期",
        "单号": "单号",
        "合同编号": "documents.文本字段6",
        "类别": "documents.类别",
        "单据金额": "应结金额",
        "商品名称": "node_name",
        "材质": "node_name",
        "规格": "规格",
        "状态": "documents.文本字段2",
        "长度": "长度",
        "数量": "数量",
        "价格": "单价",
        "重量": "重量",
        "备注": "documents.备注"
    },

    row_fn: row_fn,
    blank_row_fn: blank_row_fn,
};

table_init(init_data);
fetch_table();

//点击搜索按钮
document.querySelector('#serach-button').addEventListener('click', function () {
    let fields = document.querySelector('#search-fields').value;
    let date1 = document.querySelector('#search-date1').value;
    let date2 = document.querySelector('#search-date2').value;

    init_data.post_data.name = fields;
    init_data.post_data.cate = `${date1}${SPLITER}${date2}`;

    table_init(init_data);
    fetch_table();
});

//查看单据
// document.querySelector('#edit-button').addEventListener('click', function () {
//     let chosed = document.querySelector('tbody .focus');
//     let id = chosed ? chosed.querySelector('td:nth-child(3)').textContent : "";
//     if (id != "") {
//         let cate = chosed.querySelector('td:nth-child(5)').textContent;
//         let address = `/sale/`;
//
//         if (cate.indexOf("采购") != -1) {
//             address = `/buy_in/`;
//         }
//
//         window.open(address + id);
//     } else {
//         notifier.show('请先选择单据', 'danger');
//     }
// });


function row_fn(tr) {
    let row = tr.split(SPLITER);
    return `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td>${row[5]}</td>
            <td>${row[6]}</td><td>${row[7]}</td><td>${row[8]}</td><td>${row[9]}</td><td>${row[10]}</td>
            <td>${row[11]}</td><td>${row[12]}</td><td>${row[13]}</td><td>${row[14]}</td><td>${row[15]}</td></tr>`;
}

function blank_row_fn() {
    return `<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
}

document.querySelector('#data-out').addEventListener('click', () => {
    let da1 = document.querySelector('#search-date1').value;
    let da2 = document.querySelector('#search-date2').value;
    let name = document.querySelector('#search-fields').value;
    let data = `${da1}${SPLITER}${da2}${SPLITER}${name}`;
    fetch(`/business_excel`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                download_file(`/download/业务往来明细表.xlsx`);
                notifier.show('成功导出至 Excel 文件', 'success');
            } else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
});