--
-- PostgreSQL database dump
--

-- Dumped from database version 16.0
-- Dumped by pg_dump version 16.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.document_items DROP CONSTRAINT IF EXISTS "products_商品id_fkey";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "products_单号id_fkey";
ALTER TABLE IF EXISTS ONLY public.pout_items DROP CONSTRAINT IF EXISTS pout_items_wlh_fk;
ALTER TABLE IF EXISTS ONLY public.pout_items DROP CONSTRAINT IF EXISTS pout_items_fk;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS "documents_客商id_fkey";
ALTER TABLE IF EXISTS ONLY public.document_items DROP CONSTRAINT IF EXISTS "document_items_商品id_fkey";
ALTER TABLE IF EXISTS ONLY public.document_items DROP CONSTRAINT IF EXISTS "document_items_单号id_fkey";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "用户_pkey";
ALTER TABLE IF EXISTS ONLY public.tree DROP CONSTRAINT IF EXISTS tree_pkey;
ALTER TABLE IF EXISTS ONLY public.tableset DROP CONSTRAINT IF EXISTS tableset2_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pk;
ALTER TABLE IF EXISTS ONLY public.pout_items DROP CONSTRAINT IF EXISTS pout_items_pk;
ALTER TABLE IF EXISTS ONLY public.lu DROP CONSTRAINT IF EXISTS lu_pkey;
ALTER TABLE IF EXISTS ONLY public.help DROP CONSTRAINT IF EXISTS help_pkey;
ALTER TABLE IF EXISTS ONLY public.document_items DROP CONSTRAINT IF EXISTS document_items_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customer_pkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS buy_documents_pkey;
ALTER TABLE IF EXISTS public.tableset ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.help ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customers ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.tree;
DROP SEQUENCE IF EXISTS public.tableset2_id_seq;
DROP TABLE IF EXISTS public.tableset;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.pout_items;
DROP TABLE IF EXISTS public.lu;
DROP SEQUENCE IF EXISTS public.help_id_seq;
DROP TABLE IF EXISTS public.help;
DROP TABLE IF EXISTS public.documents;
DROP TABLE IF EXISTS public.document_items;
DROP SEQUENCE IF EXISTS public."customers_ID_seq";
DROP TABLE IF EXISTS public.customers;
DROP FUNCTION IF EXISTS public.cut_length();
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: cut_length(); Type: FUNCTION; Schema: public; Owner: sam
--

CREATE FUNCTION OR REPLACE public.cut_length() RETURNS TABLE("物料号" text, "切分次数" bigint, "长度合计" bigint, "理重合计" real)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY 
    select pout_items.物料号, count(pout_items.物料号) as 切分次数, sum(长度*数量) as 长度合计, sum(理重) as 理重合计
    from pout_items
    join documents on 单号id=单号
    where 文本字段10 <> ''
    group by pout_items.物料号;    
END;
$$;


ALTER FUNCTION public.cut_length() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    "名称" text DEFAULT ''::text,
    "联系人" text DEFAULT ''::text,
    "电话" text DEFAULT ''::text,
    "地址" text DEFAULT ''::text,
    "税率" real DEFAULT 0.15,
    "含税" boolean,
    "优惠折扣" real DEFAULT 1,
    "信用评价" text DEFAULT ''::text,
    "地区" text DEFAULT ''::text,
    "停用" boolean DEFAULT false,
    "备注" text DEFAULT ''::text,
    "助记码" text DEFAULT ''::text,
    "文本字段1" text DEFAULT ''::text,
    "文本字段2" text DEFAULT ''::text,
    "文本字段3" text DEFAULT ''::text,
    "文本字段4" text DEFAULT ''::text,
    "文本字段5" text DEFAULT ''::text,
    "文本字段6" text DEFAULT ''::text,
    "文本字段7" text DEFAULT ''::text,
    "文本字段8" text DEFAULT ''::text,
    "文本字段9" text DEFAULT ''::text,
    "文本字段10" text DEFAULT ''::text,
    "整数字段1" integer DEFAULT 0,
    "整数字段2" integer DEFAULT 0,
    "整数字段3" integer DEFAULT 0,
    "整数字段4" integer DEFAULT 0,
    "整数字段5" integer DEFAULT 0,
    "整数字段6" integer DEFAULT 0,
    "实数字段1" real DEFAULT 0,
    "实数字段2" real DEFAULT 0,
    "实数字段3" real DEFAULT 0,
    "实数字段4" real DEFAULT 0,
    "实数字段5" real DEFAULT 0,
    "实数字段6" real DEFAULT 0,
    "布尔字段1" boolean DEFAULT false,
    "布尔字段2" boolean DEFAULT false,
    "布尔字段3" boolean DEFAULT false,
    "类别" text
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_ID_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."customers_ID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."customers_ID_seq" OWNER TO postgres;

--
-- Name: customers_ID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."customers_ID_seq" OWNED BY public.customers.id;


--
-- Name: document_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "单号id" text NOT NULL,
    "单价" real DEFAULT 0,
    "数量" integer DEFAULT 0,
    "备注" text DEFAULT ''::text,
    "顺序" integer DEFAULT 0,
    "重量" real DEFAULT 0,
    "长度" integer DEFAULT 0,
    "商品id" text NOT NULL,
    "规格" text DEFAULT ''::text,
    "状态" text DEFAULT ''::text,
    "理重" real DEFAULT 0,
    "炉号" text DEFAULT ''::text
);


ALTER TABLE public.document_items OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    "单号" text NOT NULL,
    "客商id" integer NOT NULL,
    "日期" text NOT NULL,
    "应结金额" real DEFAULT 0,
    "已结金额" real DEFAULT 0,
    "是否含税" boolean DEFAULT false,
    "是否欠款" boolean DEFAULT true,
    "其他费用" real DEFAULT 0,
    "已记账" boolean DEFAULT false,
    "经办人" text DEFAULT ''::text,
    "备注" text DEFAULT ''::text,
    "开单时间" timestamp without time zone DEFAULT LOCALTIMESTAMP,
    "文本字段1" text DEFAULT ''::text,
    "文本字段2" text DEFAULT ''::text,
    "文本字段3" text DEFAULT ''::text,
    "文本字段4" text DEFAULT ''::text,
    "文本字段5" text DEFAULT ''::text,
    "文本字段6" text DEFAULT ''::text,
    "文本字段7" text DEFAULT ''::text,
    "文本字段8" text DEFAULT ''::text,
    "文本字段9" text DEFAULT ''::text,
    "文本字段10" text DEFAULT ''::text,
    "整数字段1" integer DEFAULT 0,
    "整数字段2" integer DEFAULT 0,
    "整数字段3" integer DEFAULT 0,
    "整数字段4" integer DEFAULT 0,
    "整数字段5" integer DEFAULT 0,
    "实数字段1" real DEFAULT 0,
    "实数字段2" real DEFAULT 0,
    "实数字段3" real DEFAULT 0,
    "实数字段4" real DEFAULT 0,
    "实数字段5" real DEFAULT 0,
    "布尔字段1" boolean DEFAULT false,
    "布尔字段2" boolean DEFAULT false,
    "布尔字段3" boolean DEFAULT false,
    "类别" text,
    "整数字段6" integer DEFAULT 0,
    "实数字段6" real DEFAULT 0
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: help; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.help (
    id integer NOT NULL,
    page_name text NOT NULL,
    tips text NOT NULL,
    show_order integer
);


ALTER TABLE public.help OWNER TO postgres;

--
-- Name: help_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.help_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.help_id_seq OWNER TO postgres;

--
-- Name: help_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.help_id_seq OWNED BY public.help.id;


--
-- Name: lu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lu (
    "炉号" text NOT NULL,
    "质保书" text NOT NULL
);


ALTER TABLE public.lu OWNER TO postgres;

--
-- Name: pout_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pout_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "单号id" text NOT NULL,
    "物料号" text,
    "长度" integer,
    "数量" integer,
    "重量" real,
    "备注" text DEFAULT ''::text,
    "顺序" integer,
    "理重" real,
    "单价" real DEFAULT 0
);


ALTER TABLE public.pout_items OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    "商品id" text NOT NULL,
    "规格型号" text DEFAULT ''::text,
    "出售价格" real DEFAULT 0,
    "库存下限" real DEFAULT 0,
    "停用" boolean DEFAULT false,
    "备注" text DEFAULT ''::text,
    "单位" text DEFAULT ''::text,
    "文本字段1" text DEFAULT ''::text NOT NULL,
    "文本字段2" text DEFAULT ''::text,
    "文本字段3" text DEFAULT ''::text,
    "文本字段4" text DEFAULT ''::text,
    "整数字段1" integer DEFAULT 0,
    "整数字段2" integer DEFAULT 0,
    "整数字段3" integer DEFAULT 0,
    "实数字段1" real DEFAULT 0,
    "实数字段2" real DEFAULT 0,
    "实数字段3" real DEFAULT 0,
    "文本字段5" text DEFAULT ''::text,
    "文本字段6" text DEFAULT ''::text,
    "文本字段7" text DEFAULT ''::text,
    "文本字段8" text DEFAULT ''::text,
    "文本字段9" text DEFAULT ''::text,
    "文本字段10" text DEFAULT ''::text,
    "整数字段4" integer DEFAULT 0,
    "整数字段5" integer DEFAULT 0,
    "整数字段6" integer DEFAULT 0,
    "实数字段4" real DEFAULT 0,
    "实数字段5" real DEFAULT 0,
    "实数字段6" real DEFAULT 0,
    "布尔字段1" boolean DEFAULT false,
    "布尔字段2" boolean DEFAULT false,
    "布尔字段3" boolean DEFAULT false,
    "库位" text DEFAULT ''::text,
    "单号id" text
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: tableset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tableset (
    id integer NOT NULL,
    table_name text,
    field_name text,
    data_type text,
    show_name text,
    show_width real,
    ctr_type text,
    option_value text DEFAULT ''::text,
    is_show boolean,
    show_order integer,
    inout_show boolean,
    inout_order integer,
    default_value text DEFAULT ''::text,
    all_edit boolean DEFAULT true,
    is_use boolean,
    inout_width real
);


ALTER TABLE public.tableset OWNER TO postgres;

--
-- Name: tableset2_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tableset2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tableset2_id_seq OWNER TO postgres;

--
-- Name: tableset2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tableset2_id_seq OWNED BY public.tableset.id;


--
-- Name: tree; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tree (
    num text NOT NULL,
    pnum text NOT NULL,
    node_name text,
    pinyin text,
    not_use boolean DEFAULT false
);


ALTER TABLE public.tree OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    name text NOT NULL,
    password text,
    phone text DEFAULT ''::text,
    failed integer DEFAULT 0,
    get_pass integer DEFAULT 0,
    rights text DEFAULT ''::text,
    confirm boolean DEFAULT false,
    theme text DEFAULT ''::text,
    area text DEFAULT '天津'::text,
    duty text DEFAULT ''::text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public."customers_ID_seq"'::regclass);


--
-- Name: help id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.help ALTER COLUMN id SET DEFAULT nextval('public.help_id_seq'::regclass);


--
-- Name: tableset id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tableset ALTER COLUMN id SET DEFAULT nextval('public.tableset2_id_seq'::regclass);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, "名称", "联系人", "电话", "地址", "税率", "含税", "优惠折扣", "信用评价", "地区", "停用", "备注", "助记码", "文本字段1", "文本字段2", "文本字段3", "文本字段4", "文本字段5", "文本字段6", "文本字段7", "文本字段8", "文本字段9", "文本字段10", "整数字段1", "整数字段2", "整数字段3", "整数字段4", "整数字段5", "整数字段6", "实数字段1", "实数字段2", "实数字段3", "实数字段4", "实数字段5", "实数字段6", "布尔字段1", "布尔字段2", "布尔字段3", "类别") FROM stdin;
0	本公司				0.15	\N	1			f													0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户供应商
\.


--
-- Data for Name: document_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_items (id, "单号id", "单价", "数量", "备注", "顺序", "重量", "长度", "商品id", "规格", "状态", "理重", "炉号") FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents ("单号", "客商id", "日期", "应结金额", "已结金额", "是否含税", "是否欠款", "其他费用", "已记账", "经办人", "备注", "开单时间", "文本字段1", "文本字段2", "文本字段3", "文本字段4", "文本字段5", "文本字段6", "文本字段7", "文本字段8", "文本字段9", "文本字段10", "整数字段1", "整数字段2", "整数字段3", "整数字段4", "整数字段5", "实数字段1", "实数字段2", "实数字段3", "实数字段4", "实数字段5", "布尔字段1", "布尔字段2", "布尔字段3", "类别", "整数字段6", "实数字段6") FROM stdin;
KT202312-01	0	2023-12-11	0	0	f	t	0	f		专用于库存数据导入, 与后台程序中的 单号id 保持一致	2023-12-11 11:32:04.870424										已审核	0	0	0	0	0	0	0	0	0	0	f	f	t	库存导入	0	0
\.


--
-- Data for Name: help; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.help (id, page_name, tips, show_order) FROM stdin;
\.


--
-- Data for Name: lu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lu ("炉号", "质保书") FROM stdin;
\.


--
-- Data for Name: pout_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pout_items (id, "单号id", "物料号", "长度", "数量", "重量", "备注", "顺序", "理重", "单价") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products ("商品id", "规格型号", "出售价格", "库存下限", "停用", "备注", "单位", "文本字段1", "文本字段2", "文本字段3", "文本字段4", "整数字段1", "整数字段2", "整数字段3", "实数字段1", "实数字段2", "实数字段3", "文本字段5", "文本字段6", "文本字段7", "文本字段8", "文本字段9", "文本字段10", "整数字段4", "整数字段5", "整数字段6", "实数字段4", "实数字段5", "实数字段6", "布尔字段1", "布尔字段2", "布尔字段3", "库位", "单号id") FROM stdin;
\.


--
-- Data for Name: tableset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tableset (id, table_name, field_name, data_type, show_name, show_width, ctr_type, option_value, is_show, show_order, inout_show, inout_order, default_value, all_edit, is_use, inout_width) FROM stdin;
105	商品规格	文本字段1	文本	物料号	5	普通输入		t	1	f	5		t	t	5
114	商品规格	整数字段1	整数	入库长度	4	普通输入		t	8	f	10		t	t	4
115	商品规格	整数字段2	整数	出库次数	3	普通输入		t	9	f	11		t	t	3
124	商品规格	整数字段4	整数	顺序	2	普通输入		f	16	f	23		t	t	2
121	商品规格	文本字段8	文本	合格	2	普通输入		f	17	f	4		t	t	3
179	库存调入	备注	文本	备注	12	普通输入		t	7	t	3		t	t	12
306	库存调出	文本字段1	文本	原因	6	下拉列表	盘亏_下错料	t	2	t	1		t	t	6
134	销售单据	日期	文本	订单日期	5	普通输入		t	2	t	2		t	t	4
135	销售单据	应结金额	实数	单据金额	4	普通输入		t	3	t	3		t	t	4
167	销售单据	布尔字段1	布尔	发货完成	3	二值选一	是_否	t	9	t	6		t	t	3
168	销售单据	经办人	文本	经办人	4	普通输入	张继成_刘树芳_李华同	t	5	f	11	李华同	t	t	4
199	入库单据	日期	文本	入库日期	5	普通输入		t	2	t	2		t	t	4
209	入库单据	实数字段1	实数	来料重量	4	普通输入		t	5	t	4		t	t	2.5
218	入库单据	实数字段2	实数	实际重量	4	普通输入		t	6	t	5		t	t	2.5
301	库存调出	日期	文本	日期	4	普通输入		t	1	t	2		t	t	5
201	入库单据	经办人	文本	经办人	4	普通输入	张继成_刘树芳_李华同	t	4	f	10	李华同	t	t	4
318	库存调出	备注	文本	备注	12	普通输入		t	7	t	3		t	t	12
204	入库单据	文本字段10	文本	审核	4	普通输入		t	9	f	12		t	t	6
279	发货单据	文本字段6	文本	出库单号	6	普通输入		t	1	t	1		t	t	10
319	库存调出	经办人	文本	经办人	4	普通输入	张裕华_刘杰同_李正民	t	3	f	5		t	t	4
273	发货单据	日期	文本	发货日期	5	普通输入		t	4	t	4		t	t	4
278	发货单据	文本字段2	文本	发货方式	4	普通输入		t	5	t	5		t	t	4
283	发货单据	备注	文本	备注	8	普通输入		t	14	t	10		t	t	8
275	发货单据	经办人	文本	经办人	4	普通输入	张继成_刘树芳_李华同	t	10	f	12	李华同	t	t	4
285	发货单据	文本字段7	文本	区域	3	普通输入		t	13	f	13		t	t	3
327	库存调出	文本字段7	文本	区域	6	普通输入		t	6	f	6		t	t	6
169	库存调入	日期	文本	日期	4	普通输入		t	1	t	2		t	t	5
173	库存调入	实数字段4	实数	实数字段4	4	普通输入		f	26	f	29		t	f	4
103	商品规格	单位	文本	单位	2	普通输入		f	21	f	1		t	f	2
1	采购单据	日期	文本	日期	5	普通输入		t	2	t	2		t	t	4
39	供应商	停用	布尔	停用	4	二值选一	是_否	t	6	f	7		t	t	4
163	销售单据	文本字段4	文本	发票号	10	普通输入		t	11	t	8		t	t	10
40	供应商	备注	文本	备注	10	普通输入		t	7	t	6		t	t	10
102	商品规格	规格型号	文本	规格	5	普通输入		t	2	t	1		t	t	5
77	客户	文本字段7	文本	简称	6	普通输入		t	15	t	1		t	t	6
67	客户	联系人	文本	联系人	4	普通输入		t	2	f	5		t	t	4
68	客户	电话	文本	电话	6	普通输入		t	3	f	6		t	t	6
69	客户	地址	文本	公司地址	10	普通输入		t	4	f	7		t	t	12
76	客户	备注	文本	备注	10	普通输入		t	17	f	8		t	t	10
75	客户	停用	布尔	停用	4	二值选一	是_否	t	16	f	10		t	t	4
104	商品规格	文本字段2	文本	状态	6	普通输入		t	3	t	2		t	t	6
106	商品规格	文本字段3	文本	执行标准	7	普通输入		t	4	f	13		t	t	7
111	商品规格	文本字段5	文本	生产厂家	5	普通输入		t	5	f	7		t	t	5
38	供应商	地址	文本	公司地址	10	普通输入		t	5	t	4		t	t	10
36	供应商	联系人	文本	联系人	4	普通输入		t	2	t	2		t	t	4
112	商品规格	文本字段4	文本	炉号	5	普通输入		t	6	f	8		t	t	5
158	销售单据	备注	文本	备注	8	普通输入		t	13	t	9		t	t	6
107	商品规格	出售价格	实数	售价	3	普通输入		t	7	f	14		t	t	3
138	销售单据	文本字段7	文本	区域	3	普通输入		t	12	f	12		t	t	3
10	采购单据	文本字段1	文本	合同编号	6	普通输入		t	1	t	1		t	t	5
2	采购单据	应结金额	实数	金额	4	普通输入		t	3	t	3		t	t	4
41	供应商	文本字段1	文本	简称	6	普通输入		t	4	t	5		t	t	6
35	供应商	名称	文本	名称	10	普通输入		t	1	t	1		t	t	10
8	采购单据	经办人	文本	经办人	4	普通输入		t	5	f	8		t	t	4
137	销售单据	文本字段6	文本	合同编号	5	普通输入		t	1	t	1		t	t	5
226	入库单据	实数字段3	实数	理论重量	4	普通输入		t	7	t	6		t	t	2.5
159	销售单据	文本字段2	文本	交货日期	5	普通输入		t	8	t	5		t	t	4
160	销售单据	文本字段5	文本	发票金额	4	普通输入		t	10	t	7		t	t	4
224	入库单据	备注	文本	备注	8	普通输入		t	12	t	7		t	t	6
216	入库单据	文本字段2	文本	质检	4	普通输入		t	10	f	9		t	t	4
231	入库单据	文本字段7	文本	区域	3	普通输入		t	11	f	11		t	t	3
261	出库单据	文本字段6	文本	销售单号	10	普通输入		t	1	t	1		t	t	10
262	出库单据	文本字段5	文本	合同编号	4	普通输入		t	2	t	2		t	t	5
256	出库单据	文本字段4	文本	客户	10	普通输入		t	3	t	3		t	t	8
233	出库单据	日期	文本	日期	4	普通输入		t	4	t	4		t	t	4
235	出库单据	经办人	文本	经办人	4	普通输入	张继成_刘树芳_李华同	t	5	f	8	李华同	t	t	4
281	发货单据	文本字段5	文本	客户	10	普通输入		t	6	t	6		t	t	10
175	库存调入	经办人	文本	经办人	4	普通输入	张裕华_刘杰同_李正民	t	3	f	5		t	t	4
324	库存调出	文本字段10	文本	审核	4	普通输入		t	5	f	7		t	t	6
178	库存调入	文本字段10	文本	审核	4	普通输入		t	5	f	7		t	t	6
116	商品规格	整数字段3	整数	库存长度	4	普通输入		t	10	f	12		t	t	4
108	商品规格	库存下限	实数	理论重量	4	普通输入		t	11	f	15		t	t	4
133	商品规格	库位	文本	库位	4	普通输入		t	12	f	6		t	t	4
113	商品规格	文本字段6	文本	区域	3	普通输入		t	13	f	9		t	t	3
33	采购单据	布尔字段2	布尔	入库完成	4	二值选一	是_否	t	8	t	5		t	t	4
120	商品规格	文本字段7	文本	切完	3	下拉列表	否_是	t	14	f	3		t	t	3
110	商品规格	备注	文本	备注	5	普通输入		t	15	f	16		t	t	5
16	采购单据	文本字段7	文本	区域	4	普通输入		t	9	f	9		t	t	6
37	供应商	电话	文本	手机	6	普通输入		t	3	t	3		t	t	6
9	采购单据	备注	文本	备注	8	普通输入		t	10	t	6		t	t	6
155	销售单据	是否欠款	布尔	是否欠款	3	二值选一	是_否	t	4	t	4	是	t	t	3
154	销售单据	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	6	f	10		t	t	4
227	入库单据	文本字段6	文本	采购单号	10	普通输入		t	1	t	1		t	t	8
258	出库单据	备注	文本	备注	8	普通输入		t	9	t	5		t	t	6
265	出库单据	文本字段7	文本	区域	3	普通输入		t	8	f	9		t	t	3
282	发货单据	文本字段4	文本	销售单号	6	普通输入		t	2	t	2		t	t	6
286	发货单据	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	11	f	11		t	t	4
194	库存调入	文本字段1	文本	原因	6	下拉列表	下错料_销售退货_盘盈	t	2	t	1		t	t	6
43	供应商	文本字段3	文本	文本字段3	6	普通输入		f	9	f	9		t	f	6
303	库存调出	文本字段9	文本	文本字段9	6	普通输入		f	16	f	18		t	f	6
247	出库单据	是否含税	布尔	是否含税	4	二值选一	是_否	f	16	f	5	是	t	f	4
264	出库单据	其他费用	实数	其他费用	4	普通输入		f	18	f	8		t	f	4
304	库存调出	整数字段2	整数	整数字段2	4	普通输入		f	18	f	21		t	f	4
34	采购单据	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	6	f	7		t	t	4
80	客户	文本字段1	文本	税号	6	普通输入		t	11	f	11		t	t	6
81	客户	文本字段2	文本	开户行	6	普通输入		t	12	f	12		t	t	6
82	客户	文本字段3	文本	账号	6	普通输入		t	13	f	13		t	t	6
140	销售单据	文本字段10	文本	审核	4	普通输入		t	7	f	13		t	t	6
228	入库单据	文本字段5	文本	到货日期	5	普通输入		t	3	t	3		t	t	4
250	出库单据	文本字段2	文本	图片	4	普通输入		f	10	f	7		t	t	4
238	出库单据	文本字段10	文本	审核	4	普通输入		t	7	f	10		t	t	6
66	客户	名称	文本	名称	10	普通输入		t	1	f	9		t	t	10
83	客户	文本字段4	文本	行号	6	普通输入		t	14	f	14		t	t	6
329	库存调出	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	4	f	4		t	t	4
19	采购单据	文本字段10	文本	审核	4	普通输入		t	7	f	10		t	t	6
174	库存调入	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	4	f	4		t	t	4
212	入库单据	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	8	f	8		t	t	4
246	出库单据	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	6	f	6		t	t	4
295	发货单据	文本字段3	文本	合同号	6	普通输入		t	3	t	3		t	t	4
296	发货单据	文本字段8	文本	收货人	4	普通输入		t	7	t	7		t	t	4
288	发货单据	文本字段9	文本	收货电话	6	普通输入		t	8	t	8		t	t	5
297	发货单据	文本字段1	文本	收货地址	10	普通输入		t	9	t	9		t	t	10
267	发货单据	文本字段10	文本	审核	4	普通输入		t	12	f	14		t	t	6
45	供应商	文本字段5	文本	文本字段5	6	普通输入		f	11	f	11		t	f	6
170	库存调入	文本字段7	文本	区域	6	普通输入		t	6	f	6		t	t	6
48	供应商	文本字段8	文本	文本字段8	6	普通输入		f	14	f	14		t	f	6
61	供应商	实数字段5	实数	实数字段5	4	普通输入		f	27	f	27		t	f	4
44	供应商	文本字段4	文本	文本字段4	6	普通输入		f	10	f	10		t	f	6
230	入库单据	其他费用	实数	其他费用	4	普通输入		f	21	f	8		t	f	4
207	入库单据	整数字段5	整数	整数字段5	4	普通输入		f	29	f	24		t	f	4
42	供应商	文本字段2	文本	收货地址	10	普通输入		f	8	f	8		t	f	6
59	供应商	实数字段3	实数	实数字段3	4	普通输入		f	25	f	25		t	f	4
205	入库单据	整数字段1	整数	整数字段1	4	普通输入		f	25	f	20		t	f	4
244	出库单据	布尔字段1	布尔	发货完成	3	二值选一	是_否	f	12	f	6		t	f	3
153	销售单据	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	14	f	10		t	f	4
141	销售单据	整数字段1	整数	整数字段1	4	普通输入		f	23	f	20		t	f	4
277	发货单据	布尔字段1	布尔	发货完成	3	二值选一	是_否	f	18	f	6		t	f	3
259	出库单据	文本字段1	文本	交货日期	4	普通输入		f	19	f	5		t	f	4
257	出库单据	文本字段8	文本	文本字段8	6	普通输入		f	20	f	17		t	f	6
213	入库单据	是否含税	布尔	是否含税	4	二值选一	是_否	f	19	f	5	是	t	f	4
65	供应商	布尔字段3	布尔	布尔字段3	4	二值选一	是_否	f	31	f	31		t	f	4
328	库存调出	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	30	f	33		t	f	4
245	出库单据	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	34	f	33		t	f	4
152	销售单据	实数字段6	实数	实数字段6	4	普通输入		f	34	f	31		t	f	4
47	供应商	文本字段7	文本	文本字段7	6	普通输入		f	13	f	13		t	f	6
260	出库单据	实数字段3	实数	实数字段3	4	普通输入		f	30	f	28		t	f	4
290	发货单据	实数字段4	实数	实数字段4	4	普通输入		f	31	f	29		t	f	4
18	采购单据	文本字段9	文本	文本字段9	6	普通输入		f	22	f	18		t	f	6
12	采购单据	文本字段3	文本	到货日期	5	普通输入		t	4	t	4		t	t	4
22	采购单据	整数字段3	整数	整数字段3	4	普通输入		f	25	f	22		t	f	4
139	销售单据	文本字段9	文本	文本字段9	6	普通输入		f	22	f	18		t	f	6
25	采购单据	整数字段6	整数	整数字段6	4	普通输入		f	28	f	25		t	f	4
221	入库单据	是否欠款	布尔	是否欠款	3	二值选一	是_否	f	14	f	7	是	t	f	3
223	入库单据	文本字段8	文本	文本字段8	6	普通输入		f	23	f	17		t	f	6
316	库存调出	文本字段2	文本	文本字段2	6	普通输入		f	11	f	6		t	f	6
321	库存调出	实数字段2	实数	实数字段2	4	普通输入		f	24	f	27		t	f	4
4	采购单据	是否含税	布尔	是否含税	4	二值选一	是_否	f	14	f	4	是	t	f	4
196	库存调入	文本字段3	文本	文本字段3	6	普通输入		f	8	f	12		t	f	6
270	发货单据	整数字段5	整数	整数字段5	4	普通输入		f	26	f	24		t	f	4
117	商品规格	实数字段1	实数	面积	4	普通输入		f	22	f	16		t	f	4
127	商品规格	实数字段4	实数	实数字段4	4	普通输入		f	28	f	26		t	f	4
123	商品规格	文本字段10	文本	文本字段10	6	普通输入		f	25	f	22		t	f	6
311	库存调出	整数字段1	整数	整数字段1	4	普通输入		f	17	f	20		t	f	4
64	供应商	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	30	f	30		t	f	4
28	采购单据	实数字段3	实数	实数字段3	4	普通输入		f	31	f	28		t	f	4
11	采购单据	文本字段2	文本	文本字段2	4	普通输入		f	17	f	7		t	f	4
151	销售单据	实数字段5	实数	实数字段5	4	普通输入		f	33	f	30		t	f	4
21	采购单据	整数字段2	整数	整数字段2	4	普通输入		f	24	f	21		t	f	4
208	入库单据	整数字段6	整数	整数字段6	4	普通输入		f	30	f	25		t	f	4
252	出库单据	实数字段2	实数	实数字段2	4	普通输入		f	29	f	27		t	f	4
176	库存调入	文本字段2	文本	文本字段2	6	普通输入		f	9	f	6		t	f	6
72	客户	优惠折扣	实数	优惠折扣	4	普通输入		f	20	f	7		t	f	4
181	库存调入	整数字段3	整数	整数字段3	4	普通输入		f	19	f	22		t	f	4
73	客户	信用评价	文本	收货人	4	普通输入	极好_优秀_良好_中等_较差	t	5	t	2		t	t	4
305	库存调出	实数字段1	实数	实数字段1	4	普通输入		f	23	f	26		t	f	4
234	出库单据	应结金额	实数	单据金额	4	普通输入		f	13	f	3		t	f	4
315	库存调出	布尔字段1	布尔	布尔字段1	4	二值选一	是_否	f	29	f	32		t	f	4
96	客户	实数字段1	实数	实数字段1	4	普通输入		f	31	f	31		t	f	4
191	库存调入	整数字段2	整数	整数字段2	4	普通输入		f	18	f	21		t	f	4
129	商品规格	实数字段6	实数	实数字段6	4	普通输入		f	30	f	28		t	f	4
70	客户	税率	实数	税率	3	普通输入		f	18	f	9		t	f	3
131	商品规格	布尔字段2	布尔	布尔字段2	3	二值选一	是_否	f	31	f	30		t	f	3
197	库存调入	文本字段8	文本	文本字段8	6	普通输入		f	15	f	17		t	f	6
268	发货单据	整数字段1	整数	整数字段1	4	普通输入		f	22	f	20		t	f	4
87	客户	整数字段1	整数	整数字段1	4	普通输入		f	22	f	22		t	f	4
214	入库单据	实数字段4	实数	实数字段4	4	普通输入		f	31	f	29		t	f	4
229	入库单据	已记账	布尔	已审核	4	二值选一	是_否	f	15	f	9		t	f	4
220	入库单据	文本字段3	文本	文本字段3	4	普通输入		f	17	f	10		t	f	4
242	出库单据	整数字段6	整数	整数字段6	4	普通输入		f	27	f	25		t	f	4
249	出库单据	实数字段5	实数	实数字段5	4	普通输入		f	32	f	30		t	f	4
202	入库单据	已结金额	实数	已结金额	4	普通输入		f	20	f	4		t	f	4
298	发货单据	实数字段3	实数	实数字段3	4	普通输入		f	30	f	28		t	f	4
3	采购单据	已结金额	实数	已结金额	4	普通输入		f	15	f	3		t	f	4
171	库存调入	文本字段9	文本	文本字段9	6	普通输入		f	16	f	18		t	f	6
125	商品规格	整数字段5	整数	整数字段5	4	普通输入		f	26	f	24		t	f	4
128	商品规格	实数字段5	实数	实数字段5	4	普通输入		f	29	f	27		t	f	4
84	客户	文本字段5	文本	收票人	6	普通输入		t	8	f	15		t	t	6
85	客户	文本字段6	文本	收票电话	6	普通输入		t	9	f	16		t	t	6
289	发货单据	是否含税	布尔	是否含税	4	二值选一	是_否	f	19	f	5	是	t	f	4
222	入库单据	文本字段4	文本	发票号	10	普通输入		f	18	f	5		t	f	10
206	入库单据	整数字段2	整数	整数字段2	4	普通输入		f	26	f	21		t	f	4
79	客户	文本字段10	文本	文本字段10	6	普通输入		f	21	f	14		t	f	6
274	发货单据	应结金额	实数	单据金额	4	普通输入		f	15	f	3		t	f	4
300	发货单据	实数字段6	实数	实数字段6	4	普通输入		f	33	f	31		t	f	4
187	库存调入	实数字段1	实数	实数字段1	4	普通输入		f	23	f	26		t	f	4
6	采购单据	已记账	布尔	已审核	4	二值选一	是_否	f	13	f	7	否	t	f	4
236	出库单据	已结金额	实数	已结金额	4	普通输入		f	17	f	4		t	f	4
320	库存调出	其他费用	实数	相关费用	4	普通输入		f	9	f	2		t	f	4
330	库存调出	实数字段3	实数	实数字段3	4	普通输入		f	25	f	28		t	f	4
326	库存调出	文本字段4	文本	文本字段4	6	普通输入		f	12	f	13		t	f	6
210	入库单据	布尔字段1	布尔	已质检	3	二值选一	是_否	f	16	f	7		t	f	3
144	销售单据	整数字段3	整数	整数字段3	4	普通输入		f	25	f	22		t	f	4
276	发货单据	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	34	f	33		t	f	4
122	商品规格	文本字段9	文本	原物料号	4	普通输入		f	19	f	1		t	t	4
248	出库单据	实数字段4	实数	实数字段4	4	普通输入		f	31	f	29		t	f	4
317	库存调出	实数字段4	实数	实数字段4	4	普通输入		f	26	f	29		t	f	4
54	供应商	整数字段4	整数	整数字段4	4	普通输入		f	20	f	20		t	f	4
56	供应商	整数字段6	整数	整数字段6	4	普通输入		f	22	f	22		t	f	4
118	商品规格	实数字段2	实数	进货价格	4	普通输入		f	23	f	17		t	f	4
119	商品规格	实数字段3	实数	实数字段3	4	普通输入		f	24	f	18		t	f	4
78	客户	文本字段9	文本	收货地址	10	普通输入		t	7	t	4		t	t	6
53	供应商	整数字段3	整数	整数字段3	4	普通输入		f	19	f	19		t	f	4
161	销售单据	已记账	布尔	已记账	4	二值选一	是_否	f	15	f	11		t	f	4
89	客户	整数字段3	整数	整数字段3	4	普通输入		f	24	f	24		t	f	4
91	客户	整数字段5	整数	整数字段5	4	普通输入		f	26	f	26		t	f	4
272	发货单据	实数字段1	实数	实数字段1	4	普通输入		f	28	f	26		t	f	4
180	库存调入	已记账	布尔	已记账	4	二值选一	是_否	f	11	f	9		t	f	4
185	库存调入	整数字段5	整数	整数字段5	4	普通输入		f	21	f	24		t	f	4
49	供应商	文本字段9	文本	文本字段9	6	普通输入		f	15	f	15		t	f	6
162	销售单据	文本字段1	文本	交货日期	4	普通输入		f	20	f	5		t	f	4
149	销售单据	实数字段3	实数	实数字段3	4	普通输入		f	31	f	28		t	f	4
52	供应商	整数字段2	整数	整数字段2	4	普通输入		f	18	f	18		t	f	4
55	供应商	整数字段5	整数	整数字段5	4	普通输入		f	21	f	21		t	f	4
58	供应商	实数字段2	实数	实数字段2	4	普通输入		f	24	f	24		t	f	4
254	出库单据	文本字段3	文本	文本字段3	4	普通输入		f	14	f	9		t	f	4
253	出库单据	整数字段4	整数	整数字段4	4	普通输入		f	25	f	23		t	f	4
92	客户	整数字段6	整数	整数字段6	4	普通输入		f	27	f	27		t	f	4
74	客户	地区	文本	收货电话	6	普通输入		t	6	t	3		t	t	6
30	采购单据	实数字段5	实数	实数字段5	4	普通输入		f	33	f	30		t	f	4
314	库存调出	实数字段5	实数	实数字段5	4	普通输入		f	27	f	30		t	f	4
57	供应商	实数字段1	实数	实数字段1	4	普通输入		f	23	f	23		t	f	4
63	供应商	布尔字段1	布尔	布尔字段1	4	二值选一	是_否	f	29	f	29		t	f	4
46	供应商	文本字段6	文本	文本字段6	6	普通输入		f	12	f	12		t	f	6
14	采购单据	文本字段5	文本	文本字段5	6	普通输入		f	19	f	14		t	f	6
183	库存调入	文本字段6	文本	文本字段6	6	普通输入		f	14	f	15		t	f	6
86	客户	文本字段8	文本	收票地址	6	普通输入		t	10	f	17		t	t	6
239	出库单据	整数字段1	整数	整数字段1	4	普通输入		f	22	f	20		t	f	4
251	出库单据	整数字段3	整数	整数字段3	4	普通输入		f	24	f	22		t	f	4
266	出库单据	实数字段6	实数	实数字段6	4	普通输入		f	33	f	31		t	f	4
313	库存调出	整数字段5	整数	整数字段5	4	普通输入		f	21	f	24		t	f	4
88	客户	整数字段2	整数	整数字段2	4	普通输入		f	23	f	23		t	f	4
17	采购单据	文本字段8	文本	文本字段8	6	普通输入		f	21	f	17		t	f	6
24	采购单据	整数字段5	整数	整数字段5	4	普通输入		f	27	f	24		t	f	4
60	供应商	实数字段4	实数	实数字段4	4	普通输入		f	26	f	26		t	f	4
62	供应商	实数字段6	实数	实数字段6	4	普通输入		f	28	f	28		t	f	4
51	供应商	整数字段1	整数	整数字段1	4	普通输入		f	17	f	17		t	f	4
255	出库单据	是否欠款	布尔	是否欠款	3	二值选一	是_否	f	15	f	4	是	t	f	3
237	出库单据	文本字段9	文本	文本字段9	6	普通输入		f	21	f	18		t	f	6
5	采购单据	是否欠款	布尔	是否欠款	4	二值选一	是_否	f	12	f	5	是	t	f	4
240	出库单据	整数字段2	整数	整数字段2	4	普通输入		f	23	f	21		t	f	4
263	出库单据	已记账	布尔	已审核	4	二值选一	是_否	f	11	f	8		t	f	4
200	入库单据	应结金额	实数	单据金额	4	普通输入		f	13	f	6		t	f	4
156	销售单据	其他费用	实数	其他费用	4	普通输入		f	19	f	8		t	f	4
165	销售单据	是否含税	布尔	是否含税	4	二值选一	是_否	f	17	f	5	是	t	f	4
219	入库单据	整数字段4	整数	整数字段4	4	普通输入		f	28	f	23		t	f	4
241	出库单据	整数字段5	整数	整数字段5	4	普通输入		f	26	f	24		t	f	4
32	采购单据	布尔字段1	布尔	已到货	4	二值选一	是_否	f	11	f	4		t	f	4
184	库存调入	整数字段1	整数	整数字段1	4	普通输入		f	17	f	20		t	f	4
243	出库单据	实数字段1	实数	实数字段1	4	普通输入		f	28	f	26		t	f	4
71	客户	含税	布尔	含税	4	二值选一	是_否	f	19	f	10	是	t	f	4
98	客户	实数字段3	实数	实数字段3	4	普通输入		f	33	f	33		t	f	4
109	商品规格	停用	布尔	停用	3	二值选一	是_否	f	20	f	9		t	f	3
323	库存调出	文本字段3	文本	文本字段3	6	普通输入		f	8	f	12		t	f	6
29	采购单据	实数字段4	实数	实数字段4	4	普通输入		f	32	f	29		t	f	4
182	库存调入	整数字段4	整数	整数字段4	4	普通输入		f	20	f	23		t	f	4
136	销售单据	已结金额	实数	已结金额	4	普通输入		f	18	f	4		t	f	4
150	销售单据	实数字段4	实数	实数字段4	4	普通输入		f	32	f	29		t	f	4
280	发货单据	是否欠款	布尔	是否欠款	3	二值选一	是_否	f	16	f	4	是	t	f	3
189	库存调入	实数字段6	实数	实数字段6	4	普通输入		f	28	f	31		t	f	4
130	商品规格	布尔字段1	布尔	布尔字段1	3	二值选一	是_否	f	18	f	29	是	t	f	3
126	商品规格	整数字段6	整数	整数字段6	4	普通输入		f	27	f	25		t	f	4
293	发货单据	实数字段2	实数	实数字段2	4	普通输入		f	29	f	27		t	f	4
294	发货单据	整数字段4	整数	整数字段4	4	普通输入		f	25	f	23		t	f	4
143	销售单据	整数字段6	整数	整数字段6	4	普通输入		f	28	f	25		t	f	4
232	入库单据	实数字段6	实数	实数字段6	4	普通输入		f	33	f	31		t	f	4
211	入库单据	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	34	f	33		t	f	4
93	客户	实数字段4	实数	实数字段4	4	普通输入		f	28	f	28		t	f	4
95	客户	实数字段6	实数	实数字段6	4	普通输入		f	30	f	30		t	f	4
97	客户	实数字段2	实数	实数字段2	4	普通输入		f	32	f	32		t	f	4
292	发货单据	整数字段3	整数	整数字段3	4	普通输入		f	24	f	22		t	f	4
15	采购单据	文本字段6	文本	文本字段6	6	普通输入		f	20	f	15		t	f	6
23	采购单据	整数字段4	整数	整数字段4	4	普通输入		f	26	f	23		t	f	4
31	采购单据	实数字段6	实数	实数字段6	4	普通输入		f	34	f	31		t	f	4
145	销售单据	整数字段4	整数	整数字段4	4	普通输入		f	26	f	23		t	f	4
148	销售单据	实数字段2	实数	实数字段2	4	普通输入		f	30	f	27		t	f	4
203	入库单据	文本字段9	文本	文本字段9	6	普通输入		f	24	f	18		t	f	6
307	库存调出	实数字段6	实数	实数字段6	4	普通输入		f	28	f	31		t	f	4
100	客户	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	35	f	35		t	f	4
101	客户	布尔字段3	布尔	布尔字段3	4	二值选一	是_否	f	36	f	36		t	f	4
186	库存调入	整数字段6	整数	整数字段6	4	普通输入		f	22	f	25		t	f	4
284	发货单据	已记账	布尔	已审核	4	二值选一	是_否	f	17	f	11		t	f	4
310	库存调出	文本字段6	文本	文本字段6	6	普通输入		f	14	f	15		t	f	6
94	客户	实数字段5	实数	实数字段5	4	普通输入		f	29	f	29		t	f	4
269	发货单据	整数字段2	整数	整数字段2	4	普通输入		f	23	f	21		t	f	4
291	发货单据	实数字段5	实数	实数字段5	4	普通输入		f	32	f	30		t	f	4
193	库存调入	其他费用	实数	相关费用	4	普通输入		f	10	f	2		t	f	4
192	库存调入	实数字段2	实数	实数字段2	4	普通输入		f	24	f	27		t	f	4
90	客户	整数字段4	整数	整数字段4	4	普通输入		f	25	f	25		t	f	4
312	库存调出	整数字段3	整数	整数字段3	4	普通输入		f	19	f	22		t	f	4
164	销售单据	文本字段3	文本	文本字段3	4	普通输入		f	16	f	11		t	f	4
142	销售单据	整数字段2	整数	整数字段2	4	普通输入		f	24	f	21		t	f	4
325	库存调出	文本字段5	文本	文本字段5	6	普通输入		f	13	f	14		t	f	6
198	库存调入	布尔字段1	布尔	布尔字段1	4	二值选一	是_否	f	29	f	32		t	f	4
132	商品规格	布尔字段3	布尔	布尔字段3	3	二值选一	正确_错误	f	32	f	31		t	f	3
190	库存调入	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	30	f	33		t	f	4
188	库存调入	实数字段5	实数	实数字段5	4	普通输入		f	27	f	30		t	f	4
195	库存调入	文本字段4	文本	文本字段4	6	普通输入		f	12	f	13		t	f	6
99	客户	布尔字段1	布尔	布尔字段1	4	二值选一	是_否	f	34	f	34		t	f	4
309	库存调出	整数字段4	整数	整数字段4	4	普通输入		f	20	f	23		t	f	4
308	库存调出	整数字段6	整数	整数字段6	4	普通输入		f	22	f	25		t	f	4
217	入库单据	整数字段3	整数	整数字段3	4	普通输入		f	27	f	22		t	f	4
215	入库单据	实数字段5	实数	实数字段5	4	普通输入		f	32	f	30		t	f	4
225	入库单据	文本字段1	文本	交货日期	4	普通输入		f	22	f	5		t	f	4
287	发货单据	已结金额	实数	已结金额	4	普通输入		f	20	f	4		t	f	4
299	发货单据	其他费用	实数	其他费用	4	普通输入		f	21	f	8		t	f	4
271	发货单据	整数字段6	整数	整数字段6	4	普通输入		f	27	f	25		t	f	4
13	采购单据	文本字段4	文本	文本字段4	6	普通输入		f	18	f	13		t	f	6
26	采购单据	实数字段1	实数	实数字段1	4	普通输入		f	29	f	26		t	f	4
177	库存调入	文本字段5	文本	文本字段5	6	普通输入		f	13	f	14		t	f	6
7	采购单据	其他费用	实数	其他费用	4	普通输入		f	16	f	6		t	f	4
146	销售单据	整数字段5	整数	整数字段5	4	普通输入		f	27	f	24		t	f	4
302	库存调出	文本字段8	文本	文本字段8	6	普通输入		f	15	f	17		t	f	6
322	库存调出	已记账	布尔	已记账	4	二值选一	是_否	f	10	f	9		t	f	4
50	供应商	文本字段10	文本	文本字段10	6	普通输入		f	16	f	16		t	f	6
166	销售单据	文本字段8	文本	文本字段8	6	普通输入		f	21	f	17		t	f	6
147	销售单据	实数字段1	实数	实数字段1	4	普通输入		f	29	f	26		t	f	4
20	采购单据	整数字段1	整数	整数字段1	4	普通输入		f	23	f	20		t	f	4
27	采购单据	实数字段2	实数	实数字段2	4	普通输入		f	30	f	27		t	f	4
172	库存调入	实数字段3	实数	实数字段3	4	普通输入		f	25	f	28		t	f	4
\.


--
-- Data for Name: tree; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tree (num, pnum, node_name, pinyin, not_use) FROM stdin;
3_106	3	20CrMnMo 圆钢	20crmnmoyg	f
3_110	3	20CrNiMo 圆钢	20crnimoyg	f
3_105	3	4145H 圆钢	4145hyg	f
3_102	3	42CrMo 圆钢	42crmoyg	f
3_112	3	45号钢 圆钢	45hgyg	f
3_109	3	718 圆钢	718yg	f
3_103	3	L80-13Cr 圆钢	l8013cryg	f
3_108	3	L80-9Cr 圆钢	l809cryg	f
3_104	3	Super13Cr 圆钢	super13cryg	f
3	#	圆钢	yg	f
4	#	无缝钢管	wfgg	f
4_109	4	P110套管接箍料	p110tgjgl	f
4_101	4	17-4 无缝钢管	174wfgg	f
4_105	4	20CrMnMi 无缝钢管	20crmnmiwfgg	f
4_107	4	3Cr-L80 无缝钢管	3crl80wfgg	f
4_104	4	4140 无缝钢管	4140wfgg	f
4_102	4	42CrMo 无缝钢管	42crmowfgg	f
4_108	4	C110 无缝钢管	c110wfgg	f
4_103	4	L80-13Cr 无缝钢管	l8013crwfgg	f
4_106	4	L80-9Cr 无缝钢管	l809crwfgg	f
3_101	3	17-4 圆钢	174yg	f
3_111	3	20Cr13 圆钢	20cr13yg	f
3_107	3	20CrMnMi 圆钢	20crmnmiyg	f
4_110	4	-- 锯口费	jkf	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (name, password, phone, failed, get_pass, rights, confirm, theme, area, duty) FROM stdin;
朱玉树	283876e949d73baab925c56e09663915		0	0	材料采购，商品销售，库存状态，客户管理，入库明细，用户设置，采购查询，销售查询，采购入库，供应商管理，出库明细，库存设置，跨区查库存，销售出库，业务往来，单据审核，调整库存，反审单据，入库查询，批量导入，出库查询，导出数据，调库查询，	t		天津	总经理
admin	f44f1d43c7e4b8eeaabb5526198dfd8c	13920953285	0	5	材料采购，商品销售，库存状态，客户管理，入库明细，用户设置，采购查询，销售查询，采购入库，供应商管理，出库明细，库存设置，跨区查库存，销售出库，业务往来，单据审核，调整库存，反审单据，入库查询，出库查询, 批量导入，调库查询，导出数据	t	blue	天津	总经理
\.


--
-- Name: customers_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."customers_ID_seq"', 24, true);


--
-- Name: help_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.help_id_seq', 81, true);


--
-- Name: tableset2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tableset2_id_seq', 330, true);


--
-- Name: documents buy_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT buy_documents_pkey PRIMARY KEY ("单号");


--
-- Name: customers customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- Name: document_items document_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT document_items_pkey PRIMARY KEY (id);


--
-- Name: help help_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.help
    ADD CONSTRAINT help_pkey PRIMARY KEY (id);


--
-- Name: lu lu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lu
    ADD CONSTRAINT lu_pkey PRIMARY KEY ("炉号");


--
-- Name: pout_items pout_items_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pout_items
    ADD CONSTRAINT pout_items_pk PRIMARY KEY (id);


--
-- Name: products products_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pk PRIMARY KEY ("文本字段1");


--
-- Name: tableset tableset2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tableset
    ADD CONSTRAINT tableset2_pkey PRIMARY KEY (id);


--
-- Name: tree tree_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tree
    ADD CONSTRAINT tree_pkey PRIMARY KEY (num);


--
-- Name: users 用户_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "用户_pkey" PRIMARY KEY (name);


--
-- Name: document_items document_items_单号id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT "document_items_单号id_fkey" FOREIGN KEY ("单号id") REFERENCES public.documents("单号") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_items document_items_商品id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT "document_items_商品id_fkey" FOREIGN KEY ("商品id") REFERENCES public.tree(num);


--
-- Name: documents documents_客商id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_客商id_fkey" FOREIGN KEY ("客商id") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pout_items pout_items_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pout_items
    ADD CONSTRAINT pout_items_fk FOREIGN KEY ("单号id") REFERENCES public.documents("单号");


--
-- Name: pout_items pout_items_wlh_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pout_items
    ADD CONSTRAINT pout_items_wlh_fk FOREIGN KEY ("物料号") REFERENCES public.products("文本字段1");


--
-- Name: products products_单号id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_单号id_fkey" FOREIGN KEY ("单号id") REFERENCES public.documents("单号");


--
-- Name: document_items products_商品id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_items
    ADD CONSTRAINT "products_商品id_fkey" FOREIGN KEY ("商品id") REFERENCES public.tree(num);


--
-- PostgreSQL database dump complete
--

