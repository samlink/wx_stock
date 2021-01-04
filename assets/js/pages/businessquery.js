import { table_data, table_init, fetch_table } from '../parts/table.mjs';
import { fetch_tree, tree_init, tree_search } from '../parts/tree.mjs';
import { notifier } from '../parts/notifier.mjs';
import { alert_confirm } from '../parts/alert.mjs';
import { auto_table, AutoInput } from '../parts/autocomplete.mjs';
import * as service from '../parts/service.mjs'
import { SPLITER, regInt, regReal, regDate, moneyUppercase } from '../parts/tools.mjs';

//执行一个laydate实例
laydate.render({
    elem: '#search-date1',
    showBottom: false,
    theme: 'molv',
    // value: '2021-05-02'
    // theme: '#62468d',
});

laydate.render({
    elem: '#search-date2',
    showBottom: false,
    theme: 'molv',
});
