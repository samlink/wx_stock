(function () {
    document.querySelector('#function-set').classList.add('show-bottom');
    fetch('/focus_items')
        .then(res => res.json())
        .then(data => {
            var table_focus = {
                body: document.querySelector('#home-focus tbody'),
                header: document.querySelector('#home-focus thead tr'),                 //排序可选,若不需要排序功能,则去掉此属性
                selectFocus: document.querySelector('#select-focus'),
                selectSeazon: document.querySelector('#select-seazon'),
                page_input: document.querySelector('#focus-page-input'),
                page_first: document.getElementById("focus-first"),
                page_pre: document.querySelector('#focus-pre'),
                page_aft: document.querySelector('#focus-aft'),
                page_last: document.querySelector('#focus-last'),
                total_pages: document.querySelector('#focus-pages'),
                auto_input: document.querySelector('#focus-auto'),
                auto_button: document.querySelector('#home-focus .autocomplete button'),
                sub_info: document.querySelector('#focus-info'),                        //从表可选,若无从表,去掉此属性
                sub_body: document.querySelector('#focus-details tbody'),               //从表可选,若无从表,去掉此属性
                header_names: {                                                         //排序可选,若不需要排序,去掉此属性
                    '关注': '关注.标识',
                    '名称': '名称',
                    '主营': '主营',
                    '现价': '价格',
                    '市值': '市值',
                    'VC2': 'VC2',
                    '估值': '估值',
                    '加入关注': "关注日期",
                    '市盈率': '市盈率',
                    '年报日期': '年份',
                    '季1': '季1',
                    '季2': '季2',
                    '季3': '季3',
                    '季4': '季4',
                    '最新财报': '财季',
                    '备注': '备注',
                },
                sort_name: "关注日期 DESC",                                                  //必须属性
                data_url: "/focus",
                auto_url: "/focus_auto",

                row_fn: function (tr) {
                    let focus = "";
                    if (tr.ratio < 0) {
                        focus = " class='buy-item'";
                    }

                    let report = "";
                    if (da != tr.report.split(' ')[0] && (Number(tr.seazon1.substring(0, 2)) == month || Number(tr.seazon2.substring(0, 2)) == month ||
                        Number(tr.seazon3.substring(0, 2)) == month || Number(tr.seazon4.substring(0, 2)) == month)) {
                        report = " class='report-tip'";
                    }

                    let site;

                    if (tr.id.substring(0, 1) == "美") {
                        site = 'https://xueqiu.com/S/' + tr.id.replace('美', '');
                    }
                    else if (tr.id.substring(0, 2) == "中6" || tr.id.substring(0, 2) == "中9") {
                        site = 'https://xueqiu.com/S/' + tr.id.replace('中', 'SH');
                    }
                    else if (tr.id.substring(0, 2) == "中0" || tr.id.substring(0, 2) == "中2" || tr.id.substring(0, 2) == "中3") {
                        site = 'https://xueqiu.com/S/' + tr.id.replace('中', 'SZ');
                    }
                    else if (tr.id.substring(0, 1) == "粉") {
                        site = 'https://xueqiu.com/S/' + tr.id.replace('粉', '');
                    }

                    return `<tr${report}><td><a href="/analys?code=${tr.id}" target="_blank">${tr.id}</a></td><td title='${tr.name}'${focus}><a href=${site} target="_blank">${tr.name}</a></td>
                                <td>${tr.business}</td><td>${tr.pe != '0' ? tr.pe.toFixed(1) : '--'}</td><td>${tr.vc2}</td><td>${tr.value}</td><td>${tr.buy}</td><td>${tr.price.toFixed(2)}</td><td>${tr.date}</td><td>${tr.year}</td>
                                <td>${tr.seazon1}</td><td>${tr.seazon2 != '' ? tr.seazon2 : '--'}</td><td>${tr.seazon3}</td><td>${tr.seazon4 != '' ? tr.seazon4 : '--'}</td>
                                <td>${tr.report}</td><td title='${tr.bz}'>${tr.bz}</td></tr>`;
                },
            }

            table_control(table_focus);
        });
})();