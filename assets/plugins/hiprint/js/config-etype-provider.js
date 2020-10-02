var configElementTypeProvider = (function () {
    return function (options) {

        var addElementTypes = function (context) {
            context.addPrintElementTypes(
                "testModule",
                [
                    new hiprint.PrintElementTypeGroup("常规", [
                        {
                            tid: 'configModule.name', title: '标题（点击后，右侧工具栏修改）', data: '标题（点击后，右侧工具栏修改）', type: 'text',
                            "options": {
                                "height": 42,
                                "width": 312,
                                "fontSize": 16.5,
                                "fontWeight": "700",
                                "textAlign": "center",
                                "lineHeight": 39,
                                "hideTitle": true
                            }
                        },
                        {
                            tid: 'configModule.customer', title: '客户', field: 'customer', data: '字段数据（点击后，右侧工具栏配置）', type: 'text',
                            "options": {
                                "width": 220,
                            }
                        },
                        { tid: 'configModule.date', title: '日期', field: 'date', data: '字段数据', type: 'text' },
                        { tid: 'configModule.dateTime', title: '日期时间', field: 'dateTime', data: '字段数据', type: 'text' },
                        { tid: 'configModule.dh', title: '单号', field: 'dh', data: '字段数据', type: 'text' },
                        {
                            tid: 'configModule.table', field: 'table', title: '字段数据',
                            type: 'table',
                            columns: [

                                [{ title: '序号', align: 'center', field: '序号', width: 30 },
                                { title: '名称', align: 'center', field: '名称', width: 60 },
                                { title: '规格', align: 'center', field: '规格', width: 100 },
                                { title: '单位', align: 'center', field: '单位', width: 30 },
                                { title: '单价', align: 'center', field: '单价', width: 30 },
                                { title: '数量', align: 'center', field: '数量', width: 30 },
                                { title: '金额', align: 'center', field: '金额', width: 50 },
                                ]
                            ],
                            // footerFormatter: function () {
                            //     return `<tr><td style='text-align: center;'>合计</td><td colspan="4"></td><td style='text-align: center;'>89</td><td style='text-align: center;'>1450.67</td></tr>`
                            // }
                        },

                        { tid: 'configModule.maker', title: '制单人', field: 'maker', data: '字段数据', type: 'text' },
                        { tid: 'configModule.chinese', title: '金额大写', field: 'chinese', data: '字段数据', type: 'text' },
                        { tid: 'configModule.allMoney', title: '应结金额', field: '应结金额', data: '字段数据', type: 'text' },
                        { tid: 'configModule.partMoney', title: '已结金额', field: '已结金额', data: '字段数据', type: 'text' },
                        {
                            tid: 'configModule.barCode', title: '条形码', field: 'dh', data: 'XS123456789', customText: '条形码', custom: true, type: 'text', "options": {

                                "height": 13.5,
                                "width": 78,
                                "textType": "barcode"
                            }
                        },
                        {
                            tid: 'configModule.qrcode', title: '二维码', customText: 'www.tingtran.top', custom: true, type: 'text', "options": {

                                "height": 28,
                                "width": 28,
                                "fontSize": 19,
                                "fontWeight": "700",
                                "textAlign": "center",
                                "lineHeight": 39,
                                "hideTitle": true,
                                "textType": "qrcode"
                            }
                        },
                    ]),
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

