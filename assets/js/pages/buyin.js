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
            let html = `<div class="form-group">
                            <div class="form-label">
                                <label>供应商</label>
                            </div>
                            <input class="form-control input-sm has-value" type="text" id="supplier-input">
                            <button class="btn btn-info btn-sm" id="supplier-serach">
                                <i class="fa fa-search"></i>
                            </button>
                        </div>`;

            html += build_inout_form(table_fields);


            document.querySelector('.fields-show').innerHTML = html;

        }
    });
