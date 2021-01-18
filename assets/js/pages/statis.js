import { notifier } from '../parts/notifier.mjs';
import { SPLITER } from '../parts/tools.mjs';

var ctx = document.getElementById('myChart').getContext('2d');
var char_data = {
    type: 'bar',
    data: {
        // labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
            label: '销售额',
            // data: [12, 9, 23, 5, 2, 3],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
}

var myChart;

let statis_cate_s = localStorage.getItem("statis_cate");
let chart_cate_s = localStorage.getItem("chart_cate");

let statis_cate = statis_cate_s ? statis_cate_s : "按月";
let chart_cate = chart_cate_s ? chart_cate_s : "柱状图";

if (statis_cate == "按月") {
    set_cate_date("按月");
}
else {
    if (statis_cate == "按年") {
        set_cate_date("按年");
    }
}

function set_cate_date(cate) {
    let n1 = 1, n2 = 7, d1 = "month";
    if (cate == "按年") {
        n1 = 10;
        n2 = 4;
        d1 = "year";
    }

    let da = new Date(Date.now());
    let da2 = da.setFullYear(da.getFullYear() - n1);
    let date1 = new Intl.DateTimeFormat('fr-CA').format(da2);
    let date2 = new Intl.DateTimeFormat('fr-CA').format(new Date());

    set_date(d1, `${date1.substring(0, n2)} - ${date2.substring(0, n2)}`);

    let date_s = date.split(" - ");

    let data = {
        statis_cate: statis_cate,
        chart_cate: chart_cate,
        date1: date_s[0],
        date2: date_s[1],
    };

    set_chart(data);
}

document.querySelector('#statis-cate').addEventListener('change', function () {
    if (this.value == "按月") {

    }
});


function set_date(type, value) {
    laydate.render({
        elem: '#search-date',
        type: type,
        range: true,
        theme: 'molv',
    });
}

function set_chart(data) {

}

function fetch_statis(data) {
    fetch("/fetch_statis", {
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
}

