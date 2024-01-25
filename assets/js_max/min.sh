#!/bin/sh
#parts --------
terser ./parts/alert.mjs -c -o ../min/parts/alert.mjs
terser ./parts/autocomplete.mjs -c -o ../min/parts/autocomplete.mjs
terser ./parts/customer.mjs -c -o ../min/parts/customer.mjs
terser ./parts/edit_table.mjs -c -o ../min/parts/edit_table.mjs
terser ./parts/modal.mjs -c -o ../min/parts/modal.mjs
terser ./parts/notifier.mjs -c -o ../min/parts/notifier.mjs
terser ./parts/proto_tools.js -c -o ../min/parts/proto_tools.js
terser ./parts/service.mjs -c -o ../min/parts/service.mjs
terser ./parts/table.mjs -c -o ../min/parts/table.mjs
terser ./parts/table_class.mjs -c -o ../min/parts/table_class.mjs
terser ./parts/tools.mjs -c -o ../min/parts/tools.mjs
terser ./parts/tree.mjs -c -o ../min/parts/tree.mjs

#pages --------
terser ./pages/businessquery.js -c -o ../min/pages/businessquery.js
terser ./pages/buyin.js -c -o ../min/pages/buyin.js
terser ./pages/customer.js -c -o ../min/pages/customer.js
terser ./pages/documentquery.js -c -o ../min/pages/documentquery.js
terser ./pages/fieldset.js -c -o ../min/pages/fieldset.js
terser ./pages/general.js -c -o ../min/pages/general.js
terser ./pages/help.js -c -o ../min/pages/help.js
terser ./pages/home.js -c -o ../min/pages/home.js
terser ./pages/login.js -c -o ../min/pages/login.js
terser ./pages/material.js -c -o ../min/pages/material.js
terser ./pages/materialout.js -c -o ../min/pages/materialout.js
terser ./pages/productset.js -c -o ../min/pages/productset.js
terser ./pages/stockin.js -c -o ../min/pages/stockin.js
terser ./pages/stockinitems.js -c -o ../min/pages/stockinitems.js
terser ./pages/stockout.js -c -o ../min/pages/stockout.js
terser ./pages/stockoutitems.js -c -o ../min/pages/stockoutitems.js
terser ./pages/transport.js -c -o ../min/pages/transport.js
terser ./pages/usermanage.js -c -o ../min/pages/usermanage.js
terser ./pages/userset.js -c -o ../min/pages/userset.js
terser ./pages/kp.js -c -o ../min/pages/kp.js
terser ./pages/query2.js -c -o ../min/pages/query2.js
