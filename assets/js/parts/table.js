var tool_table = function () {
    var cb_function, container, resize;
    var table_data = {};

    var table_init = function (data) {
        table_data = Object.assign(data, {
            header: document.querySelector(data.container + ' thead tr'),                 //排序可选,若不需要排序功能,则去掉此属性
            body: document.querySelector(data.container + ' tbody'),
            page_input: document.querySelector(data.container + ' #page-input'),
            page_first: document.querySelector(data.container + ' #first'),
            page_pre: document.querySelector(data.container + ' #pre'),
            page_aft: document.querySelector(data.container + ' #aft'),
            page_last: document.querySelector(data.container + ' #last'),
            total_pages: document.querySelector(data.container + ' #pages'),
            total_records: document.querySelector(data.container + ' #total-records'),
            other_info: document.querySelector(data.container + ' #other-info'),
        });

        container = data.container;

        table_data.page_input.value = 1;
        table_data.page_first.disabled = true;
        table_data.page_pre.disabled = true;
        table_data.post_data.page = 1;

        table_data.page_pre.addEventListener('click', (e) => {
            if (!table_data.edit) {
                table_data.page_input.value--;
                change_page(table_data.page_input.value);
            }
        });

        table_data.page_aft.addEventListener('click', (e) => {
            if (!table_data.edit) {
                table_data.page_input.value++;
                change_page(table_data.page_input.value);
            }
        });

        table_data.page_first.addEventListener('click', (e) => {
            if (!table_data.edit) {
                change_page(1);
            }
        });

        table_data.page_last.addEventListener('click', (e) => {
            if (!table_data.edit) {
                change_page(table_data.total_pages.textContent);
            }
        });

        table_data.page_input.addEventListener('change', function () {
            if (!table_data.edit) {
                change_page(table_data.page_input.value);
            }
        });

        if (table_data.header) {
            for (let th of table_data.header.children) {
                th.addEventListener('click', function (e) {
                    if (!resize && !table_data.edit && this.textContent != "序号") {
                        for (let t of table_data.header.children) {
                            t.textContent = t.textContent.split(' ')[0];
                        }

                        let order = table_data.post_data.sort.indexOf('ASC') !== -1 ? 'DESC' : 'ASC';
                        let arrow = table_data.post_data.sort.indexOf('ASC') !== -1 ? '▼' : '▲';
                        let sort = table_data.header_names[this.textContent] + " " + order;
                        // this.textContent = this.textContent + " " + arrow;

                        Object.assign(table_data.post_data, { page: 1, sort: sort });
                        table_data.page_input.value = 1;

                        fetch_table(cb_function);
                    }
                })
            }
        }
    }

    var fetch_table = function (cb) {
        fetch(table_data.url, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(table_data.post_data),
        })
            .then(response => response.json())
            .then(content => {
                if (content != -1) {
                    let rows = "";
                    let count = 0;
                    for (let tr of content[0]) {
                        rows += table_data.row_fn(tr);
                        count++;
                    }

                    for (let i = 0; i < table_data.post_data.rec - count; i++) {
                        rows += table_data.blank_row_fn();
                    }

                    table_data.body.innerHTML = rows;
                    table_data.total_records.textContent = content[1];
                    table_data.total_pages.textContent = content[2];
                    table_data.page_input.value = table_data.post_data.page;

                    //此处时最新加入的，可选的一个信息提示
                    if (table_data.other_info && content[3]) {
                        table_data.other_info.textContent = content[3];
                    }

                    button_change(table_data.page_input, table_data.page_first, table_data.page_pre, table_data.page_aft, table_data.page_last, content[2]);

                    for (let tr of table_data.body.children) {
                        tr.addEventListener('click', function (e) {
                            if (!table_data.edit) {
                                for (let r of table_data.body.children) {
                                    r.classList.remove('focus');
                                }
                                this.classList.add('focus');

                                if (typeof table_data.row_click == "function") {
                                    table_data.row_click(tr);
                                }
                            }
                        });
                    }

                    //若表中有链接, 去除链接的点击冒泡事件
                    let links = table_data.body.querySelectorAll('a');
                    if (links.length > 0) {
                        for (let l of links) {
                            l.addEventListener('click', function (e) {
                                e.stopPropagation();
                            });
                        }
                    }

                    table_resize();

                    if (typeof cb == "function") {
                        cb_function = cb;
                        cb();
                    }
                }
                else {
                    alert("无此操作权限");
                }
            });
    }

    function change_page(value) {
        table_data.page_input.value = value > Number(table_data.total_pages.textContent) ? Number(table_data.total_pages.textContent) : (value < 1 ? 1 : value);
        Object.assign(table_data.post_data, { page: Number(table_data.page_input.value) });
        fetch_table(cb_function);
    }

    function button_change(input, first, pre, aft, last, pages) {
        if (input.value <= 1) {
            input.value = 1;
            first.disabled = true;
            pre.disabled = true;
        }
        else {
            first.disabled = false;
            pre.disabled = false;
        }

        if (input.value >= pages) {
            input.value = pages;
            last.disabled = true;
            aft.disabled = true;
        }
        else {
            last.disabled = false;
            aft.disabled = false;
        }
    }

    //表格列宽调整
    function table_resize() {
        var tTD; //用来存储当前更改宽度的Table Cell,避免快速移动鼠标的问题
        var table = document.querySelector(container + ' table');
        for (let j = 0; j < table.rows[0].cells.length; j++) {
            table.rows[0].cells[j].onmousedown = function (event) {
                //记录单元格
                tTD = this;
                if (event.offsetX > tTD.offsetWidth - 10) {
                    tTD.mouseDown = true;
                    tTD.oldX = event.x;
                    tTD.oldWidth = tTD.offsetWidth;
                }
                //记录Table宽度
                //table = tTD; while (table.tagName != ‘TABLE') table = table.parentElement;
                //tTD.tableWidth = table.offsetWidth;
            };

            table.rows[0].cells[j].onmouseup = function (event) {
                //结束宽度调整
                if (tTD == undefined) tTD = this;
                tTD.mouseDown = false;
                tTD.style.cursor = 'pointer';

                //防止触发排序操作
                setTimeout(() => {
                    resize = false;
                }, 100);
            };

            table.rows[0].cells[j].onmousemove = function (event) {
                //更改鼠标样式
                if (event.offsetX > this.offsetWidth - 10)
                    this.style.cursor = 'col-resize';
                else
                    this.style.cursor = 'pointer';
                //取出暂存的Table Cell
                if (tTD == undefined) tTD = this;
                //调整宽度
                if (tTD.mouseDown != null && tTD.mouseDown == true) {
                    tTD.style.cursor = 'pointer';
                    if (tTD.oldWidth + (event.x - tTD.oldX) > 0)
                        tTD.width = tTD.oldWidth + (event.x - tTD.oldX);
                    //调整列宽
                    tTD.style.width = tTD.width;
                    tTD.style.cursor = 'col-resize';
                    //调整该列中的每个Cell
                    table = tTD;
                    while (table.tagName != 'TABLE') table = table.parentElement;
                    for (j = 0; j < table.rows.length; j++) {
                        table.rows[j].cells[tTD.cellIndex].width = tTD.width;
                    }
                    //调整整个表
                    //table.width = tTD.tableWidth + (tTD.offsetWidth – tTD.oldWidth);
                    //table.style.width = table.width;

                    //防止触发排序
                    resize = true;
                }
            };
        }
    }

    let get_data = function () {
        return table_data;
    }

    return {
        table_data: get_data,
        table_init: table_init,
        fetch_table: fetch_table,
    };
}();