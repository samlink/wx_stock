import { padZero } from "../parts/tools.mjs";

const price = 3.685972;
const mount = 368.5972;
const year = "2021";
const month = "03";
const day = "04";
const num = "81";

let price_select = document.querySelector('#price-select');
let mount_select = document.querySelector('#mount-select');
let date_select = document.querySelector('#date-select');
let position_select = document.querySelector('#position-select');
let spliter_check = document.querySelector('#spliter-check');

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
});

mount_select.addEventListener('change', function () {
    document.querySelector('#example-mount').textContent = mount.toFixed(Number(this.value));
});

//单号格式
date_select.addEventListener('change', function () {
    change_dh();
});

position_select.addEventListener('change', function () {
    change_dh();
});

spliter_check.addEventListener('change', function () {
    change_dh();
});

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
    let data = {
        price: Number(price_select.value),
        mount: Number(mount_select.value),
        date: date_select.value,
        position: Number(position_select.value),
        spliter: spliter_check.checked,
    }

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
                notifier.show('修改成功', 'success');
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
})