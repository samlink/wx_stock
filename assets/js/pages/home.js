let now = new Intl.DateTimeFormat('fr-CA').format(new Date());
let now2 = now.split('-');
document.querySelector('#help-info').textContent = `${now2[0]}年${now2[1]}月${now2[2]}日`;

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
        }
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
    }
}

let da = new Date(Date.now());
let da2 = da.setDate(da.getDate() - 10);
let date1 = new Intl.DateTimeFormat('fr-CA').format(da2);
let date2 = new Intl.DateTimeFormat('fr-CA').format(new Date());

let data1 = {
    statis_cate: "按日",
    date1: date1,
    date2: date2,
};

set_chart1(data1);

let data2 = {
    statis_cate: "按日",
    num: 10
};

set_chart2(data2);

function set_chart1(data) {
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
                char_data1.data.labels = content[1];
                char_data1.data.datasets[0].data = content[2];
                new Chart(ctx1, char_data1);
            }
        });
}

function set_chart2(data) {
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
                char_data2.data.labels = content[1].reverse();
                char_data2.data.datasets[0].data = content[2].reverse();

                new Chart(ctx2, char_data2);
            }
        });
}
