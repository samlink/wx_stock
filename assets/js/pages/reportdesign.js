import { notifier } from '../parts/notifier.mjs';

var hiprintTemplate;

fetch('/fetch_print_documents')
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            let options = "";
            for (let data of content) {
                options += `<option value="${data.id}">${data.name}</option>`;
            }
            document.querySelector('#newmodel-select').innerHTML = options;
            document.querySelector('#editmodel-select').innerHTML = options;
        }
        else {
            notifier.show('权限不够，操作失败', 'danger');
        }
    });

print_inti();

$('#A4_preview').click(function () {
    $('#myModal .modal-body .prevViewDiv').html(hiprintTemplate.getHtml(printData))
    $('#myModal').modal('show')
});

$('#A4_directPrint').click(function () {
    hiprintTemplate.print(printData);
});

$('#A4_getJson_toTextarea').click(function () {
    $('#A4_textarea_json').html(JSON.stringify(hiprintTemplate.getJsonTid()))
})

//调整纸张
var setPaper = function (paperTypeOrWidth, height) {
    hiprintTemplate.setPaper(paperTypeOrWidth, height);
}

var clearTemplate = function () {
    hiprintTemplate.clear();
}

var getJsonTid = function () {
    $('#textarea').html(JSON.stringify(hiprintTemplate.getJsonTid()))
}

document.addEventListener('keydown', function (e) {
    if (e.key == "Delete" && e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
        document.querySelector('#del').click();
    }
})

document.querySelector('#sumit').addEventListener('click', function () {
    document.querySelector('#PrintElementOptionSetting .hiprint-option-item-submitBtn').click();
});

document.querySelector('#del').addEventListener('click', function () {
    document.querySelector('#PrintElementOptionSetting .hiprint-option-item-deleteBtn').click();
    document.querySelector('.hiprint-printPanel').click();
});

setTimeout(() => {
    document.querySelector('.hiprint-printPanel').click();
}, 200);

document.querySelector('#choose-new').addEventListener('click', function () {
    document.querySelector('#newmodel-select').disabled = false;
    document.querySelector('#newmodel-name').disabled = false;
    document.querySelector('#editmodel-select').disabled = true;
    document.querySelector('#edit-select').disabled = true;
    document.querySelector('#choose-edit').parentNode.style.cssText = "";
    this.parentNode.style.fontWeight = "bold";

});

document.querySelector('#choose-edit').addEventListener('click', function () {
    document.querySelector('#newmodel-select').disabled = true;
    document.querySelector('#newmodel-name').disabled = true;
    document.querySelector('#editmodel-select').disabled = false;
    document.querySelector('#edit-select').disabled = false;
    document.querySelector('#choose-new').parentNode.style.cssText = "";
    this.parentNode.style.fontWeight = "bold";

});

function print_inti() {
    //初始化打印插件
    hiprint.init({
        providers: [new configElementTypeProvider()]
    });

    //设置左侧拖拽事件
    hiprint.PrintElementTypeManager.buildByHtml($('.ep-draggable-item'));

    hiprintTemplate = new hiprint.PrintTemplate({
        template: configPrintJson,
        settingContainer: '#PrintElementOptionSetting',
        // paginationContainer: '.hiprint-printPagination'
    });

    //打印设计
    hiprintTemplate.design('#hiprint-printTemplate');
}