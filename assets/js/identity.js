var USER_NAME;

(function () {
    var stored_user = localStorage.getItem('sales-user');
    if (stored_user) {
        let user = {
            id: stored_user
        }

        fetch('/get_user', {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        })
            .then(res => res.json())
            .then(user => {
                if (user.name != "") {
                    USER_NAME = user.name;
                    // window.location = "/";
                }
                else {
                    window.location = "/login";
                }
            });
    }
})();

