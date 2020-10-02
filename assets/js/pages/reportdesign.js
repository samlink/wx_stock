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
            document.querySelector('.about-this').textContent = "当前设计框中的模板是样板示例，可在此基础上修改，也可重新设计。更多帮助点击右上角“ ？”按钮";
        }
        else {
            notifier.show('权限不够，操作失败', 'danger');
        }
    });

fetch_provider(1);

$('#paper-directPrint').click(function () {
    hiprintTemplate.print(printData);
});

$('#A4_getJson_toTextarea').click(function () {
    $('#A4_textarea_json').html(JSON.stringify(hiprintTemplate.getJsonTid()))
})

//调整纸张
document.querySelector('#paper-a4').addEventListener('click', function () {
    hiprintTemplate.setPaper('A4');
    document.querySelector('#paper-type').value = `当前纸张：A4`;
});

document.querySelector('#paper-a5').addEventListener('click', function () {
    hiprintTemplate.setPaper('A5');
    document.querySelector('#paper-type').value = `当前纸张：A5`;
});

document.querySelector('#paper-custom').addEventListener('click', function () {
    let width = $('#customWidth').val();
    let height = $('#customHeight').val();
    hiprintTemplate.setPaper(width, height);
    document.querySelector('#paper-type').value = `当前纸张：${width}mm * ${height}mm`;
});

// var clearTemplate = function () {
//     hiprintTemplate.clear();
// }

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

document.querySelector('#newmodel-select').addEventListener("change", function () {
    fetch_provider(this.value);
});

function fetch_provider(id) {
    fetch('/fetch_provider', {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: Number(id),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                let html_data = content[1].split(',');
                let lis = "";
                for (let html of html_data) {
                    let h = html.split(':');
                    lis += `<li><a class="ep-draggable-item" tid="${h[0]}">${h[1]}</a></li>`
                }

                document.querySelector('#pre-set').innerHTML = lis;

                var configElementTypeProvider = (function () {
                    return function (options) {

                        var addElementTypes = function (context) {
                            context.allElementTypes = [];   //在这里清空一次，否则会累积元素，且只有第一次写入的元素有效
                            context.testModule = [];

                            console.log(JSON.parse(content[0]));

                            context.addPrintElementTypes(
                                "testModule",
                                [
                                    new hiprint.PrintElementTypeGroup("常规", JSON.parse(content[0])),
                                    new hiprint.PrintElementTypeGroup("自定义", [
                                        { tid: 'configModule.customText', title: '自定义文本', customText: '自定义文本', custom: true, type: 'text' },
                                        { tid: 'configModule.image', title: '图片', data: '/Content/assets/hi.png', type: 'image' },
                                        {
                                            tid: 'configModule.tableCustom',
                                            title: '表格',
                                            type: 'tableCustom',
                                            field: 'table',
                                        },
                                    ]),

                                    new hiprint.PrintElementTypeGroup("辅助", [
                                        {
                                            tid: 'configModule.hline',
                                            title: '横线',
                                            type: 'hline'
                                        },
                                        {
                                            tid: 'configModule.vline',
                                            title: '竖线',
                                            type: 'vline'
                                        },
                                        {
                                            tid: 'configModule.rect',
                                            title: '矩形',
                                            type: 'rect'
                                        },
                                        {
                                            tid: 'testModule.oval',
                                            title: '椭圆',
                                            type: 'oval'
                                        }
                                    ])
                                ]
                            );
                        };

                        return {
                            addElementTypes: addElementTypes
                        };
                    };
                })();

                var configPrintJson = JSON.parse(content[2]);

                document.querySelector('#hiprint-printTemplate').innerHTML = "";
                document.querySelector('#PrintElementOptionSetting').innerHTML = "";

                //初始化打印插件
                hiprint.init({
                    providers: [new configElementTypeProvider()]
                });

                //设置左侧拖拽事件
                hiprint.PrintElementTypeManager.buildByHtml($('.ep-draggable-item'));

                hiprintTemplate = new hiprint.PrintTemplate({
                    template: configPrintJson,
                    settingContainer: '#PrintElementOptionSetting',
                    paginationContainer: '.hiprint-printPagination'
                });

                //打印设计
                hiprintTemplate.design('#hiprint-printTemplate');

                let paper_type = configPrintJson.panels[0].paperType;
                let width = configPrintJson.panels[0].width;
                let height = configPrintJson.panels[0].height;

                document.querySelector('#paper-type').value = paper_type ? `当前纸张：${paper_type}` :
                    `当前纸张：${width}mm * ${height}mm`;

                setTimeout(() => {
                    document.querySelector('.hiprint-printPanel').click();
                }, 100);
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
}