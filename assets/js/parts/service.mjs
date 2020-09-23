import { SPLITER } from '../parts/tools.mjs';

//根据显示字段创建表头，参数 n 依据屏幕宽度调整，是整数。返回表头和表头排序参数
export function build_table_header(table_container, table_fields) {
    let all_width = 0;
    for (let item of table_fields) {
        all_width += item.show_width;
    }

    all_width += 3;  //序号列的宽度
    let table_width = table_container.clientWidth;
    let width_raio = table_width / all_width;
    let row = `<th width='${300 / all_width}%'>序号</th><th width='${400 / all_width}%'>编号</th>`;

    //当可用屏幕宽度小于字段总宽度的18倍时，则按实际px显示，这样会横向滚动
    if (width_raio < 18) {
        row = `<th width='${3 * 18}px'>序号</th><th width='${4 * 18}px'>编号</th>`;
        table_container.style.width = table_width;
        table_container.querySelector('.table-ctrl').style.cssText = `
            position: absolute;
            width: ${table_width + 2}px;
            margin-top: 11px;
            border: 1px solid #edf5fb;
            margin-left: -2px;`;
    }

    let header_names = {};
    for (let th of table_fields) {
        row += width_raio > 18 ? `<th width="${(th.show_width * 100 / all_width).toFixed(1)}%">${th.show_name}</th>` :
            `<th width="${th.show_width * 18}px">${th.show_name}</th>`;

        let key = th.show_name;
        let value = th.field_name;
        header_names[key] = value;
    }

    return {
        th_row: row,
        header_names: header_names,
    };
}

//依据显示字段，创建表格内容行
export function build_row_from_string(rec, row, table_fields) {
    let n = 2;
    for (let name of table_fields) {
        if (name.data_type == "文本") {
            row += `<td title='${rec[n]}'>${rec[n]}</td>`;
        } else if (name.data_type == "整数" || name.data_type == "实数") {
            row += `<td style="text-align: right;">${rec[n]}</td>`;
        }
        else {
            row += `<td>${rec[n]}</td>`;
        }
        n++;
    }
    row += "</tr>";

    return row;
}

//依据显示字段，创建表格空行
export function build_blank_from_fields(row, table_fields) {
    for (let _f of table_fields) {
        row += "<td></td>";
    }
    row += "</tr>";
    return row;
}

//依据显示字段，建立编辑类型 form
export function build_edit_form(num, table_fields, chosed) {
    let form = "<form>";
    for (let name of table_fields) {
        let control;
        if (name.ctr_type == "普通输入") {
            let value = chosed.querySelector(`td:nth-child(${num})`).textContent;
            control = `<div class="form-group">
                            <div class="form-label">
                                <label>${name.show_name}</label>
                            </div>
                            <input class="form-control input-sm has-value" type="text" value="${value}">
                        </div>`;
        } else if (name.ctr_type == "二值选一") {
            let value = chosed.querySelector(`td:nth-child(${num})`).textContent;
            let options = name.option_value.split('_');
            let check = value == options[0] ? "checked" : "";

            control = `<div class="form-group">
                            <div class="form-label">                                    
                                <label>${name.show_name}</label>
                            </div>
                            <label class="check-radio"><input class="has-value" type="checkbox" ${check}><span class="checkmark"></span>
                            </label>
                        </div>`;
        } else {
            let show_value = chosed.querySelector(`td:nth-child(${num})`).textContent;
            control = `<div class="form-group">
                            <div class="form-label">                                    
                                <label>${name.show_name}</label>
                            </div>
                            <select class='select-sm has-value'>`;

            let options = name.option_value.split('_');
            for (let value of options) {
                if (value == show_value) {
                    control += `<option value="${value}" selected>${value}</option>`;
                }
                else {
                    control += `<option value="${value}">${value}</option>`;
                }
            }

            control += "</select></div>";
        }

        form += control;
        num++;
    }
    form += "</form>";

    return form;
}

//依据显示字段，建立添加类型 form, 用于 modal 弹出框
export function build_add_form(table_fields) {
    let form = "<form>";

    for (let name of table_fields) {
        let control;
        if (name.ctr_type == "普通输入") {
            control = `<div class="form-group">
                                <div class="form-label">
                                    <label>${name.show_name}</label>
                                </div>
                                <input class="form-control input-sm has-value" type="text">
                            </div>`;
        } else if (name.ctr_type == "二值选一") {
            let checked = name.option_value.split('_')[0] == name.default_value ? 'checked' : '';
            control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <label class="check-radio">
                                    <input class="has-value" type="checkbox" ${checked}>
                                    <span class="checkmark"></span>
                                </label>
                            </div>`;
        } else {
            control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <select class='select-sm has-value'>`;

            let options = name.option_value.split('_');
            for (let value of options) {
                let selected = value == name.default_value ? 'selected' : '';
                control += `<option value="${value}" ${selected}>${value}</option>`;
            }
            control += "</select></div>";
        }

        form += control;
    }
    form += "</form>";

    return form;
}

//依据显示字段，建立表头字段, 用于进出货输入
export function build_inout_form(table_fields) {
    let form = "";
    for (let name of table_fields) {
        let control;
        if (name.ctr_type == "普通输入") {
            control = `<div class="form-group">
                                <div class="form-label">
                                    <label>${name.show_name}</label>
                                </div>
                                <div class="form-input">
                                    <input class="form-control input-sm has-value" type="text" 
                                        style="width: ${name.show_width * 20};" />
                                </div>
                            </div>`;
        } else if (name.ctr_type == "二值选一") {
            let checked = name.option_value.split('_')[0] == name.default_value ? 'checked' : '';
            control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label class='check-label' for='${name.show_name}'>${name.show_name}</label>
                                </div>
                                <label class="check-radio">
                                    <input class="has-value" id='${name.show_name}' type="checkbox" ${checked}>
                                    <span class="checkmark"></span>
                                </label>
                            </div>`;
        } else {
            control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <select class='select-sm has-value' style="width: ${name.show_width * 20};">`;

            let options = name.option_value.split('_');
            for (let value of options) {
                let selected = value == name.default_value ? 'selected' : '';
                control += `<option value="${value}" ${selected}>${value}</option>`;
            }
            control += "</select></div>";
        }

        form += control;
    }

    return form;
}

