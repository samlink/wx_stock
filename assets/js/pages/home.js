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

var char_data1 = {
    type: 'bar',
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
        },
        responsive: true,
        maintainAspectRatio: false,
    }
}

var char_data2 = {
    type: 'line',
    data: {
        datasets: [{
            label: '库存成本',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: false,
        }]
    },
    options: {
        responsive:false,
    }
}

let da = new Date(Date.now());
let da2 = da.setDate(da.getDate() - 180);
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
    num: 6
};

set_chart2(data2);

let moni_sale = [1360, 1369, 1490, 1432, 1598, 1588, 1621, 1603, 1653, 1699];
let moni_cost = [1360, 1369, 1490, 1432, 1598, 1588, 1621, 1603, 1653, 1699];

//
// fetch(`/home_statis`, {
//     method: 'post',
//     headers: {
//         "Content-Type": "application/json",
//     },
// })
//     .then(response => response.json())
//     .then(content => {
//         if (content != -1) {
//             document.querySelector('#sale-data').textContent = content[0];
//             document.querySelector('#buy-data').textContent = content[1];
//             document.querySelector('#warn-data2').textContent = content[2];
//             document.querySelector('#warn-data1').textContent = content[3];
//         }
//     });

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
                char_data1.data.labels = content[1];
                char_data1.data.datasets[0].data = content[2];
                new Chart(ctx1, char_data1);
            }
            // else {
            //     char_data1.data.labels = fill_labels();
            //     char_data1.data.datasets[0].label = "销售额 (模拟）";
            //     char_data1.data.datasets[0].data = moni_sale;
            //     new Chart(ctx1, char_data1);
            // }
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
                char_data2.data.labels = content[1].reverse();
                char_data2.data.datasets[0].data = content[2].reverse();
                new Chart(ctx2, char_data2);
            }
            // else {
            //     char_data2.data.labels = fill_labels();
            //     char_data2.data.datasets[0].label = "库存成本 (模拟）";
            //     char_data2.data.datasets[0].data = moni_cost.reverse();
            //     new Chart(ctx2, char_data2);
            // }
        });
}

// function fill_labels() {
//     let labels = [];
//     for (let i = 9; i >= 0; i--) {
//         let da = new Date(Date.now());
//         let da2 = da.setDate(da.getDate() - i);
//         let date = new Intl.DateTimeFormat('fr-CA').format(da2);
//
//         labels.push(date);
//     }
//     return labels;
// }