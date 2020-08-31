function table_control(table) {
    table.page_input.value = 1;
    table.page_first.disabled = true;
    table.page_pre.disabled = true;

    fetch_show(table.post_data);

    if (table.header) {
        for (let th of table.header.children) {
            th.addEventListener('click', function (e) {

                for (let t of table.header.children) {
                    t.textContent = t.textContent.split(' ')[0];
                }

                let order = table.sort_name.indexOf('ASC') !== -1 ? 'DESC' : 'ASC';
                let arrow = table.sort_name.indexOf('ASC') !== -1 ? '▼' : '▲';
                table.sort_name = table.header_names[this.textContent] + " " + order;
                this.textContent = this.textContent + " " + arrow;

                Object.assign(table, { post_data: { page: 1, sort: table.sort_name } });

                fetch_show(table.post_data);
            })
        }
    }

    table.page_pre.addEventListener('click', (e) => {
        table.page_input.value--;
        change_page(table.page_input.value);
    });

    table.page_aft.addEventListener('click', (e) => {
        table.page_input.value++;
        change_page(table.page_input.value);
    });

    table.page_first.addEventListener('click', (e) => {
        change_page(1);
    });

    table.page_last.addEventListener('click', (e) => {
        change_page(table.total_pages.textContent);
    });

    table.page_input.addEventListener('change', function () {
        change_page(table.page_input.value);
    });

    function fetch_show(data) {
        fetch(table.url, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(content => {
                let rows = "";
                for (let tr of content[0]) {
                    rows += table.row_fn(tr);
                }

                table.body.innerHTML = rows;
                table.total_pages.textContent = content[2];

                button_change(table.page_input, table.page_first, table.page_pre, table.page_aft, table.page_last, content[2]);

                for (let tr of table.body.children) {
                    tr.addEventListener('click', function (e) {
                        for (let r of table.body.children) {
                            r.classList.remove('focus');
                        }
                        this.classList.add('focus');
                    });
                }

                //若表中有链接, 去除链接的点击冒泡事件
                let links = table.body.querySelectorAll('a');
                if (links.length > 0) {
                    for (let l of links) {
                        l.addEventListener('click', function (e) {
                            e.stopPropagation();
                        });
                    }
                }
            });
    }

    function change_page(value) {
        table.page_input.value = value;
        Object.assign(table, { post_data: { page: Number(value), sort: table.sort_name } });
        fetch_show(table.post_data);
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

}
