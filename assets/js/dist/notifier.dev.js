"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

;

(function (root, factory) {
  if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && (typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object') {
    exports['notifier'] = factory();
  } else {
    root['notifier'] = factory();
  }
})(typeof self !== 'undefined' ? self : void 0, function () {
  var count = 0;
  var d = document;

  var myCreateElement = function myCreateElement(elem, attrs) {
    var el = d.createElement(elem);

    for (var prop in attrs) {
      el.setAttribute(prop, attrs[prop]);
    }

    return el;
  };

  var createContainer = function createContainer() {
    var container = myCreateElement('div', {
      "class": 'notifier-container',
      id: 'notifier-container'
    });
    d.body.appendChild(container);
  };

  var show = function show(msg, type) {
    var timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 3000;
    var ntfId = 'notifier-' + count;
    var container = d.querySelector('.notifier-container'),
        ntf = myCreateElement('div', {
      "class": 'notifier ' + type
    }),
        ntfBody = myCreateElement('div', {
      "class": 'notifier-body'
    }),
        ntfClose = myCreateElement('button', {
      "class": 'notifier-close',
      type: 'button'
    });
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

  var hide = function hide(notificationId) {
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
});