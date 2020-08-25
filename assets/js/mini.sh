#!/bin/bash

terser autocomplete.js functions.js tables.js notifier.js -c -o ../../static/frontmerge.js
terser event.js login.js -c -o ../../static/backendmerge.js
terser analys.js -c -o ../../static/analys.js
terser focus.js -c -o ../../static/focus.js
terser hold.js -c -o ../../static/hold.js
terser history.js -c -o ../../static/history.js
terser trade.js -c -o ../../static/trade.js
terser pool.js -c -o ../../static/pool.js
