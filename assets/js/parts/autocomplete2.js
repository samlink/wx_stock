var autoInput = function () {
    var cate_element,

    return {
        cate: cate_element,
        init: function (input, cate, url, cb) {
            var currentFocus;
            cate_element = cate;
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
    }
}();
export var cate_element = {};

/// input: 输入元素；cate: 类别元素，url: 数据地址；cb: 回调函数
export function autocomplete(input, cate, url, cb) {

}