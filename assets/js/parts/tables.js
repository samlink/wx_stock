var data_table = function () {
    var data;
    return {
        data: data,
        init: function (table) {
            Object.assign(table, {
                header: document.querySelector(table.container + ' thead tr'),                 //排序可选,若不需要排序功能,则去掉此属性
                body: document.querySelector(table.container + ' tbody'),
                page_input: document.querySelector(table.container + ' #page-input'),
                page_first: document.querySelector(table.container + ' #first'),
                page_pre: document.querySelector(table.container + ' #pre'),
                page_aft: document.querySelector(table.container + ' #aft'),
                page_last: document.querySelector(table.container + ' #last'),
                total_pages: document.querySelector(table.container + ' #pages'),
                total_records: document.querySelector(table.container + ' #total-records'),
            });

            table.page_input.value = 1;
            table.page_first.disabled = true;
            table.page_pre.disabled = true;
            table.post_data.page = 1;

            data = table;

            table.page_pre.addEventListener('click', (e) => {
                if (!data_table.data.edit) {
                    table.page_input.value--;
                    change_page(table.page_input.value);
                }
            });

            table.page_aft.addEventListener('click', (e) => {
                if (!data_table.data.edit) {
                    table.page_input.value++;
                    change_page(table.page_input.value);
                }
            });

            table.page_first.addEventListener('click', (e) => {
                if (!data_table.data.edit) {
                    change_page(1);
                }
            });

            table.page_last.addEventListener('click', (e) => {
                if (!data_table.data.edit) {
                    change_page(table.total_pages.textContent);
                }
            });

            table.page_input.addEventListener('change', function () {
                if (!data_table.data.edit) {
                    change_page(table.page_input.value);
                }
            });

            if (table.header) {
                for (let th of table.header.children) {
                    th.addEventListener('click', function (e) {
                        if (!data_table.data.edit) {
                            for (let t of table.header.children) {
                                t.textContent = t.textContent.split(' ')[0];
                            }

                            let order = table.post_data.sort.indexOf('ASC') !== -1 ? 'DESC' : 'ASC';
                            let arrow = table.post_data.sort.indexOf('ASC') !== -1 ? '▼' : '▲';
                            let sort = table.header_names[this.textContent] + " " + order;
                            this.textContent = this.textContent + " " + arrow;

                            Object.assign(table.post_data, { page: 1, sort: sort });
                            table.page_input.value = 1;

                            data_table.fetch_table(table.post_data);
                        }
                    })
                }
            }
        },

        fetch_table: function (post_data) {
            fetch(data.url, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(post_data),
            })
                .then(response => response.json())
                .then(content => {
                    if (content != -1) {
                        let rows = "";
                        let count = 0;
                        for (let tr of content[0]) {
                            rows += data.row_fn(tr);
                            count++;
                        }

                        for (let i = 0; i < post_data.rec - count; i++) {
                            rows += data.blank_row_fn();
                        }

                        data.body.innerHTML = rows;
                        data.total_records.textContent = content[1];
                        data.total_pages.textContent = content[2];

                        button_change(data.page_input, data.page_first, data.page_pre, data.page_aft, data.page_last, content[2]);

                        for (let tr of data.body.children) {
                            tr.addEventListener('click', function (e) {
                                if (!data_table.data.edit) {
                                    for (let r of data.body.children) {
                                        r.classList.remove('focus');
                                    }
                                    this.classList.add('focus');

                                    data.row_click(tr);
                                }
                            });
                        }

                        //若表中有链接, 去除链接的点击冒泡事件
                        let links = data.body.querySelectorAll('a');
                        if (links.length > 0) {
                            for (let l of links) {
                                l.addEventListener('click', function (e) {
                                    e.stopPropagation();
                                });
                            }
                        }
                    }
                    else {
                        alert("无次操作权限");
                    }
                });
        }
    }

    function change_page(value) {
        data.page_input.value = value > Number(data.total_pages.textContent) ? Number(data.total_pages.textContent) : (value < 1 ? 1 : value);
        Object.assign(data.post_data, { page: Number(data.page_input.value) });
        data_table.fetch_table(data.post_data);
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
}();


