// import {alert_confirm} from "./alert.mjs";

var modal_out_data = {edit: 0};

function modal_init() {
    //关闭按键
    document.querySelector('#modal-close-button').addEventListener('click', function () {
        document.querySelector('#modal-sumit-button').style.display = "inline-block";
        close_modal();
    });
    document.querySelector('.top-close').addEventListener('click', function () {
        document.querySelector('#modal-sumit-button').style.display = "inline-block";
        close_modal();
    });
}

function close_modal() {
    if (modal_out_data.edit == 1) {
        alert_confirm('编辑还未保存，确认退出吗？', {
            confirmCallBack: () => {
                modal_edit = 0;
                document.querySelector('.modal').style.display = "none";
            }
        });
    } else {
        document.querySelector('.modal').style.display = "none";
    }

    document.querySelector('#modal-info').innerHTML = "";
}

//编辑离开提醒事件
function leave_alert() {
    let all_input = document.querySelectorAll('.modal input');
    for (let input of all_input) {
        input.addEventListener('input', () => {
            modal_edit = 1;
        });
    }

    let all_select = document.querySelectorAll('.modal select');
    for (let select of all_select) {
        select.addEventListener('change', function () {
            modal_edit = 1;
        });
    }
}