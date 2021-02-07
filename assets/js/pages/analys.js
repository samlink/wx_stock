import { notifier } from '../parts/notifier.mjs';
import { SPLITER } from '../parts/tools.mjs';

//设置菜单 
document.querySelector('#statics .nav-icon').classList.add('show-chosed');
document.querySelector('#statics .menu-text').classList.add('show-chosed');

//执行日期实例------------------------------------------------
laydate.render({
    elem: '#search-date1',
    showBottom: false,
    // theme: 'molv',
});

laydate.render({
    elem: '#search-date2',
    showBottom: false,
    // theme: 'molv',
});

let today_button = document.querySelector('#today-button');

document.querySelector('#serach-button').addEventListener('click', function () {
    let date1 = document.querySelector('#search-date1').value;
    let date2 = document.querySelector('#search-date2').value;
    if (!(date1 && date2)) {
        notifier.show('请输入起止日期', 'danger');
        return;
    }

    document.querySelector('.customer-name').textContent = `日期：${date1} 至 ${date2}`;

    let data = {
        date1: date1,
        date2: date2,
    }

    fetch_data(data);
});

today_button.addEventListener('click', function () {
    document.querySelector('.customer-name').textContent = "今日";
    let da = new Date(Date.now());
    let data = {
        date1: da.toLocaleDateString(),
        date2: da.toLocaleDateString(),
    }

    fetch_data(data);
});

today_button.click();

function fetch_data(data) {
    fetch("/fetch_analys", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                let rows = "";

                for (let record of content) {
                    let row = "<tr>";
                    let document = record.split(SPLITER);
                    for (let d of document) {
                        d = d == 0 ? "" : d;
                        row += `<td>${d}</td>`;
                    }
                    row += "</tr>";
                    rows += row;
                }

                document.querySelector('.table-container tbody').innerHTML = rows;
            }
            else {
                notifier.show('无操作权限', 'danger');
            }
        });
}