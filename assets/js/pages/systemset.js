import { padZero } from "../parts/tools.mjs";
import { notifier } from '../parts/notifier.mjs';

const price = 3.685972;
const mount = 368.5972;
const year = "2021";
const month = "03";
const day = "04";
const num = "81";

var edit = 0;

let price_select = document.querySelector('#price-select');
let mount_select = document.querySelector('#mount-select');
let date_select = document.querySelector('#date-select');
let position_select = document.querySelector('#position-select');
let spliter_check = document.querySelector('#spliter-check');
let date_example = document.querySelector('#example-dh');

fetch('/fetch_system')
    .then(response => response.json())
    .then(data => {
        let system = data.split(',');
        price_select.value = system[0];
        mount_select.value = system[1];
        date_select.value = system[2];
        position_select.value = system[3];
        spliter_check.checked = system[4] == 'true' ? true : false;

        document.querySelector('#example-price').textContent = price.toFixed(Number(price_select.value));
        document.querySelector('#example-mount').textContent = mount.toFixed(Number(mount_select.value));

        change_dh();
    });

//小数位数
price_select.addEventListener('change', function () {
    document.querySelector('#example-price').textContent = price.toFixed(Number(this.value));
    edit_change();
});

mount_select.addEventListener('change', function () {
    document.querySelector('#example-mount').textContent = mount.toFixed(Number(this.value));
    edit_change();
});

//单号格式
date_select.addEventListener('change', function () {
    edit_change();
    change_dh();
});

position_select.addEventListener('change', function () {
    edit_change();
    change_dh();
});

spliter_check.addEventListener('change', function () {
    edit_change();
    change_dh();
});

function edit_change() {
    edit = 1;
    document.querySelector('#sumit-button').disabled = false;
}

function change_dh() {
    let date_value = date_select.value;
    let position_value = Number(position_select.value);

    let spliter = spliter_check.checked ? "-" : "";
    let date;
    if (date_value == "日") {
        date = `XS${year}${spliter}${month}${spliter}${day}${spliter}`;
    }
    else if (date_value == "月") {
        date = `XS${year}${spliter}${month}${spliter}`;
    }
    else if (date_value == "年") {
        date = `XS${year}${spliter}`;
    }
    else {
        date = `XS`;
    }

    let pad_num = padZero(num, position_value);

    document.querySelector('#example-dh').textContent = ` ${date}${pad_num}`;
}

document.querySelector('#sumit-button').addEventListener('click', function () {
    let data = `${price_select.value},${mount_select.value},${date_select.value},${position_select.value},${spliter_check.checked},${date_example.textContent.trim()}`;

    fetch('/update_system', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            if (data != -1) {
                edit = 0;
                notifier.show('修改成功', 'success');
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
});

window.onbeforeunload = function (e) {
    if (edit == 1) {
        var e = window.event || e;
        e.returnValue = ("编辑未保存提醒");
    }
}