import { notifier } from '../parts/notifier.mjs';

//设置菜单 
document.querySelector('#statics .nav-icon').classList.add('show-chosed');
document.querySelector('#statics .menu-text').classList.add('show-chosed');

var ctx = document.getElementById('myChart').getContext('2d');

var char_data = {
    data: {
        datasets: [{
            label: '销售额',
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
            }],
        }
    }
}

var myChart;

//按月
let da = new Date(Date.now());
let da2 = da.setFullYear(da.getFullYear() - 1);
let date1 = new Date(da2).Format("yyyy-MM");
let date2 = new Date().Format("yyyy-MM");
let value_month = `${date1} - ${date2}`;

laydate.render({
    elem: '#search-date-month',
    type: "month",
    range: true,
    value: value_month,
    // theme: 'molv',
});

//按年
da = new Date(Date.now());
da2 = da.setFullYear(da.getFullYear() - 10);
date1 = new Date(da2).Format("yyyy");
date2 = new Date().Format("yyyy");

let value_year = `${date1} - ${date2}`;

laydate.render({
    elem: '#search-date-year',
    type: "year",
    range: true,
    value: value_year,
    // theme: 'molv',
});

//按周和按日
da = new Date(Date.now());
da2 = da.setMonth(da.getMonth() - 3);
date1 = new Date(da2).Format("yyyy-MM-dd");
date2 = new Date().Format("yyyy-MM-dd");

let value_week = `${date1} - ${date2}`;

laydate.render({
    elem: '#search-date-week',
    range: true,
    value: value_week,
    // theme: 'molv',
});

let info = document.querySelector('#info');
let m = "默认区间为1年";
let y = "默认区间为10年";
let w = "默认区间三个月，周一为起始日";
let d = "默认区间一个月";

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

    info.textContent = m;

    let date = value_month.split(' - ');
    let date1 = date[0] + "-01";
    let date2 = add_month(date[1]);

    let data = {
        statis_cate: statis_cate,
        date1: date1,
        date2: date2,
    };

    set_chart(data);
}
else if (statis_cate == "按年") {
    document.querySelector('#statis-cate').value = "按年";
    document.querySelector('#search-date-month').style.display = "none";
    document.querySelector('#search-date-year').style.display = "inline-block";
    document.querySelector('#search-date-week').style.display = "none";

    info.textContent = y;

    let date = value_year.split(' - ');

    let data = {
        statis_cate: statis_cate,
        date1: date[0] + "-01-01",
        date2: date[1] + "-12-31",
    };

    set_chart(data);
}
else {
    let date = value_week.split(' - ');
    let date1 = date[0];
    let date2 = date[1];

    if (statis_cate == "按周") {
        document.querySelector('#statis-cate').value = "按周";
        info.textContent = w;
    }
    else {
        document.querySelector('#statis-cate').value = "按日";
        info.textContent = d;
        let da = new Date(Date.now());
        let da2 = da.setMonth(da.getMonth() - 1);
        date1 = new Date(da2).Format("yyyy-MM-dd");
    }

    document.querySelector('#search-date-week').value = `${date1} - ${date2}`;

    document.querySelector('#search-date-month').style.display = "none";
    document.querySelector('#search-date-year').style.display = "none";
    document.querySelector('#search-date-week').style.display = "inline-block";

    let data = {
        statis_cate: statis_cate,
        date1: date1,
        date2: date2,
    };

    set_chart(data);
}

document.querySelector('#statis-cate').addEventListener('change', function () {
    if (this.value == "按月") {
        document.querySelector('#search-date-month').style.display = "inline-block";
        document.querySelector('#search-date-year').style.display = "none";
        document.querySelector('#search-date-week').style.display = "none";
        info.textContent = m;
    }
    else if (this.value == "按年") {
        document.querySelector('#search-date-month').style.display = "none";
        document.querySelector('#search-date-year').style.display = "inline-block";
        document.querySelector('#search-date-week').style.display = "none";
        info.textContent = y;
    }
    else {
        document.querySelector('#search-date-month').style.display = "none";
        document.querySelector('#search-date-year').style.display = "none";
        document.querySelector('#search-date-week').style.display = "inline-block";

        if (this.value == "按周") {
            info.textContent = w;
        }
        else {
            info.textContent = d;
        }
    }
});

document.querySelector('#chart-cate').addEventListener('change', function () {
    localStorage.setItem("chart_cate", this.value);
    char_data.type = this.value == "柱状图" ? "bar" : "line";
    char_data.data.datasets[0].fill = this.value == "柱状图" ? true : false;

    myChart.destroy();
    myChart = new Chart(ctx, char_data);
});

document.querySelector('#statis-button').addEventListener('click', function () {
    chart_cate = document.querySelector('#chart-cate').value;
    let sta_cate = document.querySelector('#statis-cate').value;

    let date, date1, date2;
    if (sta_cate == "按月") {
        date = document.querySelector('#search-date-month').value

        if (!date) {
            notifier.show('请输入起止月份', 'danger');
            return false;
        }

        date = date.split(' - ');
        date1 = date[0] + "-01";
        date2 = add_month(date[1]);
    }
    else if (sta_cate == "按年") {
        date = document.querySelector('#search-date-year').value;

        if (!date) {
            notifier.show('请输入起止年份', 'danger');
            return false;
        }

        date = date.split(' - ');
        date1 = date[0] + "-01-01";
        date2 = date[1] + "-12-31";
    }
    else {
        date = document.querySelector('#search-date-week').value;

        if (!date) {
            notifier.show('请输入正确日期', 'danger');
            return false;
        }

        date = date.split(' - ');
        date1 = date[0];
        date2 = date[1];
    }

    let data = {
        statis_cate: sta_cate,
        date1: date1,
        date2: date2,
    };

    set_chart(data);

    localStorage.setItem("statis_cate", sta_cate);
});

function set_chart(data) {
    fetch(`/${code}/fetch_statis`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                let th_date = document.querySelector('#th-date');

                if (data.statis_cate == "按月") {
                    th_date.textContent = "月份";
                }
                else if (data.statis_cate == "按年") {
                    th_date.textContent = "年份";
                }
                else if (data.statis_cate == "按周") {
                    th_date.textContent = "周 (周一)";
                }
                else {
                    th_date.textContent = "日期";
                }

                let rows = "";
                for (let i = 0; i < content[0].length; i++) {
                    rows += `<tr><td>${content[0][i]}</td><td>${content[1][i]}</td><td>${content[2][i]}</td></tr>`;
                }

                document.querySelector('.table-container tbody').innerHTML = rows;

                char_data.type = chart_cate == "柱状图" ? "bar" : "line";
                char_data.data.labels = content[1];
                char_data.data.datasets[0].data = content[2];
                char_data.data.datasets[0].fill = chart_cate == "柱状图" ? true : false;

                if (myChart) {
                    myChart.destroy();
                }

                myChart = new Chart(ctx, char_data);
            }
            else {
                notifier.show('无操作权限', 'danger');
            }
        });
}

function add_month(da_str) {
    let str = da_str + "-01";
    str = str.replace(/-/g, '/');
    let date = new Date(str);

    date.setMonth(date.getMonth() + 1);
    return new Date(date).Format("yyyy-MM-dd");
}
