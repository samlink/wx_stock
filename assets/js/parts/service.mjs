import { SPLITER } from '../parts/tools.mjs';
export function build_row_from_string(tr, table_fields) {
    let rec = tr.split(SPLITER);
    let row = `<tr><td style="text-align: center;">${rec[1]}</td><td hidden>${rec[0]}</td>`;
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

export function build_blank_from_fields(table_fields) {
    let row = "<tr><td></td><td hidden></td>";
    for (let _f of table_fields) {
        row += "<td></td>";
    }
    row += "</tr>";
    return row;
}