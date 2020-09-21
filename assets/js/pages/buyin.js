import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { autocomplete } from '../parts/autocomplete.mjs';
import { build_inout_form } from '../parts/service.mjs'

var table_fields;
fetch("/fetch_buyin_fields", {
    method: 'post',
})
    .then(response => response.json())
    .then(content => {
        if (content != -1) {
            table_fields = content;
            let html = build_inout_form(table_fields);

            console.log(html);
            document.querySelector('.fields-show').innerHTML = html;

        }
    });
