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

let da = new Date(Date.now());
let da2 = da.setFullYear(da.getFullYear() - 1);
let date1 = new Intl.DateTimeFormat('fr-CA').format(da2);
let date2 = new Intl.DateTimeFormat('fr-CA').format(new Date());
let value_month = `${date1.substring(0, 7)} - ${date2.substring(0, 7)}`;

laydate.render({
    elem: '#search-date-month',
    type: "month",
    range: true,
    value: value_month,
    theme: 'molv',
});

da = new Date(Date.now());
da2 = da.setFullYear(da.getFullYear() - 10);
date1 = new Intl.DateTimeFormat('fr-CA').format(da2);
date2 = new Intl.DateTimeFormat('fr-CA').format(new Date());

let value_year = `${date1.substring(0, 4)} - ${date2.substring(0, 4)}`;

laydate.render({
    elem: '#search-date-year',
    type: "year",
    range: true,
    value: value_year,
    theme: 'molv',
});

let statis_cate_s = localStorage.getItem("statis_cate");
let chart_cate_s = localStorage.getItem("chart_cate");

let statis_cate = statis_cate_s ? statis_cate_s : "按月";
let chart_cate = chart_cate_s ? chart_cate_s : "柱状图";

document.querySelector('#chart-cate').value = chart_cate;

if (statis_cate == "按月") {
    document.querySelector('#statis-cate').value = "按月";
    document.querySelector('#search-date-month').style.display = "inline-block";
    document.querySelector('#search-date-year').style.display = "none";
    document.querySelector('#search-date-week').style.display = "none";

    let date = value_month.split(' - ');

    let data = {
        statis_cate: statis_cate,
        chart_cate: chart_cate,
        date1: date[0],
        date2: date[1],
    };

    set_chart(data);
}
else if (statis_cate == "按年") {
    document.querySelector('#statis-cate').value = "按年";
    document.querySelector('#search-date-month').style.display = "none";
    document.querySelector('#search-date-year').style.display = "inline-block";
    document.querySelector('#search-date-week').style.display = "none";

    let date = value_year.split(' - ');

    let data = {
        statis_cate: statis_cate,
        chart_cate: chart_cate,
        date1: date[0],
        date2: date[1],
    };

    set_chart(data);
}
else {
    document.querySelector('#statis-cate').value = "按周";
    document.querySelector('#search-date-month').style.display = "none";
    document.querySelector('#search-date-year').style.display = "none";
    document.querySelector('#search-date-week').style.display = "inline-block";

    document.querySelector('#search-date-week').value = 24;

    let data = {
        statis_cate: statis_cate,
        chart_cate: chart_cate,
        date1: "",
        date2: "24",
    };

    set_chart(data);
}

document.querySelector('#statis-cate').addEventListener('change', function () {
    if (this.value == "按月") {
        document.querySelector('#search-date-month').style.display = "inline-block";
        document.querySelector('#search-date-year').style.display = "none";
        document.querySelector('#search-date-week').style.display = "none";
        localStorage.setItem("statis_cate", "按月");

    }
    else if (this.value == "按年") {
        document.querySelector('#search-date-month').style.display = "none";
        document.querySelector('#search-date-year').style.display = "inline-block";
        document.querySelector('#search-date-week').style.display = "none";
        localStorage.setItem("statis_cate", "按年");
    }
    else {
        document.querySelector('#search-date-month').style.display = "none";
        document.querySelector('#search-date-year').style.display = "none";
        document.querySelector('#search-date-week').style.display = "inline-block";
        localStorage.setItem("statis_cate", "按周");
    }
});

document.querySelector('#chart-cate').addEventListener('change', function () {
    localStorage.setItem("chart_cate", this.value);
});


char_data.data.labels = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'];
char_data.data.datasets[0].data = [12, 9, 23, 5, 2, 3];

myChart = new Chart(ctx, char_data);

function set_chart(data) {
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
                // let row = "<tr>";
                // for (let d of debt4) {
                //     d = d == 0 ? "" : d;
                //     row += `<td>${d}</td>`;
                // }
                // row += "</tr>";
                // rows += row;

                // s1 = debt3[1] * 1 + debt4[1] * 1;
                // s2 = debt3[2] * 1 - debt4[2] * 1;
                // s3 = debt3[3] * 1 - debt4[3] * 1;
                // s4 = debt3[4] * 1 - debt4[4] * 1;
                // s5 = debt3[5] * 1 - debt4[5] * 1;

                // rows += `<tr><td>小计</td><td>${s1 == 0 ? "" : s1}</td><td>${s2 == 0 ? "" : s2.toFixed(p)}</td><td>${s3 == 0 ? "" : s3.toFixed(p)}</td>
                //             <td>${s4 == 0 ? "" : s4.toFixed(p)}</td><td>${s5 == 0 ? "" : s5.toFixed(p)}</td></tr>`;

                // document.querySelector('.table-container tbody').innerHTML = rows;

                char_data.data.labels = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'];
                char_data.data.datasets[0].data = [12, 9, 23, 5, 2, 3];

                myChart = new Chart(ctx, char_data);
            }
            else {
                notifier.show('无操作权限', 'danger');
            }
        });
}

