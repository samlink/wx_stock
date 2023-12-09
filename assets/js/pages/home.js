document.querySelector('#title').classList.add('show-chosed');

let now = new Intl.DateTimeFormat('fr-CA').format(new Date());
let now2 = now.split('-');
document.querySelector('#date-now').textContent = `${now2[0]}年${now2[1]}月${now2[2]}日`;

// fetch(`/start_date`, {
//     method: 'post',
//     headers: {
//         "Content-Type": "application/json",
//     },
// })
//     .then(response => response.json())
//     .then(content => {
//         document.querySelector('#use-day').textContent =
//             parseInt((new Date().getTime() - new Date(content).getTime()) / (1000 * 60 * 60 * 24)) + 1;
//     });


var ctx1 = document.getElementById('myChart1').getContext('2d');
var ctx2 = document.getElementById('myChart2').getContext('2d');

let da = new Date(Date.now());
let da2 = da.setDate(da.getDate() - 365);
let date1 = new Intl.DateTimeFormat('fr-CA').format(da2);
let date2 = new Intl.DateTimeFormat('fr-CA').format(new Date());

let data1 = {
    statis_cate: "按月",
    date1: date1,
    date2: date2,
};

set_chart1(data1);

let data2 = {
    statis_cate: "按月",
    num: 12
};

set_chart2(data2);


fetch(`/home_statis`, {
    method: 'post',
    headers: {
        "Content-Type": "application/json",
    },
})
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            let reminder = document.querySelector('#show-01 .reminder')
            let lines = Math.floor(reminder.clientHeight / 33);
            let add = 0;
            if (lines >= content.length) {
                lines = content.length;
            } else {
                lines--;
                add = 1;
            }

            let line = "<ul>";
            for (let i = 0; i < lines; i++) {
                line += `<li onclick='/sale/${content[i].split('　')[0]}'>${content[i]}</li>`;
            }

            line += "</ul>";

            if (add == 1) {
                line += '<div class="more-tip">更多......</div>'
            }

            // console.log(line)
            document.querySelector('#sale-data').textContent = `销售未完成 ${content.length} 单`; //未审核, 未发货, 未收款
            reminder.innerHTML = line;

            reminder.querySelectorAll('li').forEach((li) => {
                li.addEventListener('click', () => {
                    window.location.href = `/sale/${li.textContent.split('　')[0]}`;
                })
            });

            // document.querySelector('#sale-data').textContent = content[0];
            // document.querySelector('#buy-data').textContent = content[1];
            // document.querySelector('#warn-data2').textContent = content[2];
            // document.querySelector('#warn-data1').textContent = content[3];
        }
    });

document.querySelector('#sale-tip').addEventListener('click', function () {
    window.open(`/sale_query`);
});

document.querySelector('#buy-tip').addEventListener('click', function () {
    window.open(`/buy_query`);
});

document.querySelector('#warn-tip2').addEventListener('click', function () {
    window.open(`/stock_query`);
});

document.querySelector('#warn-tip').addEventListener('click', function () {
    window.open(`/stock_query`);
});
//
// setInterval(() => {
//     location.reload();
// }, 600000);

function set_chart1(data) {
    fetch(`/fetch_statis`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                new Chart(ctx1,
                    {
                        type: 'bar',
                        data: {
                            labels: content[1],
                            datasets: [{
                                label: '销售额',
                                data: content[2],
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
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                            hover: {
                                animationDuration: 0  // 防止鼠标移上去，数字闪烁
                            },
                            animation: {           // 这部分是数值显示的功能实现
                                onComplete: function () {
                                    var chartInstance = this;
                                    let ctx = chartInstance.ctx;
                                    // 以下属于canvas的属性（font、fillStyle、textAlign...）
                                    // ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize,
                                    //             Chart.defaults.global.defaultFontStyle,
                                    //             Chart.defaults.global.defaultFontFamily);
                                    ctx.fillStyle = "dark-gray";
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'bottom';

                                    this.data.datasets.forEach(function (dataset, i) {
                                        var meta = chartInstance.controller.getDatasetMeta(i);
                                        meta.data.forEach(function (bar, index) {
                                            var data = dataset.data[index];
                                            ctx.fillText(data, bar._model.x, bar._model.y - 5);
                                        });
                                    });
                                }
                            }
                        }
                    }
                );
            }
        });
}

function set_chart2(data) {
    fetch(`/fetch_cost`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                new Chart(ctx2, {
                    type: 'line',
                    data: {
                        labels: content[1].reverse(),
                        datasets: [{
                            label: '库存重量',
                            data: content[2].reverse(),
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1,
                            fill: false,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                    }
                });
            }
        });
}
