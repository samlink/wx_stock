; (function (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    exports['notifier'] = factory();
  } else {
    root['notifier'] = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  var count = 0;
  var d = document;

  var myCreateElement = function (elem, attrs) {
    var el = d.createElement(elem);
    for (var prop in attrs) {
      el.setAttribute(prop, attrs[prop]);
    }
    return el;
  };

  var createContainer = function () {
    var container = myCreateElement('div', { class: 'notifier-container', id: 'notifier-container' });
    d.body.appendChild(container);
  };

  var show = function (msg, type, timeout = 3000) {

    var ntfId = 'notifier-' + count;

    var container = d.querySelector('.notifier-container'),
      ntf = myCreateElement('div', { class: 'notifier ' + type }),
      ntfBody = myCreateElement('div', { class: 'notifier-body' }),
      ntfClose = myCreateElement('button', { class: 'notifier-close', type: 'button' });

    ntfBody.innerHTML = msg;
    ntfClose.innerHTML = '&times;';

    ntf.appendChild(ntfClose);
    ntf.appendChild(ntfBody);

    container.appendChild(ntf);

    setTimeout(function () {
      ntf.className += ' shown';
      ntf.setAttribute('id', ntfId);
    }, 100);

    if (timeout > 0) {
      setTimeout(function () {
        hide(ntfId);
      }, timeout);
    }

    ntfClose.addEventListener('click', function () {
      hide(ntfId);
    });

    count += 1;

    return ntfId;
  };

  var hide = function (notificationId) {

    var notification = document.getElementById(notificationId);

    if (notification) {

      notification.className = notification.className.replace(' shown', '');

      setTimeout(function () {
        notification.parentNode.removeChild(notification);
      }, 600);

      return true;

    } else {
      return false;
    }
  };

  createContainer();

  return {
    show: show,
    hide: hide
  };
}));
