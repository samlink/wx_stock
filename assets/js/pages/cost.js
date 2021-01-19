import { notifier } from '../parts/notifier.mjs';

var ctx = document.getElementById('myChart').getContext('2d');

var char_data = {
    data: {
        datasets: [{
            label: '销售额',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    }
}

var myChart;

let m = "个月";
let w = "周";
let d = "天";
let y = "年";

let info = document.querySelector('#info2');

let statis_cate_s = localStorage.getItem("statis_cate");
let chart_cate_s = localStorage.getItem("chart_cate");

let statis_cate = statis_cate_s ? statis_cate_s : "按月";
let chart_cate = chart_cate_s ? chart_cate_s : "柱状图";

document.querySelector('#chart-cate').value = chart_cate;

if (statis_cate == "按月") {
    document.querySelector('#statis-cate').value = "按月";
    document.querySelector('#search-date').value = 12;

    let data = {
        statis_cate: statis_cate,
        num: 12,
    };

    set_chart(data);
}
else if (statis_cate == "按年") {
    document.querySelector('#statis-cate').value = "按年";
    document.querySelector('#search-date').value = 10;

    info.textContent = y;

    let data = {
        statis_cate: statis_cate,
        num: 10,
    };

    set_chart(data);
}
else {
    if (statis_cate == "按周") {
        document.querySelector('#statis-cate').value = "按周";
        info.textContent = w;
    }
    else {
        document.querySelector('#statis-cate').value = "按日";
        info.textContent = d;
    }

    document.querySelector('#search-date').value = 10;

    let data = {
        statis_cate: statis_cate,
        num: 10,
    };

    set_chart(data);
}

document.querySelector('#statis-cate').addEventListener('change', function () {
    if (this.value == "按月") {
        info.textContent = m;
    }
    else if (this.value == "按年") {
        info.textContent = y;
    }
    else {
        if (this.value == "按周") {
            info.textContent = w;
        }
        else {
            info.textContent = d;
        }
    }

    document.querySelector('#search-date').value = 10;
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

    let num = document.querySelector('#search-date').value;

    if (!num) {
        notifier.show('请输入正确数字', 'danger');
        return false;
    }

    let data = {
        statis_cate: sta_cate,
        num: num,
    }

    set_chart(data);

    localStorage.setItem("statis_cate", sta_cate);
});

function set_chart(data) {
    fetch("/fetch_cost", {
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
                notifier.show('无操作权限或无销售记录', 'danger');
            }
        });
}
