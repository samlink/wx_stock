import { SPLITER } from '../parts/tools.mjs';

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
            control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <label class="check-radio"><input class="has-value" type="checkbox"><span class="checkmark"></span>
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
                control += `<option value="${value}">${value}</option>`;
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
                                <input class="form-control input-sm has-value" type="text" style="width: ${name.show_width * 20};">
                            </div>`;
        } else if (name.ctr_type == "二值选一") {
            control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <label class="check-radio"><input class="has-value" type="checkbox"><span class="checkmark"></span>
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
                control += `<option value="${value}">${value}</option>`;
            }
            control += "</select></div>";
        }

        form += control;
    }

    return form;
}

