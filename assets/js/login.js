(function () {
  var login_show = document.querySelector('#login-form');
  var logon_show = document.querySelector('#logon-form');
  var login = document.querySelector('#login');
  var logon = document.querySelector('#logon');

  //点击用户登录
  document.querySelector('#login a').addEventListener('click', function (e) {
    e.preventDefault();
    login_show.style.display = 'block';
    logon_show.style.display = 'none';
    login.style.display = 'none';
    logon.style.display = 'block';
    var input = login_show.querySelectorAll('input');
    input[0].focus();
  });

  // 点击注册新用户
  document.querySelector('#logon a').addEventListener('click', function (e) {
    e.preventDefault();
    logon_show.style.display = 'block';
    login_show.style.display = 'none';
    login.style.display = 'block';
    logon.style.display = 'none';
    var input = logon_show.querySelectorAll('input');
    input[0].focus();
  });

  //注册
  document.querySelector('#logon-button').addEventListener('click', function (evnet) {
    event.preventDefault();

    var logon_pass = document.querySelector('#logon-pass').value.trim();
    var logon_pass2 = document.querySelector('#logon-pass2').value.trim();
    var name = document.querySelector('#logon-name').value.trim();

    if (name == "" || logon_pass == "" || logon_pass2 == "") {
      notifier.show('用户名或密码不能为空', 'danger');
      return false;
    }

    if (logon_pass != logon_pass2) {
      notifier.show('两次输入的密码不同', 'danger');
      return false;
    }
    var user = {
      name: name,
      password: logon_pass
    }

    fetch('/logon', {
      method: 'post',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then(res => res.json())
      .then(data => {
        if (data != 0) {
          // localStorage.setItem('knowledge-user', data);
          window.location = "/";
        }
        else {
          notifier.show('该用户名已存在', 'danger');
        }
      });
  });

  //登录
  document.querySelector('#login-button').addEventListener('click', function (evnet) {
    event.preventDefault();
    var name = document.querySelector('#login-name').value.trim();
    var login_pass = document.querySelector('#login-pass').value.trim();

    if (name == "" || login_pass == "") {
      notifier.show('用户名或密码不能为空', 'danger');
      return false;
    }

    var user = {
      name: name,
      password: login_pass
    }

    let MAX_FAILED = 6;

    fetch('/login', {
      method: 'post',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then(res => res.json())
      .then(data => {
        if (data == -1) {
          notifier.show('该用户不存在', 'danger');
        }
        else if (data != 0 && data < MAX_FAILED) {
          notifier.show('密码错误', 'danger');
          setTimeout(() => notifier.show('还有 ' + data + ' 次机会', 'warning'), 500);
        }
        else if (data == 0 || data == MAX_FAILED) {
          notifier.show('该用户已被锁定保护', 'danger');
        }
        else {
          let remeber = document.querySelector('#remember-me').checked;
          if (remeber) localStorage.setItem('stock-user', data);
          window.location = "/";
        }
      });
  });

  //找回密码
  document.querySelector('#forget-pass').addEventListener('click', function () {
    let name = document.querySelector('#login-name').value.trim();
    if (name == "") {
      notifier.show('用户名不能为空', 'danger');
      return false;
    }

    let MAX_PASS = 6;

    var user = {
      name: name,
      password: ""
    }

    fetch('/forget_pass', {
      method: 'post',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then(res => res.json())
      .then(data => {
        if (data == -1) {
          notifier.show('此用户不存在', 'danger');
        }
        else if (data == -2) {
          notifier.show('用户没有预留手机号', 'danger');
        }
        else if (data == -3) {
          notifier.show('找回密码限次已用完', 'danger');
        }
        else {
          notifier.show('新密码已发送至预留手机号', 'success');
          setTimeout(() => notifier.show('还有 ' + data + ' 次找回密码的机会', 'info'), 500);
        }
      });
  });
})();