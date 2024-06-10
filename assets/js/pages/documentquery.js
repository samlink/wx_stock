let page_documentquery = function () {
    let cate = document.querySelector('#category').textContent;
    let limit = document.querySelector('#limit').textContent;

    let get_height = getHeight() - 168;
    let row_num = Math.floor(get_height / 30);

    let document_cate;
    let sort="开单时间 DESC";

    if (cate == "采购查询") {
        document_cate = "采购单据";
    } else if (cate == "销售查询") {
        document_cate = "销售单据";
    } else if (cate == "入库查询") {
        document_cate = "入库单据";
    } else if (cate == "出库查询") {
        document_cate = "出库单据";
    } else if (cate == "发货查询") {
        document_cate = "发货单据";
        sort = "日期 DESC, 开单时间 DESC";
    } else if (cate == "开票查询") {
        document_cate = "销售开票";
    } else if (cate == "调入查询") {
        document_cate = "库存调入";
    } else if (cate == "调出查询") {
        document_cate = "库存调出";
    }

    let table_fields;

    let init_data = {
        container: '.table-documents',
        url: `/fetch_all_documents`,
        post_data: {
            id: "",
            name: '',
            sort: sort,
            rec: row_num,
            cate: cate + ' ' + limit,
        },
        edit: false,

        blank_cells: 14,
        row_fn: table_row,
    };

    fetch(`/fetch_show_fields`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(document_cate),
    })
        .then(response => response.json())
        .then(content => {
            if (content != -1) {
                table_fields = content;
                let custom_fields = [
                    { name: '序号', field: '-', width: 2 },  //field 是用于排序的字段
                    { name: '单号', field: '单号', width: 7 },
                    { name: '类别', field: 'documents.类别', width: 4 },
                    { name: cate == '销售查询' ? '客户' : '供应商', field: 'customers.名称', width: 10 },
                ];

                // 对于出入库的表格, 不需要供应商列, 要去除
                if (cate.indexOf("销售") == -1 && cate.indexOf("采购") == -1) {
                    custom_fields = [
                        { name: '序号', field: '-', width: 2 },  //field 是用于排序的字段
                        { name: '单号', field: '单号', width: 7 },
                        { name: '类别', field: 'documents.类别', width: 4 },
                    ];
                }

                let table = document.querySelector('.table-documents');
                let data = service.build_table_header(table, custom_fields, table_fields, "", "documents");
                table.querySelector('thead tr').innerHTML = data.th_row;

                init_data.header_names = data.header_names;

                tool_table.table_init(init_data);
                tool_table.fetch_table();
            }
        });

    function table_row(tr) {
        let rec = tr.split(SPLITER);
        let len = rec.length;
        let border_left = "";
        if (rec[2].indexOf("退") != -1) {
            border_left = "has-border";
        }

        let bk_color = "";
        if (rec[len - 2] == "否") {
            bk_color = "not-confirm";
        }

        let row = `<tr class='${border_left} ${bk_color}'><td style="text-align: center;">${rec[0]}</td>
        <td title='${rec[1]}'>${rec[1]}</td>
        <td style="text-align: center;">${rec[2]}</td>
        <td style="text-align: center;">${rec[3]}</td>`;

        //第三列的供应商对于出入库表不需要
        if (cate.indexOf("销售") == -1 && cate.indexOf("采购") == -1) {
            row = `<tr class='${border_left} ${bk_color}'><td style="text-align: center;">${rec[0]}</td>
        <td title='${rec[1]}'>${rec[1]}</td>
        <td style="text-align: center;">${rec[2]}</td>`;
        }

        return service.build_row_from_string(rec, row, table_fields, 4);
    }

    document.querySelector('#serach-button').addEventListener('click', function () {
        search_table();
    });

    function search_table() {
        let search = document.querySelector('#search-input').value;
        Object.assign(tool_table.table_data().post_data, { name: search, page: 1 });
        tool_table.fetch_table();
    }

    //编辑按键
    document.querySelector('#edit-button').addEventListener('click', function () {
        let chosed = document.querySelector('tbody .focus');
        if (chosed) {
            let id = chosed.querySelector('td:nth-child(2)').textContent;
            let cate = chosed.querySelector('td:nth-child(3)').textContent;
            let address;
            if (cate == "材料采购") {
                address = `/buy_in/`;
            } else if (cate == "采购退货") {
                address = '/buy_back/';
            } else if (cate == "商品销售") {
                address = `/sale/`;
            } else if (cate == "销售退货") {
                address = '/saleback/';
            } else if (cate == "采购入库") {
                address = `/material_in/`;
            } else if (cate == "销售出库") {
                address = `/material_out/`;
            } else if (cate == "运输发货") {
                address = `/transport/`;
            } else if (cate == "销售开票") {
                address = `/kp/`;
            } else if (cate == "调整入库") {
                address = `/stock_change_in/`;
            } else if (cate == "调整出库") {
                address = `/stock_change_out/`;
            }
            window.open(address + id);
        } else {
            notifier.show('请先选择单据', 'danger');
        }
    });

    //删除按键
    let del_btn = document.querySelector('#del-button');
    if (del_btn) {
        del_btn.addEventListener('click', function () {
            let chosed = document.querySelector('tbody .focus');
            let dh = chosed ? chosed.querySelector('td:nth-child(2)').textContent : "";
            let base = document.querySelector('#base').textContent;

            let del = {
                id: dh,
                rights: "删除单据",
                base: base,
            }

            if (dh != "") {
                alert_confirm(`单据 ${dh} 删除后无法恢复，确认删除吗？`, {
                    confirmCallBack: () => {
                        fetch(`/documents_del`, {
                            method: 'post',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(del),
                        })
                            .then(response => response.json())
                            .then(content => {
                                if (content != -1) {
                                    search_table();
                                } else {
                                    notifier.show('权限不够，操作失败', 'danger');
                                }
                            });
                    }
                });
            } else {
                notifier.show('请先选择单据', 'danger');
            }
        });
    }

    //作废单据
    let fei_btn = document.querySelector('#fei-button');
    if (fei_btn) {
        fei_btn.addEventListener('click', function () {
            let chosed = document.querySelector('tbody .focus');
            let dh = chosed ? chosed.querySelector('td:nth-child(2)').textContent : "";
            let base = document.querySelector('#base').textContent;

            let del = {
                id: dh,
                rights: "作废单据",
                base: base,
            }

            if (dh != "") {
                alert_confirm(`单据 ${dh} 确认作废吗？`, {
                    confirmCallBack: () => {
                        fetch(`/documents_fei`, {
                            method: 'post',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(del),
                        })
                            .then(response => response.json())
                            .then(content => {
                                if (content != -1) {
                                    search_table();
                                } else {
                                    notifier.show('权限不够，操作失败', 'danger');
                                }
                            });
                    }
                });
            } else {
                notifier.show('请先选择单据', 'danger');
            }
        });
    }

    // 导出数据
    let data_out = document.querySelector('#data-out');
    if (data_out) {
        data_out.addEventListener('click', () => {
            let dateTime = new Date();
            let da = dateTime.setMonth(dateTime.getMonth() - 3);
            let da1 = new Date(da).Format("yyyy-MM-dd");
            let da2 = new Date().Format("yyyy-MM-dd");

            let name = document.querySelector('#search-input').value;
            let data = `${da1}${SPLITER}${da2}${SPLITER}${name}`;

            fetch(`/trans_excel`, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
                .then(response => response.json())
                .then(content => {
                    if (content != -1) {
                        download_file(`/download/发货单表.xlsx`);
                        notifier.show('成功导出至 Excel 文件', 'success');
                    } else {
                        notifier.show('权限不够，操作失败', 'danger');
                    }
                });
        });
    }

}();