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
            let html = `<div class="form-group has-auto" style="">
                            <div class="form-label" style="margin-right: 8px;">
                                <label>供应商</label>
                            </div>
                            <div class="form-input autocomplete">
                                <input class="form-control input-sm has-value" type="text" id="supplier-input" />
                            </div>
                            <button class="btn btn-info btn-sm" id="supplier-serach">
                                <i class="fa fa-search"></i>
                            </button>
                        </div>`;

            html += build_inout_form(table_fields);
            document.querySelector('.fields-show').innerHTML = html;

            let search_input = document.querySelector('#supplier-input');
            autocomplete(search_input, "", "/supplier_auto", () => {
                // search_table();
            });

            let fields_show = document.querySelector('.fields-show');
            let has_auto = document.querySelector('.has-auto');
            let next_auto = document.querySelector('.has-auto+div');

            fields_show.addEventListener('scroll', function () {
                console.log(fields_show.scrollTop);
                if (fields_show.scrollTop != 0 ) {
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

