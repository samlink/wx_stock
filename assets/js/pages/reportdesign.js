
var hiprintTemplate;
$(document).ready(function () {

    //初始化打印插件
    hiprint.init({
        providers: [new configElementTypeProvider()]
    });

    // hiprint.PrintElementTypeManager.build('.hiprintEpContainer', 'testModule');
    //设置左侧拖拽事件
    hiprint.PrintElementTypeManager.buildByHtml($('.ep-draggable-item'));

    hiprintTemplate = new hiprint.PrintTemplate({
        template: configPrintJson,
        settingContainer: '#PrintElementOptionSetting',
        // paginationContainer: '.hiprint-printPagination'
    });
    //打印设计
    hiprintTemplate.design('#hiprint-printTemplate');

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
});

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
    if (e.key == "Delete") {
        document.querySelector('#PrintElementOptionSetting .hiprint-option-item-deleteBtn').click();
    }
})

document.querySelector('#sumit').addEventListener('click', function () {
    document.querySelector('#PrintElementOptionSetting .hiprint-option-item-submitBtn').click();
});

document.querySelector('#del').addEventListener('click', function () {
    document.querySelector('#PrintElementOptionSetting .hiprint-option-item-deleteBtn').click();
});

setTimeout(() => {
    document.querySelector('.hiprint-printPanel').click();
}, 200);