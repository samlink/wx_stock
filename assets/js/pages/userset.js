let page_userset = function () {
    const lang = localStorage.getItem('language') || 'zh';

    if (lang != 'zh') {
        document.querySelector('.title span').textContent = 'Change Password';
        document.querySelector('#old').textContent = 'Original Password';
        document.querySelector('#new').textContent = 'New Password';
        document.querySelector('#confirm').textContent = 'Confirm Password';
        document.querySelector('#pass-button').textContent = 'Submit';
    }

    //设置密码
    document.querySelector('#pass-button').addEventListener('click', function (event) {
        event.preventDefault();
        var old_pass = document.querySelector('#old-pass').value.trim();
        var new_pass = document.querySelector('#new-pass').value.trim();
        var confirm_pass = document.querySelector('#confirm-pass').value.trim();

        if (old_pass == "" || new_pass == "" || confirm_pass == "") {
            notifier.show(lang == 'zh' ? '密码不能为空' : 'Password can not be empty', 'danger');
            return false;
        }

        if (new_pass != confirm_pass) {
            notifier.show(lang == 'zh' ? '两次密码输入不一致' : 'The two passwords do not match', 'danger');
            return false;
        }
        var password = {
            old_pass: old_pass,
            new_pass: new_pass
        }

        fetch(`/stock/change_pass`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(password),
        })
            .then(res => res.json())
            .then(data => {
                if (data != 0) {
                    notifier.show(lang == 'zh' ? '密码修改成功' : 'Password has been successfully changed', 'success');
                }
                else {
                    notifier.show(lang == 'zh' ? '原密码输入有误' : 'The original password entered is incorrect', 'danger');
                }
            });
    });
}();