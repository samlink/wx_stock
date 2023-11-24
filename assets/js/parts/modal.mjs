//关闭函数
export function modal_init() {
    //关闭按键
    document.querySelector('#modal-close-button').addEventListener('click', function () {
        close_modal();
    });

    //关闭按键
    document.querySelector('.top-close').addEventListener('click', function () {
        close_modal();
    });
}

export function close_modal() {
    document.querySelector('.modal').style.display = "none";
    document.querySelector('.modal-content').style.cssText = "";
    document.querySelector('#modal-info').innerHTML = "";
}