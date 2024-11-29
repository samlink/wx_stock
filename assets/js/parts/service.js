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

    //创建商品规格型号表，供“商品设置”以及出入库输入时的商品查找使用
    let build_product_table = function (row_num, cb, more) {
        let init_data = {
            container: '.table-product',
            url: `/fetch_product`,
            post_data: {
                id: "",
                name: '',
                // sort: "products.文本字段1 ASC",
                rec: row_num,
                cate: '',
                filter: '',
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

                    tool_table.table_init(init_data);

                    let post_data = {
                        cate: document.querySelector('#p-select') ? document.querySelector('#p-select').value : "现有库存",
                        page: 1,
                    }

                    Object.assign(tool_table.table_data().post_data, post_data);
                    tool_table.fetch_table(() => {
                        if (cb) {
                            cb(table);
                        }
                        if (more) {
                            more();
                        }
                    });
                }
            });

        function table_row(tr) {
            let rec = tr.split(SPLITER);
            let row = `<tr><td>${rec[1]}</td><td hidden>${rec[0]}</td>`;
            let row_build = build_row_from_string(rec, row, table_fields);
            let rows = row_build.replace("</tr>", `<td class = "名称">${rec[rec.length - 4]}</td>
                                        <td class = "商品id">${rec[rec.length - 3]}</td><td class = "link">${rec[rec.length - 2]}</td></tr>`);  //将商品id和名称加入

            return rows;
        }

        function blank_row() {
            let row = "<tr><td></td><td></td>";
            return build_blank_from_fields(row, table_fields);
        }

        document.querySelector('#serach-button').addEventListener('click', function () {
            search_table();
        });

        function search_table() {
            let search = document.querySelector('#search-input').value;
            Object.assign(tool_table.table_data().post_data, { name: search, page: 1 });

            //加cb回调函数，是为了在出入库商品搜索时，加上行的双击事件
            let table = document.querySelector('.table-product');
            tool_table.fetch_table(() => {
                if (cb) {
                    cb(table);
                }
                if (more) {
                    more();
                }
            });
        }

    }

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
        Object.assign(tool_table.table_data().post_data, { name: search, page: 1 });

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
