/* 确认对话框
 * roar - v1.0.5 - 2018-05-25
 * https://getbutterfly.com/roarjs-vanilla-javascript-alert-confirm-replacement/
 * Copyright (c) 2018 Ciprian Popescu
 * Licensed GPLv3
 */
function alert_confirm(message, optionsA) {
    var options = {
        cancel: true,
        confirmText: "确认",
        cancelText: "取消",
        cancelCallBack: () => { },
        confirmCallBack: () => { }
    }

    if (typeof optionsA === 'object') {
        Object.assign(options, optionsA);
    }

    let element = document.querySelector('#roar-alert');
    let old_cancelElement = document.querySelector('.roar-alert-message-button-cancel');
    let old_confirmElement = document.querySelector('.roar-alert-message-button-confirm');

    let cancelElement = old_cancelElement.cloneNode(true);
    let confirmElement = old_confirmElement.cloneNode(true);

    old_cancelElement.parentNode.replaceChild(cancelElement, old_cancelElement);
    old_confirmElement.parentNode.replaceChild(confirmElement, old_confirmElement);

    if (!options.cancel) {
        cancelElement.style.display = 'none';
    }
    else {
        cancelElement.innerHTML = options.cancelText;
        cancelElement.addEventListener('click', function () {
            options.cancelCallBack();
            element.style.display = "none";
        });
    }

    confirmElement.innerHTML = options.confirmText;
    confirmElement.addEventListener('click', function () {
        options.confirmCallBack();
        element.style.display = "none";
    });

    document.querySelector('.roar-alert-message-content').innerHTML = message;

    element.style.display = "block";
}
