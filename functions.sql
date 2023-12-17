CREATE OR REPLACE FUNCTION public.cut_length() RETURNS TABLE("物料号" text, "切分次数" bigint, "长度合计" bigint, "理重合计" real)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    select pout_items.物料号, sum(数量) as 切分次数, sum(长度*数量) as 长度合计, sum(理重) as 理重合计
    from pout_items
    join documents on 单号id=单号
    where 文本字段10 <> ''
    group by pout_items.物料号;
END;
$$;


ALTER FUNCTION public.cut_length() OWNER TO postgres;
