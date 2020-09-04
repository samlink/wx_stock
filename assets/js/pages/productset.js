// import { table_data, table_init, fetch_table } from '../parts/table.mjs';
// import { notifier } from '../parts/notifier.mjs';
// import { alert_confirm } from '../parts/alert.mjs';
import { fetch_tree, tree_event } from '../parts/tree.mjs';
import { autocomplete } from '../parts/autocomplete.mjs';

fetch_tree();
tree_event();

let input = document.querySelector('#auto_input');
autocomplete(input, "/tree_auto", () => {
    alert("执行命令");
});