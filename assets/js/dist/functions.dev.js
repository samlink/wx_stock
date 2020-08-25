"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var re_real = /^\d+(\.\d+)?$/;
var re_date = /^((?:19|20)\d\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;

Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1,
    // 月份
    "d+": this.getDate(),
    // 日
    "h+": this.getHours(),
    // 小时
    "m+": this.getMinutes(),
    // 分
    "s+": this.getSeconds(),
    // 秒
    "q+": Math.floor((this.getMonth() + 3) / 3),
    // 季度
    "S": this.getMilliseconds() // 毫秒

  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, this.getFullYear() + "");

  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
  }

  return fmt;
};

function home_tip() {
  fetch('/home_tip').then(function (res) {
    return res.json();
  }).then(function (data) {
    document.querySelector('#hold-tip').textContent = "持股加仓：" + data[0];
    document.querySelector('#anual-tip').textContent = "年报发布：" + data[1];
    document.querySelector('#home-words').textContent = data[2];

    if (data[0] > 0) {
      document.querySelector('#hold-tip').classList.add('blink');
    }

    if (data[1] > 0) {
      document.querySelector('#anual-tip').classList.add('blink');
    }
  });
} //获取用户


function fetch_data() {
  var fn = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
  var stored_name = localStorage.getItem('stock-user');

  if (!stored_name) {
    stored_name = "0";
  }

  var user = {
    id: stored_name
  };
  fetch('/get_user', {
    method: 'post',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(user)
  }).then(function (res) {
    return res.json();
  }).then(function (user) {
    if (user.name != "") {
      document.querySelector('#login1').innerHTML = user.name;
      document.querySelector('#login2').innerHTML = "退出";
    } else {
      document.querySelector('#login-form').style.display = 'block';
    }

    if (user.theme == "") {
      user.theme = "theme-dark";
    }

    fn();
    change_themes(user.theme);
  });
} //点击表格行，高亮显示 


function click_choose(tbody) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = tbody.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var tr = _step.value;
      tr.addEventListener('click', function (e) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = tbody.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var r = _step2.value;
            r.classList.remove('focus');
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        this.classList.add('focus');
      });
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}
/* 确认对话框
 * roar - v1.0.5 - 2018-05-25
 * https://getbutterfly.com/roarjs-vanilla-javascript-alert-confirm-replacement/
 * Copyright (c) 2018 Ciprian Popescu
 * Licensed GPLv3
 */


function alert_confirm(message, optionsA) {
  var options = {
    cancel: true,
    confirmText: "确认",
    cancelText: "取消",
    cancelCallBack: function cancelCallBack() {},
    confirmCallBack: function confirmCallBack() {}
  };

  if (_typeof(optionsA) === 'object') {
    Object.assign(options, optionsA);
  }

  var element = document.querySelector('#roar-alert');
  var old_cancelElement = document.querySelector('.roar-alert-message-button-cancel');
  var old_confirmElement = document.querySelector('.roar-alert-message-button-confirm');
  var cancelElement = old_cancelElement.cloneNode(true);
  var confirmElement = old_confirmElement.cloneNode(true);
  old_cancelElement.parentNode.replaceChild(cancelElement, old_cancelElement);
  old_confirmElement.parentNode.replaceChild(confirmElement, old_confirmElement);

  if (!options.cancel) {
    cancelElement.style.display = 'none';
  } else {
    cancelElement.innerHTML = options.cancelText;
    cancelElement.addEventListener('click', function () {
      options.cancelCallBack();
      element.style.display = "none";
    });
  }

  confirmElement.innerHTML = options.confirmText;
  confirmElement.addEventListener('click', function () {
    options.confirmCallBack();
    element.style.display = "none";
  });
  document.querySelector('.roar-alert-message-content').innerHTML = message;
  element.style.display = "block";
} //用户设置


function user_set() {
  //设置密码
  document.querySelector('#pass-button').addEventListener('click', function (evnet) {
    event.preventDefault();
    var old_pass = document.querySelector('#old-pass').value.trim();
    var new_pass = document.querySelector('#new-pass').value.trim();
    var confirm_pass = document.querySelector('#confirm-pass').value.trim();

    if (old_pass == "" || new_pass == "" || confirm_pass == "") {
      notifier.show('密码不能为空', 'danger');
      return false;
    }

    if (new_pass != confirm_pass) {
      notifier.show('新密码与确认密码不一致', 'danger');
      return false;
    }

    var password = {
      old_pass: old_pass,
      new_pass: new_pass
    };
    fetch('/change_pass', {
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(password)
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      if (data != 0) {
        notifier.show('密码修改成功', 'success');
      } else {
        notifier.show('原密码输入有误', 'danger');
      }
    });
  }); //设置手机

  document.querySelector('#phone-button').addEventListener('click', function (evnet) {
    event.preventDefault();
    var phone_number = document.querySelector('#phonenumber').value.trim();

    if (phone_number != "" && !phone_number.match(/^(13[0-9]|14[579]|15[0-3,5-9]|16[6]|17[0135678]|18[0-9]|19[89])\d{8}$/)) {
      notifier.show('手机号不合法', 'danger');
      return false;
    }

    var phone = {
      phone_number: phone_number
    };
    fetch('/phone_number', {
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(phone)
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      notifier.show('手机号设置成功', 'success');
    });
  }); //设置主题

  var themes = document.querySelectorAll('.themes');
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = themes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var theme = _step3.value;
      theme.addEventListener('click', function () {
        var _this = this;

        var theme_name = {
          name: this.dataset.theme
        };
        fetch('/change_theme', {
          method: 'post',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(theme_name)
        }).then(function (res) {
          return res.json();
        }).then(function (data) {
          change_themes(_this.dataset.theme);
          notifier.show('主题设置成功', 'success');
        });
      });
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
        _iterator3["return"]();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }
}

function change_themes(theme) {
  var app_themes = {
    light: {
      logo: 'logo.png',
      book: 'main.png'
    },
    pink: {
      logo: 'logo4.png',
      book: 'pink2.png'
    },
    orange: {
      logo: 'logo1.png',
      book: 'blue.png'
    },
    red: {
      logo: 'logo3.png',
      book: 'red2.png'
    },
    green: {
      logo: 'logo1.png',
      book: 'main.png'
    },
    blue: {
      logo: 'logo1.png',
      book: 'main.png'
    },
    dark: {
      logo: 'logo.png',
      book: 'main.png'
    }
  };
  document.body.removeAttribute('class');
  document.body.classList.add(theme);
  var name = theme.split('-')[1];
  document.querySelector('#logo img').setAttribute('src', '/assets/img/' + app_themes[name].logo);
  document.styleSheets[0].insertRule('.caret::before {content: url("/assets/img/close-' + app_themes[name].book + '")}', document.styleSheets[0].cssRules.length);
  document.styleSheets[0].insertRule('.caret-down::before {content: url("/assets/img/open-' + app_themes[name].book + '")}', document.styleSheets[0].cssRules.length);
  var menu = document.querySelector('#menu-bar img');
  var search = document.querySelector('#phone-query img');

  if (theme == "theme-light") {
    menu.setAttribute('src', '/assets/img/menu-1.png');
    search.setAttribute('src', '/assets/img/search-1.png');
  } else {
    menu.setAttribute('src', '/assets/img/menu-2.png');
    search.setAttribute('src', '/assets/img/search-2.png');
  }
} // //匹配手机屏幕
// function match_screen() {
//     var screen = window.matchMedia('(max-width:980px)');
//     if (screen.matches) {
//     }
// }