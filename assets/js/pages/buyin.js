import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { autocomplete } from '../parts/autocomplete.mjs';
import { build_inout_form } from '../parts/service.mjs'
import { SPLITER } from '../parts/tools.mjs';

var table_fields;

fetch("/fetch_buyin_fields", {
    method: 'post',
})
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            table_fields = content;
            let html = build_inout_form(table_fields);
            document.querySelector('.has-auto').insertAdjacentHTML('afterend', html);


            let fields_show = document.querySelector('.fields-show');
            let has_auto = document.querySelector('.has-auto');
            let next_auto = document.querySelector('.has-auto+div');

            //加入滚动事件处理
            fields_show.addEventListener('scroll', function () {
                if (fields_show.scrollTop != 0) {
                    has_auto.style.cssText = "position: relative;";
                    next_auto.style.cssText = "margin-left: -3px;"
                }
                else {
                    has_auto.style.cssText = "";
                    next_auto.style.cssText = "";
                }
            });
        }
    });

//自动完成
let search_input = document.querySelector('#supplier-input');
autocomplete(search_input, "", "/supplier_auto", () => {
    fetch("/fetch_supplier", {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(search_input.getAttribute('data')),
    })
        .then(response => response.json())
        .then(content => {
            let supplier = content[1].split(SPLITER);
            let join_sup = "";
            for (let i = 0; i < content[0].length; i++) {
                join_sup += `${content[0][i].show_name}：${supplier[i]}； `;
            }

            document.querySelector('#supplier-info').textContent = join_sup;
        });
});

document.querySelector('#supplier-serach').addEventListener('click', function () {
    let width = document.querySelector('body').clientWidth * 0.8;
    let height = document.querySelector('body').clientHeight * 0.8;
    let html = `<div id="customer-show">
                    <div class="table-top">
                        <div class="autocomplete customer-search">
                            <input type="text" class="form-control search-input" id="search-input" placeholder="供应商搜索">
                            <button class="btn btn-info btn-sm" id="serach-button">搜索</button>
                        </div>
                    </div>

                    <div class="table-container table-customer">
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                        <div class="table-ctrl">
                            <div class="tools-button"></div>
                            <div class="table-button">
                                <button class="page-button btn" id="first" title="首页"><img src="/assets/img/backward.png"
                                        width="12px"></button>
                                <button class="page-button btn" id="pre" title="前一页"><img src="/assets/img/backward2.png"
                                        width="12px"></button>
                                <p class="seperator"></p>
                                <span>第</span><input type="text" class="form-control" id="page-input" value="1">
                                <span>页，共</span><span id="pages"></span><span>页</span>
                                <p class="seperator"></p>
                                <button class="page-button btn" id="aft" title="后一页"><img src="/assets/img/forward2.png"
                                        width="12px"></button>
                                <button class="page-button btn" id="last" title="尾页"><img src="/assets/img/forward.png"
                                        width="12px"></button>
                            </div>

                            <div class="table-info">
                                共 <span id="total-records"></span> 条记录
                            </div>

                        </div>
                    </div>
                </div>`;

    document.querySelector('.modal-body').innerHTML = html;

    document.querySelector('.modal-title').textContent = "选择供应商";
    document.querySelector('.modal-dialog').style.cssText = `max-width: ${width}px; height: ${height}px;`
    document.querySelector('.modal-content').style.cssText = `height: 100%;`

    document.querySelector('.modal').style.display = "block";
});

//关闭按键
document.querySelector('#modal-close-button').addEventListener('click', function () {
    close_modal();
});

//关闭按键
document.querySelector('.top-close').addEventListener('click', function () {
    close_modal();
});

//关闭函数
function close_modal() {
    document.querySelector('.modal').style.display = "none";
    document.querySelector('.modal-content').style.cssText = "";
    document.querySelector('#modal-info').innerHTML = "";
}