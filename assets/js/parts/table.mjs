
export var table_data = {};

export var table_init = function (data) {
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
    });

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
                if (!table_data.edit) {
                    for (let t of table_data.header.children) {
                        t.textContent = t.textContent.split(' ')[0];
                    }

                    let order = table_data.post_data.sort.indexOf('ASC') !== -1 ? 'DESC' : 'ASC';
                    let arrow = table_data.post_data.sort.indexOf('ASC') !== -1 ? '▼' : '▲';
                    let sort = table_data.header_names[this.textContent] + " " + order;
                    this.textContent = this.textContent + " " + arrow;

                    Object.assign(table_data.post_data, { page: 1, sort: sort });
                    table_data.page_input.value = 1;

                    fetch_table();
                }
            })
        }
    }
}

export var fetch_table = function (cb) {
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

                button_change(table_data.page_input, table_data.page_first, table_data.page_pre, table_data.page_aft, table_data.page_last, content[2]);

                for (let tr of table_data.body.children) {
                    tr.addEventListener('click', function (e) {
                        if (!table_data.edit) {
                            for (let r of table_data.body.children) {
                                r.classList.remove('focus');
                            }
                            this.classList.add('focus');

                            if (table_data.row_click == "function") {
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

                if (typeof cb == "function") {
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
    fetch_table();
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

