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

