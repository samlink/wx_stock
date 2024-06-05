 --批量修改 tableset 表格
 --备份表:
 pg_dump sales -t tableset -f t.sql
 --删除表
 drop table tableset
 --还原表:
 psql sales < t.sql

 --批量增加 tableset 数据
 --把类似数据保存到一个临时表
 select * into tmp from tableset where table_name='采购单据';
 --在临时表中修改后, 再插入到原表
 insert into tableset (table_name,field_name,data_type,show_name,show_width,ctr_type,option_value,is_show,
             show_order,inout_show,inout_order,default_value,all_edit,is_use,inout_width)
 select table_name,field_name,data_type,show_name,show_width,ctr_type,option_value,is_show,
        show_order,inout_show,inout_order,default_value,all_edit,is_use,inout_width from tmp;

--新增 tableset 字段
insert into public.tableset
(id, table_name, field_name, data_type, show_name, show_width, ctr_type, option_value, is_show, show_order, inout_show, inout_order, default_value, all_edit, is_use, inout_width)
values 
(368,'商品规格','库存状态','文本','库存类别',4,'普通输入','',false,29,false,27,'',true,false,4);

创建外键索引
ALTER TABLE pout_items ADD CONSTRAINT fk_sale_idx FOREIGN KEY (销售id) REFERENCES document_items (id) on delete cascade;

删除外键
ALTER TABLE pout_items DROP CONSTRAINT fk_sale_idx;
        DELETE FROM document_items WHERE 单号id='XS20231126-03'

CREATE TABLE public.lu (
    "炉号" text PRIMARY KEY NOT NULL,
    "质保书" text NOT NULL,
);

其他命令
alter table document_items add column 出库完成 bool default false;