import { notifier } from '../parts/notifier.mjs';
import { SPLITER } from '../parts/tools.mjs';

var da = new Date(Date.now());
let da2 = da.setFullYear(da.getFullYear() - 1); //此处 da 已经改变

let date1 = new Intl.DateTimeFormat('fr-CA').format(da2)
let date2 = new Intl.DateTimeFormat('fr-CA').format(new Date())

laydate.render({
    elem: '#search-date',
    type: 'month',
    range: true,
    theme: 'molv',
    value: `${date1.substring(0,7)} - ${date2.substring(0,7)}`,

    done: function (value, startDate, endDate) {
        let date = value.split(" - ");
        console.log(date[0]);


    },
});

// laydate.render({
//     elem: '#search-date1',
//     showBottom: false,
//     theme: 'molv',
//     value: new Intl.DateTimeFormat('fr-CA').format(da2),
//     // theme: '#62468d',
// });

// laydate.render({
//     elem: '#search-date2',
//     showBottom: false,
//     // value: da.toLocaleDateString(),
//     value: new Intl.DateTimeFormat('fr-CA').format(da),
//     theme: 'molv',
// });

let search_button = document.querySelector('#serach-button');

search_button.addEventListener('click', function () {
    let date1 = document.querySelector('#search-date1').value;
    let date2 = document.querySelector('#search-date2').value;
    if (!(date1 && date2)) {
        notifier.show('请输入起止日期', 'danger');
        return;
    }

    if (old_date1 != date1 || old_date2 != date2) {
        old_date1 = date1;
        old_date2 = date2;
        flag = 0;
    }

    let cate = document.querySelector('#customer-cate').value;
    let c = document.querySelector('#search-customer').value;
    let customer = c ? c : "";

    let data = {
        cate: cate,
        customer: customer,
        date1: date1,
        date2: date2,
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
                if (flag == 0) {
                    flag = 1;
                    let div_list = document.querySelector('.name-list');
                    let names = "";

                    for (let name of content[0]) {
                        names += `<p>${name}</p>`;
                    }

                    div_list.innerHTML = names;

                    let ps = div_list.querySelectorAll("p");
                    for (let p of ps) {
                        p.addEventListener("click", function () {
                            for (let p1 of ps) {
                                p1.classList.remove('focus');
                            }
                            this.classList.add('focus');
                            document.querySelector("#search-customer").value = p.textContent;
                            search_button.click();

                        });
                    }
                }

                if (content[1].length > 0) {
                    let rows = "";
                    let debt1 = content[1][0].split(SPLITER);
                    let debt2 = content[1][1].split(SPLITER);
                    let debt3 = content[1][2].split(SPLITER);
                    let debt4 = content[1][3].split(SPLITER);

                    let s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0;

                    let row = "<tr>";
                    for (let d of debt1) {
                        d = d == 0 ? "" : d;
                        row += `<td>${d}</td>`;
                    }
                    row += "</tr>";
                    rows += row;

                    row = "<tr>";
                    for (let d of debt2) {
                        d = d == 0 ? "" : d;
                        row += `<td>${d}</td>`;
                    }
                    row += "</tr>";
                    rows += row;

                    s1 = debt1[1] * 1 + debt2[1] * 1;
                    s2 = debt1[2] * 1 - debt2[2] * 1;
                    s3 = debt1[3] * 1 - debt2[3] * 1;
                    s4 = debt1[4] * 1 - debt2[4] * 1;
                    s5 = debt1[5] * 1 - debt2[5] * 1;

                    rows += `<tr><td>小计</td><td>${s1 == 0 ? "" : s1}</td><td>${s2 == 0 ? "" : s2.toFixed(p)}</td><td>${s3 == 0 ? "" : s3.toFixed(p)}</td>
                    <td>${s4 == 0 ? "" : s4.toFixed(p)}</td><td>${s5 == 0 ? "" : s5.toFixed(p)}</td></tr>`;

                    s1 = 0; s2 = 0; s3 = 0; s4 = 0; s5 = 0;

                    row = "<tr>";
                    for (let d of debt3) {
                        d = d == 0 ? "" : d;
                        row += `<td>${d}</td>`;
                    }
                    row += "</tr>";
                    rows += row;

                    row = "<tr>";
                    for (let d of debt4) {
                        d = d == 0 ? "" : d;
                        row += `<td>${d}</td>`;
                    }
                    row += "</tr>";
                    rows += row;

                    s1 = debt3[1] * 1 + debt4[1] * 1;
                    s2 = debt3[2] * 1 - debt4[2] * 1;
                    s3 = debt3[3] * 1 - debt4[3] * 1;
                    s4 = debt3[4] * 1 - debt4[4] * 1;
                    s5 = debt3[5] * 1 - debt4[5] * 1;

                    rows += `<tr><td>小计</td><td>${s1 == 0 ? "" : s1}</td><td>${s2 == 0 ? "" : s2.toFixed(p)}</td><td>${s3 == 0 ? "" : s3.toFixed(p)}</td>
                            <td>${s4 == 0 ? "" : s4.toFixed(p)}</td><td>${s5 == 0 ? "" : s5.toFixed(p)}</td></tr>`;

                    document.querySelector('.table-container tbody').innerHTML = rows;
                }
            }
            else {
                notifier.show('无操作权限', 'danger');
            }
        });
});


