var service = function () {
    const lang = localStorage.getItem('language') || 'zh';

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
            url: `/stock/fetch_product`,
            post_data: {
                id: "",
                name: '',
                sort: "products.物料号 ASC",
                rec: row_num,
                cate: '正常销售',
                page: 1,
                filter: '',
                user: document.querySelector("#user-id").textContent.trim(),
            },
            header_names: lang == "zh" ?
                {
                    "名称": "split_part(node_name,' ',2)",
                    "材质": "split_part(node_name,' ',1)",
                    "物料号": "products.物料号",
                    "规格": "规格型号",
                    "状态": "products.文本字段2",
                    "执行标准": "products.文本字段3",
                    "生产厂家": "products.文本字段5",
                    "炉批号": "products.文本字段4",
                    "库存长度_mm": "COALESCE(foo.库存长度,0)",
                    "库存重量": "COALESCE(foo.理论重量,0)",
                    "备注": "products.备注",
                } :
                {
                    "Type": "split_part(node_name,' ',2)",
                    "Material": "split_part(node_name,' ',1)",
                    "Stock No.": "products.物料号",
                    "Dia./OD*WT mm": "规格型号",
                    "Condition": "products.文本字段2",
                    "Standard": "products.文本字段3",
                    "Manufacturer": "products.文本字段5",
                    "Heat_No.": "products.文本字段4",
                    "Length (mm)": "COALESCE(foo.库存长度,0)",
                    "Weight (Kg)": "COALESCE(foo.理论重量,0)",
                    "Remarks": "products.备注",
                },
            edit: false,

            blank_cells: 18,
            row_fn: table_row,
        };

        let custom_fields = lang == "zh" ?
            [
                { name: '序号', width: 2 },
                { name: '名称', width: 4 },
                { name: '材质', width: 4 },
                { name: '物料号', width: 4 },
                { name: '规格', width: 4 },
                { name: '状态', width: 4 },
                { name: '执行标准', width: 6 },
                { name: '生产厂家', width: 4 },
                { name: '炉批号', width: 5 },
                { name: '库存长度_mm', width: 4 },
                { name: '库存重量', width: 3 },
                { name: '备注', width: 4 },
            ] :
            [
                { name: 'No.', width: 2 },
                { name: 'Type', width: 4 },
                { name: 'Material', width: 4 },
                { name: 'Stock No.', width: 4 },
                { name: 'Dia./OD*WT mm', width: 4 },
                { name: 'Condition', width: 4 },
                { name: 'Standard', width: 6 },
                { name: 'Manufacturer', width: 4 },
                { name: 'Heat_No.', width: 5 },
                { name: 'Length (mm)', width: 3 },
                { name: 'Weight (Kg)', width: 3 },
                { name: 'Remarks', width: 5 }
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

        document.querySelector('#serach-button').addEventListener('click', function () {
            search_table();
        });

        function search_table() {
            let search = document.querySelector('#search-input').value;
            Object.assign(tool_table.table_data().post_data, { name: search, page: 1 });

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
    };

    function table_row(tr) {
        let row;
        if (lang == "zh") {
            let rec = tr.split(SPLITER);
            let name = rec[1].split(" ");
            row = `<tr><td class="序号">${rec[0]}</td><td class="名称">${name[1]}</td><td class="材质">${name[0]}</td>
                <td class="物料号">${rec[2]}</td><td class="规格">${rec[3]}</td><td class="状态">${rec[4]}</td>
                <td class="执行标准" title="${rec[5]}">${rec[5]}</td><td class="生产厂家">${rec[6]}</td>
                <td class="炉号" title="${rec[7]}">${rec[7]}</td><td>${rec[8]}</td><td>${rec[9]}</td><td>${rec[10]}</td></tr>`;
        } else {
            tr = status_to_en(tr);
            tr = factor_to_en(tr);

            let rec = tr.split(SPLITER);
            let name = rec[1].split(" ");
            row = `<tr><td class="序号">${rec[0]}</td><td class="名称">${name[1]}</td><td class="材质">${name[0]}</td>
                    <td class="物料号">${rec[2]}</td><td class="规格">${rec[3]}</td><td class="状态">${rec[4]}</td>
                    <td class="执行标准" title="${rec[5]}">${rec[5]}</td><td class="生产厂家" title="${rec[6]}">${rec[6]}</td>
                    <td class="炉号" title="${rec[7]}">${rec[7]}</td><td>${rec[8]}</td>
                    <td>${rec[9]}</td><td class="备注"></td></tr>`;
        }

        return row;
    }

    let status_map = new Map([
        ["圆钢", "Bar"],
        ["无缝钢管", "Pipe"],
        ["套管接箍料", "Casing Coupling"],
        ["调质", "Q&T"],
        ["固溶", "Solution"],
        ["时效", "Aging"],
        ["热轧", "Hot Rolled"],
        ["锻造态", "As-Forged"],
        ["锻造", "Forged"],
        ["未正火", "Untreated"],
        ["正回火", "Double Tempering"],
        ["未调", "Non-Q&T"],
        ["挤压", "Extruded"],
        ["退火", "Annealed"],
        ["态", "State"],
        ["固熔酸洗", "Solution Treatment and Pickling"],
        ["号钢", "Steel"],
        ["双", 'Double'],
        ["非标", "Non-standard"],
        ["其他", "Others"]
    ]);

    let factor_map = new Map([
        ["中航上大", "AVIC Shangda"],
        ["上大", "Shangda"],
        ["靖江特殊钢", "Jingjiang Special Steel"],
        ["烟台华新", "Yantai Huaxin"],
        ["江阴兴澄", "Jiangyin Xingcheng"],
        ["抚顺特钢", "Fushun Special Steel"],
        ["抚钢", "Fugang"],
        ["达利普", "Dalipu"],
        ["本钢钢铁", "Benxi Steel"],
        ["本钢", "Bengang"],
        ["中兴热处理", "Zhongxing Heat Treatment"],
        ["天津钢管制造", "Tianjin Pipe Manufacturing"],
        ["衡钢", "Hengyang Steel"],
        ["新兴铸管", "Xinxing Ductile Iron Pipes"],
        ["劝诚特钢", "Quancheng Special Steel"],
        ["劝诚", "Quancheng"],
        ["重庆重材", "Chongqing Heavy Materials"],
        ["取芯材", "Coring Material"],
        ["上海沪崎金属", "Shanghai Huzaki Metal"],
        ["湖北新冶钢", "Hubei Xinye"],
        ["冶钢", "Yegang"],
        ["浙江华东", "Zhejiang Huadong"],
        ["威亚塑料", "Weiya Plastics"],
        ["重庆钢铁", "Chongqing Steel"],
        ["宝山钢铁", "Baosteel"],
        ["宝钢特种", "Baosteel Special"],
        ["山东海鑫达", "Haixinda"],
        ["海鑫达", "Haixinda"],
        ["石钢", "Shigang"],
        ["东北轻合金", "Northeast Light Alloy"],
        ["大冶特殊钢", "Daye Special Steel"],
        ["大冶特殊", "Daye Special"],
        ["大冶特钢", "Daye Spec Steel"],
        ["青海国鑫铝业", "Qinghai Guoxin Aluminum"],
        ["山东中正钢管", "Shandong Zhongzheng Steel Pipe"],
        ["大无缝", "Da Wufeng"],
        ["莱钢", "Laiwu Steel"],
        ["上海朝展金属", "Shanghai Chaozhan Metal"],
        ["江苏常宝", "Jiangsu Changbao"],
        ["常宝", "Changbao"],
        ["衡阳华菱", "Hengyang Hualing"],
        ["威晟", "Weisheng"],
        ["鑫禹泽", "Xinyuze"],
        ["西宁特钢", "Xining Special Steel"],
        ["大钢", "Dagang"],
        ["上海祥巨金属", "Shanghai Xiangju Metal"],
        ["北满", "Beiman"],
        ["兴澄特钢+浩运", "Xingcheng Special Steel"],
        ["钢管", "Pipe"],
        ["圆钢", "Bar"]
    ]);

    let status_to_en = function (tr) {
        status_map.forEach((key, value) => {
            tr = tr.replace(value, key);
        });
        return tr;
    }

    let status_to_zh = function (tr) {
        status_map.forEach((key, value) => {
            tr = tr.replace(key, value);
        });
        return tr;
    }

    let factor_to_en = function (tr) {
        factor_map.forEach((key, value) => {
            tr = tr.replace(value, key);
        });
        return tr;
    }

    let factor_to_zh = function (tr) {
        factor_map.forEach((key, value) => {
            tr = tr.replace(key, value);
        });
        return tr;
    }

    return {
        build_table_header: build_table_header,
        build_product_table: build_product_table,
        status_to_en: status_to_en,
        status_to_zh: status_to_zh,
        factor_to_en: factor_to_en,
        factor_to_zh: factor_to_zh,
    }
}();
