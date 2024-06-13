let page_stockoutitems = function () {
    let get_height = getHeight() - 133;
    let row_num = Math.floor(get_height / 33);

    //执行日期实例------------------------------------------------
    service.set_date();
    let date1 = document.querySelector('#search-date1').value;
    let date2 = document.querySelector('#search-date2').value;

    //表格搜索----------------------------------------------------
    let init_data = {
        container: '#table-stockout',
        url: `/get_trans_items`,
        post_data: {
            id: "",
            name: '',
            sort: "日期 DESC, 单号 DESC, 顺序",
            rec: row_num,
        },
        edit: false,
        header_names: {
            "发货日期": "d.日期",
            "合同号": "d.文本字段3",
            "销售单号": "d.文本字段6",
            "发货单号": "di.单号id",
            "客户名称": "d.文本字段5",
            "名称": "split_part(node_name,' ',2)",
            "材质": "split_part(node_name,' ',1)",
            "规格": "规格型号",
            "状态": "p.文本字段2",
            "炉号": "p.文本字段4",
            "单价": "单价",
            "长度": "长度",
            "数量": "数量",
            "重量": "重量",
            "金额": "金额",
            "备注": "di.备注"
        },

        blank_cells: 20,
        row_fn: row_fn,
    };

    init_data.post_data.cate = `${date1}${SPLITER}${date2}`;

    tool_table.table_init(init_data);
    tool_table.fetch_table(fetch_lu);

    function fetch_lu() {
        let trs = document.querySelectorAll('#table-stockout tbody tr');
        service.get_lu(trs);
    }

    //点击搜索按钮
    document.querySelector('#serach-button').addEventListener('click', function () {
        let fields = document.querySelector('#search-fields').value;
        let date1 = document.querySelector('#search-date1').value;
        let date2 = document.querySelector('#search-date2').value;

        init_data.post_data.name = fields;
        init_data.post_data.cate = `${date1}${SPLITER}${date2}`;
        init_data.post_data.page = 1;

        tool_table.fetch_table(fetch_lu);
    });

    function row_fn(tr) {
        let row = tr.split(SPLITER);
        return `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[5]}</td>
            <td>${row[4]}</td><td>${row[6]}</td><td class='材质'>${row[7]}</td><td class='规格'>${row[8]}</td><td>${row[9]}</td>
            <td class='炉号'>${row[10]}</td><td>${row[11]}</td><td>${row[12]}</td><td>${row[13]}</td><td>${row[14]}</td>
            <td>${row[15]}</td> <td>${row[16]}</td></tr>`;
    }

    document.querySelector('#data-out').addEventListener('click', () => {
        let da1 = document.querySelector('#search-date1').value;
        let da2 = document.querySelector('#search-date2').value;
        let name = document.querySelector('#search-fields').value;
        let data = `${da1}${SPLITER}${da2}${SPLITER}${name}`;
        fetch(`/trans_item_excel`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(content => {
                if (content != -1) {
                    download_file(`/download/发货明细表.xlsx`);
                    notifier.show('成功导出至 Excel 文件', 'success');
                } else {
                    notifier.show('权限不够，操作失败', 'danger');
                }
            });
    });
}();