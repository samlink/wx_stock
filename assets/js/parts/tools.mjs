export var regReal = /^\d+(\.\d+)?$/;
export var regDate = /^((?:19|20)\d\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;

export function getHeight() {
    let header = document.querySelector('.header');
    let footer = document.querySelector('footer');
    let title = document.querySelector('.top-title');

    let content_height = document.body.clientHeight - header.clientHeight - footer.clientHeight - title.clientHeight;

    var sum = 0;
    for (let i = 0; i < arguments.length; i++) {
        sum += arguments[i];
    }
    return content_height - sum;
}
