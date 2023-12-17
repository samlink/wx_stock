 --批量修改 tableset 表格
 --备份表:
 pg_dump sales -t tableset -f t.sql
 --还原表:
 psql sales < t.sql

 --批量增加 tabeset 数据
 -- 把类似数据保存到一个临时表
 select * into tmp from tableset where table_name='采购单据';
 --在临时表中修改后, 再插入到原表
 insert into tableset (table_name,field_name,data_type,show_name,show_width,ctr_type,option_value,is_show,
             show_order,inout_show,inout_order,default_value,all_edit,is_use,inout_width)
 select table_name,field_name,data_type,show_name,show_width,ctr_type,option_value,is_show,
        show_order,inout_show,inout_order,default_value,all_edit,is_use,inout_width from tmp;

创建外键索引
ALTER TABLE pout_items ADD CONSTRAINT fk_sale_idx FOREIGN KEY (销售id) REFERENCES document_items (id) on delete cascade;

删除外键
ALTER TABLE pout_items DROP CONSTRAINT fk_sale_idx;
        DELETE FROM document_items WHERE 单号id='XS20231126-03'

CREATE TABLE public.lu (
    "炉号" text PRIMARY KEY NOT NULL,
    "质保书" text NOT NULL,
);

备份单表
pg_dump -U postgres sales -t tableset -f set.sql