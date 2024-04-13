// import { SPLITER, getLeft, getTop } from '../parts/tools.mjs';

class AutoInput {
    constructor(input, cate, url, cb, width) {
        this.input = input;
        this.cate = cate;
        this.url = url;
        this.cb = cb;
        this.space = 400;
        this.width = width    //自定义的宽度, 如 200
    }

    init() {
        var currentFocus;
        var input = this.input;
        var cb = this.cb;
        var width = this.width;

        input.addEventListener("input", () => {
            var a, b, i;
            var val = input.value;
            var space = this.space;

            closeAllLists();
            if (!val) {
                return false;
            }

            currentFocus = -1;
            var get_url;
            if (this.cate == "") {
                get_url = `${this.url}?s=${val}`;
            } else if (typeof (this.cate) == "string") {
                get_url = `${this.url}?s=${val}&cate=${this.cate}`;
            } else {
                get_url = `${this.url}?s=${val}&cate=${this.cate.textContent ? this.cate.textContent : this.cate.value}`;
            }

            fetch(get_url)
                .then(response => response.json())
                .then(function (arr) {
                    if (arr != -1 && arr.length > 0) {
                        a = document.createElement("DIV");
                        a.setAttribute("id", "autocomplete-list");
                        a.setAttribute("class", "autocomplete-items");
                        input.parentNode.appendChild(a);
                        let top = getTop(input, document.querySelector('body')) + 30;  // 加行高
                        let left = getLeft(input, document.querySelector('body'));
                        let au_width = width ? width : input.clientWidth;
                        a.style.cssText = `position:fixed; top: ${top}px; left: ${left}px; width: ${au_width}px;`;

                        for (i = 0; i < arr.length; i++) {
                            b = document.createElement("DIV");
                            b.innerHTML = arr[i].label;
                            b.innerHTML += "<input type='hidden' id='" + arr[i].id + "' value='" + arr[i].label + "'>";
                            b.addEventListener("click", function (e) {
                                e.stopPropagation();
                                input.value = this.querySelector('input').value;
                                input.setAttribute('data', this.querySelector('input').getAttribute('id'));
                                closeAllLists();
                                if (cb && typeof (cb) == "function") {
                                    cb();  //这里加入其他控件的处理函数
                                }
                            });

                            a.appendChild(b);
                            // 宽度自适应
                            b.style.width = au_width * 0.93 + "px";
                        }

                        if (a.clientHeight > space) {
                            a.style.top = -(a.clientHeight - space + 30) + "px";
                            a.style.left = "120px";
                            a.style.borderTop = "1px solid #9acffa"
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
                    } else {
                        x[0].click();
                    }
                } else if (e.key == 'Escape') {
                    closeAllLists();
                } else if (e.key == 'Tab') {
                    e.preventDefault();
                    if (currentFocus > -1) {
                        x[currentFocus].click();     //模拟 click 操作
                    } else {
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
}

///thead 是对象数组，其格式：[{ name: "名称", width: 140 }，……];
///cb 是回调函数
///cf 是前置函数, 应返回一个联合查询字符串
function auto_table(input, cate, url, thead, cb, cf) {
    var currentFocus;
    input.addEventListener("input", function (e) {
        var a, b, i;
        var val = this.value;

        closeAllLists();
        if (!val) {
            return false;
        }

        currentFocus = -1;
        let get_url;
        if (cate != "") {
            let c = typeof (cate) == "string" ? cate : cate.textContent;
            get_url = `${url}?s=${val}&cate=${c}`;
        } else {
            get_url = `${url}?s=${val}`;
        }

        //调用前置函数
        if (typeof (cf) == "function") {
            get_url += `&ss=${cf()}`;
        }

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

                    for (let i = 0; i < thead.length; i++) {
                        ths += `<th width=${thead[i].width}>${thead[i].name}</th>`;
                    }

                    document.querySelector('.table-auto thead tr').innerHTML = ths;
                    let tbody = document.querySelector('.table-auto tbody');

                    for (i = 0; i < arr.length; i++) {
                        let items = arr[i].label.split(SPLITER);
                        let tr = document.createElement("tr");
                        tr.setAttribute("data", `${arr[i].id}${SPLITER}${arr[i].label}`);
                        let row = "";
                        for (let i = 0; i < items.length; i++) {
                            row += `<td width=${thead[i].width}>${items[i]}</td>`;
                        }
                        tr.innerHTML = row;

                        tr.addEventListener("click", function (e) {
                            // e.preventDefault();
                            e.stopPropagation();
                            input.value = this.querySelector('td:nth-child(1)').textContent;
                            input.setAttribute('data', this.getAttribute("data"));
                            closeAllLists();
                            if (cb && typeof (cb) == "function") {
                                cb();  //这里加入其他控件的处理函数
                            }
                            //这里加入其他控件的处理函数
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
                } else {
                    x[0].click();
                }
            } else if (e.key == 'Escape') {
                closeAllLists();
            } else if (e.key == 'Tab') {
                e.preventDefault();
                if (currentFocus > -1) {
                    x[currentFocus].click();     //模拟 click 操作
                } else {
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
