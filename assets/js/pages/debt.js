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

document.querySelector('#serach-button').addEventListener('click', function () {
    let date1 = document.querySelector('#search-date1').value;
    let date2 = document.querySelector('#search-date2').value;
    if (!(date1 && date2)) {
        notifier.show('请输入起止日期', 'danger');
        return;
    }

    let cate = document.querySelector('#customer-cate').value;
    let c = document.querySelector('#search-customer').value;
    let customer = c ? c : "";

    let data = {
        cate: cate,
        customer: customer,
        date1: date1,
        date2: date2,
        // flag: 1,
    }

    fetch("/fetch_debt", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                document.querySelector('.customer-name').textContent = customer;
                let div_list = document.querySelector('.name-list');
                let names = "";

                for (let name of content[0]) {
                    names += `<p>${name}</p>`;
                }

                div_list.innerHTML = names;

                console.log(content[1]);

                if (content[1].length > 0) {
                    let rows;
                    for (let s of content[1]) {
                        rows = "";
                        let debt = s.split(SPLITER);
                        if (debt.length > 1) {
                            let row = "<tr>";
                            for (let d of debt) {
                                row += `<td>${d}</td>`;
                            }
                            row += "</tr>";
                            rows += row;
                        }
                    }

                    console.log(rows);

                    document.querySelector('.table-container tbody').innerHTML = rows;
                }

            }
            else {
                notifier.show('无操作权限', 'danger');
            }
        });

})

//填充表格空行-------------------------------------------------
// let blank_rows = "";
// for (let i = 0; i < row_num; i++) {
//     blank_rows += blank_row_fn();
// }

// document.querySelector('.table-container tbody').innerHTML = blank_rows;

// function blank_row_fn() {
//     return `<tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
// }