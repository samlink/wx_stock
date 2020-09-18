import { padZero } from "../parts/tools.mjs";

const price = 3.685972;
const mount = 368.5972;
const pre = "XS";
const year = "2021";
const month = "03";
const day = "04";
const num = "81";

//小数位数
document.querySelector('#price-select').addEventListener('change', function () {
    document.querySelector('#example-price').textContent = price.toFixed(Number(this.value));
});

document.querySelector('#mount-select').addEventListener('change', function () {
    document.querySelector('#example-mount').textContent = mount.toFixed(Number(this.value));
});

//单号格式
document.querySelector('#date-select').addEventListener('change', function () {
    change_dh();
});

document.querySelector('#position-select').addEventListener('change', function () {
    change_dh();
});

document.querySelector('#spliter-check').addEventListener('change', function () {
    change_dh();
});

function change_dh() {
    let has_spliter = document.querySelector('#spliter-check').checked;
    let date_value = document.querySelector('#date-select').value;
    let position_value = Number(document.querySelector('#position-select').value);

    let spliter = has_spliter ? "-" : "";
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