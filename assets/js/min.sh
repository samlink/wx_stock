#!/bin/sh
terser ./parts/proto_tools.js ./parts/tools.js ./parts/alert.js ./parts/notifier.js ./parts/autocomplete.js ./parts/modal.js ./parts/tree.js \
        ./parts/table.js ./parts/table_class.js ./parts/edit_table.js ./parts/customer.js -c -o ../../static/tools_service.js

terser ./pages/login.js -c -o ../../static/login.js
terser ./pages/productset.js -c -o ../../static/productset.js
terser ./pages/userset.js -c -o ../../static/userset.js

