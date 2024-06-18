var service = function () {
    var table_fields;

    /**
     * 根据显示字段创建表头
     * @param {} table_container 表格容器
     * @param {} custom_fields 自定义字段数组 [{name:'序号', width: 3}...]
     * @param {} table_fields  自动生成字段 [{field_name:'日期', show_name:'日期', data_type:'文本' ...}...]
     * @param {} last_fields  自定义表格最后部分的字段数组 [{name:'库存', field: '库存', width: 3}...]
     * @param {} table_name  表名，为了避免联合查询时出现名称冲突
     */
    let build_table_header = function (table_container, custom_fields, table_fields, last_fields, table_name) {
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

    //创建商品规格型号表，供“商品设置”以及出入库输入时的商品查找使用，从 cb 开始都是回调函数
    let build_product_table = function (row_num, cb, more, more2) {
        let init_data = {
            container: '.table-product',
            url: '/fetch_product',
            post_data: {
                id: "",
                name: '',
                sort: "products.物料号 ASC",
                rec: row_num,
                cate: '正常销售',
                page: 1,
                filter: '',
            },
            header_names: {
                "名称": "split_part(node_name,' ',2)",
                "材质": "split_part(node_name,' ',1)",
                "物料号": "products.物料号",
                "规格": "规格型号",
                "状态": "products.文本字段2",
                "执行标准": "products.文本字段3",
                "生产厂家": "products.文本字段5",
                "炉号": "products.文本字段4",
                "库存长度": "COALESCE(foo.库存长度,0)",
                "库存重量": "COALESCE(foo.理论重量,0)",
                "备注": "products.备注",
            },
            edit: false,

            blank_cells: 18,
            row_fn: table_row,
        };

        let custom_fields = [
            {name: '序号', width: 2},
            {name: '名称', width: 4},
            {name: '材质', width: 4},
            {name: '物料号', width: 4},
            {name: '规格', width: 4},
            {name: '状态', width: 4},
            {name: '执行标准', width: 6},
            {name: '生产厂家', width: 4},
            {name: '炉号', width: 5},
            {name: '库存长度', width: 3},
            {name: '库存重量', width: 3},
            {name: '备注', width: 5},
        ];
        let table = document.querySelector('.table-product');
        let header = build_table_header(table, custom_fields, "", "", "products");
        table.querySelector('thead tr').innerHTML = header.th_row;

        tool_table.table_init(init_data);
        tool_table.fetch_table((content) => {
            if (cb) {
                cb(table);
            }
            if (more) {
                more();
            }
            if (more2) {
                more2(content);
            }
        });
    };

    function table_row(tr) {
        let rec = tr.split(SPLITER);
        let name = rec[1].split(" ");
        let row = `<tr><td class="序号">${rec[0]}</td><td class="名称">${name[1]}</td><td class="材质">${name[0]}</td>
            <td class="物料号">${rec[2]}</td><td class="规格">${rec[3]}</td><td class="状态">${rec[4]}</td>
            <td class="执行标准" title="${rec[5]}">${rec[5]}</td><td class="生产厂家">${rec[6]}</td>
            <td class="炉号" title="${rec[7]}">${rec[7]}</td><td>${rec[8]}</td><td>${rec[9]}</td><td>${rec[10]}</td></tr>`;

        return row;
    }

    document.querySelector('#serach-button').addEventListener('click', function () {
        search_table();
    });

    function search_table() {
        let search = document.querySelector('#search-input').value;
        Object.assign(tool_table.table_data().post_data, {name: search, page: 1});

        //加cb回调函数，是为了在出入库商品搜索时，加上行的双击事件
        let table = document.querySelector('.table-product');
        tool_table.fetch_table((content) => {
            if (cb) {
                cb(table);
            }
            if (more) {
                more();
            }
            if (more2) {
                more2(content);
            }
        });
    }

    /// 获取炉号
    let get_lu = function (tem_trs) {
        let trs = [];
        tem_trs.forEach(tr => {
            if (tr.querySelector('.炉号')) {
                trs.push(tr);
            }
        });

        let lus_arr = [];
        for (let tr of trs) {
            let lu = tr.querySelector('.炉号');
            if (lu.textContent.trim() != '' && lu.textContent.trim() != '--') {
                // 不可换行
                let da = `${tr.querySelector('.材质').textContent.trim()}_${tr.querySelector('.规格').textContent.trim()}_${lu.textContent.trim()}`;
                lus_arr.push(da);
            }
        }

        if (lus_arr.length > 0) {
            fetch("/fetch_lu", {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(lus_arr),
            })
                .then(response => response.json())
                .then(content => {
                    for (let tr of trs) {
                        let lu = tr.querySelector('.炉号');
                        for (let cont of content) {
                            let da = `${tr.querySelector('.材质').textContent.trim()}_${tr.querySelector('.规格').textContent.trim()}_${lu.textContent.trim()}`;
                            if (cont.indexOf(da) != -1) {
                                lu.innerHTML = `<a href="${cont}" title="点击下载质保书">${lu.textContent.trim()}</a>`;
                                break;
                            }
                        }
                    }
                })
        }
    }


    return {
        build_table_header: build_table_header,
        build_product_table: build_product_table,
        get_lu: get_lu,
    }
}();
