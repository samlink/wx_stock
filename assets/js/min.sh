#!/bin/sh
terser ./parts/proto_tools.js ./parts/tools.js ./parts/alert.js ./parts/notifier.js ./parts/autocomplete.js ./parts/modal.js ./parts/tree.js \
        ./parts/table.js ./parts/table_class.js ./parts/service.js ./parts/edit_table.js ./parts/customer.js -c -o ../../static/tools_service.js

terser ./pages/businessquery.js -c -o ../../static/businessquery.js
terser ./pages/buyin.js -c -o ../../static/buyin.js
terser ./pages/customer.js -c -o ../../static/customer.js
terser ./pages/documentquery.js -c -o ../../static/documentquery.js
terser ./pages/fieldset.js -c -o ../../static/fieldset.js
terser ./pages/general.js -c -o ../../static/general.js
terser ./pages/help.js -c -o ../../static/help.js
terser ./pages/home.js -c -o ../../static/home.js
terser ./pages/login.js -c -o ../../static/login.js
terser ./pages/material.js -c -o ../../static/material.js
terser ./pages/materialout.js -c -o ../../static/materialout.js
terser ./pages/productset.js -c -o ../../static/productset.js
terser ./pages/stockin.js -c -o ../../static/stockin.js
terser ./pages/stockinitems.js -c -o ../../static/stockinitems.js
terser ./pages/stockout.js -c -o ../../static/stockout.js
terser ./pages/stockoutitems.js -c -o ../../static/stockoutitems.js
terser ./pages/transport.js -c -o ../../static/transport.js
terser ./pages/usermanage.js -c -o ../../static/usermanage.js
terser ./pages/userset.js -c -o ../../static/userset.js
terser ./pages/kp.js -c -o ../../static/kp.js
terser ./pages/query2.js -c -o ../../static/query2.js
