document.querySelector('#title').classList.add('show-chosed');

let now = new Intl.DateTimeFormat('fr-CA').format(new Date());
let now2 = now.split('-');
document.querySelector('#date-now').textContent = `${now2[0]}年${now2[1]}月${now2[2]}日`;

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
            let reminder = document.querySelector('#show-01 .reminder');
            let fit_lines = Math.floor(reminder.clientHeight / 33);

            //销售未收款
            let data = {
                content: content[0],
                lines: fit_lines,
                reminder: reminder,
                title_holer: document.querySelector('#sale-data'),
                title: `销售待收款 ${content[0].length} 单`,
                more_href: "/sale_query?s=wait_money",
                location: "/sale/",
            }

            show_reminders(data);

            //销售未发货
            let data2 = {
                content: content[1],
                lines: fit_lines,
                reminder: document.querySelector('#show-02 .reminder'),
                title_holer: document.querySelector('#sale-data2'),
                title: `销售待发货 ${content[1].length} 单`,
                more_href: "/sale_query?s=wait_trans",
                location: "/sale/",
            }

            show_reminders(data2);

            //采购未入库
            let data3 = {
                content: content[2],
                lines: fit_lines,
                reminder: document.querySelector('#show-03 .reminder'),
                title_holer: document.querySelector('#buy-data'),
                title: `采购待入库 ${content[2].length} 单`,
                more_href: "/buy_query?s=wait_in",
                location: "/buy_in/",
            }

            show_reminders(data3);

            //等待审核
            let data4 = {
                content: content[3],
                lines: fit_lines,
                reminder: document.querySelector('#show-04 .reminder'),
                title_holer: document.querySelector('#warn-data2'),
                title: `待审核 ${content[3].length} 类单据`,
                alter_func: function () {
                    this.reminder.querySelectorAll('li').forEach((li) => {
                        li.addEventListener('click', () => {
                            let cate = li.textContent.split('　')[0];
                            let query = "s=wait_shen" + " " + cate;
                            window.location.href = `${get_address(cate)}?${query}`;
                        })
                    });
                }
            }

            show_reminders(data4);

            //销售待出库
            let data6 = {
                content: content[5],
                lines: fit_lines,
                reminder: document.querySelector('#show-06 .reminder'),
                title_holer: document.querySelector('#pre-data'),
                title: `销售待出库 ${content[5].length} 单`,
                more_href: "/sale_query?s=wait_out",
                location: "/sale/",
            }

            show_reminders(data6);

            //销售未开票
            let data5 = {
                content: content[4],
                lines: fit_lines,
                reminder: document.querySelector('#show-05 .reminder'),
                title_holer: document.querySelector('#warn-data3'),
                title: `销售待开票 ${content[4].length} 单`,
                more_href: "/s_query?s=wait_kp",
                location: "/sale/",
            }

            show_reminders(data5);

            //反审单据
            let data7 = {
                content: content[6],
                lines: fit_lines,
                reminder: document.querySelector('#show-07 .reminder'),
                title_holer: document.querySelector('#fan-data'),
                title: `其他待办 ${content[6].length} 类单据`,
                alter_func: function () {
                    this.reminder.querySelectorAll('li').forEach((li) => {
                        li.addEventListener('click', () => {
                            let cate = li.textContent.split('　')[0];
                            let query = "s=" + cate;
                            window.location.href = `/other_query?${query}`;
                        })
                    });
                    // this.reminder.querySelectorAll('li').forEach((li) => {
                    //     li.addEventListener('click', () => {
                    //         window.location.href = get_locat(li.textContent.split(' ')[0]);
                    //     })
                    // });
                }
            }

            show_reminders(data7);
        }
    }
    );

function get_locat(dh) {
    let loc;
    if (dh.startsWith("XS")) {
        loc = "/sale/" + dh;
    } else if (dh.startsWith("XT")) {
        loc = "/saleback/" + dh;
    } else if (dh.startsWith("CG")) {
        loc = "/buy_in/" + dh;
    } else if (dh.startsWith("CT")) {
        loc = "/buy_back/" + dh;
    } else if (dh.startsWith("RK")) {
        loc = "/material_in/" + dh;
    } else if (dh.startsWith("CK")) {
        loc = "/material_out/" + dh;
    } else if (dh.startsWith("FH")) {
        loc = "/transport/" + dh;
    } else if (dh.startsWith("TR")) {
        loc = "/stock_change_in/" + dh;
    } else {
        loc = "/stock_change_out/" + dh;
    }
    return loc;
}

function get_address(cate) {
    let address;
    if (cate == "材料采购") {
        address = `/buy_query`;
    } else if (cate == "商品销售") {
        address = `/sale_query`;
    } else if (cate == "销售退货") {
        address = '/sale_query';
    } else if (cate == "采购入库") {
        address = `/change_query_in`;
    } else if (cate == "采购退货") {
        address = `/buy_query`;
    } else if (cate == "销售出库") {
        address = `/change_query_out`;
    } else if (cate == "运输发货") {
        address = `/trans_query`;
    } else if (cate == "调整入库") {
        address = `/stock_query_in`;
    } else if (cate == "调整出库") {
        address = `/stock_query_out`;
    } else if (cate == "销售开票") {
        address = `/kp_query`;
    }
    return address;
}

function show_reminders(data) {
    // 销售提醒
    let add = 0;

    if (data.lines >= data.content.length) {
        data.lines = data.content.length;
    } else {
        data.lines--;
        add = 1;
    }

    let line = "<ul>";
    for (let i = 0; i < data.lines; i++) {
        line += `<li>${data.content[i]}</li>`;
    }

    line += "</ul>";

    if (add == 1) {
        line += `<div class="more-tip"> <a href=${data.more_href}>更多......</a></div>`;
    }

    data.title_holer.textContent = data.title;
    data.reminder.innerHTML = line;

    if (!data.alter_func) {
        data.reminder.querySelectorAll('li').forEach((li) => {
            li.addEventListener('click', () => {
                window.location.href = `${data.location}${li.textContent.split(' ')[0]}`;
            })
        });
    } else {
        data.alter_func();
    }
}

document.querySelector('#sale-tip').addEventListener('click', function () {
    window.location.href = `/sale_query?s=wait_money`;
});

document.querySelector('#buy-tip').addEventListener('click', function () {
    window.location.href = `/sale_query?s=wait_trans`;
});

document.querySelector('#warn-tip').addEventListener('click', function () {
    window.location.href = `/buy_query?s=wait_in`;
});

document.querySelector('#use-tip').addEventListener('click', function () {
    window.location.href = `/buy_query?s=wait_buy_back`;
});

document.querySelector('#pre-shen').addEventListener('click', function () {
    window.location.href = `/sale_query?s=wait_out`;
});

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
                let cont = content[2].map(n => Math.round((n / 10000), 1));
                new Chart(ctx1,
                    {
                        type: 'bar',
                        data: {
                            labels: content[1],
                            datasets: [{
                                label: '销售额',
                                data: cont,
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
