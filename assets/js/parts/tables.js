function table_control(table) {
    table.page_input.value = 1;
    table.page_first.disabled = true;
    table.page_pre.disabled = true;

    change_page(1);

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

                let seazon = table.selectSeazon ? table.selectSeazon.options[table.selectSeazon.selectedIndex].value : '0';

                let data = {
                    stock: table.selectFocus.options[table.selectFocus.selectedIndex].value.substring(0, 1),
                    cate: 1,
                    seazon: seazon,
                    page: 1,
                    sort: table.sort_name,
                }

                focus_search(data);
            })
        }
    }

    function focus_search(data) {
        fetch(table.data_url, {
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
                        //从表可选功能
                        if (table.sub_body) {
                            fetch(table.sub_url, {
                                method: 'post',
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ code: this.cells[0].firstChild.innerHTML }),
                            })
                                .then(response => response.json())
                                .then(content => {
                                    table.sub_info.textContent = this.cells[0].firstChild.innerHTML + " - " + this.cells[1].textContent + "：";
                                    rows = table.sub_fn(content);
                                    table.sub_body.innerHTML = rows;
                                })
                        }

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
        let seazon = table.selectSeazon ? table.selectSeazon.options[table.selectSeazon.selectedIndex].value : '0';

        let data = {
            stock: table.selectFocus.options[table.selectFocus.selectedIndex].value.substring(0, 1),
            cate: 1,
            seazon: seazon,
            page: Number(value),
            sort: table.sort_name,
        }

        focus_search(data);
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

    function auto_change(cate) {
        table.page_input.value = 1;

        let search = {
            stock: table.auto_input.value.split('　')[0],
            cate: cate,
            seazon: '0',
            page: 1,
            sort: table.sort_name,
        }

        focus_search(search);
    }

    autocomplete(table.auto_input, table.auto_url, function () {
        auto_change(2);
    });

    table.auto_button.addEventListener('click', function () {
        auto_change(1);
    });

    table.selectFocus.addEventListener('change', (e) => {
        change_page(1);
    });

    if (table.selectSeazon) {
        table.selectSeazon.addEventListener('change', (e) => {
            change_page(1);
        });
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
}
