import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';

//设置菜单 
document.querySelector('#function-set .nav-icon').classList.add('show-chosed');
document.querySelector('#function-set .menu-text').classList.add('show-chosed');

var hiprintTemplate;
var edit_mode = "新增";
var options;

fetch(`/${code}/fetch_print_documents`)
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            options = "<option value=0 selected hidden>请选择单据</option>";
            for (let data of content) {
                options += `<option value="${data.id}">${data.name}</option>`;
            }
            document.querySelector('#newmodel-select').innerHTML = options;
            document.querySelector('#editmodel-select').innerHTML = options;
            first_page();

            document.querySelector('.gener-code').style.display = "none";   //隐藏的这部分在正式发布时需删除，包括html和js两部分代码
        }
        else {
            notifier.show('权限不够，操作失败', 'danger');
        }
    });

function first_page() {
    var configElementTypeProvider = (function () {
        return function (options) {

            var addElementTypes = function (context) {
                context.allElementTypes = [];
                context.testModule = [];

                context.addPrintElementTypes(
                    "testModule",
                    [
                        new hiprint.PrintElementTypeGroup("自定义", [
                            { tid: 'configModule.customText', title: '自定义文本', customText: '自定义文本', custom: true, type: 'text' },
                        ]),
                    ]
                );
            };

            return {
                addElementTypes: addElementTypes
            };
        };
    })();

    let configPrintJson = { "panels": [{ "index": 0, "height": 93.1, "width": 190, "paperHeader": 0, "paperFooter": 266.45669291338584, "printElements": [{ "tid": "configModule.customText", "options": { "left": 153, "top": 90, "height": 30, "width": 243, "title": " 欢迎使用报表设计，请先选择单据", "fontSize": 15, "fontWeight": "bold", "color": "#2196f3", "textAlign": "center", "textContentVerticalAlign": "middle" } }], "paperNumberLeft": 508.5, "paperNumberTop": 244.5, "paperNumberDisabled": true }] };

    hiprint.init({
        providers: [new configElementTypeProvider()]
    });

    template_init(configPrintJson);

    document.querySelector('.about-this').textContent = "更多帮助点击右上角“ ？”按钮";
}

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
    if (edit_mode != "新增") {
        edit_mode = "新增";
        reset_ctrol(false);
        this.parentNode.style.fontWeight = "bold";

        let model = hiprintTemplate.getJsonTid();
        if (model.panels[0].printElements.length > 1) {
            alert_clear();
            reset_content();
        }
    }
});

document.querySelector('#choose-edit').addEventListener('click', function () {
    if (edit_mode != "编辑") {
        edit_mode = "编辑";
        reset_ctrol(true);
        this.parentNode.style.fontWeight = "bold";

        let model = hiprintTemplate.getJsonTid();
        if (model.panels[0].printElements.length > 1) {
            alert_clear();
            reset_content();
        }
    }
});

function reset_ctrol(yes) {
    let no = yes ? false : true;
    document.querySelector('#newmodel-select').disabled = yes;
    document.querySelector('#newmodel-name').disabled = yes;
    document.querySelector('#editmodel-select').disabled = no;
    document.querySelector('#edit-select').disabled = no;
    document.querySelector('#editmodel-name').disabled = no;
    document.querySelector('#del-button').disabled = no;
    document.querySelector('#choose-edit').parentNode.style.cssText = "";
}

function alert_clear() {
    let model = hiprintTemplate.getJsonTid();
    if (model.panels[0].printElements.length > 1) {
        alert_confirm('设计框内容将被重置，确认重置吗？', {
            confirmText: "是",
            cancelText: "否",
            confirmCallBack: () => {
                first_page();
            }
        });
    }
    else {
        first_page();
    }
}

function reset_content() {
    document.querySelector('#newmodel-name').value = "";
    document.querySelector('#editmodel-name').value = "";
    document.querySelector('#default-check').checked = false;
    document.querySelector('#newmodel-select').innerHTML = options;
    document.querySelector('#editmodel-select').innerHTML = options;
    document.querySelector('#edit-select').innerHTML = "<option value=0 selected hidden>请选择模板</option>";
}

document.querySelector('#newmodel-select').addEventListener("change", function () {
    fetch_provider(this.value);
    document.querySelector('#newmodel-name').value = "";
    document.querySelector('#editmodel-name').value = "";
    document.querySelector('#default-check').checked = false;
    document.querySelector('.about-this').textContent = "设计框中是样板示例，可在此基础上修改，也可重新设计";
});

document.querySelector('#editmodel-select').addEventListener("change", function () {
    let model_json = { first: true, "panels": [{ "index": 0, "height": 93.1, "width": 190, "paperHeader": 0, "paperFooter": 266.45669291338584, "printElements": [{ "tid": "configModule.customText", "options": { "left": 153, "top": 90, "height": 30, "width": 243, "title": "修改报表模板，请选择打印模板", "fontSize": 15, "fontWeight": "bold", "color": "#2196f3", "textAlign": "center", "textContentVerticalAlign": "middle" } }], "paperNumberLeft": 508.5, "paperNumberTop": 244.5, "paperNumberDisabled": true }] };
    fetch_provider(this.value, model_json);

    let id = Number(document.querySelector('#editmodel-select').value);
    fetch(`/${code}/fetch_models`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: id,
    })
        .then(response => response.json())
        .then(content => {
            let model_options = "<option value=0 selected hidden>请选择模板</option>";
            for (let data of content) {
                model_options += `<option value="${data.id}" data=${data.default}>${data.name}</option>`;
            }

            document.querySelector('#edit-select').innerHTML = model_options;
        });
});

document.querySelector('#edit-select').addEventListener("change", function () {
    fetch(`/${code}/fetch_one_model`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: Number(this.value),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                document.querySelector('#default-check').checked = content[0];
                document.querySelector('#newmodel-name').value = "";
                document.querySelector('#editmodel-name').value = "";

                let model = hiprintTemplate.getJsonTid();
                if (model.panels[0].printElements.length > 1) {
                    alert_confirm('设计框内容将被重置，确认重置吗？', {
                        confirmText: "是",
                        cancelText: "否",
                        confirmCallBack: () => {
                            template_init(JSON.parse(content[1]));
                        },
                    });
                }
                else {
                    template_init(JSON.parse(content[1]));
                }

                document.querySelector('.about-this').textContent = "设计框中是已保存的模板，可在此基础上修改，也可重新设计";
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });

});

document.querySelector('#save-button').addEventListener('click', function () {
    let id, name, print_id;
    if (edit_mode == "新增") {
        id = 0;
        name = document.querySelector('#newmodel-name').value;
        print_id = document.querySelector('#newmodel-select').value;
    }
    else {
        id = document.querySelector('#edit-select').value;
        name = document.querySelector('#editmodel-name').value;
        print_id = document.querySelector('#editmodel-select').value;
    }

    if (edit_mode == "新增" && (print_id == 0 || name == "")) {
        notifier.show('单据或名称不能为空', 'danger');
        return false;
    }

    if (edit_mode == "编辑" && id == 0) {
        notifier.show('编辑单据不能为空', 'danger');
        return false;
    }

    let model = hiprintTemplate.getJsonTid();
    if (model.panels[0].printElements.length > 1) {
        let data = {
            id: Number(id),
            print_id: Number(print_id),
            name: name,
            model: JSON.stringify(model),
            default: document.querySelector('#default-check').checked,
            cate: edit_mode,
        }

        fetch(`/${code}/save_model`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(content => {
                if (content == 1) {
                    notifier.show('模板保存成功', 'success');
                }
                else {
                    notifier.show('权限不够，操作失败', 'danger');
                }
            });
    }
    else {
        notifier.show('模板不能为空', 'danger');
    }
});

document.querySelector('#del-button').addEventListener('click', function () {
    let id = document.querySelector('#edit-select').value;
    if (id != 0) {
        alert_confirm('模板删除后无法恢复，确认删除吗？', {
            confirmText: "确认",
            cancelText: "取消",
            confirmCallBack: () => {
                fetch(`/${code}/del_model`, {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: Number(id),
                })
                    .then(response => response.json())
                    .then(content => {
                        if (content == 1) {
                            changed = 0;
                            edit_mode = "新增";
                            document.querySelector('#choose-edit').click();
                            notifier.show('模板删除成功', 'success');
                        }
                        else {
                            notifier.show('权限不够，操作失败', 'danger');
                        }
                    });
            }
        });
    }
    else {
        notifier.show('请先选择模板', 'danger');
    }
});

function fetch_provider(id, model_json) {
    fetch(`/${code}/fetch_provider`, {
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

                            context.addPrintElementTypes(
                                "testModule",
                                [
                                    new hiprint.PrintElementTypeGroup("常规", JSON.parse(content[0])),
                                    new hiprint.PrintElementTypeGroup("自定义", [
                                        { tid: 'configModule.customText', title: '自定义文本', customText: '自定义文本', custom: true, type: 'text' },
                                        { tid: 'configModule.image', title: '图片', data: `/${code}/assets/img/book.jpg`, type: 'image' },
                                        {
                                            tid: 'configModule.tableCustom',
                                            title: '表格',
                                            type: 'tableCustom',
                                            field: 'table',
                                            options: {
                                                width: 500,
                                            }
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
                                            tid: 'configModule.oval',
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


                var configPrintJson = model_json ? model_json : JSON.parse(content[2]);

                //初始化打印插件
                hiprint.init({
                    providers: [new configElementTypeProvider()]
                });

                //设置左侧拖拽事件
                hiprint.PrintElementTypeManager.buildByHtml($('.ep-draggable-item'));

                let model = hiprintTemplate.getJsonTid();
                if (model.panels[0].printElements.length > 1) {
                    alert_confirm('设计框内容将被重置，确认重置吗？', {
                        confirmText: "是",
                        cancelText: "否",
                        confirmCallBack: () => {
                            template_init(configPrintJson);
                        },
                    });
                }
                else {
                    template_init(configPrintJson);
                }
            }
            else {
                notifier.show('权限不够，操作失败', 'danger');
            }
        });
}

function template_init(configPrintJson) {
    document.querySelector('#hiprint-printTemplate').innerHTML = "";        //清空一下，否则会出现多个设计框
    document.querySelector('#PrintElementOptionSetting').innerHTML = "";

    hiprintTemplate = new hiprint.PrintTemplate({
        template: configPrintJson,
        settingContainer: '#PrintElementOptionSetting',
        paginationContainer: '.hiprint-printPagination'
    });

    //设计
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