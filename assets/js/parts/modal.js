// import {alert_confirm} from "./alert.mjs";

var modal_out_data = { edit: 0 };

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

// 拖动
function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = e => {
        // 只允许点标题栏拖动
        let target = e.srcElement ? e.srcElement : e.target;
        if (target.className == "modal-header") {
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
            elmnt.style.background = "none";
        }
    }

    function elementDrag(e) {
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

dragElement(document.getElementById('for-click-close'));