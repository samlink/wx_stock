import { SPLITER } from '../parts/tools.mjs';

export var cate_element = {};

/// input: 输入元素；cate: 类别元素，url: 数据地址；cb: 回调函数
export function autocomplete(input, cate, url, cb) {
    var currentFocus;
    cate_element.cate = cate;
    input.addEventListener("input", function (e) {
        var a, b, i;
        var val = this.value;

        closeAllLists();
        if (!val) { return false; }

        currentFocus = -1;
        var get_url = cate_element.cate == "" ? `${url}?s=${val}` : `${url}?s=${val}&cate=${cate_element.cate.textContent}`;

        fetch(get_url)
            .then(response => response.json())
            .then(function (arr) {
                if (arr != -1 && arr.length > 0) {
                    a = document.createElement("DIV");
                    a.setAttribute("id", "autocomplete-list");
                    a.setAttribute("class", "autocomplete-items");
                    input.parentNode.appendChild(a);

                    for (i = 0; i < arr.length; i++) {
                        b = document.createElement("DIV");
                        b.innerHTML = arr[i].label;
                        b.innerHTML += "<input type='hidden' id='" + arr[i].id + "' value='" + arr[i].label + "'>";
                        b.addEventListener("click", function (e) {
                            input.value = this.querySelector('input').value;
                            input.setAttribute('data', this.querySelector('input').getAttribute('id'));
                            closeAllLists();
                            cb();       //这里加入其他控件的处理函数
                        });

                        a.appendChild(b);
                    }
                }
            })
    });

    input.addEventListener("keydown", function (e) {
        var x = document.querySelectorAll("#autocomplete-list div");
        if (x.length > 0) {
            if (e.key == 'ArrowDown') {
                currentFocus++;
                addActive(x);
            } else if (e.key == 'ArrowUp') {
                currentFocus--;
                addActive(x);
            } else if (e.key == 'Enter') {
                e.preventDefault();
                if (currentFocus > -1) {
                    x[currentFocus].click();
                }
                else {
                    x[0].click();
                }
            } else if (e.key == 'Escape') {
                closeAllLists();
            } else if (e.key == 'Tab') {
                e.preventDefault();
                if (currentFocus > -1) {
                    x[currentFocus].click();     //模拟 click 操作
                }
                else {
                    x[0].click();
                }
            }
        }
    });

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        //循环选择
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        var x = document.querySelector(".autocomplete-items");
        if (x && elmnt != x && elmnt != input) {
            x.parentNode.removeChild(x);
        }
    }
}

//thead 是对象数组，其格式：[{ name: "名称", width: 140 }，……];
export function auto_table(input, cate, url, thead, cb) {
    var currentFocus;
    input.addEventListener("input", function (e) {
        var a, b, i;
        var val = this.value;

        closeAllLists();
        if (!val) { return false; }

        currentFocus = -1;
        var get_url = cate == "" ? `${url}?s=${val}` : `${url}?s=${val}&cate=${cate.textContent}`;

        fetch(get_url)
            .then(response => response.json())
            .then(function (arr) {
                if (arr != -1 && arr.length > 0) {
                    a = document.createElement("DIV");
                    a.setAttribute("id", "autocomplete-list");
                    a.setAttribute("class", "autocomplete-items table-auto");
                    a.innerHTML = `<table><thead><tr></tr></thead><tbody></tbody></table>`;
                    input.parentNode.appendChild(a);

                    let ths = "";

                    for (let th of thead) {
                        ths += `<th width=${th.width}>${th.name}</th>`;
                    }

                    document.querySelector('.table-auto thead tr').innerHTML = ths;
                    let tbody = document.querySelector('.table-auto tbody');

                    for (i = 0; i < arr.length; i++) {
                        let items = arr[i].label.split(SPLITER);
                        let tr = document.createElement("tr");
                        tr.setAttribute("data", `${arr[i].id}${SPLITER}${arr[i].label}`);

                        let row = "";
                        for (let item of items) {
                            row += `<td>${item}</td>`;
                        }
                        tr.innerHTML = row;

                        tr.addEventListener("click", function (e) {
                            input.value = this.querySelector('td:nth-child(1)').textContent;
                            input.setAttribute('data', this.getAttribute("data"));
                            closeAllLists();
                            cb();       //这里加入其他控件的处理函数
                        });

                        tbody.appendChild(tr);
                    }
                }
            })
    });

    input.addEventListener("keydown", function (e) {
        var x = document.querySelectorAll("#autocomplete-list tbody tr");
        if (x.length > 0) {
            if (e.key == 'ArrowDown') {
                currentFocus++;
                addActive(x);
            } else if (e.key == 'ArrowUp') {
                currentFocus--;
                addActive(x);
            } else if (e.key == 'Enter') {
                e.preventDefault();
                if (currentFocus > -1) {
                    x[currentFocus].click();
                }
                else {
                    x[0].click();
                }
            } else if (e.key == 'Escape') {
                closeAllLists();
            } else if (e.key == 'Tab') {
                e.preventDefault();
                if (currentFocus > -1) {
                    x[currentFocus].click();     //模拟 click 操作
                }
                else {
                    x[0].click();
                }
            }
        }
    });

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        //循环选择
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        var x = document.querySelector(".autocomplete-items");
        if (x && elmnt != x && elmnt != input) {
            x.parentNode.removeChild(x);
        }
    }
}
