function print(fp, qk) {
    var th = `<tr>
        <th class="center" width="7%">序号</th>
        <th class="center" width="22%">商品名称</th>
        <th class="center" width="30%">规格型号</th>
        <th class="center" width="7%">单位</th>
        <th class="center" width="7%">数量</th>
        <th class="center" width="10%">单价</th>
        <th class="center" width="12%">总金额</th>
    </tr>`;

    document.querySelector('#print-table thead').innerHTML = th;

    var company = "天津市达鑫利机电设备有限公司";
    if (fp == '无税') {
        company = "天津市利鑫达五金商行";
        var tt = $('#print-title').text();
        $('#print-title').text(company + tt.substring(14));
    }

    var space = "";
    var value = 40 - $('#form-customer').val().length;
    for (var i = 0; i < value; i++) {
        space += '　';
    }

    $('#客户名称').text($('#form-customer').val() + space);
    $('#打印单号').text($('#单号').text());
    $('#开单日期').text($('#saledate').val());

    $('#print-table tbody').empty();
    var sum = 0;
    var tablerows = $("#grid-table").jqGrid('getRowData');
    var getlen = tablerows.length;
    if (getlen > 0) {
        for (var i = 0; i < getlen; i++) {
            var price = tablerows[i].单价;
            var money = Number(tablerows[i].单价 * tablerows[i].数量).toFixed(3);

            $('#print-table tbody').append(
                '<tr><td class="center">' + Number(i + 1) + ' </td>' +
                '<td class="center">' + tablerows[i].名称 + '</td>' +
                '<td class="center">' + tablerows[i].规格型号 + '</td>' +
                '<td class="center">' + tablerows[i].单位 + '</td>' +
                '<td class="center">' + tablerows[i].数量 + '</td>' +
                '<td class="center">' + price + '</td>' +
                '<td class="center">' + money + '</td></tr>');
            sum += Number(tablerows[i].单价 * tablerows[i].数量);
        }
    }
    $('#print-table tbody').append(
        '<tr>' +
        '<td class="center" colspan="2">合计</td>' +
        '<td class="center" colspan="4"></td>' +
        '<td class="center" id="合计" colspan="2">' + sum.toFixed(3) + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td class="center" colspan="2">备注</td>' +
        '<td colspan="5">　' + $('#bz').val() + '</td>' +
        '<tr>' +
        '<td class="center">销货单位</td>' +
        '<td colspan="2">&nbsp ' + company + '</td>' +
        '<td class="center">联系电话</td>' +
        '<td colspan="3">&nbsp 022-87886300, 13702152772</td>' +
        '</tr>' +
        '<tr>' +
        '<td class="center">联系地址</td>' +
        '<td colspan="2">&nbsp 天津市南开区密云路新南马路五金城二区15栋112</td>' +
        '<td class="center">单据说明</td>' +
        '<td colspan="3">&nbsp' + fp + '　' + qk + '</td>' +
        '</tr>'
    );

    $('#myprint').printArea();
}

function print_hide(fp, qk) {
    var th = `<tr>
        <th class="center" width="10%">序号</th>
        <th class="center" width="28%">商品名称</th>
        <th class="center" width="37%">规格型号</th>
        <th class="center" width="10%">单位</th>
        <th class="center" width="10%">数量</th>
    </tr>`;

    document.querySelector('#print-table thead').innerHTML = th;

    var company = "天津市达鑫利机电设备有限公司";
    if (fp == '无税') {
        company = "天津市利鑫达五金商行";
        var tt = $('#print-title').text();
        $('#print-title').text(company + tt.substring(14));
    }

    var space = "";
    var value = 40 - $('#form-customer').val().length;
    for (var i = 0; i < value; i++) {
        space += '　';
    }

    $('#客户名称').text($('#form-customer').val() + space);
    $('#打印单号').text($('#单号').text());
    $('#开单日期').text($('#saledate').val());

    $('#print-table tbody').empty();
    var sum = 0;
    var tablerows = $("#grid-table").jqGrid('getRowData');
    var getlen = tablerows.length;
    if (getlen > 0) {
        for (var i = 0; i < getlen; i++) {
            $('#print-table tbody').append(
                '<tr><td class="center">' + Number(i + 1) + ' </td>' +
                '<td class="center">' + tablerows[i].名称 + '</td>' +
                '<td class="center">' + tablerows[i].规格型号 + '</td>' +
                '<td class="center">' + tablerows[i].单位 + '</td>' +
                '<td class="center">' + tablerows[i].数量 + '</td></tr>');
        }
    }
    $('#print-table tbody').append(
        '<tr>' +
        '<td class="center">备注</td>' +
        '<td colspan="4">　' + $('#bz').val() + '</td>' +
        '<tr>' +
        '<td colspan="5">　销货单位：' + company + '　　　　　　　　　　　　　　　联系电话：022-87886300, 13702152772</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="5">　联系地址：天津市南开区密云路新南马路五金城二区15栋112  　　　　　　　　　　　　　　　单据说明：' + fp + '　' + qk + '</td>' +
        '</tr>'
    );

    $('#myprint').printArea();
}