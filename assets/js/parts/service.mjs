import { regDate, regInt, regReal, SPLITER } from '../parts/tools.mjs';
import { AutoInput } from '../parts/autocomplete.mjs';
import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { notifier } from "./notifier.mjs";
import { alert_confirm } from "./alert.mjs";

export var table_fields;

/**
 * 根据显示字段创建表头
 * @param {} table_container 表格容器
 * @param {} custom_fields 自定义字段数组 [{name:'序号', width: 3}...]
 * @param {} table_fields  自动生成字段 [{field_name:'日期', show_name:'日期', data_type:'文本' ...}...]
 * @param {} last_fields  自定义表格最后部分的字段数组 [{name:'库存', field: '库存', width: 3}...]
 * @param {} table_name  表名，为了避免联合查询时出现名称冲突
 */
export function build_table_header(table_container, custom_fields, table_fields, last_fields, table_name) {
    let all_width = 0;
    for (let item of custom_fields) {
        all_width += item.width;
    }

    if (last_fields) {
        for (let item of last_fields) {
            all_width += item.width;
        }
    }

    for (let item of table_fields) {
        all_width += item.show_width;
    }

    let table_width = table_container.clientWidth;
    let width_raio = table_width / all_width;
    let row = "";

    //当可用屏幕宽度小于字段总宽度的18倍时，则按实际px显示，这样会横向滚动
    if (width_raio < 18) {
        for (let item of custom_fields) {
            row += `<th width='${item.width * 18}px'>${item.name}</th>`;
        }

        table_container.style.width = table_width;
        table_container.querySelector('.table-ctrl').style.cssText = `
            position: absolute;
            width: ${table_width + 2}px;
            margin-top: 11px;
            border: 1px solid #edf5fb;
            margin-left: -2px;`;
    } else {
        for (let item of custom_fields) {
            row += `<th width='${item.width * 100 / all_width}%'>${item.name}</th>`;
        }
    }

    let header_names = {};
    for (let th of custom_fields) {
        header_names[th.name] = th.field;
    }

    for (let th of table_fields) {
        row += width_raio > 18 ? `<th width="${(th.show_width * 100 / all_width).toFixed(1)}%">${th.show_name}</th>` :
            `<th width="${th.show_width * 18}px">${th.show_name}</th>`;

        header_names[th.show_name] = `${table_name}.${th.field_name}`;
    }

    if (last_fields) {
        for (let item of last_fields) {
            row += width_raio < 18 ? `<th width='${item.width * 18}px'>${item.name}</th>` : `<th width='${item.width * 100 / all_width}%'>${item.name}</th>`;
            header_names[item.name] = item.field;
        }
    }

    return {
        th_row: row,
        header_names: header_names,
    };
}

/**
 * 计算钢材理论重量
 * @param {
 * data
 * long: 长度，单位毫米，如 7688，
 * num: 支数，
 * name: 名称，如圆钢或无缝钢管，
 * cz: 材质，如 17-4，
 * gg: 规格，如 120 或 123*80}
 * @returns 两位小数的字符串
 */
export function calc_weight(data) {
    let tech, cz = data.cz.trim();
    if (cz == "718") {
        tech = 1.05;
    } else if (cz == "17-4" || cz == "Super13Cr") {
        tech = 1.0064;
    } else {
        tech = 1;
    }

    let weight = 0;
    if (data.name == "圆钢") {
        weight = data.gg * data.gg * 0.00617 * data.long * data.num * tech / 1000;
    } else {
        let pipe = data.gg.split('*');
        weight = 0.02466 * pipe[1] * (pipe[0] - pipe[1]) * data.long * data.num * tech / 1000;
    }

    return weight.toFixed(1);
}

//保存时，读取头部字段内容
export function build_save_header(all_values, table_fields) {
    let n = 0;
    let save_str = "";
    for (let f of table_fields) {
        if (f.data_type == "文本") {
            save_str += `${all_values[n].value}${SPLITER}`;
        } else if (f.data_type == "整数" || f.data_type == "实数") {
            let value = all_values[n].value ? all_values[n].value : 0;
            save_str += `${value}${SPLITER}`;
        } else {
            save_str += `${all_values[n].checked ? "是" : "否"}${SPLITER}`;
        }
        n++;
    }
    return save_str;
}

// 保存时，读取表格明细，n 为去除隐藏列及序号列的个数
export function build_save_items(n, row, show_names) {
    let save_str = "";
    let len = show_names.length;
    for (let i = n; i < len; i++) {
        if (show_names[i].is_save) {
            if (show_names[i].type == "autocomplete" && show_names[i].save && show_names[i].save != "id") {
                let value = row.querySelector(`.${show_names[i].class}`).value;
                save_str += `${value}${SPLITER}`;
            } else if (show_names[i].type == "autocomplete") {
                let value = row.querySelector(`.${show_names[i].class}`).getAttribute('data').split(SPLITER)[0];
                save_str += `${value}${SPLITER}`;
            } else if (show_names[i].type == "普通输入" || show_names[i].type == "下拉列表") {     // 下拉列表和二值选一未测试
                let value = row.querySelector(`.${show_names[i].class}`).value;
                if (!value) value = row.querySelector(`.${show_names[i].class}`).textContent;
                save_str += `${value.trim()}${SPLITER}`;
            } else {
                let value = row.querySelector(`.${show_names[i].class}`).checked ? "是" : "否";
                save_str += `${value}${SPLITER}`;
            }
        }
    }
    return save_str;
}

// 放置提交审核按钮, 在单据头部
export function set_sumit_shen() {
    let sumit_shen = document.createElement("Button");
    sumit_shen.setAttribute('id', 'sumit-shen');
    sumit_shen.classList.add("btn-info");
    sumit_shen.classList.add("btn");
    sumit_shen.classList.add("btn-sm");
    sumit_shen.classList.add("button-shen");
    sumit_shen.textContent = '提交审核';
    document.querySelector('.fields-show').appendChild(sumit_shen);
}

// 审核单据
export function make_formal(data) {
    if (data.button.textContent.trim() == "已审核") {
        return false;
    }

    if (data.dh == "新单据" || data.edited) {
        notifier.show('请先保存单据', 'danger');
        return false;
    }

    if (document.querySelector('#sumit-shen') &&
        document.querySelector('#sumit-shen').textContent == "提交审核") {
        notifier.show('该单还未提交审核', 'danger');
        return false;
    }

    alert_confirm("确认审核吗？", {
        confirmText: "确认",
        cancelText: "取消",
        confirmCallBack: () => {
            fetch(`/make_formal`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cate: data.document_name,
                    dh: data.dh,
                }),
            })
                .then(response => response.json())
                .then(content => {
                    if (content != -1) {
                        data.button.textContent = '已审核';
                        data.button.classList.add('remembered');
                        if (typeof (data.readonly_fun) == "function") {
                            data.readonly_fun();
                        }

                        if (data.after_shen_fun) {
                            data.after_shen_fun();
                        }

                        if (typeof (data.after_func) == "function") {
                            data.after_func(data.xsdh, data.dh);
                        }

                        notifier.show('审核完成', 'success');
                    } else {
                        notifier.show('权限不够', 'danger');
                    }
                });
        }
    });
}

//提交审核
export function sumit_shen(data) {
    if (data.button.textContent == "已提审核") {
        return false;
    }

    if (data.dh == "新单据" || data.edited) {
        notifier.show('请先保存单据', 'danger');
        return false;
    }

    alert_confirm("确认提交审核吗？", {
        confirmText: "确认",
        cancelText: "取消",
        confirmCallBack: () => {
            fetch(`/make_sumit_shen`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cate: data.document_name,
                    dh: data.dh,
                }),
            })
                .then(response => response.json())
                .then(content => {
                    if (content != -1) {
                        data.button.textContent = '已提审核';
                        data.button.classList.add('remembered');
                        notifier.show('提交完成', 'success');
                        setTimeout(() => {
                            let l = location.toString().lastIndexOf("/");
                            location = location.toString().substring(0, l + 1) + 'new';
                        }, 1000);
                    } else {
                        notifier.show('权限不够', 'danger');
                    }
                });
        }
    });
}

//设置只读: 提交审核、审核以及用户
export function set_shens_owner(data) {
    let values = data.content.split(SPLITER);
    let len = values.length;
    document.querySelector('#owner').textContent = `[ ${values[len - 1]} ]`;
    only_worker(values[len - 1], data.readonly_fun);
    let shen = document.querySelector('#sumit-shen');
    if (values[len - 5] == "true") {
        shen.textContent = "已提审核";
        shen.classList.add('remembered');
    } else {
        shen.textContent = "提交审核";
        shen.classList.remove('remembered');
    }

    let rem = document.querySelector('#remember-button');
    if (values[len - 2] != "") {
        rem.textContent = "已审核";
        rem.classList.add('remembered');
        data.readonly_fun();
    } else {
        rem.textContent = "审核";
        rem.classList.remove('remembered');
    }
    if (rem.textContent == "审核" && data.focus_fun && typeof data.focus_fun == "function") {
        data.focus_fun();
    }
}

//使编辑表格的功能键只读
export function edit_button_disabled() {
    document.querySelector('#row-insert').disabled = true;
    document.querySelector('#row-del').disabled = true;
    document.querySelector('#row-up').disabled = true;
    document.querySelector('#row-down').disabled = true;
}

// 非经办人只能查看
export function only_worker(worker, set_readonly) {
    if (document.querySelector('#user-name').textContent.indexOf(worker) == -1) {
        set_readonly();
        let all_edit = document.querySelectorAll('.fields-show input');
        for (let edit of all_edit) {
            edit.disabled = true;
        }
        document.querySelector('#save-button').disabled = true;
    }
}

//保存前的错误排查, 检查表头的日期和整数、实数、空表的输入错误
export function header_error_check(document_table_fields, all_rows) {
    if (!regDate.test(document.querySelector('#日期').value)) {
        notifier.show('日期输入错误', 'danger');
        return false;
    }

    let all_values = document.querySelectorAll('.document-value');
    for (let i = 0; i < document_table_fields.length; i++) {
        if (document_table_fields[i].data_type == "整数") {
            if (all_values[i].value && !regInt.test(all_values[i].value)) {
                notifier.show(`${document_table_fields[i].show_name}输入错误`, 'danger');
                return false;
            }
        } else if (document_table_fields[i].data_type == "实数") {
            if (all_values[i].value && !regReal.test(all_values[i].value)) {
                notifier.show(`${document_table_fields[i].show_name}输入错误`, 'danger');
                return false;
            }
        }
    }

    if (all_rows.length == 0) {
        notifier.show(`表格不能为空`, 'danger');
        return false;
    }
    return true;
}

//依据显示字段，创建表格内容行
export function build_row_from_string(rec, row, table_fields, n) {
    if (!n) n = 2;
    for (let name of table_fields) {
        if (name.data_type == "文本") {
            row += `<td title='${rec[n]}'>${rec[n]}</td>`;
        } else if (name.data_type == "整数" || name.data_type == "实数") {
            row += `<td>${rec[n]}</td>`;
        } else {
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
                } else {
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
export function build_inout_form(table_fields, data) {
    let values = data ? data.split(SPLITER) : "";
    let form = "";
    let idx_n = 1;
    let n = 0;
    for (let name of table_fields) {
        let control;
        let id = `id="${name.field_name}"`;
        let value = values ? values[n] : "";

        if (name.ctr_type == "普通输入") {
            value = value === "0" ? "" : value;
            control = `<div class="form-group">
                                <div class="form-label">
                                    <label>${name.show_name}</label>
                                </div>
                                <div class="form-input">
                                    <input class="form-control input-sm document-value" value='${value}' idx="${idx_n++}" type="text" ${id}
                                        style="width: ${name.show_width * 20}px;" />
                                </div>
                            </div>`;
        } else if (name.ctr_type == "二值选一") {
            let has_value = value ? value : name.default_value;
            let checked = name.option_value.split('_')[0] == has_value ? 'checked' : '';
            control = `<div class="form-group" style="display: flex;">
                                <div class="form-label">                                    
                                    <label class='check-label' for='${name.show_name}'>${name.show_name}</label>
                                </div>
                                <label class="check-radio">
                                    <input class="document-value" id='${name.show_name}' type="checkbox"  idx="${idx_n++}" ${id} ${checked}>
                                    <span class="checkmark"></span>
                                </label>
                            </div>`;
        } else {
            control = `<div class="form-group">
                                <div class="form-label">                                    
                                    <label>${name.show_name}</label>
                                </div>
                                <select class='select-sm document-value' style="width: ${name.show_width * 20}px;" ${id}>`;

            let options = name.option_value.split('_');
            let has_value = value ? value : name.default_value;
            for (let value of options) {
                let selected = value == has_value ? 'selected' : '';
                control += `<option value="${value}" ${selected}>${value}</option>`;
            }
            control += "</select></div>";
        }

        form += control;
        n++;
    }

    return form;
}

//创建商品规格型号表，供“商品设置”以及出入库输入时的商品查找使用
export function build_product_table(row_num, cb, more) {
    let init_data = {
        container: '.table-product',
        url: `/fetch_product`,
        post_data: {
            id: "",
            name: '',
            sort: "products.文本字段1 ASC",
            rec: row_num,
            cate: '',
        },
        edit: false,

        row_fn: table_row,
        blank_row_fn: blank_row,
    };

    fetch(`/fetch_fields`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: "商品规格"
        }),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                table_fields = content[0].filter((item) => {
                    return item.is_show;
                });

                let table = document.querySelector('.table-product');
                let header = build_table_header(table, [{ name: '序号', width: 3 }], table_fields, "", "products");
                table.querySelector('thead tr').innerHTML = header.th_row;
                // table.querySelector('thead tr th:nth-child(2)').setAttribute('hidden', 'true');

                init_data.header_names = header.header_names;
                init_data.header_names["编号"] = "id";

                // 自动计算得出的字段, 需用相关的计算公式进行排序, 不可直接使用原字段
                init_data.header_names["库存长度"] = "products.整数字段3-COALESCE(长度合计,0)-COALESCE(切分次数,0)*2";
                init_data.header_names["切分"] = "COALESCE(切分次数,0)";
                init_data.header_names["理论重量"] = "库存下限-COALESCE(理重合计,0)";

                table_init(init_data)

                // let data = {
                //     url: `/fetch_product`,
                // }

                let post_data = {
                    cate: document.querySelector('#p-select').value,
                    page: 1,
                }

                // Object.assign(table_data, data);
                Object.assign(table_data.post_data, post_data);
                fetch_table();
            }
        });

    function table_row(tr) {
        let rec = tr.split(SPLITER);
        let row = `<tr><td>${rec[1]}</td><td hidden>${rec[0]}</td>`;
        let row_build = build_row_from_string(rec, row, table_fields);
        let rows = row_build.replace("</tr>", `<td>${rec[rec.length - 2]}</td></tr>`);  //将库存加入
        return rows;
    }

    function blank_row() {
        let row = "<tr><td></td><td></td>";
        return build_blank_from_fields(row, table_fields);
    }

    //搜索规格
    // let search_input = document.querySelector('#search-input');
    // let cate = document.querySelector('#product-id');

    // let auto_comp = new AutoInput(search_input, cate, `/product_auto`, () => {
    //     search_table();
    // });

    // auto_comp.init();

    document.querySelector('#serach-button').addEventListener('click', function () {
        search_table();
    });

    function search_table() {
        let search = document.querySelector('#search-input').value;
        Object.assign(table_data.post_data, { name: search, page: 1 });

        //加cb回调函数，是为了在出入库商品搜索时，加上行的双击事件
        if (typeof cb == "function") {
            let table = document.querySelector('.table-product');
            fetch_table(() => {
                cb(table);
            });
        } else {
            fetch_table();
        }
    }
}

//出入库时，获取单据列表
export function get_materials_docs(url, cate, build_func) {
    fetch(url, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cate),
    })
        .then(response => response.json())
        .then(content => {
            let tr = "";
            content.forEach(obj => {
                tr += `<tr><td>${obj.label}</td></tr>`;
            });

            document.querySelector(".table-docs tbody").innerHTML = tr;

            let lines = document.querySelectorAll(".table-docs tbody tr");
            for (let l of lines) {
                l.addEventListener("dblclick", () => {
                    if (document.querySelector('#remember-button').textContent == "已审核" ||
                        document.querySelector('#save-button').disabled == true) {
                        return false;
                    }
                    let dh = l.querySelector('td:nth-child(1)').textContent.split('　')[0];
                    document.querySelector('#文本字段6').value = dh;
                    build_func(dh);
                    lines.forEach(l => {
                        l.classList.remove('has-bak')
                    })
                    l.classList.add('has-bak');
                    document.querySelector('#文本字段6').focus();
                });
            }
        });
}

// 业务报表设置起始日期
export function set_date() {
    let date1 = document.querySelector('#search-date1');
    let date2 = document.querySelector('#search-date2');

    var dateTime = new Date();
    let d1 = dateTime.setDate(dateTime.getDate() - 30);
    date1.value = new Date(d1).Format("yyyy-MM-dd");
    date2.value = new Date().Format("yyyy-MM-dd");

    laydate.render({
        elem: date1,
        showBottom: false,
        // theme: 'molv',
        // value: '2021-05-02'
        // theme: '#62468d',
    });

    laydate.render({
        elem: date2,
        showBottom: false,
    });
}

export function handle_pic(dh_div, save_url) {
    let fileBtn = document.getElementById('pic_upload');
    // 点击传图
    document.querySelector('#pic-button').addEventListener('click', function (e) {
        // let that = this;
        if (dh_div.textContent == "新单据") {
            notifier.show('请先保存单据', 'danger');
            return false;
        }
        e.preventDefault();
        fileBtn.click();
    });

    //图片上传
    fileBtn.addEventListener('change', () => {
        document.querySelector('#pic-button').disabled = "true";
        const fd = new FormData();
        fd.append('file', fileBtn.files[0]);
        fetch(`/pic_in`, {
            method: 'POST',
            body: fd,
        })
            .then(res => res.json())
            .then(content => {
                fetch(save_url, {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(`${dh_div.textContent}${SPLITER}${content.substr(1, content.length - 1)}`),
                })
                    .then(response => response.json())
                    .then(content => {
                        if (content == -1) {
                            notifier.show('权限不够', 'danger');
                        } else if (content == -2) {
                            notifier.show('图片保存出错', 'danger');
                        } else {
                            document.querySelector('#upload-pic').src = `${content}?${Math.random()}`;
                            document.querySelector('#pic-button').disabled = "";
                            notifier.show('图片成功保存', 'success');
                        }
                    });
            });
    });

    // 放大图片
    document.querySelector('#upload-pic').addEventListener('click', () => {
        let pic = document.querySelector('#upload-pic').src;
        let show = pic.split("?")[0].replace("min_", "pic_") + `?${Math.random()}`;
        let pic_html = `<div class = "form-input show-pic">
                                <img width = "1190px" src = "${show}" alt = "出库签字图">
                            </div>`;

        document.querySelector('.modal-body').innerHTML = pic_html;
        document.querySelector('.modal-title').textContent = "出库签字图";
        document.querySelector('.modal-dialog').style.cssText = "max-width: 1230px;"
        document.querySelector('.modal').style.display = "block";
        document.querySelector('#modal-sumit-button').style.display = "none";
    })
}