let page_userset = function () {
    //设置密码
    document.querySelector('#pass-button').addEventListener('click', function (event) {
        event.preventDefault();
        var old_pass = document.querySelector('#old-pass').value.trim();
        var new_pass = document.querySelector('#new-pass').value.trim();
        var confirm_pass = document.querySelector('#confirm-pass').value.trim();

        if (old_pass == "" || new_pass == "" || confirm_pass == "") {
            notifier.show('密码不能为空', 'danger');
            return false;
        }

        if (new_pass != confirm_pass) {
            notifier.show('两次密码输入不一致', 'danger');
            return false;
        }
        var password = {
            old_pass: old_pass,
            new_pass: new_pass
        }

        fetch(`/change_pass`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(password),
        })
            .then(res => res.json())
            .then(data => {
                if (data != 0) {
                    notifier.show('密码修改成功', 'success');
                }
                else {
                    notifier.show('原密码输入有误', 'danger');
                }
            });
    });   
}();