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
-- Name: cut_length(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cut_length() RETURNS TABLE("物料号" text, "切分次数" bigint, "长度合计" bigint, "理重合计" real)
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
    "炉号" text DEFAULT ''::text,
    "执行标准" text DEFAULT ''::text
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
27	鞍山申阔机械制造有限公司	崔立健	18641270600	辽宁省鞍山市铁西区双德街45号	0.15	\N	1	崔立健	18641270600	f		asskjxzzyxgs		鞍山银行实业支行	7200 0000 0085 3077		崔立健	18641270600	鞍山申阔	辽宁省鞍山市铁西区双德街45号 鞍山申阔 	辽宁省鞍山市铁西区双德街45号 鞍山申阔 		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
28	成都若克石油技术开发有限公司	林静	18180975876	成都市新都区工业东区虎桥路199号B3-2	0.15	\N	1	林静	18180975876	f		cdrksyjskfyxgs					林静	18180975876	成都若克	成都市新都区工业东区虎桥路199号B3-2	成都市新都区工业东区虎桥路199号B3-2		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
31	天津市三一兴石油机械有限公司 	 	 18526444313	天津市津南区葛沽镇福南路29号	0.15	\N	1	 	 	f	 	tjssyxsyjxyxgs	91120112MA7EHH4G85	中国农业银行股份有限公司天津葛沽支行	02030701040025782	 	 	 	三一兴	 	 		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
26	德阳鼎宏科技有限责任公司	王晓明	13678388523	德阳市工农街道千佛村九组	0.15	\N	1	王晓明	13678388523	f	 	dydhkjyxzrgs	915106006783812067	长城华西银行股份有限公司德阳长江支行	2010100001630112	313658010028	王晓明	13678388523	 德阳鼎宏	德阳市旌阳区工农街道千佛村九组（德阳鼎宏	德阳市旌阳区工农街道千佛村九组（德阳鼎宏）		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
30	天津顺得来机械工程有限公司 	程相征	13602187847	天津市滨海新区开发区天龙路9号尼罗石油院内	0.15	\N	1	程相征	13602187847	f	 	tjsdljxgcyxgs	91120116MA05JCK64E	中国建设银行股份有限公司天津贻成豪庭支行	12050110057400000062	 	程相征	13602187847	 天津顺得来	天津市滨海新区开发区天龙路9号尼罗石油院内	天津市滨海新区开发区天龙路9号尼罗石油院内		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
29	河南逸唐石油机械有限公司	杨总	15639936535	郑州高新技术开发区金菊路16号34幢东1单元10层28号	0.15	\N	1	 	 	f	 	hnytsyjxyxgs	91410100MA44Y90Y6Q	郑州银行股份有限公司长椿路支行	90501880190448315	 	 	 	 逸唐石油	 	 		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
25	天津彩虹石油机械有限公司	 	 	 	0.15	\N	1	 	 	f	内部单位	tjchsyjxyxgs	 	 	 	 	 	 	 彩虹石油	 	 		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
32	青岛瑞信石油设备有限公司	于素娟	0532-82597816-8008	青岛即墨市蓝村镇幸福路东首南侧	0.15	\N	1	于素娟	18661602003	f		qdrxsysbyxgs	91370282794010795T	中国农业银行山东省即墨市蓝村分理处	3812 2801 0400 05567		于素娟	18661602003	青岛瑞信	山东省青岛市即墨市蓝村镇西部工业园青岛瑞信石油设备有限公司	山东省青岛市即墨市蓝村镇西部工业园青岛瑞信石油设备有限公司		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
33	天津鑫威斯特石油机械有限公司	徐超	15522118082 	天津市津南区北闸口镇国家自主创新示范区高营路8号A区	0.15	\N	1	徐超	15522118082 	f		tjxwstsyjxyxgs	91120112MA06Y5R895	中国建设银行股份有限公司天津津南支行	12050180080000002440		徐超	15522118082 	鑫威斯特	津南区八里台工业园南区春经路	津南区八里台工业园南区春经路		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
34	北京航天兴达精密机械有限公司	霍总	13552758402	北京市丰台区造甲街110号31幢一层A1-206	0.15	\N	1	霍守成	13552758482	f		bjhtxdjmjxyxgs	91110106061291235W	中国建设银行股份有限公司北京菜市口南街支行	11001176400053000248				北京航天兴达		河北省张家口市万全区东红庙小区西侧万全京仪院内		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
35	荆州诚达石油工具有限公司		0716-8080120	荆州市荆州区西环路135号	0.15	\N	1	胡蕾	177 2038 9392	f		jzcdsygjyxgs	91421000679772137J	建行北湖支行	42001626508053000680		肖魏		荆州诚达	荆州市荆州区西环路 135号 荆州诚达石油工具有限公司	荆州市荆州区西环路 135号 荆州诚达石油工具有限公司		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
36	抚顺特殊钢股份有限公司	王佳俊	13134131210		0.15	\N	1			f		fstsggfyxgs	抚钢										0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	供应商
37	大冶特殊钢有限公司	曾九全	18772261998		0.15	\N	1			f		dytsgyxgs	冶钢										0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	供应商
38	大冶特殊钢有限公司2	朱小飞	13597711352		0.15	\N	1			f		dytsgyxgs2	冶钢2										0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	供应商
39	江苏常宝普莱森钢管有限公司	周昊	18706140017		0.15	\N	1			f		jscbplsggyxgs	常宝										0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	供应商
40	中航上大高温合金股份有限公司	陈国伟	19832107995	 	0.15	\N	1			f	 	zhsdgwhjgfyxgs	 上大										0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	供应商
41	衡阳华菱钢管有限公司	周黎黎	13575105587		0.15	\N	1			f		hyhlggyxgs	衡钢										0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	供应商
42	天津市鑫东航通钢铁贸易有限公司	 	13642074115	天津市北辰区青光镇韩家墅钢材市场C区后道43号	0.15	\N	1	 	 	f	 	tjsxdhtgtmyyxgs	91120113MACQ4A17G	中国农业银行股份有限公司天津津西支行	02020201040029480	 	 	 	鑫东航通	 	 		0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
43	天津市克赛斯工贸有限公司		022-28328875	天津市津南区八里台镇科达一路16号	0.15	\N	1			f		tjskssgmyxgs	91120222744035214D	建行天津中塘支行	12001765901052501404				克赛斯				0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
44	东营市博鸿石油机械有限公司		15254696743	山东省东营市垦利区黄河路以东宜兴路以南黄河口汽配城11幢3号	0.15	\N	1			f		dysbhsyjxyxgs	91370521MA3W905C08	垦利乐安村镇银行股份有限公司开发区支行	928070100100003488				博鸿石油				0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
45	天津市通盈石油技术开发有限公司		022-65611229	天津市滨海新区旅游区鬓旅产业园13号楼五层550-3房间	0.15	\N	1			f		tjstysyjskfyxgs	91120116075901452U	中国工商银行天津市翠亨广场支行	0302098209100035371				通盈石油				0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
46	天津瑞琪森石油设备有限公司			天津东疆保税港区亚洲路6975号金融贸易中心南区1-1-916	0.15	\N	1			f		tjrqssysbyxgs	91120118MA06XBDK9N	中国银行天津河西支行	280489810470				瑞琪森				0	0	0	0	0	0	0	0	0	0	0	0	f	f	f	客户
\.


--
-- Data for Name: document_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_items (id, "单号id", "单价", "数量", "备注", "顺序", "重量", "长度", "商品id", "规格", "状态", "理重", "炉号", "执行标准") FROM stdin;
cdc75913-797f-4f4d-a6a4-c7e86df237fa	XS202312-01	50	1	料头	1	0	115	3_104	220	调质-110KSI	34.6		
e9334032-1273-46a6-a9e5-0cfb735b559c	XS202312-12	13	1		1	0	955	3_105	190	调质-110KSI	212.7		
57d9c373-9947-43ef-b068-0285e4edb348	XS202312-12	13	1		2	0	2315	3_105	220	调质-110KSI	691.3		
96fcc7c7-4069-4a27-bb0d-b6136fbd9622	XS202312-12	13	1		3	0	210	3_105	220	调质110KSI	62.7		
dafe2a0f-29fd-4a9c-b635-c5c23f2ab670	XS202312-12	13	1		4	0	730	3_105	160	调质110KSI	115.3		
6fd4c35e-02ab-4f1d-b036-e1bdbcd6f275	XS202312-12	13	1		5	0	45	3_105	160	调质110KSI	7.1		
68ae7eaf-6118-4970-90a8-6d1c15811ff7	XS202312-05	50	1		1	30.2	150	3_104	180	调质-110KSI	30.2		
fedd3aaf-2ee2-4aca-bfaa-23e8eb065a1f	XS202312-12	13	1		6	0	645	3_105	130	调质110KSI	67.3		
2c460cfb-dbf3-413a-bb89-f9a9eb79076a	XS202312-12	20	6		7	0	0	4_111	-	-	0		
3e4e4240-6e34-4036-88b6-e19f11b42752	XS202312-15	50	1	切	1	0	3000	3_104	120	调质-110KSI	268.2		
ddb8386a-5f51-4144-a828-a5dfde27d0e3	XS202312-15	45	1	整支	2	0	2940	3_104	140	调质-110KSI	357.8		
9e38c18c-727d-45e4-a66d-f0b3805cd5ce	XS202312-15	50	1	切	3	0	5000	3_104	155	调质-110KSI	745.9		
08b9d619-acee-45c6-90f8-6accc505a65a	XS202312-15	50	1	切	4	0	4200	3_104	170	调质-110KSI	753.7		
fbadadc5-008e-4ef6-8c87-4bdbc5738b20	XS202312-15	50	1	切	5	0	1000	3_104	190	调质-110KSI	224.2		
e06cf8f0-d482-4c1d-a76a-8a4686636aed	FH202312-01	50	1		1	34.6	115	3_104	220	调质-110KSI	34.6	21209122762	
7ba874e9-a64c-46d2-a38a-fedd81fe2813	XS202312-09	11.3	1	中间切开	1	0	7700	4_102	178*32	调质-110KSI	887.1		
821d21c0-4de9-44af-9a71-549bc1e6e591	XS202312-07	26.5	1		1	0	6780	4_103	127*9.19	调质-80KSI	181		
f1c986d3-8d37-4752-8f70-b06b4fa4d014	XS202312-07	26.5	2		2	0	6770	4_103	127*9.19	调质-80KSI	361.5		
e3d38bab-e926-44d4-8d22-f85423c0d419	XS202312-07	26.5	1		3	0	6790	4_103	127*9.19	调质-80KSI	181.3		
9ff6a5b7-63b0-4f50-b7bf-ed367c5099ca	XS202312-15	50	1	切	6	0	3500	3_104	200	调质-110KSI	869.3		
95e0c13c-9b26-45a0-b7fc-355d6b10eaf6	XS202312-15	45	1	整支	7	0	6150	3_104	220	调质-110KSI	1848.3		
0a9bef6a-16e0-4d81-9e9b-99f07eb51e4f	XS202312-15	50	1	切	8	0	1400	3_104	210	调质-110KSI	383.4		
442471c5-cc77-450c-a9fd-55b13abf1d3a	XS202312-10	44	1	3435切开	1	0	6100	3_104	120	调质-110KSI	545.4		
e6c09381-3ae8-4256-9c61-6585278825c1	XS202312-10	44	1	3620切开	2	0	6510	3_104	100	调质-110KSI	404.2		
ecadcfb0-ff08-4faa-a060-bb333723b454	XS202312-10	49.47	1	切定尺	3	0	2426	3_104	100	调质-110KSI	150.6		
8e11fe6c-fd92-4d60-b911-b7bb72efd184	XS202312-04	13	1	料头	1	0	298	3_105	140	调质110KSI	31.3		
f90c3cc2-e8c3-4d53-801f-1ef56734a646	CG202312-01	16.429	0	不超过30%短尺可接受	1	5000	0	3_108	80	调质-80KSI	0		QJ/DT01.24669-2021-C/0
d22c1bd1-f88f-4fbd-8949-9aa9e4218464	CG202312-01	16.429	0	不超过30%短尺可接受	2	5000	0	3_108	100	调质-80KSI	0		QJ/DT01.24669-2021-C/0
f655b061-4f1d-4a00-bf38-70968ca834ce	CG202312-01	16.429	0	不超过30%短尺可接受	3	5000	0	3_108	115	调质-80KSI	0		QJ/DT01.24669-2021-C/0
7984bd16-32da-416d-808c-d27da4d44431	CG202312-01	16.429	0	不超过30%短尺可接受	4	10000	0	3_108	135	调质-80KSI	0		QJ/DT01.24669-2021-C/0
cff58a74-ddc2-4fdb-92a9-9c7961d27441	XS202312-03	11.5	1	整支	1	0	7770	4_102	159*24	调质-110KSI	620.8		
8dc844be-2375-4cd2-9684-d38a72576398	XS202312-03	11.5	1	整支	2	0	7840	4_102	159*24	调质-110KSI	626.4		
b1f7e6db-f660-40a9-930a-3f314d5f754e	XS202312-03	11.5	1	整支	3	0	7670	4_102	159*24	调质-110KSI	612.8		
e0e29c3d-cc6a-47c9-9307-5137103b5650	XS202312-03	11.5	1	整支	4	0	7130	4_102	127*35	调质110KSI	566.2		
4f267bc6-4f20-4485-b5d3-f476d9edfc63	XS202312-03	11.5	1	整支	5	0	7175	4_102	127*35	调质110KSI	569.7		
e46cf454-078d-4ddc-9108-a7a55d7b15d6	CG202312-01	16.429	0	不超过30%短尺可接受	5	10000	0	3_108	155	调质-80KSI	0		QJ/DT01.24669-2021-C/0
97b679f9-07cb-4ec4-b2b7-61eb4621034a	FH202312-02	50	1		1	34.6	115	3_104	220	调质-110KSI	34.6	21209122762	
be5083a0-8f6a-44f5-babc-bc933e95bfd6	CG202312-01	16.429	0	不超过30%短尺可接受	6	10000	0	3_108	220	调质-80KSI	0		QJ/DT01.24669-2021-C/0
38507415-8105-4a6d-b0f1-ee99d1b9cb72	XS202312-22	50	1		1	0	200	3_104	200	调质-110KSI	49.7		QJ/DT01.24548-2021-A/0
55dfa5c9-5896-4993-b556-665c0b2eed23	XS202312-24	11.5	1	均分3段	1	0	9940	4_102	143*25	调质-110KSI	723.1		0
5f38b107-3b68-4567-84c0-415a371f21a8	XS202312-24	11.5	1	均分3段	2	0	9940	4_102	143*25	调质-110KSI	723.1		0
d9445abc-210a-490c-a3c9-5baf93f461a3	XS202312-24	11.5	1		3	0	2190	4_102	116*25	调质110KSI	122.9		0
2451053a-0198-4f5a-8b48-40ed56d73fc7	FH202312-03	13	1	由壬接头1	1	31.3	298	3_105	140	调质110KSI	36	F22306309XA	
344f9488-95d1-4a05-a003-b0aa30adc8c9	XS202312-08	11.5	1	切1410*6+余料	1	0	9630	3_105	170	调质110KSI	1717.2		
85f992dc-db8b-4baa-be22-e0c30c7aab31	XS202312-20	45	1		1	0	6750	3_104	120	调质-110KSI	603.6		0
69b0816f-a7f9-406e-bfcd-d3b8a577b3a4	XS202312-06	45	1		1	0	8340	3_104	155	调质-110KSI	1244.2		
534482b1-ce44-47df-a286-051cc2d83e48	XS202312-06	45	1		2	0	8485	3_104	155	调质-110KSI	1265.8		
edafa632-b7d4-4cd8-9df0-d8389929db51	XS202312-06	45	1		3	0	8535	3_104	155	调质-110KSI	1273.3		
18ba3a25-8cf3-475d-b532-29bbf46a661a	XS202312-06	45	1		4	0	3500	3_104	110	调质-110KSI	263		
e5a68aa4-d3f2-4c3e-bfeb-0ec7d74022b5	XS202312-11	13	2		1	0	510	3_105	110	调质-110KSI	76.2		
dfe523bd-196b-4d8a-96f5-2511bbf5bd7f	XS202312-17	12	80	变扣内管	1	0	512	4_102	121*25	调质110KSI	2424.2		
0a9e50d7-5406-4672-b1b2-2100681fe777	XS202312-17	12	160	挡环	2	0	30	4_102	146*22	调质110KSI	322.9		
c84478f4-103f-4956-a990-f245e221621c	XS202312-17	12	2	无补偿隔热管	3	0	3010	4_102	98*20	调质110KSI	231.6		
54abd4e4-ac94-439c-9dbf-e2fa223fd758	XS202312-17	12	2	无补偿隔热管	4	0	2700	4_102	121*20	调质110KSI	269		
a4656215-903b-44c6-b71b-9f657beb40c6	XS202312-17	12	4	凸耳座	5	0	122	4_102	159*24	调质110KSI	39		
3ce3ffa8-ef42-40d2-9bca-60555006540a	XS202312-17	33	12	卡瓦架	6	0	267	4_103	219*13	调质-80KSI	211.6		
972d7028-0c3a-4097-9360-657ef7b710b7	XS202312-17	25	2	主体	7	0	603	3_103	220	调质-80KSI	360.1		
9840cc24-e157-4000-a77c-5b09ffddbdec	XS202312-17	12	2	光管	8	0	810	4_102	121*25	调质-110KSI	95.9		
a6550ed1-0ec6-461e-a9b7-e7c572bf1345	XS202312-16	50	23	上接头	1	0	560	3_104	170	调质-110KSI	2311.4		
3d649a30-3a2b-4d5d-acaf-bb72aa446138	XS202312-16	25	24	中心管	2	0	990	3_103	80	调质-80KSI	938.2		
d302f211-e31a-40af-bdaf-a8a2f76de1a8	XS202312-16	25	25	壳体	3	0	820	3_103	170	调质-80KSI	3655.4		
c2be7d9c-c58f-4007-b9a7-f56ecc2e3d20	XS202312-16	25	25	弹簧下座	4	0	36	3_103	120	调质-80KSI	80		
4d4a133b-0e60-46af-b53a-ac715fa7b763	XS202312-16	25	25	弹簧上座	5	0	26	3_103	140	调质-80KSI	78.6		
486e3aed-a8aa-4362-961d-2d7709fd4288	XS202312-16	25	25	下接头	6	0	425	3_103	170	调质-80KSI	1894.6		
14f7a667-faec-4e69-97cf-07c61753791a	XS202312-02	50	1		1	0	1620	3_104	120	调质-110KSI	144.9		
0b5f8a73-2613-4018-a9db-7667fb39316a	XS202312-02	50	1		2	0	1620	3_104	100	调质-110KSI	143.9		
b371c76f-f8d0-4545-8ab7-408e1480550c	XS202312-14	50	1	切	1	0	3000	3_104	120	调质-110KSI	268.2		
88760c55-e45f-4d0e-bb4f-2f470d5bbd19	XS202312-14	45	1	整支	2	0	2940	3_104	140	调质-110KSI	357.8		
53e3c522-eece-4bdc-a18e-4a1d14d56e39	XS202312-14	50	1	切	3	0	5000	3_104	155	调质-110KSI	745.9		
f3665904-43b0-492e-bd4d-35ba8e34e67e	XS202312-14	50	1	切	4	0	4200	3_104	170	调质-110KSI	753.7		
0db24021-eea3-43c1-be54-9d8ef85e6ca0	XS202312-14	50	1	切	5	0	1000	3_104	190	调质-110KSI	224.2		
6c412d29-07a8-49f6-a957-a0e742e533f4	XS202312-14	50	1	切	6	0	3500	3_104	200	调质-110KSI	869.3		
ae89dcd1-4b2a-4528-96c7-5d5f2acc2060	XS202312-14	45	1	整支	7	0	6150	3_104	220	调质-110KSI	1848.3		
26f204f5-01d1-4283-9295-9d60e6dc9660	XS202312-14	50	1	切	8	0	1400	3_104	210	调质-110KSI	383.4		
49b05029-a030-467d-9227-7a707b569cf3	XS202312-13	12	2	钻杆变扣	1	0	508	3_105	140	调质110KSI	106.6		
60d51981-c9c3-4d72-864c-d517fcc8ce3a	XS202312-13	12	2	钻杆变扣	2	0	508	3_105	140	调质110KSI	106.6		
99944a3f-781a-4b40-ab70-fd491e69f0c7	XS202312-18	12	2	钻杆变扣	1	0	508	3_105	140	调质110KSI	122.9		
26d74b79-9225-4fba-91bd-46537a366a33	XS202312-18	12	2	钻杆变扣	2	0	508	3_105	140	调质110KSI	122.9		
f0b0b663-9c75-4ba2-9af3-49439cec5a23	XS202312-19	12	1	卡瓦	1	0	87	3_110	110	热轧	6.5		
445f7b3e-9a63-4aba-9859-e638c7814eeb	XS202312-21	50	1		1	0	1160	3_104	100	调质-110KSI	72		0
86065067-8f48-48ba-80e4-55eadb3b3064	XS202312-21	11	1		2	0	1000	3_110	150	热轧	138.8		0
a1170762-4f3a-4fd8-a32c-715718dd60ae	XS202312-23	31	1	1510倍尺切	1	0	6770	4_103	116*22	调质-80KSI	345.2		0
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents ("单号", "客商id", "日期", "应结金额", "已结金额", "是否含税", "是否欠款", "其他费用", "已记账", "经办人", "备注", "开单时间", "文本字段1", "文本字段2", "文本字段3", "文本字段4", "文本字段5", "文本字段6", "文本字段7", "文本字段8", "文本字段9", "文本字段10", "整数字段1", "整数字段2", "整数字段3", "整数字段4", "整数字段5", "实数字段1", "实数字段2", "实数字段3", "实数字段4", "实数字段5", "布尔字段1", "布尔字段2", "布尔字段3", "类别", "整数字段6", "实数字段6") FROM stdin;
KT202312-01	0	2023-12-11	0	0	f	t	0	f		专用于库存数据导入, 与后台程序中的 单号id 保持一致	2023-12-11 11:32:04.870424										已审核	0	0	0	0	0	0	0	0	0	0	f	f	t	库存导入	0	0
FH202312-01	0	2023-12-18	0	0	f	t	0	f	唐文静		2023-12-17 17:35:07.585773			CHSC-YCLCG-231229	XS202312-01	天津彩虹石油机械有限公司	CK202312-01	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	运输发货	0	0
XS202312-18	25	2023-12-19	2949.6	0	f	t	0	f	唐文静		2023-12-18 22:44:47.173412						CHSC-231232	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
XS202312-01	25	2023-12-17	1730	0	f	f	0	f	唐文静		2023-12-17 03:17:08.522404						CHSC-YCLCG-231229	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
XS202312-05	25	2023-12-18	1510	0	f	f	0	f	唐文静		2023-12-17 16:59:23.531081						CHSC-YCLCG-231224	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	t	f	t	商品销售	0	0
XS202312-04	25	2023-12-18	406.9	0	f	f	0	f	唐文静		2023-12-17 16:44:37.524026						CHSC-YCLCG-231228	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
XS202312-23	44	2023-12-19	10701.2	0	f	t	0	f	张金宝		2023-12-19 01:16:37.141993						21-WXM-230731	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
CK202312-01	25	2023-12-17	0	0	f	t	0	f	唐文静		2023-12-17 03:50:03.649888		/upload/pics/pic_CK202312-01.jpg		天津彩虹石油机械有限公司	CHSC-YCLCG-231229	XS202312-01	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	销售出库	0	0
XS202312-03	27	2023-12-17	34452.85	0	f	t	0	f	张金宝	 2023-12-28客户自提	2023-12-17 04:17:50.443542		2023-12-19		 	 	21-WXM-230718	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	t	f	t	商品销售	0	0
CK202312-03	27	2023-12-18	0	0	f	t	0	f	唐文静		2023-12-17 19:59:16.464832		/upload/pics/pic_CK202312-03.jpg		鞍山申阔机械制造有限公司	21-WXM-230718	XS202312-03	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	t	f	t	销售出库	0	0
CK202312-02	25	2023-12-17	0	0	f	t	0	f	唐文静		2023-12-17 06:01:48.660803		/upload/pics/pic_CK202312-02.jpg		天津彩虹石油机械有限公司	CHSC-YCLCG-231229	XS202312-01	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	销售出库	0	0
CK202312-06	28	2023-12-19	0	0	f	t	0	f	唐文静	 	2023-12-18 16:24:32.434077		/upload/pics/pic_CK202312-06.jpg		成都若克石油技术开发有限公司	21-WXM-230721	XS202312-06	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	销售出库	0	0
XS202312-09	31	2023-12-18	10024.23	0	f	t	0	f	张金宝		2023-12-17 19:39:56.785106		2023-12-18				21-WXM-230723	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
XS202312-07	29	2023-12-18	19180.7	0	f	t	0	f	张金宝	 	2023-12-17 17:26:50.172552		2023-12-20		 	 	21-WXM-230720	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
XS202312-10	32	2023-12-18	49232.58	0	f	t	0	f	张金宝		2023-12-17 22:27:58.036462		2023-12-19				21-WXM-230724	天津				0	0	0	0	0	0	0	0	0	0	f	f	f	商品销售	0	0
XS202312-13	25	2023-12-19	2558.4	0	f	f	0	f	唐文静		2023-12-18 17:44:53.141042						CHSC-YCLCG-231232	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	t	f	t	商品销售	0	0
XS202312-19	25	2023-12-19	78	0	f	t	0	f	唐文静		2023-12-18 22:48:36.390861						CHSC-231233	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
CG202312-01	36	2023-12-19	739305	0	f	t	0	f	朱玉树	9CR圆钢采购	2023-12-18 21:01:14.806997	 		2024-03-19				天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	材料采购	0	0
XS202312-08	30	2023-12-18	19747.8	0	f	f	0	f	张金宝	 	2023-12-17 19:20:41.840539		2023-12-19		 	 19550	21-WXM-230722	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	t	f	t	商品销售	0	0
XS202312-21	43	2023-12-19	5126.8	0	f	t	0	f	张金宝		2023-12-19 00:53:28.438946		2023-12-20				21-WXM-230730	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
CK202312-04	30	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-18 16:18:20.625265		/upload/pics/pic_CK202312-04.jpg		天津顺得来机械工程有限公司 	21-WXM-230722	XS202312-08	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	t	f	t	销售出库	0	0
XS202312-02	26	2023-12-17	14440	0	f	f	0	f	张金宝	 	2023-12-17 03:55:02.184995		 		 	 	21-WXM-230719	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
FH202312-02	0	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-18 16:06:03.204199	 		CHSC-YCLCG-231229	XS202312-01	天津彩虹石油机械有限公司	CK202312-02	天津	 	 	朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	运输发货	0	0
CK202312-07	26	2023-12-19	0	0	f	t	0	f	唐文静	 	2023-12-18 16:27:39.894739		/upload/pics/pic_CK202312-07.jpg		德阳鼎宏科技有限责任公司	21-WXM-230719	XS202312-02	天津				0	0	0	0	0	0	0	0	0	0	f	f	t	销售出库	0	0
CK202312-05	31	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-18 16:20:46.957957		/upload/pics/pic_CK202312-05.jpg		天津市三一兴石油机械有限公司 	21-WXM-230723	XS202312-09	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	销售出库	0	0
XS202312-12	34	2023-12-19	15153.2	0	f	t	0	f	张金宝		2023-12-18 16:35:45.613465		2023-12-20		 	 	21-WXM-230726	天津				0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
XS202312-06	28	2023-12-18	182083.5	0	f	t	0	f	张金宝	 已收款172800元	2023-12-17 17:01:39.160691		2023-12-19		 		21-WXM-230721	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
XS202312-14	28	2023-12-19	261509.5	0	f	t	0	f	张金宝		2023-12-18 19:34:55.958312						21-WXM-230727	天津				0	0	0	0	0	0	0	0	0	0	f	f	f	商品销售	0	0
XS202312-11	33	2023-12-18	990.6	0	f	t	0	f	张金宝	 	2023-12-18 00:37:14.740261		2023-12-19		 	 	21-WXM-230725	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	t	f	t	商品销售	0	0
CK202312-09	33	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-18 17:59:54.75525		/upload/pics/pic_CK202312-09.jpg		天津鑫威斯特石油机械有限公司	21-WXM-230725	XS202312-11	天津				0	0	0	0	0	0	0	0	0	0	t	f	f	销售出库	0	0
FH202312-03	0	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-18 23:16:15.457125	 		CHSC-YCLCG-231228	XS202312-04	天津彩虹石油机械有限公司	CK202312-10	天津	 	 	朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	运输发货	0	0
XS202312-16	25	2023-12-19	281740	0	f	t	0	f	唐文静	 	2023-12-18 22:17:44.525771		 		 	 	CHSC-231230	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
CK202312-13	25	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-19 01:05:54.910045		/upload/pics/pic_CK202312-13.jpg		天津彩虹石油机械有限公司	CHSC-231233	XS202312-19	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	销售出库	0	0
XS202312-24	45	2023-12-19	18044.65	0	f	t	0	f	张金宝		2023-12-19 01:19:36.073369						21-WXM-230732	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
XS202312-22	25	2023-12-19	2485	0	f	t	0	f	唐文静	 	2023-12-19 00:55:28.464438		 		 	 	CHSC-231229	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	t	f	t	商品销售	0	0
XS202312-17	25	2023-12-19	56576.5	0	f	t	0	f	唐文静	 	2023-12-18 22:43:04.746462		 		 	 	SHSC-231231	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
CK202312-10	25	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-18 20:01:15.024783		/upload/pics/pic_CK202312-10.jpg		天津彩虹石油机械有限公司	CHSC-YCLCG-231228	XS202312-04	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	销售出库	0	0
XS202312-20	42	2023-12-19	27162	0	f	f	0	f	张金宝		2023-12-19 00:49:00.616231		2023-12-19				21-WXM-230729	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
CK202312-12	25	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-19 01:05:15.118631				天津彩虹石油机械有限公司	CHSC-231233	XS202312-19	天津				0	0	0	0	0	0	0	0	0	0	f	f	f	销售出库	0	0
XS202312-15	28	2023-12-19	261509.5	0	f	t	0	f	张金宝		2023-12-18 19:43:16.187668						21-WXM-230727	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	商品销售	0	0
CK202312-08	33	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-18 17:31:40.78122		/upload/pics/pic_CK202312-08.jpg		天津鑫威斯特石油机械有限公司	21-WXM-230725	XS202312-11	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	t	f	t	销售出库	0	0
CK202312-11	33	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-18 20:04:04.845882		/upload/pics/pic_CK202312-11.jpg		天津鑫威斯特石油机械有限公司	21-WXM-230725	XS202312-11	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	t	f	t	销售出库	0	0
CK202312-14	25	2023-12-19	0	0	f	t	0	f	唐文静		2023-12-19 01:09:24.804529		/upload/pics/pic_CK202312-14.jpg		天津彩虹石油机械有限公司	CHSC-YCLCG-231232	XS202312-13	天津			朱玉树	0	0	0	0	0	0	0	0	0	0	f	f	t	销售出库	0	0
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
451de63f-f806-48ec-ae1b-4449ef54fcdd	CK202312-01	L395	115	1	34.6		1	34.6	50
5d1f1414-a169-4f4d-980a-d8d2279882c6	CK202312-02	L395	115	1	34.6		1	34.6	50
682f60b3-1578-4fe6-acfd-5e7108f4629c	CK202312-03	M003639	7175	1	0		1	569.7	11.5
fb21b61e-0fe1-4231-a146-0bb37ddce6ae	CK202312-03	M003635	7130	1	1147.8	1.2项重量合计	2	566.2	11.5
e88709a9-b23f-449d-bbff-eaae07509bb9	CK202312-03	M002203	7670	1	0		3	612.8	11.5
5cc9fa11-ac4a-47aa-b483-86afd3959272	CK202312-03	M002202	7840	1	0		4	626.4	11.5
7945eded-1f80-4b9d-bed9-d4146c2264c2	CK202312-03	M002201	7770	1	1869.7	3.4.5项重量合计	5	620.8	11.5
0f77f38e-cd52-4067-8e6e-52a3841fce19	CK202312-04	M003792	9630	1	1700	1410*6+余料	1	1717.2	11.5
cfc1f6ef-e848-40b5-a537-4ed2e9b0f8e8	CK202312-05	M004499	7700	1	892		1	887.1	11.3
6638e3ae-079e-4532-9759-080bd75b5c3e	CK202312-07	M004221	1620	1	141.8		1	144.9	50
f31df039-bbdc-418f-8c28-7bf630615409	CK202312-07	M005569	1620	1	100.6		2	100.6	50
826e12db-b575-4c95-90dc-bc8160df4cb4	CK202312-06	M003270	3500	1	0		1	214.4	45
910db28b-5925-4f89-bc4f-f028efe2bf55	CK202312-06	M003271	8535	1	0		2	1273.3	45
cf0ca319-c121-4ea0-af04-186fb820521f	CK202312-06	M003273	8485	1	3774.5	前3项重量	3	1265.8	45
ee7bf732-1ccf-441f-94db-cae4f7d1c1de	CK202312-06	M001904	8340	1	261.7		4	1244.2	45
25b1a3c4-25fd-4ce7-9f2e-2a0cc9583609	CK202312-08	M002134	510	2	75		1	76.2	13
a7002656-65ab-4b83-9b56-d97f7f607996	CK202312-09	M002134	510	2	75		1	76.2	13
c0e1b11f-ec36-4837-a99f-884c1ff99d22	CK202312-10	M003834	298	1	31.3	备注140*50.8	1	36	13
513864fd-67e2-41ea-ad66-ac198c524b98	CK202312-11	M002134	510	2	75		1	76.2	13
fa94ef7e-1246-42d4-a6e8-5e5fc567b0fa	CK202312-12	M000844A	87	1	6.5	卡瓦	1	6.5	12
75f1b853-8d22-4674-8780-f523c6d47445	CK202312-13	M000844-A	87	1	6.5	卡瓦	1	6.5	12
7ac09df3-324c-486c-9e6a-c5f32ce16c56	CK202312-14	M003843	508	2	106.6	140*50.8	1	122.9	12
2fdf4fc8-9612-4886-844a-01626ad4f902	CK202312-14	M003843	508	2	106.6	140*50.8	2	122.9	12
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products ("商品id", "规格型号", "出售价格", "库存下限", "停用", "备注", "单位", "文本字段1", "文本字段2", "文本字段3", "文本字段4", "整数字段1", "整数字段2", "整数字段3", "实数字段1", "实数字段2", "实数字段3", "文本字段5", "文本字段6", "文本字段7", "文本字段8", "文本字段9", "文本字段10", "整数字段4", "整数字段5", "整数字段6", "实数字段4", "实数字段5", "实数字段6", "布尔字段1", "布尔字段2", "布尔字段3", "库位", "单号id") FROM stdin;
4_101	150*10	0	72.5	f			L659	固溶时效H1100	ASTM S564/A564M-13	0D40224	2100	0	2100	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	174*12	0	37.15	f			L663	固溶时效H1100			775	0	775	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	160*22	0	109.68	f			L680	固溶时效H1100	XTG-JY-036-2020	19D2971V	1465	0	1465	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	160*22	0	67.38	f			L687	固溶时效H1100	XTG-JY-036-2020	19D2971V	900	0	900	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	160*22	0	315.94	f			L688	固溶时效H1100	XTG-JY-036-2020	19D2971V	4220	0	4220	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	160*22	0	296.1	f			L689	固溶时效H1100	XTG-JY-036-2020	19D2971V	3955	0	3955	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	160*22	0	316.69	f			L690	固溶时效H1100	XTG-JY-036-2020	19D2971V	4230	0	4230	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	150*10	0	72.5	f	150圆钢打孔		L778	固溶时效H1100	ASTM S564/A564M-13	0D40224	2100	0	2100	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	219*14	0	17.69	f			M001651	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	250	0	250	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	219*14	0	10.97	f			M001652	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	155	0	155	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	219*14	0	3.54	f			M001654	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	50	0	50	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	219*14	0	452.95	f			M001655	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	6400	0	6400	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	219*14	0	360.24	f			M001656	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	5090	0	5090	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	178*15	0	357.84	f			M001663	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	5935	0	5935	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	178*15	0	358.14	f			M001665	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	5940	0	5940	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	178*15	0	358.14	f			M001669	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	5940	0	5940	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	178*15	0	66.32	f			M001670	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	1100	0	1100	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	178*15	0	43.41	f			Z23010205	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	720	0	720	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_101	178*15	0	56.37	f			M003167	固溶时效，28-32HRC	XTG-JY-C-036-2020	2MALV21118	935	0	935	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	859.89	f			M000618	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	4260	0	4260	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	1046.6	f			M000619	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	5185	0	5185	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	394.62	f			M000620	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	1955	0	1955	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	1059.72	f			M000621	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	5250	0	5250	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	1043.57	f			M000622	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	5170	0	5170	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	1029.45	f			M000623	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	5100	0	5100	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	1029.45	f			M000624	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	5100	0	5100	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	86.8	f			M000625	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	430	0	430	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	58.54	f	带φ10偏心孔		M000626	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	290	0	290	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	1031.46	f			M000627	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	5110	0	5110	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	1473.52	f			M000628	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	7300	0	7300	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	1338.28	f			M000629	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	6630	0	6630	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	1026.42	f			M000630	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20525/1MAL20504	5085	0	5085	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	220	0	48.25	f			M000846	固溶+时效1100	ZHSD/JT-20-0136/0	1MAL20914	160	0	160	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	20	0	1.61	f			M000852	固溶	ZHSD/JT-20-0136/0	1MAL20914	645	0	645	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	170	0	414.11	f			L658	固溶+时效1100			2300	0	2300	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	160	0	318.98	f			L660	固溶+时效1100			2000	0	2000	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	160	0	278.31	f			L661	固溶+时效1100			1745	0	1745	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	150	0	583.13	f			L681	固溶+时效1100			4160	0	4160	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	150	0	53.27	f			L779	固溶+时效1100			380	0	380	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	150	0	189.24	f			L780	固溶+时效1100			1350	0	1350	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*28	0	17.44	f			Z230510-30				308	0	308	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	150	0	4.91	f			M004229	固溶时效	ZHSD/JT-20-0136/0	22306120350	35	0	35	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	150	0	645.51	f			M004230	固溶时效	ZHSD/JT-20-0136/0	22306120350	4605	0	4605	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	150	0	7.01	f			M004231	固溶时效	ZHSD/JT-20-0136/0	22306120350	50	0	50	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	150	0	15.42	f			M004166	固溶时效	ZHSD/JT-20-0136/0	22306120350	110	0	110	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002609	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002610	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.34	f			M002611	固溶时效	GB/T 1220-2007	YX2302-2136	5895	0	5895	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002612	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002613	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002614	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.34	f			M002615	固溶时效	GB/T 1220-2007	YX2302-2136	5895	0	5895	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002616	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002617	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002618	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	102.85	f			M002619	固溶时效	GB/T 1220-2007	YX2302-2136	2285	0	2285	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002620	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002621	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002622	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	85	0	265.57	f			M002623	固溶时效	GB/T 1220-2007	YX2302-2136	5900	0	5900	0	0	0	劝诚特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	180	0	96.89	f			Z23010201	固溶时效	ZHSD/JT-20-0136/0+GB/T1220-2007		480	0	480	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	200	0	1192.42	f			Z23010202	固溶时效	ZHSD/JT-20-0136/0+GB/T1220-2007		4785	0	4785	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_101	90	0	57.78	f			Z23010203	固溶时效	ZHSD/JT-20-0136/0+GB/T1220-2007		1145	0	1145	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2179.98	f			M003767	退火态	XYGN4086.4-2022-01	3075357M	7300	0	7300	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2212.83	f			M003768	退火态	XYGN4086.4-2022-01	3075357M	7410	0	7410	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2188.94	f			M003769	退火态	XYGN4086.4-2022-01	3075357M	7330	0	7330	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2197.9	f			M003770	退火态	XYGN4086.4-2022-01	3075357M	7360	0	7360	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2194.92	f			M003771	退火态	XYGN4086.4-2022-01	3075357M	7350	0	7350	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2151.61	f			M003772	退火态	XYGN4086.4-2022-01	3075357M	7205	0	7205	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2202.38	f			M003773	退火态	XYGN4086.4-2022-01	3075357M	7375	0	7375	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2200.89	f			M003774	退火态	XYGN4086.4-2022-01	3075357M	7370	0	7370	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2148.63	f			M003775	退火态	XYGN4086.4-2022-01	3075357M	7195	0	7195	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2138.18	f			M003776	退火态	XYGN4086.4-2022-01	3075357M	7160	0	7160	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2203.87	f			M003777	退火态	XYGN4086.4-2022-01	3075357M	7380	0	7380	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2203.87	f			M003778	退火态	XYGN4086.4-2022-01	3075357M	7380	0	7380	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2202.38	f			M003779	退火态	XYGN4086.4-2022-01	3075357M	7375	0	7375	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2147.14	f			M003780	退火态	XYGN4086.4-2022-01	3075357M	7190	0	7190	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2191.93	f			M003781	退火态	XYGN4086.4-2022-01	3075357M	7340	0	7340	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2250.16	f			M003782	退火态	XYGN4086.4-2022-01	3075357M	7535	0	7535	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2145.64	f			M003784	退火态	XYGN4086.4-2022-01	3075357M	7185	0	7185	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2141.16	f			M003785	退火态	XYGN4086.4-2022-01	3075357M	7170	0	7170	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2099.35	f			M003786	退火态	XYGN4086.4-2022-01	3075357M	7030	0	7030	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2190.44	f			M003787	退火态	XYGN4086.4-2022-01	3075357M	7335	0	7335	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	2088.9	f			M003788	退火态	XYGN4086.4-2022-01	3075357M	6995	0	6995	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_113	220	0	1781.32	f			M003790	退火态	XYGN4086.4-2022-01	3075357M	5965	0	5965	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	220	0	1015.34	f			M001369	热轧	GB/T3077-2015	2018358Z	3400	0	3400	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	210	0	2010.8	f			L582	退火态	GB/T 3077-2015	21EB07161	7390	0	7390	0	0	0	西宁特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	210	0	2009.44	f			L583	退火态	GB/T 3077-2015	21EB07161	7385	0	7385	0	0	0	西宁特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	210	0	340.12	f			L586	退火态	GB/T 3077-2015	21EB07161	1250	0	1250	0	0	0	西宁特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	200	0	1182.17	f	硬度不够		L517	调质-110KSI	GB/T 3077-2015	2020687	4790	0	4790	0	0	0	本钢/中兴热处理	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	200	0	1522.76	f	硬度不够		L518	调质-110KSI	GB/T 3077-2015	2020687	6170	0	6170	0	0	0	本钢/中兴热处理	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	200	0	54.3	f	硬度不够		L652	调质-110KSI	GB/T 3077-2015	2020687	220	0	220	0	0	0	本钢/中兴热处理	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	200	0	1920.1	f			L580	退火态	GB/T 3077-2015	21EB07158	7780	0	7780	0	0	0	西宁特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	200	0	1920.1	f			L581	退火态	GB/T 3077-2015	21EB07158	7780	0	7780	0	0	0	西宁特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	200	0	419.56	f			L585	退火态	GB/T 3077-2015	21EB07158	1700	0	1700	0	0	0	西宁特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	200	0	241.86	f			Z23010221	退火态	GB/T 3077-2015	21EB07158	980	0	980	0	0	0	西宁特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	200	0	103.66	f	已调硬度不够		Z23010503	退火态	GB/T 3077-2015	21EB07158	420	0	420	0	0	0	西宁特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	180	0	73.97	f	已调硬度不够		Z23010501	热轧	GB/T3077-2015	2018559Z	370	0	370	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	180	0	208.9	f	已调硬度不够		Z23010502	热轧	GB/T3077-2015	2018559Z	1045	0	1045	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	165	0	53.75	f			M003156	调质125KSI	XYGN5233-2022-01	2018878Z	320	0	320	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	165	0	369.55	f			M003157	调质125KSI	XYGN5233-2022-01	2018878Z	2200	0	2200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	165	0	19.32	f			M003158	调质125KSI	XYGN5233-2022-01	2018878Z	115	0	115	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	150	0	8.33	f			L542	退火态	西宁特钢	21EB05115	60	0	60	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	125	0	756.79	f			L574	退火态	西宁特钢	21EB07158	7850	0	7850	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	125	0	771.25	f			L575	退火态	西宁特钢	21EB07158	8000	0	8000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	125	0	771.25	f			L576	退火态	西宁特钢	21EB07158	8000	0	8000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	125	0	771.25	f			Z23010222	退火态	西宁特钢	21EB07158	8000	0	8000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	125	0	771.25	f			L561	退火态	西宁特钢	21EB07158	8000	0	8000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	125	0	771.25	f			L562	退火态	西宁特钢	21EB07158	8000	0	8000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	125	0	771.25	f			L566	退火态	西宁特钢	21EB07158	8000	0	8000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	125	0	263.57	f			L572	退火态	东北特钢	21EB07158	2734	0	2734	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	125	0	771.25	f			Z230330-1	退火态	东北特钢	21EB07158	8000	0	8000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	120	0	787.19	f			L567	退火态	东北特钢	21EB06970	8860	0	8860	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	120	0	787.19	f			L568	退火态	东北特钢	21EB06970	8860	0	8860	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	120	0	787.19	f			L569	退火态	东北特钢	21EB06970	8860	0	8860	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	120	0	787.19	f			L570	退火态	东北特钢	21EB06970	8860	0	8860	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	120	0	63.53	f			L571	退火态	东北特钢	21EB06970	715	0	715	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	120	0	396.26	f			L537	退火态	东北特钢	21EB06970	4460	0	4460	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	110	0	447.94	f			L505	热轧	本钢	18C3566	6000	0	6000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	110	0	447.94	f			L502	热轧	本钢	18C3566	6000	0	6000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	110	0	6.72	f			L645	热轧	本钢	18C3566	90	0	90	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	80	0	63.18	f			L498	热轧	本钢	2036055	1600	0	1600	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	80	0	8.49	f			L535	热轧	本钢	2036055	215	0	215	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	75	0	9.89	f			L540	退火态	西宁特钢	21EB07316	285	0	285	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	60	0	191.02	f			L546	退火态	西宁特钢	21EB06513	8600	0	8600	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	60	0	44.42	f			L553	退火态	西宁特钢	21EB06513	2000	0	2000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	40	0	59.23	f			L549	热轧	本钢	20A1762	6000	0	6000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	40	0	37.27	f			L555	热轧	本钢	20A1762	3775	0	3775	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	40	0	59.23	f			L556	热轧	本钢	20A1762	6000	0	6000	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	100	0	0.62	f			Z23010540	热轧			10	0	10	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	110	0	50.02	f			Z23010541	热轧			670	0	670	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	85	0	0.89	f			Z23010543	热轧			20	0	20	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	175	0	245.64	f	打孔		Z23010547	热轧			1300	0	1300	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	180	0	23.99	f	已调质硬度不够		Z23010552				120	0	120	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	180	0	167.92	f			L653	热轧			840	0	840	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	95	0	6.68	f			Z23010553	退火 态			120	0	120	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	170	0	12.48	f			Z23010554	热轧			70	0	70	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	170	0	57.95	f			Z23010555	热轧			325	0	325	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	60	0	1	f			M002099	调质-110KSI	本钢钢铁	20A1392	45	0	45	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	60	0	38.43	f			M002100	调质-110KSI	本钢钢铁	20A1392	1730	0	1730	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	60	0	1	f			M002101	调质-110KSI	本钢钢铁	20A1392	45	0	45	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	60	0	87.96	f			M002102	调质-110KSI	本钢钢铁	20A1392	3960	0	3960	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	60	0	2.22	f			M002106	调质-110KSI	本钢钢铁	20A1392	100	0	100	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	60	0	134.6	f			M002108	调质-110KSI	本钢钢铁	20A1392	6060	0	6060	0	0	0	GB/T 3077-2015	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	100	0	61.7	f			Z230510-7	未调			1000	0	1000	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	60	0	12.22	f			Z230510-8	未调			550	0	550	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	60	0	6.33	f			Z230510-10	未调			285	0	285	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	105	0	49.66	f	打孔40		Z230510-11	未调			730	0	730	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	100	0	0.74	f			Z230510-12	未调			12	0	12	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	110	0	38.82	f			Z230510-14	未调			520	0	520	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_102	110	0	62.71	f			Z230510-16	未调			840	0	840	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	215.9*38.1	0	1303	f			M002141	调质110KSI	ASTM A519	TX22-01664LG	7800	0	7800	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	215.9*38.1	0	1314.69	f			M002142	调质110KSI	ASTM A519	TX22-01664LG	5860	0	5860	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	203.2*28.575	0	276.25	f			L717	调质-110KSI	GA-102Rev.1	8023216A	2245	0	2245	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	120.65*31.75	0	2.37	f			L721	调质-80KSI	CA&S 0028 Rev.13/ASTM A519	8023247C	34	0	34	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	222.25*38.1	0	1176.52	f			L724	调质-110KSI	CA&A 0011 Rev.12/ASTM A519	8021764C	6800	0	6800	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	196.85*25.4	0	335.59	f			L727	调质-110KSI	CA&A 0011 Rev.12/ASTM A519	8020701C	3125	0	3125	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	146.05*25.4	0	56.3	f			L728	调质-110KSI	ARA/TS-14	1624154C	745	0	745	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	146.05*25.4	0	7.93	f			L729	调质-110KSI	ARA/TS-14	1624154C	105	0	105	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	171.5*31.75	0	876.44	f			B230110-185	调质-80KSI	API SPEC 5CT& FS-T-M-011C	TX22-06595LG	8010	0	8010	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	171.5*31.75	0	874.25	f			B230110-186	调质-80KSI	API SPEC 5CT& FS-T-M-011C	TX22-06595LG	7990	0	7990	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	171.5*31.75	0	876.44	f			B230110-187	调质-80KSI	API SPEC 5CT& FS-T-M-011C	TX22-06595LG	8010	0	8010	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	171.5*31.75	0	879.72	f			B230110-188	调质-80KSI	API SPEC 5CT& FS-T-M-011C	TX22-06595LG	8040	0	8040	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	171.5*31.75	0	611.65	f			B230110-189	调质-80KSI	API SPEC 5CT& FS-T-M-011C	TX22-06595LG	5590	0	5590	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	171.5*31.75	0	833.76	f			B230110-190	调质-80KSI	API SPEC 5CT& FS-T-M-011C	TX22-06595LG	7620	0	7620	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	158.75*25.4	0	690.76	f			M000277	调质-80KSI	XTG-RZ026-C-037-2013	2200694	8270	0	8270	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	158.75*25.4	0	53.87	f			M000278	调质-80KSI	XTG-RZ026-C-037-2013	2200694	645	0	645	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	158.75*25.4	0	709.13	f			M000279	调质-80KSI	XTG-RZ026-C-037-2013	2200694	8490	0	8490	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	158.75*25.4	0	715.81	f			M000280	调质-80KSI	XTG-RZ026-C-037-2013	2200694	8570	0	8570	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	158.75*25.4	0	666.53	f			M000322	调质-80KSI	XTG-RZ026-C-037-2013	2200694	7980	0	7980	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	158.75*25.4	0	730.85	f			L716	调质-110KSI	CA&A 0011 Rev.12/ASTM A519	2023251B	8750	0	8750	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	158.75*25.4	0	143.66	f			M000282	调质-110KSI	XTG-RZ026-C-037-2013	2200694	1720	0	1720	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	158.75*25.4	0	597.21	f			M000283	调质-110KSI	XTG-RZ026-C-037-2013	2200694	7150	0	7150	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	215.9*22.225	0	956.39	f			M000293	调质-110KSI	XTG-RZ026-C-037-2013	8023250A	9010	0	9010	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	215.9*22.225	0	857.67	f			M000294	调质-110KSI	XTG-RZ026-C-037-2013	8024417C	8080	0	8080	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	158.75*19.05	0	525.02	f			M000319	调质-110KSI	XTG-RZ026-C-037-2013	8020700B	8000	0	8000	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_104	133.4*22.23	0	4.88	f			Z23010225	调质-110KSI	WS-305RevU		80	0	80	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_110	203*28	0	722.59	f			M002758	调质110KSI	XYGN4935-2022-01	2055452A	5980	0	5980	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_110	203*28	0	14.5	f			M002760	调质110KSI	XYGN4935-2022-01	2055452A	120	0	120	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_110	203*28	0	733.46	f			M002762	调质110KSI	XYGN4935-2022-01	2055452A	6070	0	6070	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_110	203*28	0	745.55	f			M002763	调质110KSI	XYGN4935-2022-01	2055452A	6170	0	6170	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	273*32	0	1692.58	f			M004241	调质80KSI	XYGN4972-2022-01	2053576A	8900	0	8900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	273*32	0	1719.21	f			M004242	调质80KSI	XYGN4972-2022-01	2053576A	9040	0	9040	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	273*32	0	1760.1	f			M004243	调质80KSI	XYGN4972-2022-01	2053576A	9255	0	9255	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	18.68	f			M003378	调质80KSI	XYGN4972-2022-01	3071311M	115	0	115	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1085.23	f			M003903	调质80KSI	XYGN4972-2022-01	3074014M	6680	0	6680	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1088.48	f			M003904	调质80KSI	XYGN4972-2022-01	3074014M	6700	0	6700	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1085.23	f			M003905	调质80KSI	XYGN4972-2022-01	3074014M	6680	0	6680	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1080.36	f			M003914	调质80KSI	XYGN4972-2022-01	3074014M	6650	0	6650	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1085.23	f			M003915	调质80KSI	XYGN4972-2022-01	3074014M	6680	0	6680	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1080.36	f			M003916	调质80KSI	XYGN4972-2022-01	3074014M	6650	0	6650	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1091.73	f			M003917	调质80KSI	XYGN4972-2022-01	3074014M	6720	0	6720	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1070.61	f			M003918	调质80KSI	XYGN4972-2022-01	3074014M	6590	0	6590	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1019.44	f			M003919	调质80KSI	XYGN4972-2022-01	3074014M	6275	0	6275	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1094.17	f			M003920	调质80KSI	XYGN4972-2022-01	3074014M	6735	0	6735	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1060.86	f			M003921	调质80KSI	XYGN4972-2022-01	3074014M	6530	0	6530	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1093.36	f			M003922	调质80KSI	XYGN4972-2022-01	3074014M	6730	0	6730	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1092.54	f			M003923	调质80KSI	XYGN4972-2022-01	3074014M	6725	0	6725	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1087.67	f			M003924	调质80KSI	XYGN4972-2022-01	3074014M	6695	0	6695	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1094.17	f			M003925	调质80KSI	XYGN4972-2022-01	3074014M	6735	0	6735	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	41.43	f			M003926	调质80KSI	XYGN4972-2022-01	3074014M	255	0	255	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	1071.42	f			M003927	调质80KSI	XYGN4972-2022-01	3074014M	6595	0	6595	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*36	0	539.37	f			M003928	调质80KSI	XYGN4972-2022-01	3074014M	3320	0	3320	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	507.74	f			M003431	调质-80KSI	XYGN4972-2022-01	3072881M	3850	0	3850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	130.56	f			M003433	调质-80KSI	XYGN4972-2022-01	3072881M	990	0	990	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	478.73	f			M003434	调质-80KSI	XYGN4972-2022-01	3072881M	3630	0	3630	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	4.62	f			M001631	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	70	0	70	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	551.43	f			M001632	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8350	0	8350	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	545.02	f			M001633	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8253	0	8253	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	528.32	f			M001634	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8000	0	8000	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	539.54	f			M001635	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8170	0	8170	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	548.79	f			M001636	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8310	0	8310	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	555.13	f			M001637	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8406	0	8406	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	555.13	f			M001638	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8406	0	8406	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	551.76	f			M001639	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8355	0	8355	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	517.62	f			M001640	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	7838	0	7838	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	352.65	f			M001641	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	5340	0	5340	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	519.07	f			M001643	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	7860	0	7860	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	550.77	f			M001644	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8340	0	8340	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	521.71	f			M001645	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	7900	0	7900	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	536.9	f			M001646	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8130	0	8130	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	529.31	f			M001648	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8015	0	8015	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	544.17	f			M001649	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	8240	0	8240	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*13	0	13.54	f			M001650	调质-80KSI	XTG-JY-C-041-2020/FS-T-M-003	2MALV21099	205	0	205	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	1089.34	f			M002024	调质-80KSI	XYGN4972-2022-01	2055208M	8260	0	8260	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	1099.23	f			M002025	调质-80KSI	XYGN4972-2022-01	2055208M	8335	0	8335	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	1091.98	f			M002026	调质-80KSI	XYGN4972-2022-01	2055208M	8280	0	8280	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	1.98	f			M002027	调质-80KSI	XYGN4972-2022-01	2055208M	15	0	15	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	494.56	f			M002029	调质-80KSI	XYGN4972-2022-01	2055208M	3750	0	3750	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	204.42	f			M002031	调质-80KSI	XYGN4972-2022-01	2055208M	1550	0	1550	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	1078.13	f	外径217-217.1\n壁厚26.5-27		M004897	调质-80KSI	XYGN4972-2022-01	3073989M	8175	0	8175	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	1070.88	f			M004898	调质-80KSI	XYGN4972-2022-01	3073989M	8120	0	8120	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	1082.09	f			M004899	调质-80KSI	XYGN4972-2022-01	3073989M	8205	0	8205	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	1072.2	f			M004900	调质-80KSI	XYGN4972-2022-01	3073989M	8130	0	8130	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	1072.2	f			M004901	调质-80KSI	XYGN4972-2022-01	3073989M	8130	0	8130	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*28	0	1072.2	f			M004902	调质-80KSI	XYGN4972-2022-01	3073989M	8130	0	8130	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	4.42	f			M001821	调质-80KSI	XYGN4972-2022-01	2053670M	45	0	45	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	22.08	f			M001822	调质-80KSI	XYGN4972-2022-01	2053670M	225	0	225	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	1.96	f			M001825	调质-80KSI	XYGN4972-2022-01	2053670M	20	0	20	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	8.83	f			M003569	调质-80KSI	XYGN4972-2022-01	3051115M	90	0	90	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	74.59	f			M003571	调质-80KSI	XYGN4972-2022-01	3051115M	760	0	760	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	95.2	f			M003572	调质-80KSI	XYGN4972-2022-01	3051115M	970	0	970	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	242.42	f			M004336	调质-80KSI	XYGN4972-2022-01	3074014M	2470	0	2470	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	202.18	f			M004337	调质-80KSI	XYGN4972-2022-01	3074014M	2060	0	2060	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	205.13	f			M004338	调质-80KSI	XYGN4972-2022-01	3074014M	2090	0	2090	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	38.77	f			M004339	调质-80KSI	XYGN4972-2022-01	3074014M	395	0	395	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	219*20	0	247.82	f			M004340	调质-80KSI	XYGN4972-2022-01	3074014M	2525	0	2525	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	506.21	f			M003906	调质-80KSI	XYGN4972-2022-01	3074205A	8500	0	8500	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1108.2	f			M004801	调质-80KSI	XYGN5203-2022-01	3073989M	7110	0	7110	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1109.76	f			M004802	调质-80KSI	XYGN5203-2022-01	3073989M	7120	0	7120	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1078.58	f			M004803	调质-80KSI	XYGN5203-2022-01	3073989M	6920	0	6920	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1069.23	f			M004804	调质-80KSI	XYGN5203-2022-01	3073989M	6860	0	6860	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1174.44	f			M005394	调质-80KSI	XYGN5203-2022-01	3052448M	7535	0	7535	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1151.84	f			M005395	调质-80KSI	XYGN5203-2022-01	3052448M	7390	0	7390	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1187.69	f			M005396	调质-80KSI	XYGN5203-2022-01	3052448M	7620	0	7620	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1120.67	f			M005397	调质-80KSI	XYGN5203-2022-01	3076208A	7190	0	7190	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1120.67	f			M005398	调质-80KSI	XYGN5203-2022-01	3076208A	7190	0	7190	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1123.79	f			M005399	调质-80KSI	XYGN5203-2022-01	3076208A	7210	0	7210	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1122.23	f			M005400	调质-80KSI	XYGN5203-2022-01	3076208A	7200	0	7200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1103.52	f			M005401	调质-80KSI	XYGN5203-2022-01	3076208A	7080	0	7080	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1114.43	f			M005402	调质-80KSI	XYGN5203-2022-01	3076208A	7150	0	7150	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1106.64	f			M005403	调质-80KSI	XYGN5203-2022-01	3074014M	7100	0	7100	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1112.87	f			M005404	调质-80KSI	XYGN5203-2022-01	3074014M	7140	0	7140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1112.87	f			M005405	调质-80KSI	XYGN5203-2022-01	3074014M	7140	0	7140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1109.76	f			M005406	调质-80KSI	XYGN5203-2022-01	3074014M	7120	0	7120	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1078.58	f			M005407	调质-80KSI	XYGN5203-2022-01	3074014M	6920	0	6920	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1109.76	f			M005408	调质-80KSI	XYGN5203-2022-01	3074014M	7120	0	7120	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1175.22	f			M005409	调质-80KSI	XYGN5203-2022-01	3052448M	7540	0	7540	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1187.69	f			M005410	调质-80KSI	XYGN5203-2022-01	3052448M	7620	0	7620	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	215.9*34.925	0	1159.63	f			M005411	调质-80KSI	XYGN5203-2022-01	3052448M	7440	0	7440	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	970.87	f			M004531	调质-80KSI	XYGN5203-2022-01	3074511M	7890	0	7890	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	969.03	f			M004532	调质-80KSI	XYGN5203-2022-01	3074511M	7875	0	7875	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	984.41	f			M004533	调质-80KSI	XYGN5203-2022-01	3074511M	8000	0	8000	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	979.49	f			M004534	调质-80KSI	XYGN5203-2022-01	3074511M	7960	0	7960	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	984.41	f			M004535	调质-80KSI	XYGN5203-2022-01	3074511M	8000	0	8000	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	959.18	f			M004536	调质-80KSI	XYGN5203-2022-01	3074511M	7795	0	7795	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	981.33	f			M004537	调质-80KSI	XYGN5203-2022-01	3074511M	7975	0	7975	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	972.1	f			M004538	调质-80KSI	XYGN5203-2022-01	3074511M	7900	0	7900	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	992.41	f			M004539	调质-80KSI	XYGN5203-2022-01	3074511M	8065	0	8065	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	994.25	f			M004540	调质-80KSI	XYGN5203-2022-01	3074511M	8080	0	8080	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	985.64	f			M004541	调质-80KSI	XYGN5203-2022-01	3074511M	8010	0	8010	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	987.49	f			M004542	调质-80KSI	XYGN5203-2022-01	3074511M	8025	0	8025	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	980.1	f			M004543	调质-80KSI	XYGN5203-2022-01	3074511M	7965	0	7965	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	986.87	f			M004544	调质-80KSI	XYGN5203-2022-01	3074511M	8020	0	8020	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203.2*28.575	0	980.72	f			M004545	调质-80KSI	XYGN5203-2022-01	3074511M	7970	0	7970	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	793.88	f			M002003	调质-80KSI	XYGN4972-2022-01	2055044M	6570	0	6570	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	803.55	f			M002005	调质-80KSI	XYGN4972-2022-01	2055044M	6650	0	6650	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	39.88	f			M002006	调质-80KSI	XYGN4972-2022-01	2055044M	330	0	330	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	779.38	f			M002007	调质-80KSI	XYGN4972-2022-01	2055045M	6450	0	6450	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	799.32	f			M002009	调质-80KSI	XYGN4972-2022-01	2055045M	6615	0	6615	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	768.5	f			M002010	调质-80KSI	XYGN4972-2022-01	2055045M	6360	0	6360	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	787.23	f			M002602	调质-80KSI	XYGN4972-2022-01	2055045M	6515	0	6515	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	766.69	f			M002013	调质-80KSI	XYGN4972-2022-01	2055044M	6345	0	6345	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	773.34	f			M002014	调质-80KSI	XYGN4972-2022-01	2055044M	6400	0	6400	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	766.69	f			M002015	调质-80KSI	XYGN4972-2022-01	2055044M	6345	0	6345	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	773.34	f			M002016	调质-80KSI	XYGN4972-2022-01	2055044M	6400	0	6400	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	31.42	f			M002087	调质-80KSI	XYGN4972-2022-01	2055045M	260	0	260	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	42.29	f			M002089	调质-80KSI	XYGN4972-2022-01	2055045M	350	0	350	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	35.65	f			M002091	调质-80KSI	XYGN4972-2022-01	2055045M	295	0	295	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	756.42	f			M002092	调质-80KSI	XYGN4972-2022-01	2055045M	6260	0	6260	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	153.46	f			M002093	调质-80KSI	XYGN4972-2022-01	2055045M	1270	0	1270	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	2.42	f			M002094	调质-80KSI	XYGN4972-2022-01	2055045M	20	0	20	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	88.21	f			M002781	调质-80KSI	XYGN4972-2022-01	2054693A	730	0	730	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*28	0	141.98	f			M002782	调质-80KSI	XYGN4972-2022-01	2054693A	1175	0	1175	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	779.3	f			M001802	调质-80KSI	XYGN4972-2022-01	2053669M	9490	0	9490	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	767.8	f			M001803	调质-80KSI	XYGN4972-2022-01	2053669M	9350	0	9350	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	754.25	f			M001804	调质-80KSI	XYGN4972-2022-01	2053669M	9185	0	9185	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	776.01	f			M001805	调质-80KSI	XYGN4972-2022-01	2053669M	9450	0	9450	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	769.03	f			M001806	调质-80KSI	XYGN4972-2022-01	2053669M	9365	0	9365	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	5.75	f			M001812	调质-80KSI	XYGN4972-2022-01	2053669M	70	0	70	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	1.64	f			M001813	调质-80KSI	XYGN4972-2022-01	2053669M	20	0	20	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	9.85	f			M001817	调质-80KSI	XYGN4972-2022-01	2053669M	120	0	120	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	6.16	f			M001857	调质-80KSI	XYGN4972-2022-01	2074733T	75	0	75	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	514.47	f			M001858	调质-80KSI	XYGN4972-2022-01	2074733T	6265	0	6265	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	514.88	f			M001909	调质-80KSI	XYGN4972-2022-01	2074733T	6270	0	6270	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	515.7	f			M001910	调质-80KSI	XYGN4972-2022-01	2074733T	6280	0	6280	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	515.29	f			M001911	调质-80KSI	XYGN4972-2022-01	2074733T	6275	0	6275	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	500.92	f			M001912	调质-80KSI	XYGN4972-2022-01	2074733T	6100	0	6100	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	513.24	f			M001913	调质-80KSI	XYGN4972-2022-01	2074733T	6250	0	6250	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	516.52	f			M001914	调质-80KSI	XYGN4972-2022-01	2074733T	6290	0	6290	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	515.29	f			M001915	调质-80KSI	XYGN4972-2022-01	2074733T	6275	0	6275	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	500.1	f			M001916	调质-80KSI	XYGN4972-2022-01	2074733T	6090	0	6090	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	500.92	f			M001917	调质-80KSI	XYGN4972-2022-01	2074733T	6100	0	6100	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	508.31	f			M001918	调质-80KSI	XYGN4972-2022-01	2074733T	6190	0	6190	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	505.02	f			M001919	调质-80KSI	XYGN4972-2022-01	2074733T	6150	0	6150	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	428.65	f			M001920	调质-80KSI	XYGN4972-2022-01	2074733T	5220	0	5220	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	514.88	f			M001921	调质-80KSI	XYGN4972-2022-01	2074733T	6270	0	6270	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	517.34	f			M001922	调质-80KSI	XYGN4972-2022-01	2074733T	6300	0	6300	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	518.98	f			M001923	调质-80KSI	XYGN4972-2022-01	2074733T	6320	0	6320	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	516.52	f			M001925	调质-80KSI	XYGN4972-2022-01	2074733T	6290	0	6290	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	203*18	0	80.48	f			M001926	调质-80KSI	XYGN4972-2022-01	2074733T	980	0	980	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	195.5*28	0	817.68	f			M004238	调质-80KSI	XYGN4972.3-2023-01	3074011M	7070	0	7070	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	195.5*28	0	961.1	f			M004239	调质-80KSI	XYGN4972.3-2023-01	3074011M	8310	0	8310	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	195.5*28	0	962.25	f			M004240	调质-80KSI	XYGN4972.3-2023-01	3074011M	8320	0	8320	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	712	f			M004794	调质-80KSI	XYGN5203-2022-01	3074511M	6630	0	6630	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	709.85	f			M004795	调质-80KSI	XYGN5203-2022-01	3074511M	6610	0	6610	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	722.74	f			M004796	调质-80KSI	XYGN5203-2022-01	3074511M	6730	0	6730	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	709.85	f			M004797	调质-80KSI	XYGN5203-2022-01	3074511M	6610	0	6610	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	712	f			M004798	调质-80KSI	XYGN5203-2022-01	3074511M	6630	0	6630	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	738.84	f			M004799	调质-80KSI	XYGN5203-2022-01	3074511M	6880	0	6880	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	721.66	f			M004800	调质-80KSI	XYGN5203-2022-01	3074511M	6720	0	6720	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	786.1	f	预留\n外销		M005372	调质-80KSI	XYGN5203-2022-01	3074511M	7320	0	7320	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	781.8	f			M005373	调质-80KSI	XYGN5203-2022-01	3074511M	7280	0	7280	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	766.77	f			M005374	调质-80KSI	XYGN5203-2022-01	3074511M	7140	0	7140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	762.47	f			M005375	调质-80KSI	XYGN5203-2022-01	3074511M	7100	0	7100	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	785.02	f			M005376	调质-80KSI	XYGN5203-2022-01	3074511M	7310	0	7310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	778.58	f			M005377	调质-80KSI	XYGN5203-2022-01	3074511M	7250	0	7250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	769.45	f			M005378	调质-80KSI	XYGN5203-2022-01	3074511M	7165	0	7165	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	196.85*25.4	0	764.62	f			M005379	调质-80KSI	XYGN5203-2022-01	3074511M	7120	0	7120	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190*35	0	1034.12	f			M003393	调质-80KSI	XYGN4972-2022-01	3071311M	7730	0	7730	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190*35	0	936.46	f			M003394	调质-80KSI	XYGN4972-2022-01	3071311M	7000	0	7000	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	755.95	f	预留\n外销		M005380	调质-80KSI	XYGN5203-2022-01	3074511M	7310	0	7310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	722.34	f			M005381	调质-80KSI	XYGN5203-2022-01	3074511M	6985	0	6985	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	745.61	f			M005382	调质-80KSI	XYGN5203-2022-01	3074511M	7210	0	7210	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	754.91	f			M005383	调质-80KSI	XYGN5203-2022-01	3074511M	7300	0	7300	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	750.78	f			M005384	调质-80KSI	XYGN5203-2022-01	3074511M	7260	0	7260	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	744.57	f			M005385	调质-80KSI	XYGN5203-2022-01	3074511M	7200	0	7200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	734.23	f			M005386	调质-80KSI	XYGN5203-2022-01	3074511M	7100	0	7100	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	741.47	f			M005387	调质-80KSI	XYGN5203-2022-01	3074511M	7170	0	7170	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	746.12	f			M005388	调质-80KSI	XYGN5203-2022-01	3074511M	7215	0	7215	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	708.38	f			M005389	调质-80KSI	XYGN5203-2022-01	3074511M	6850	0	6850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	711.48	f			M005390	调质-80KSI	XYGN5203-2022-01	3074511M	6880	0	6880	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	708.38	f			M005391	调质-80KSI	XYGN5203-2022-01	3074511M	6850	0	6850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	730.09	f			M005392	调质-80KSI	XYGN5203-2022-01	3074511M	7060	0	7060	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	190.5*25.4	0	728.03	f			M005393	调质-80KSI	XYGN5203-2022-01	3074511M	7040	0	7040	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	686.9	f			M004773	调质-80KSI	XYGN4972-2022-01	3073626A	8390	0	8390	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	670.12	f			M004774	调质-80KSI	XYGN4972-2022-01	3073626A	8185	0	8185	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	664.38	f			M004775	调质-80KSI	XYGN4972-2022-01	3073626A	8115	0	8115	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	662.34	f			M004776	调质-80KSI	XYGN4972-2022-01	3073626A	8090	0	8090	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	650.06	f			M004777	调质-80KSI	XYGN4972-2022-01	3073626A	7940	0	7940	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	685.26	f			M004778	调质-80KSI	XYGN4972-2022-01	3073626A	8370	0	8370	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	686.08	f			M004779	调质-80KSI	XYGN4972-2022-01	3073626A	8380	0	8380	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	653.33	f			M004780	调质-80KSI	XYGN4972-2022-01	3073626A	7980	0	7980	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	650.06	f			M004782	调质-80KSI	XYGN4972-2022-01	3073626A	7940	0	7940	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	672.98	f			M004783	调质-80KSI	XYGN4972-2022-01	3073626A	8220	0	8220	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	650.88	f			M004784	调质-80KSI	XYGN4972-2022-01	3073626A	7950	0	7950	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	668.07	f			M004785	调质-80KSI	XYGN4972-2022-01	3073626A	8160	0	8160	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	665.61	f			M004786	调质-80KSI	XYGN4972-2022-01	3073626A	8130	0	8130	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	690.17	f			M004787	调质-80KSI	XYGN4972-2022-01	3073626A	8430	0	8430	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	651.69	f			M004788	调质-80KSI	XYGN4972-2022-01	3073626A	7960	0	7960	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	186*20	0	650.06	f			M004789	调质-80KSI	XYGN4972-2022-01	3073626A	7940	0	7940	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	184.5*38.5	0	916.24	f			M004083	调质-80KSI	XYGN4972.3-2023-01	3074011M	6610	0	6610	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	184.5*38.5	0	961.29	f			M004084	调质-80KSI	XYGN4972.3-2023-01	3074011M	6935	0	6935	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	184.5*38.5	0	527.43	f			M004085	调质-80KSI	XYGN4972.3-2023-01	3074011M	3805	0	3805	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	639.14	f			M004739	调质-80KSI	XYGN4972-2022-01	3073671M	6340	0	6340	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	704.66	f			M004740	调质-80KSI	XYGN4972-2022-01	3073671M	6990	0	6990	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	695.09	f			M004741	调质-80KSI	XYGN4972-2022-01	3073671M	6895	0	6895	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	702.65	f			M004742	调质-80KSI	XYGN4972-2022-01	3073671M	6970	0	6970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	670.89	f			M004743	调质-80KSI	XYGN4972-2022-01	3073671M	6655	0	6655	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	717.77	f			M004744	调质-80KSI	XYGN4972-2022-01	3073671M	7120	0	7120	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	688.53	f			M004745	调质-80KSI	XYGN4972-2022-01	3073671M	6830	0	6830	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	700.63	f			M004746	调质-80KSI	XYGN4972-2022-01	3073671M	6950	0	6950	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	697.61	f			M004747	调质-80KSI	XYGN4972-2022-01	3073671M	6920	0	6920	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	694.08	f			M004748	调质-80KSI	XYGN4972-2022-01	3073671M	6885	0	6885	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	668.37	f			M004749	调质-80KSI	XYGN4972-2022-01	3073671M	6630	0	6630	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	706.68	f			M004750	调质-80KSI	XYGN4972-2022-01	3073671M	7010	0	7010	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	732.89	f			M004751	调质-80KSI	XYGN4972-2022-01	3073671M	7270	0	7270	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	698.61	f			M004752	调质-80KSI	XYGN4972-2022-01	3073671M	6930	0	6930	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	723.82	f			M004753	调质-80KSI	XYGN4972-2022-01	3073671M	7180	0	7180	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	673.41	f			M004754	调质-80KSI	XYGN4972-2022-01	3073671M	6680	0	6680	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	515.88	f			M005365	调质-80KSI	XYGN4972-2022-01	3073671A	7450	0	7450	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	562.96	f			M005366	调质-80KSI	XYGN4972-2022-01	3073671A	8130	0	8130	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	533.88	f			M005367	调质-80KSI	XYGN4972-2022-01	3073671A	7710	0	7710	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	573.35	f			M005368	调质-80KSI	XYGN4972-2022-01	3073671A	8280	0	8280	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	42.59	f			M005369	调质-80KSI	XYGN4972-2022-01	3073671A	615	0	615	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	553.96	f			M005370	调质-80KSI	XYGN4972-2022-01	3073671A	8000	0	8000	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	558.12	f			M005371	调质-80KSI	XYGN4972-2022-01	3073671A	8060	0	8060	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	514.6	f			M004072	调质-80KSI	XYGN4972-2022-01	3073671M	7400	0	7400	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	538.25	f			M004073	调质-80KSI	XYGN4972-2022-01	3073671M	7740	0	7740	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	509.74	f			M004074	调质-80KSI	XYGN4972-2022-01	3073671M	7330	0	7330	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	536.86	f			M004075	调质-80KSI	XYGN4972-2022-01	3073671M	7720	0	7720	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	537.9	f			M004076	调质-80KSI	XYGN4972-2022-01	3073671M	7735	0	7735	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	514.6	f			M004077	调质-80KSI	XYGN4972-2022-01	3073671M	7400	0	7400	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	555.63	f			M004078	调质-80KSI	XYGN4972-2022-01	3073671M	7990	0	7990	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	537.21	f			M004079	调质-80KSI	XYGN4972-2022-01	3073671M	7725	0	7725	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	520.17	f			M004080	调质-80KSI	XYGN4972-2022-01	3073671M	7480	0	7480	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	537.55	f			M004081	调质-80KSI	XYGN4972-2022-01	3073671M	7730	0	7730	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	161*20	0	556.33	f			M004082	调质-80KSI	XYGN4972-2022-01	3073671M	8000	0	8000	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	675.07	f			M003117	调质-80KSI	XYGN4972-2022-01	3050996M	8760	0	8760	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	671.99	f			M003118	调质-80KSI	XYGN4972-2022-01	3050996M	8720	0	8720	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	698.96	f			M003119	调质-80KSI	XYGN4972-2022-01	3050996M	9070	0	9070	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	698.96	f			M003120	调质-80KSI	XYGN4972-2022-01	3050996M	9070	0	9070	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	71.67	f			M003121	调质-80KSI	XYGN4972-2022-01	2055653M	930	0	930	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	67.04	f			M003123	调质-80KSI	XYGN4972-2022-01	2055653M	870	0	870	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	228.88	f			M003124	调质-80KSI	XYGN4972-2022-01	2055653M	2970	0	2970	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	757.52	f			M004576	调质-80KSI	XYGN4972-2022-01	3052131M	9830	0	9830	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	757.52	f			M004577	调质-80KSI	XYGN4972-2022-01	3052131M	9830	0	9830	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	766	f			M004578	调质-80KSI	XYGN4972-2022-01	3052131M	9940	0	9940	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	752.9	f			M004579	调质-80KSI	XYGN4972-2022-01	3052131M	9770	0	9770	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	764.07	f			M004580	调质-80KSI	XYGN4972-2022-01	3052131M	9915	0	9915	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	732.48	f			M004581	调质-80KSI	XYGN4972-2022-01	3052131M	9505	0	9505	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	731.32	f	外径148-148.6\n壁厚24.8-26		M004890	调质-80KSI	XYGN4972-2022-01	3073626A	9490	0	9490	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	762.92	f			M004891	调质-80KSI	XYGN4972-2022-01	3073626A	9900	0	9900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	766	f			M004892	调质-80KSI	XYGN4972-2022-01	3073626A	9940	0	9940	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	750.59	f			M004893	调质-80KSI	XYGN4972-2022-01	3073626A	9740	0	9740	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	766	f			M004894	调质-80KSI	XYGN4972-2022-01	3073626A	9940	0	9940	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	747.51	f			M004895	调质-80KSI	XYGN4972-2022-01	3073626A	9700	0	9700	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	770.63	f			M004896	调质-80KSI	XYGN4972-2022-01	3073626A	10000	0	10000	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	457.97	f			M003125	调质-80KSI	XYGN4972-2022-01	3072161M	7690	0	7690	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	454.99	f			M003126	调质-80KSI	XYGN4972-2022-01	3072161M	7640	0	7640	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	455.59	f			M003127	调质-80KSI	XYGN4972-2022-01	3072161M	7650	0	7650	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	457.97	f			M003128	调质-80KSI	XYGN4972-2022-01	3072161M	7690	0	7690	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	457.97	f			M003129	调质-80KSI	XYGN4972-2022-01	3072161M	7690	0	7690	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	457.97	f			M003130	调质-80KSI	XYGN4972-2022-01	3072161M	7690	0	7690	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	451.42	f			M003131	调质-80KSI	XYGN4972-2022-01	3072161M	7580	0	7580	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	453.8	f			M003132	调质-80KSI	XYGN4972-2022-01	3072161M	7620	0	7620	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	453.8	f			M003133	调质-80KSI	XYGN4972-2022-01	3072161M	7620	0	7620	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	453.8	f			M003134	调质-80KSI	XYGN4972-2022-01	3072161M	7620	0	7620	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	454.99	f			M003135	调质-80KSI	XYGN4972-2022-01	3072161M	7640	0	7640	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	457.97	f			M003136	调质-80KSI	XYGN4972-2022-01	3072161M	7690	0	7690	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	506.51	f			M003907	调质-80KSI	XYGN4972-2022-01	3074205A	8505	0	8505	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	510.97	f			M003908	调质-80KSI	XYGN4972-2022-01	3074205A	8580	0	8580	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	510.67	f			M003909	调质-80KSI	XYGN4972-2022-01	3074205A	8575	0	8575	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	383.82	f			M003910	调质-80KSI	XYGN4972-2022-01	3074205A	6445	0	6445	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	379.36	f			M003911	调质-80KSI	XYGN4972-2022-01	3074205A	6370	0	6370	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	385.61	f			M003912	调质-80KSI	XYGN4972-2022-01	3074205A	6475	0	6475	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	385.61	f			M003913	调质-80KSI	XYGN4972-2022-01	3074205A	6475	0	6475	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	379.95	f			M004086	调质-80KSI	XYGN4972-2022-01	3074205A	6380	0	6380	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	385.61	f			M004087	调质-80KSI	XYGN4972-2022-01	3074205A	6475	0	6475	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	373.7	f			M004089	调质-80KSI	XYGN4972-2022-01	3074205A	6275	0	6275	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	136*21	0	371.91	f			M004090	调质-80KSI	XYGN4972-2022-01	3074205A	6245	0	6245	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	426.56	f			M004244	调质-80KSI	XYGN4972-2022-01	2016505Z	9085	0	9085	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	378.91	f			M004245	调质-80KSI	XYGN4972-2022-01	2016505Z	8070	0	8070	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	394.4	f			M004246	调质-80KSI	XYGN4972-2022-01	2016505Z	8400	0	8400	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	414.12	f			M004247	调质-80KSI	XYGN4972-2022-01	2016505Z	8820	0	8820	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	389.24	f			M004248	调质-80KSI	XYGN4972-2022-01	2016505Z	8290	0	8290	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	386.42	f			M004249	调质-80KSI	XYGN4972-2022-01	2016505Z	8230	0	8230	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	339	f			M004250	调质-80KSI	XYGN4972-2022-01	2016505Z	7220	0	7220	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	412.71	f			M004251	调质-80KSI	XYGN4972-2022-01	2016505Z	8790	0	8790	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	408.72	f			M004252	调质-80KSI	XYGN4972-2022-01	2016505Z	8705	0	8705	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	419.29	f			M004253	调质-80KSI	XYGN4972-2022-01	2016505Z	8930	0	8930	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	415.06	f			M004254	调质-80KSI	XYGN4972-2022-01	2016505Z	8840	0	8840	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	389	f			M004255	调质-80KSI	XYGN4972-2022-01	2016505Z	8285	0	8285	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	423.98	f			M004256	调质-80KSI	XYGN4972-2022-01	2016505Z	9030	0	9030	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*16	0	423.98	f			M004257	调质-80KSI	XYGN4972-2022-01	2016505Z	9030	0	9030	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	21.77	f			M003528	调质-80KSI	XYGN4972-2022-01	3073018A	310	0	310	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	514.8	f			M003531	调质-80KSI	XYGN4972-2022-01	3073018A	7330	0	7330	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	517.96	f			M003532	调质-80KSI	XYGN4972-2022-01	3073018A	7375	0	7375	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	34.41	f			M003535	调质-80KSI	XYGN4972-2022-01	3073018A	490	0	490	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	10.89	f			M003536	调质-80KSI	XYGN4972-2022-01	3073018A	155	0	155	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	21.77	f			M003539	调质-80KSI	XYGN4972-2022-01	3073018A	310	0	310	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	233.52	f			M003540	调质-80KSI	XYGN4972-2022-01	3073018A	3325	0	3325	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	44.18	f			M003543	调质-80KSI	XYGN4972-2022-01	3073018A	629	0	629	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	42.84	f			M003544	调质-80KSI	XYGN4972-2022-01	3073018A	610	0	610	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	44.18	f			M003545	调质-80KSI	XYGN4972-2022-01	3073018A	629	0	629	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	14.96	f			M003546	调质-80KSI	XYGN4972-2022-01	3073018A	213	0	213	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	2.81	f			M003547	调质-80KSI	XYGN4972-2022-01	3073018A	40	0	40	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	42.14	f			M003549	调质-80KSI	XYGN4972-2022-01	3073018A	600	0	600	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*32	0	47.13	f			M003550	调质-80KSI	XYGN4972-2022-01	3073018A	671	0	671	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	168*20	0	5.47	f			L619	调质-80KSI	XTG-JY-C-010-2020	0MALV20331	75	0	75	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	168*20	0	80.29	f			L620	调质-80KSI	XTG-JY-C-010-2020	0MALV20331	1100	0	1100	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	168*20	0	48.54	f			L609	调质-80KSI	XTG-JY-C-010-2020	21D0347V	665	0	665	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	168*20	0	394.17	f			L621	调质-80KSI	XTG-JY-C-010-2020	0MALV20331	5400	0	5400	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	168*20	0	104.02	f			L622	调质-80KSI	XTG-JY-C-010-2020	0MALV20331	1425	0	1425	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*35	0	2.54	f			M002790	调质-80KSI	XYGN4972-2022-01	3070668M	30	0	30	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*35	0	32.14	f			M002791	调质-80KSI	XYGN4972-2022-01	3070668M	380	0	380	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*35	0	510.04	f			M002792	调质-80KSI	XYGN4972-2022-01	3070668M	6030	0	6030	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*35	0	225.84	f			M003159	调质-80KSI	XYGN4972-2022-01	3070668M	2670	0	2670	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*35	0	16.07	f			M003163	调质-80KSI	XYGN4972-2022-01	3070668M	190	0	190	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*35	0	21.15	f			M003164	调质-80KSI	XYGN4972-2022-01	3070668M	250	0	250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*13	0	186.12	f			L695	调质-80KSI	XTG-JY-C-041-2021/FS-T-M-003	2042973V	7540	0	7540	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*13	0	192.05	f			L697	调质-80KSI	XTG-JY-C-041-2021/FS-T-M-003	2042973V	7780	0	7780	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*13	0	191.06	f			L698	调质-80KSI	XTG-JY-C-041-2021/FS-T-M-003	2042973V	7740	0	7740	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*13	0	190.07	f			L701	调质-80KSI	XTG-JY-C-041-2021/FS-T-M-003	2042973V	7700	0	7700	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	505.97	f			M003200	调质-80KSI	XYGN4972-2022-01	3071650M	8260	0	8260	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	502.91	f			M003201	调质-80KSI	XYGN4972-2022-01	3071650M	8210	0	8210	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	517.61	f			M003202	调质-80KSI	XYGN4972-2022-01	3071650M	8450	0	8450	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	502.91	f			M003203	调质-80KSI	XYGN4972-2022-01	3071650M	8210	0	8210	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	499.84	f			M003204	调质-80KSI	XYGN4972-2022-01	3071650M	8160	0	8160	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	209.49	f			M003205	调质-80KSI	XYGN4972-2022-01	3071650M	3420	0	3420	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	464.62	f			M003206	调质-80KSI	XYGN4972-2022-01	3071650M	7585	0	7585	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	531.08	f			M003207	调质-80KSI	XYGN4972-2022-01	3071650M	8670	0	8670	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	505.36	f			M003208	调质-80KSI	XYGN4972-2022-01	3071650M	8250	0	8250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	499.84	f			M003209	调质-80KSI	XYGN4972-2022-01	3071650M	8160	0	8160	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	523.12	f			M003210	调质-80KSI	XYGN4972-2022-01	3071650M	8540	0	8540	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	700.64	f			M003211	调质-80KSI	XYGN4972-2022-01	3050996M	9060	0	9060	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	702.96	f			M003212	调质-80KSI	XYGN4972-2022-01	3050996M	9090	0	9090	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	700.64	f			M003213	调质-80KSI	XYGN4972-2022-01	3050996M	9060	0	9060	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	692.14	f			M003214	调质-80KSI	XYGN4972-2022-01	3050996M	8950	0	8950	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	556.8	f			M003215	调质-80KSI	XYGN4972-2022-01	3050996M	7200	0	7200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	771.02	f			M003216	调质-80KSI	XYGN4972-2022-01	3050996M	9970	0	9970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	690.59	f			M003217	调质-80KSI	XYGN4972-2022-01	3050996M	8930	0	8930	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	762.51	f			M003218	调质-80KSI	XYGN4972-2022-01	3050996M	9860	0	9860	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	762.9	f			M003219	调质-80KSI	XYGN4972-2022-01	3050996M	9865	0	9865	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	760.19	f			M003714	调质-80KSI	XYGN4972-2022-01	3071650M	9830	0	9830	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	761.74	f			M003715	调质-80KSI	XYGN4972-2022-01	3071650M	9850	0	9850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	761.74	f			M003716	调质-80KSI	XYGN4972-2022-01	3071650M	9850	0	9850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	762.51	f			M003717	调质-80KSI	XYGN4972-2022-01	3071650M	9860	0	9860	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	767.15	f			M003718	调质-80KSI	XYGN4972-2022-01	3071650M	9920	0	9920	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	767.92	f			M003719	调质-80KSI	XYGN4972-2022-01	3071650M	9930	0	9930	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	765.6	f			M003720	调质-80KSI	XYGN4972-2022-01	3071650M	9900	0	9900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	764.06	f			M003721	调质-80KSI	XYGN4972-2022-01	3071650M	9880	0	9880	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	756.32	f			M003722	调质-80KSI	XYGN4972-2022-01	3071650M	9780	0	9780	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	756.32	f			M003723	调质-80KSI	XYGN4972-2022-01	3071650M	9780	0	9780	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	773.34	f			M003724	调质-80KSI	XYGN4972-2022-01	3071650M	10000	0	10000	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	761.74	f			M003725	调质-80KSI	XYGN4972-2022-01	3071650M	9850	0	9850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	761.74	f			M003726	调质-80KSI	XYGN4972-2022-01	3071650M	9850	0	9850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	768.7	f			M003727	调质-80KSI	XYGN4972-2022-01	3071650M	9940	0	9940	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	42.38	f			M000067	调质-80KSI	XYGN4018.1-2021-02	2050596M	550	0	550	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	38.73	f			M002057	调质-80KSI	XYGN4972-2022-01	2055049M	610	0	610	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	234.95	f			M002062	调质-80KSI	XYGN4972-2022-01	2055049M	3700	0	3700	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	464.82	f			M002064	调质-80KSI	XYGN4972-2022-01	2055049M	7320	0	7320	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	461.96	f			M002066	调质-80KSI	XYGN4972-2022-01	2055049M	7275	0	7275	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	461.96	f			M002068	调质-80KSI	XYGN4972-2022-01	2055049M	7275	0	7275	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	464.82	f			M002069	调质-80KSI	XYGN4972-2022-01	2055049M	7320	0	7320	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	453.39	f			M003221	调质-80KSI	XYGN4972-2022-01	3072161M	7140	0	7140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	442.59	f			M003222	调质-80KSI	XYGN4972-2022-01	3072161M	6970	0	6970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	436.24	f			M003223	调质-80KSI	XYGN4972-2022-01	3072161M	6870	0	6870	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	441.32	f			M003224	调质-80KSI	XYGN4972-2022-01	3072161M	6950	0	6950	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	442.59	f			M003225	调质-80KSI	XYGN4972-2022-01	3072161M	6970	0	6970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	441.32	f			M003226	调质-80KSI	XYGN4972-2022-01	3072161M	6950	0	6950	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	441.32	f			M003227	调质-80KSI	XYGN4972-2022-01	3072161M	6950	0	6950	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	442.59	f			M003228	调质-80KSI	XYGN4972-2022-01	3072161M	6970	0	6970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	439.42	f			M003229	调质-80KSI	XYGN4972-2022-01	3072161M	6920	0	6920	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	439.42	f			M003230	调质-80KSI	XYGN4972-2022-01	3072161M	6920	0	6920	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	128*25	0	442.59	f			M003231	调质-80KSI	XYGN4972-2022-01	3072161M	6970	0	6970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*35	0	19.26	f			M002374	调质-80KSI	XYGN4972-2022-01	2074709T	180	0	180	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*35	0	27.29	f			M002377	调质-80KSI	XYGN4972-2022-01	2053826M	255	0	255	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*35	0	83.48	f			M002379	调质-80KSI	XYGN4972-2022-01	2054509M	780	0	780	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*26	0	699.25	f			M003729	调质-80KSI	XYGN4972.3-2023-01	3071650M	8200	0	8200	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*24	0	208.53	f			M003396	调质-80KSI	XYGN4972-2022-01	3050376M	2610	0	2610	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*22	0	37.91	f			M000083	调质-80KSI	XYGN4018.1-2021-02	2050595M	510	0	510	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*22	0	52.77	f			M000084	调质-80KSI	XYGN4018.1-2021-02	2050595M	710	0	710	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*24	0	761.43	f			M003153	调质-80KSI	XYGN4972-2022-01	2055585A	9530	0	9530	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*24	0	18.38	f			M003154	调质-80KSI	XYGN4972-2022-01	2055585A	230	0	230	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*24	0	761.43	f			M003155	调质-80KSI	XYGN4972-2022-01	2055585A	9530	0	9530	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	29.1	f			M000096	调质-80KSI	XYGN4018.1-2021-02	1054937M	400	0	400	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	140*28	0	6.96	f			M001866	调质-80KSI	XYGN4972-2022-01	2051591M	90	0	90	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	145	f			M000114	调质-80KSI	XTG-JT-028-2019	119V-1547	4900	0	4900	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	248.57	f			M000116	调质-80KSI	XTG-JT-028-2019	119V-1547	8400	0	8400	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	242.95	f			M000117	调质-80KSI	XTG-JT-028-2019	119V-1547	8210	0	8210	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	253.01	f			M000118	调质-80KSI	XTG-JT-028-2019	119V-1547	8550	0	8550	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	251.53	f			M000119	调质-80KSI	XTG-JT-028-2019	119V-1547	8500	0	8500	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	247.39	f			M000120	调质-80KSI	XTG-JT-028-2019	119V-1547	8360	0	8360	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	248.57	f			M000121	调质-80KSI	XTG-JT-028-2019	119V-1547	8400	0	8400	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	247.69	f			M000122	调质-80KSI	XTG-JT-028-2019	119V-1547	8370	0	8370	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	251.24	f			M000123	调质-80KSI	XTG-JT-028-2019	119V-1547	8490	0	8490	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	247.98	f			M000124	调质-80KSI	XTG-JT-028-2019	119V-1547	8380	0	8380	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	163.94	f			M000126	调质-80KSI	XTG-JT-028-2019	119V-1547	5540	0	5540	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	371.26	f			M003173	调质-80KSI	XYGN4972-2022-01	3072161M	7280	0	7280	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	359.27	f			M003174	调质-80KSI	XYGN4972-2022-01	3072161M	7045	0	7045	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	381.46	f			M003176	调质-80KSI	XYGN4972-2022-01	3072161M	7480	0	7480	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	385.03	f			M003177	调质-80KSI	XYGN4972-2022-01	3072161M	7550	0	7550	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	385.54	f			M003178	调质-80KSI	XYGN4972-2022-01	3072161M	7560	0	7560	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	378.4	f			M003179	调质-80KSI	XYGN4972-2022-01	3072161M	7420	0	7420	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	377.89	f			M003180	调质-80KSI	XYGN4972-2022-01	3072161M	7410	0	7410	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	392.68	f			M003181	调质-80KSI	XYGN4972-2022-01	3072161M	7700	0	7700	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	378.4	f			M003182	调质-80KSI	XYGN4972-2022-01	3072161M	7420	0	7420	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	227.96	f			M003183	调质-80KSI	XYGN4972-2022-01	3072161M	4470	0	4470	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	385.54	f			M003184	调质-80KSI	XYGN4972-2022-01	3072161M	7560	0	7560	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	383.75	f			M003185	调质-80KSI	XYGN4972-2022-01	3072161M	7525	0	7525	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	392.93	f			M003186	调质-80KSI	XYGN4972-2022-01	3072161M	7705	0	7705	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	370.75	f			M003187	调质-80KSI	XYGN4972-2022-01	3072161M	7270	0	7270	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	382.48	f			M003188	调质-80KSI	XYGN4972-2022-01	3072161M	7500	0	7500	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	374.83	f			M003189	调质-80KSI	XYGN4972-2022-01	3072161M	7350	0	7350	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	354.94	f			M003190	调质-80KSI	XYGN4972-2022-01	3072161M	6960	0	6960	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	354.43	f			M003191	调质-80KSI	XYGN4972-2022-01	3072161M	6950	0	6950	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	359.02	f			M003192	调质-80KSI	XYGN4972-2022-01	3072161M	7040	0	7040	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	360.04	f			M003193	调质-80KSI	XYGN4972-2022-01	3072161M	7060	0	7060	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	345.25	f			M003194	调质-80KSI	XYGN4972-2022-01	3072161M	6770	0	6770	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	356.47	f			M003195	调质-80KSI	XYGN4972-2022-01	3072161M	6990	0	6990	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	352.9	f			M003196	调质-80KSI	XYGN4972-2022-01	3072161M	6920	0	6920	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	379.42	f			M003197	调质-80KSI	XYGN4972-2022-01	3072161M	7440	0	7440	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	383.5	f			M003198	调质-80KSI	XYGN4972-2022-01	3072161M	7520	0	7520	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	385.54	f			M003247	调质-80KSI	XYGN4972-2022-01	3072161M	7560	0	7560	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	6.88	f			M002071	调质-80KSI	XYGN4972-2022-01	2055048M	155	0	155	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	2.22	f			M002072	调质-80KSI	XYGN4972-2022-01	2055048M	50	0	50	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	15.31	f			M002073	调质-80KSI	XYGN4972-2022-01	2055048M	345	0	345	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	2.22	f			M002081	调质-80KSI	XYGN4972-2022-01	2055048M	50	0	50	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	11.32	f			M002082	调质-80KSI	XYGN4972-2022-01	2055048M	255	0	255	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	2.09	f			M000150	调质-80KSI		2050592M	35	0	35	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	7.18	f			M000151	调质-80KSI		2050592M	120	0	120	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	31.1	f			M000152	调质-80KSI		2050592M	520	0	520	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	1.2	f			M000164	调质-80KSI		2050592M	20	0	20	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	20.93	f			M000166	调质-80KSI		2050592M	350	0	350	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	20.33	f			M000167	调质-80KSI		2050592M	340	0	340	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	20.33	f			M000168	调质-80KSI		2050592M	340	0	340	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	15.55	f			M000169	调质-80KSI		2050592M	260	0	260	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	20.33	f			M000170	调质-80KSI		2050592M	340	0	340	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	22.13	f			M000171	调质-80KSI		2050592M	370	0	370	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*25	0	114.82	f			M000172	调质-80KSI		2050592M	1920	0	1920	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	2.91	f			M001753	调质-80KSI	XYGN4972-2022-01	2053515M	40	0	40	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	5.46	f			M001755	调质-80KSI	XYGN4972-2022-01	2053515M	75	0	75	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	7.64	f			M001759	调质-80KSI	XYGN4972-2022-01	2053515M	105	0	105	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	3.27	f			M001760	调质-80KSI	XYGN4972-2022-01	2053515M	45	0	45	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	20.73	f			M001761	调质-80KSI	XYGN4972-2022-01	2053515M	285	0	285	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	3.64	f			M001762	调质-80KSI	XYGN4972-2022-01	2053515M	50	0	50	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	3.27	f			M001764	调质-80KSI	XYGN4972-2022-01	2053515M	45	0	45	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	5.46	f			M001767	调质-80KSI	XYGN4972-2022-01	2053515M	75	0	75	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	2.91	f			M001770	调质-80KSI	XYGN4972-2022-01	2053515M	40	0	40	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	6.18	f			M001773	调质-80KSI	XYGN4972-2022-01	2053515M	85	0	85	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	510.68	f			M004755	调质-80KSI	XYGN4972-2022-01	3074205A	7020	0	7020	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	504.14	f			M004756	调质-80KSI	XYGN4972-2022-01	3074205A	6930	0	6930	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	507.05	f			M004757	调质-80KSI	XYGN4972-2022-01	3074205A	6970	0	6970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	512.87	f			M004758	调质-80KSI	XYGN4972-2022-01	3074205A	7050	0	7050	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	512.87	f			M004759	调质-80KSI	XYGN4972-2022-01	3074205A	7050	0	7050	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	507.77	f			M004760	调质-80KSI	XYGN4972-2022-01	3074205A	6980	0	6980	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	523.78	f			M004761	调质-80KSI	XYGN4972-2022-01	3074205A	7200	0	7200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	507.77	f			M004762	调质-80KSI	XYGN4972-2022-01	3074205A	6980	0	6980	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	513.59	f			M004763	调质-80KSI	XYGN4972-2022-01	3074205A	7060	0	7060	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	512.87	f			M004764	调质-80KSI	XYGN4972-2022-01	3074205A	7050	0	7050	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	510.68	f			M004765	调质-80KSI	XYGN4972-2022-01	3074205A	7020	0	7020	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	501.95	f			M004766	调质-80KSI	XYGN4972-2022-01	3074205A	6900	0	6900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	0.51	f			Z230510-29				13	0	13	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	505.96	f			M004767	调质-80KSI	XYGN4972-2022-01	3074205A	6955	0	6955	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	506.68	f			M004768	调质-80KSI	XYGN4972-2022-01	3074205A	6965	0	6965	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	493.22	f			M004769	调质-80KSI	XYGN4972-2022-01	3074205A	6780	0	6780	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	504.14	f			M004770	调质-80KSI	XYGN4972-2022-01	3074205A	6930	0	6930	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	507.05	f			M004771	调质-80KSI	XYGN4972-2022-01	3074205A	6970	0	6970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	143*25	0	499.77	f			M004772	调质-80KSI	XYGN4972-2022-01	3074205A	6870	0	6870	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	159*22	0	10.41	f			M000078	调质-80KSI	XYGN4018.1-2021-02	2050595M	140	0	140	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*25	0	3.39	f			M001774	调质-80KSI	XYGN4972-2022-01	2053515M	50	0	50	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*25	0	5.43	f			M001775	调质-80KSI	XYGN4972-2022-01	2053515M	80	0	80	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*25	0	5.43	f			M001776	调质-80KSI	XYGN4972-2022-01	2053515M	80	0	80	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*25	0	6.78	f			M001781	调质-80KSI	XYGN4972-2022-01	2053515M	100	0	100	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*25	0	487.25	f			M003168	调质-80KSI	XYGN4972-2022-01	3070668M	7185	0	7185	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*25	0	414.35	f			M003169	调质-80KSI	XYGN4972-2022-01	3070668M	6110	0	6110	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*25	0	523.53	f			M003170	调质-80KSI	XYGN4972-2022-01	3070668M	7720	0	7720	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	135*25	0	537.09	f			M003171	调质-80KSI	XYGN4972-2022-01	3070668M	7920	0	7920	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	505.36	f			M003997	调质-80KSI	XYGN4972-2022-01	3072974M	7590	0	7590	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	499.37	f			M003998	调质-80KSI	XYGN4972-2022-01	3072974M	7500	0	7500	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	513.35	f			M003999	调质-80KSI	XYGN4972-2022-01	3072974M	7710	0	7710	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	512.02	f			M004000	调质-80KSI	XYGN4972-2022-01	3072974M	7690	0	7690	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	512.68	f			M004001	调质-80KSI	XYGN4972-2022-01	3072974M	7700	0	7700	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	508.35	f			M004002	调质-80KSI	XYGN4972-2022-01	3072974M	7635	0	7635	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	506.02	f			M004003	调质-80KSI	XYGN4972-2022-01	3072974M	7600	0	7600	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	511.35	f			M004004	调质-80KSI	XYGN4972-2022-01	3072974M	7680	0	7680	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	511.35	f			M004005	调质-80KSI	XYGN4972-2022-01	3072974M	7680	0	7680	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	512.68	f			M004006	调质-80KSI	XYGN4972-2022-01	3072974M	7700	0	7700	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	502.03	f			M004007	调质-80KSI	XYGN4972-2022-01	3072974M	7540	0	7540	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	518.67	f			M004008	调质-80KSI	XYGN4972-2022-01	3073018A	7790	0	7790	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	514.68	f			M004009	调质-80KSI	XYGN4972-2022-01	3073018A	7730	0	7730	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	515.01	f			M004010	调质-80KSI	XYGN4972-2022-01	3073018A	7735	0	7735	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	510.68	f			M004011	调质-80KSI	XYGN4972-2022-01	3073018A	7670	0	7670	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	511.35	f			M004012	调质-80KSI	XYGN4972-2022-01	3073018A	7680	0	7680	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	501.36	f			M004013	调质-80KSI	XYGN4972-2022-01	3073018A	7530	0	7530	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	504.69	f			M004014	调质-80KSI	XYGN4972-2022-01	3073018A	7580	0	7580	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	498.03	f			M004015	调质-80KSI	XYGN4972-2022-01	3072974M	7480	0	7480	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	508.69	f			M004016	调质-80KSI	XYGN4972-2022-01	3072974M	7640	0	7640	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	505.36	f			M004017	调质-80KSI	XYGN4972-2022-01	3072974M	7590	0	7590	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	492.71	f			M004018	调质-80KSI	XYGN4972-2022-01	3072974M	7400	0	7400	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	493.37	f			M004019	调质-80KSI	XYGN4972-2022-01	3072974M	7410	0	7410	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	512.02	f			M004020	调质-80KSI	XYGN4972-2022-01	3072974M	7690	0	7690	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	502.69	f			M004021	调质-80KSI	XYGN4972-2022-01	3072974M	7550	0	7550	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	133*25	0	504.69	f			M004022	调质-80KSI	XYGN4972-2022-01	3072974M	7580	0	7580	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	162*25	0	116.56	f			M000176	调质-80KSI	XYGN4972-2022-01	2050596M	1380	0	1380	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	162*25	0	812.51	f			M002796	调质-80KSI	XYGN4972-2022-01	2055551M	9620	0	9620	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	162*25	0	814.2	f			M002797	调质-80KSI	XYGN4972-2022-01	2055551M	9640	0	9640	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	162*25	0	804.91	f			M002798	调质-80KSI	XYGN4972-2022-01	2055551M	9530	0	9530	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	162*25	0	805.75	f			M002799	调质-80KSI	XYGN4972-2022-01	2055551M	9540	0	9540	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	162*25	0	814.2	f			M002800	调质-80KSI	XYGN4972-2022-01	2055551M	9640	0	9640	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	162*25	0	87.84	f			M002716	调质-80KSI	XYGN4972-2022-01	2055551M	1040	0	1040	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	265	f			M004843	调质-80KSI	XYGN4972-2022-01	3074934M	5970	0	5970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	262.78	f			M004844	调质-80KSI	XYGN4972-2022-01	3074934M	5920	0	5920	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	260.56	f			M004845	调质-80KSI	XYGN4972-2022-01	3074934M	5870	0	5870	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	264.33	f			M004846	调质-80KSI	XYGN4972-2022-01	3074934M	5955	0	5955	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261	f			M004847	调质-80KSI	XYGN4972-2022-01	3074934M	5880	0	5880	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	263.66	f			M004848	调质-80KSI	XYGN4972-2022-01	3074934M	5940	0	5940	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261	f			M004849	调质-80KSI	XYGN4972-2022-01	3074934M	5880	0	5880	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	263.22	f			M004850	调质-80KSI	XYGN4972-2022-01	3074934M	5930	0	5930	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	263.66	f			M004851	调质-80KSI	XYGN4972-2022-01	3074934M	5940	0	5940	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261	f			M004852	调质-80KSI	XYGN4972-2022-01	3074934M	5880	0	5880	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	264.33	f			M004853	调质-80KSI	XYGN4972-2022-01	3074934M	5955	0	5955	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261	f			M004854	调质-80KSI	XYGN4972-2022-01	3074934M	5880	0	5880	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	266.77	f			M004855	调质-80KSI	XYGN4972-2022-01	3074934M	6010	0	6010	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.89	f			M004856	调质-80KSI	XYGN4972-2022-01	3074934M	5900	0	5900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	265.22	f			M004857	调质-80KSI	XYGN4972-2022-01	3074934M	5975	0	5975	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.89	f			M004858	调质-80KSI	XYGN4972-2022-01	3074934M	5900	0	5900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	262.33	f			M004859	调质-80KSI	XYGN4972-2022-01	3074934M	5910	0	5910	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	264.11	f			M004860	调质-80KSI	XYGN4972-2022-01	3074934M	5950	0	5950	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	264.55	f			M004861	调质-80KSI	XYGN4972-2022-01	3074934M	5960	0	5960	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.89	f			M004862	调质-80KSI	XYGN4972-2022-01	3074934M	5900	0	5900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	260.56	f			M004863	调质-80KSI	XYGN4972-2022-01	3074934M	5870	0	5870	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	265	f			M004864	调质-80KSI	XYGN4972-2022-01	3074934M	5970	0	5970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	263.89	f			M004865	调质-80KSI	XYGN4972-2022-01	3074934M	5945	0	5945	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	258.78	f			M004866	调质-80KSI	XYGN4972-2022-01	3074934M	5830	0	5830	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.45	f			M004867	调质-80KSI	XYGN4972-2022-01	3074934M	5890	0	5890	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.89	f			M004868	调质-80KSI	XYGN4972-2022-01	3074934M	5900	0	5900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	264.11	f			M004869	调质-80KSI	XYGN4972-2022-01	3074934M	5950	0	5950	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	248.13	f			M004870	调质-80KSI	XYGN4972-2022-01	3074934M	5590	0	5590	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	209.51	f			M004871	调质-80KSI	XYGN4972-2022-01	3074934M	4720	0	4720	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	258.78	f			M004872	调质-80KSI	XYGN4972-2022-01	3074934M	5830	0	5830	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	194.86	f			M004873	调质-80KSI	XYGN4972-2022-01	3074934M	4390	0	4390	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	206.4	f			M004874	调质-80KSI	XYGN4972-2022-01	3074934M	4650	0	4650	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	218.83	f			M004875	调质-80KSI	XYGN4972-2022-01	3074934M	4930	0	4930	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	262.33	f			M004876	调质-80KSI	XYGN4972-2022-01	3074934M	5910	0	5910	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.45	f			M004877	调质-80KSI	XYGN4972-2022-01	3074934M	5890	0	5890	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.45	f			M004878	调质-80KSI	XYGN4972-2022-01	3074934M	5890	0	5890	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.89	f			M004879	调质-80KSI	XYGN4972-2022-01	3074934M	5900	0	5900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.45	f			M004880	调质-80KSI	XYGN4972-2022-01	3074934M	5890	0	5890	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.89	f			M004881	调质-80KSI	XYGN4972-2022-01	3074934M	5900	0	5900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	260.34	f			M004882	调质-80KSI	XYGN4972-2022-01	3074934M	5865	0	5865	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	262.33	f			M004883	调质-80KSI	XYGN4972-2022-01	3074934M	5910	0	5910	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.67	f			M004884	调质-80KSI	XYGN4972-2022-01	3074934M	5895	0	5895	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	260.11	f			M004885	调质-80KSI	XYGN4972-2022-01	3074934M	5860	0	5860	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.45	f			M004886	调质-80KSI	XYGN4972-2022-01	3074934M	5890	0	5890	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.89	f			M004887	调质-80KSI	XYGN4972-2022-01	3074934M	5900	0	5900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	260.34	f			M004888	调质-80KSI	XYGN4972-2022-01	3074934M	5865	0	5865	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	110*20	0	261.89	f			M004889	调质-80KSI	XYGN4972-2022-01	3074934M	5900	0	5900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	28.34	f			M004149	调质-80KSI	XYGN4972-2022-01	3052130M	570	0	570	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	52.95	f			M004150	调质-80KSI	XYGN4972-2022-01	3052130M	1065	0	1065	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	254.04	f			M004151	调质-80KSI	XYGN4972-2022-01	3052130M	5110	0	5110	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	249.07	f			M004152	调质-80KSI	XYGN4972-2022-01	3052130M	5010	0	5010	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	251.06	f			M004153	调质-80KSI	XYGN4972-2022-01	3052130M	5050	0	5050	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	252.8	f			M004154	调质-80KSI	XYGN4972-2022-01	3052130M	5085	0	5085	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	51.7	f			M004155	调质-80KSI	XYGN4972-2022-01	3052130M	1040	0	1040	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	253.3	f			M004156	调质-80KSI	XYGN4972-2022-01	3052130M	5095	0	5095	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	252.55	f			M004157	调质-80KSI	XYGN4972-2022-01	3052130M	5080	0	5080	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	248.57	f			M004158	调质-80KSI	XYGN4972-2022-01	3052130M	5000	0	5000	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	4.47	f			M004262	调质-80KSI	XYGN4972-2022-01	3074934M	90	0	90	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	193.89	f			M004263	调质-80KSI	XYGN4972-2022-01	3074934M	3900	0	3900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	245.59	f			M004264	调质-80KSI	XYGN4972-2022-01	3074934M	4940	0	4940	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	242.86	f			M004265	调质-80KSI	XYGN4972-2022-01	3074934M	4885	0	4885	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	241.86	f			M004266	调质-80KSI	XYGN4972-2022-01	3074934M	4865	0	4865	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	258.02	f			M004267	调质-80KSI	XYGN4972-2022-01	3074934M	5190	0	5190	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	250.31	f			M004268	调质-80KSI	XYGN4972-2022-01	3074934M	5035	0	5035	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	255.04	f			M004269	调质-80KSI	XYGN4972-2022-01	3074934M	5130	0	5130	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	254.79	f			M004270	调质-80KSI	XYGN4972-2022-01	3074934M	5125	0	5125	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	252.3	f			M004271	调质-80KSI	XYGN4972-2022-01	3074934M	5075	0	5075	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	250.06	f			M004272	调质-80KSI	XYGN4972-2022-01	3074934M	5030	0	5030	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	250.06	f			M004273	调质-80KSI	XYGN4972-2022-01	3074934M	5030	0	5030	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	255.78	f			M004274	调质-80KSI	XYGN4972-2022-01	3074934M	5145	0	5145	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	255.53	f			M004275	调质-80KSI	XYGN4972-2022-01	3074934M	5140	0	5140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	254.79	f			M004276	调质-80KSI	XYGN4972-2022-01	3074934M	5125	0	5125	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	251.56	f			M004277	调质-80KSI	XYGN4972-2022-01	3074934M	5060	0	5060	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	254.79	f			M004278	调质-80KSI	XYGN4972-2022-01	3074934M	5125	0	5125	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	256.28	f			M004279	调质-80KSI	XYGN4972-2022-01	3074934M	5155	0	5155	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	254.04	f			M004280	调质-80KSI	XYGN4972-2022-01	3074934M	5110	0	5110	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	254.54	f			M004281	调质-80KSI	XYGN4972-2022-01	3074934M	5120	0	5120	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	254.04	f			M004282	调质-80KSI	XYGN4972-2022-01	3074934M	5110	0	5110	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	250.56	f			M004283	调质-80KSI	XYGN4972-2022-01	3074934M	5040	0	5040	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	253.79	f			M004284	调质-80KSI	XYGN4972-2022-01	3074934M	5105	0	5105	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	259.01	f			M004285	调质-80KSI	XYGN4972-2022-01	3074934M	5210	0	5210	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	248.57	f			M004286	调质-80KSI	XYGN4972-2022-01	3074934M	5000	0	5000	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	254.04	f			M004287	调质-80KSI	XYGN4972-2022-01	3074934M	5110	0	5110	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	249.82	f			M004288	调质-80KSI	XYGN4972-2022-01	3074934M	5025	0	5025	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	250.06	f			M004289	调质-80KSI	XYGN4972-2022-01	3074934M	5030	0	5030	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	253.79	f			M004290	调质-80KSI	XYGN4972-2022-01	3074934M	5105	0	5105	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	252.05	f			M004291	调质-80KSI	XYGN4972-2022-01	3074934M	5070	0	5070	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	252.05	f			M004292	调质-80KSI	XYGN4972-2022-01	3074934M	5070	0	5070	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	254.54	f			M004293	调质-80KSI	XYGN4972-2022-01	3074934M	5120	0	5120	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	251.56	f			M004294	调质-80KSI	XYGN4972-2022-01	3074934M	5060	0	5060	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*24	0	253.54	f			M004295	调质-80KSI	XYGN4972-2022-01	3074934M	5100	0	5100	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	244.13	f			M004805	调质-80KSI	XYGN5203-2022-01	3060076A	6250	0	6250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.96	f			M004806	调质-80KSI	XYGN5203-2022-01	3060076A	6220	0	6220	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	241.79	f			M004807	调质-80KSI	XYGN5203-2022-01	3060076A	6190	0	6190	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	241.4	f			M004808	调质-80KSI	XYGN5203-2022-01	3060076A	6180	0	6180	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	239.84	f			M004809	调质-80KSI	XYGN5203-2022-01	3060076A	6140	0	6140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	241.79	f			M004810	调质-80KSI	XYGN5203-2022-01	3060076A	6190	0	6190	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	244.13	f			M004811	调质-80KSI	XYGN5203-2022-01	3060076A	6250	0	6250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	244.13	f			M004812	调质-80KSI	XYGN5203-2022-01	3060076A	6250	0	6250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.18	f			M004813	调质-80KSI	XYGN5203-2022-01	3060076A	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.18	f			M004814	调质-80KSI	XYGN5203-2022-01	3060076A	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.18	f			M004815	调质-80KSI	XYGN5203-2022-01	3060076A	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	241.01	f			M004816	调质-80KSI	XYGN5203-2022-01	3060076A	6170	0	6170	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.18	f			M004817	调质-80KSI	XYGN5203-2022-01	3060076A	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.18	f			M004818	调质-80KSI	XYGN5203-2022-01	3060076A	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	239.84	f			M004819	调质-80KSI	XYGN5203-2022-01	3060076A	6140	0	6140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.18	f			M004820	调质-80KSI	XYGN5203-2022-01	3060076A	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.57	f			M004821	调质-80KSI	XYGN5203-2022-01	3060076A	6210	0	6210	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.18	f			M004822	调质-80KSI	XYGN5203-2022-01	3060076A	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.77	f			M004823	调质-80KSI	XYGN5203-2022-01	3060076A	6215	0	6215	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	244.13	f			M004824	调质-80KSI	XYGN5203-2022-01	3060076A	6250	0	6250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	244.13	f			M004825	调质-80KSI	XYGN5203-2022-01	3060076A	6250	0	6250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	244.13	f			M004826	调质-80KSI	XYGN5203-2022-01	3060076A	6250	0	6250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.18	f			M004827	调质-80KSI	XYGN5203-2022-01	3060076A	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.18	f			M004828	调质-80KSI	XYGN5203-2022-01	3060076A	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	238.27	f			M004829	调质-80KSI	XYGN5203-2022-01	3060076A	6100	0	6100	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.57	f			M004830	调质-80KSI	XYGN5203-2022-01	3060076A	6210	0	6210	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	353.73	f			M004831	调质-80KSI	XYGN5203-2022-01	3060076A	8470	0	8470	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	339.53	f			M004832	调质-80KSI	XYGN5203-2022-01	3060076A	8130	0	8130	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	352.06	f			M004833	调质-80KSI	XYGN5203-2022-01	3060076A	8430	0	8430	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	316.14	f			M004834	调质-80KSI	XYGN5203-2022-01	3060076A	7570	0	7570	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	320.32	f			M004835	调质-80KSI	XYGN5203-2022-01	3060076A	7670	0	7670	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	349.14	f			M004836	调质-80KSI	XYGN5203-2022-01	3060076A	8360	0	8360	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	351.23	f			M004837	调质-80KSI	XYGN5203-2022-01	3060076A	8410	0	8410	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	353.73	f			M004838	调质-80KSI	XYGN5203-2022-01	3060076A	8470	0	8470	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	327.42	f			M004839	调质-80KSI	XYGN5203-2022-01	3060076A	7840	0	7840	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	317.4	f			M004840	调质-80KSI	XYGN5203-2022-01	3060076A	7600	0	7600	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	349.14	f			M004841	调质-80KSI	XYGN5203-2022-01	3060076A	8360	0	8360	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	107.95*19.05	0	351.23	f			M004842	调质-80KSI	XYGN5203-2022-01	3060076A	8410	0	8410	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	262.36	f			M003954	调质-80KSI	XYGN4972-2022-01	3052130M	6045	0	6045	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	263.23	f			M003955	调质-80KSI	XYGN4972-2022-01	3052130M	6065	0	6065	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	261.28	f			M003956	调质-80KSI	XYGN4972-2022-01	3052130M	6020	0	6020	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	261.28	f			M003957	调质-80KSI	XYGN4972-2022-01	3052130M	6020	0	6020	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	260.41	f			M003958	调质-80KSI	XYGN4972-2022-01	3051854M	6000	0	6000	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	262.15	f			M003959	调质-80KSI	XYGN4972-2022-01	3051854M	6040	0	6040	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	262.58	f			M003960	调质-80KSI	XYGN4972-2022-01	3051854M	6050	0	6050	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	260.41	f			M003962	调质-80KSI	XYGN4972-2022-01	3051854M	6000	0	6000	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	261.49	f			M003963	调质-80KSI	XYGN4972-2022-01	3051854M	6025	0	6025	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	263.01	f			M003964	调质-80KSI	XYGN4972-2022-01	3051854M	6060	0	6060	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	260.84	f			M003965	调质-80KSI	XYGN4972-2022-01	3051854M	6010	0	6010	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	263.01	f			M003966	调质-80KSI	XYGN4972-2022-01	3051854M	6060	0	6060	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	260.41	f			M003967	调质-80KSI	XYGN4972-2022-01	3051854M	6000	0	6000	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	260.41	f			M003968	调质-80KSI	XYGN4972-2022-01	3051854M	6000	0	6000	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	249.13	f			M003969	调质-80KSI	XYGN4972-2022-01	3052130M	5740	0	5740	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	253.25	f			M003970	调质-80KSI	XYGN4972-2022-01	3052130M	5835	0	5835	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	254.12	f			M003971	调质-80KSI	XYGN4972-2022-01	3052130M	5855	0	5855	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	253.9	f			M003972	调质-80KSI	XYGN4972-2022-01	3052130M	5850	0	5850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	245.22	f			M003973	调质-80KSI	XYGN4972-2022-01	3052130M	5650	0	5650	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	247.82	f			M003974	调质-80KSI	XYGN4972-2022-01	3052130M	5710	0	5710	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	244.35	f			M003975	调质-80KSI	XYGN4972-2022-01	3052130M	5630	0	5630	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	242.18	f			M003976	调质-80KSI	XYGN4972-2022-01	3052130M	5580	0	5580	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	244.35	f			M003977	调质-80KSI	XYGN4972-2022-01	3052130M	5630	0	5630	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	245.22	f			M003978	调质-80KSI	XYGN4972-2022-01	3052130M	5650	0	5650	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	253.9	f			M003979	调质-80KSI	XYGN4972-2022-01	3051854M	5850	0	5850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	253.9	f			M003980	调质-80KSI	XYGN4972-2022-01	3051854M	5850	0	5850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	254.33	f			M003981	调质-80KSI	XYGN4972-2022-01	3051854M	5860	0	5860	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	244.35	f			M003982	调质-80KSI	XYGN4972-2022-01	3051854M	5630	0	5630	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	236.1	f			M003983	调质-80KSI	XYGN4972-2022-01	3051854M	5440	0	5440	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	253.47	f			M003984	调质-80KSI	XYGN4972-2022-01	3051854M	5840	0	5840	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	22.79	f			M004137	调质-80KSI	XYGN4972-2022-01	3052130M	525	0	525	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	241.1	f			M004138	调质-80KSI	XYGN4972-2022-01	3052130M	5555	0	5555	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	236.97	f			M004139	调质-80KSI	XYGN4972-2022-01	3052130M	5460	0	5460	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	249.99	f			M004140	调质-80KSI	XYGN4972-2022-01	3052130M	5760	0	5760	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	239.79	f			M004141	调质-80KSI	XYGN4972-2022-01	3052130M	5525	0	5525	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	23.44	f			M004142	调质-80KSI	XYGN4972-2022-01	3052130M	540	0	540	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	249.13	f			M004143	调质-80KSI	XYGN4972-2022-01	3052130M	5740	0	5740	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	119.79	f			M004144	调质-80KSI	XYGN4972-2022-01	3052130M	2760	0	2760	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	21.7	f			M004145	调质-80KSI	XYGN4972-2022-01	3052130M	500	0	500	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	246.09	f			M004146	调质-80KSI	XYGN4972-2022-01	3052130M	5670	0	5670	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	27.78	f			M004147	调质-80KSI	XYGN4972-2022-01	3052130M	640	0	640	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	33.85	f			M004148	调质-80KSI	XYGN4972-2022-01	3052130M	780	0	780	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	109.64	f			M003137	调质-80KSI	XYGN4972-2022-01	3050615M	1900	0	1900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	17.6	f			M003138	调质-80KSI	XYGN4972-2022-01	3050615M	305	0	305	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	455.86	f			M003139	调质-80KSI	XYGN4972-2022-01	3050615M	7900	0	7900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	73.28	f			M003140	调质-80KSI	XYGN4972-2022-01	3050615M	1270	0	1270	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	462.79	f			M003141	调质-80KSI	XYGN4972-2022-01	3050615M	8020	0	8020	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	478.95	f			M003142	调质-80KSI	XYGN4972-2022-01	3050615M	8300	0	8300	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	469.71	f			M003144	调质-80KSI	XYGN4972-2022-01	3050615M	8140	0	8140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	462.79	f			M003145	调质-80KSI	XYGN4972-2022-01	3050615M	8020	0	8020	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	476.06	f			M003146	调质-80KSI	XYGN4972-2022-01	3050615M	8250	0	8250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	462.79	f			M003147	调质-80KSI	XYGN4972-2022-01	3050615M	8020	0	8020	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	469.71	f			M003149	调质-80KSI	XYGN4972-2022-01	3050615M	8140	0	8140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	463.37	f			M003150	调质-80KSI	XYGN4972-2022-01	3050615M	8030	0	8030	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	462.79	f			M003151	调质-80KSI	XYGN4972-2022-01	3050615M	8020	0	8020	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	3.32	f			M003297	调质-80KSI	XYGN4972-2022-01	3051620M	85	0	85	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	3.91	f			M003298	调质-80KSI	XYGN4972-2022-01	3051620M	100	0	100	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	1.56	f			M003299	调质-80KSI	XYGN4972-2022-01	3051620M	40	0	40	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	6.45	f			M003300	调质-80KSI	XYGN4972-2022-01	3051620M	165	0	165	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	5.47	f			M003301	调质-80KSI	XYGN4972-2022-01	3051620M	140	0	140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	3.91	f			M003302	调质-80KSI	XYGN4972-2022-01	3051620M	100	0	100	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	6.45	f			M003303	调质-80KSI	XYGN4972-2022-01	3051620M	165	0	165	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	3.32	f			M003304	调质-80KSI	XYGN4972-2022-01	3051620M	85	0	85	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	0.78	f			M003305	调质-80KSI	XYGN4972-2022-01	3051620M	20	0	20	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	239.45	f			M003398	调质-80KSI	XYGN4972-2022-01	3051620M	6130	0	6130	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	253.51	f			M003399	调质-80KSI	XYGN4972-2022-01	3051620M	6490	0	6490	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	96.48	f			M003400	调质-80KSI	XYGN4972-2022-01	3051620M	2470	0	2470	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	1.76	f			M003401	调质-80KSI	XYGN4972-2022-01	3051620M	45	0	45	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	251.56	f			M003402	调质-80KSI	XYGN4972-2022-01	3051620M	6440	0	6440	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	259.37	f			M003403	调质-80KSI	XYGN4972-2022-01	3051620M	6640	0	6640	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	256.24	f			M003404	调质-80KSI	XYGN4972-2022-01	3051620M	6560	0	6560	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	242.18	f			M003405	调质-80KSI	XYGN4972-2022-01	3051620M	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	4.69	f			M003406	调质-80KSI	XYGN4972-2022-01	3051620M	120	0	120	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	4.88	f			M003408	调质-80KSI	XYGN4972-2022-01	3051620M	125	0	125	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	2.34	f			M003409	调质-80KSI	XYGN4972-2022-01	3051620M	60	0	60	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	7.03	f			M003410	调质-80KSI	XYGN4972-2022-01	3051620M	180	0	180	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	0.59	f			M003411	调质-80KSI	XYGN4972-2022-01	3051620M	15	0	15	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	0.66	f			M003412	调质-80KSI	XYGN4972-2022-01	3051620M	17	0	17	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	106*18	0	6.64	f			M003413	调质-80KSI	XYGN4972-2022-01	3051620M	170	0	170	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	255.04	f			M003985	调质-80KSI	XYGN4972-2022-01	3052127M	6340	0	6340	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	251.42	f			M003986	调质-80KSI	XYGN4972-2022-01	3052127M	6250	0	6250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	256.65	f			M003987	调质-80KSI	XYGN4972-2022-01	3052127M	6380	0	6380	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	256.65	f			M003988	调质-80KSI	XYGN4972-2022-01	3052127M	6380	0	6380	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	255.44	f			M003989	调质-80KSI	XYGN4972-2022-01	3052127M	6350	0	6350	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	254.63	f			M003990	调质-80KSI	XYGN4972-2022-01	3052127M	6330	0	6330	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	249.41	f			M003991	调质-80KSI	XYGN4972-2022-01	3052127M	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	251.42	f			M003992	调质-80KSI	XYGN4972-2022-01	3052127M	6250	0	6250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	257.05	f			M003993	调质-80KSI	XYGN4972-2022-01	3052127M	6390	0	6390	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	253.03	f			M003994	调质-80KSI	XYGN4972-2022-01	3052127M	6290	0	6290	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	18.1	f			M003995	调质-80KSI	XYGN4972-2022-01	3052127M	450	0	450	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	249.41	f			M003996	调质-80KSI	XYGN4972-2022-01	3052127M	6200	0	6200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	259.86	f			M004111	调质-80KSI	XYGN4972-2022-01	3052308M	6460	0	6460	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	258.25	f			M004112	调质-80KSI	XYGN4972-2022-01	3052308M	6420	0	6420	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	252.22	f			M004113	调质-80KSI	XYGN4972-2022-01	3052308M	6270	0	6270	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	256.44	f			M004114	调质-80KSI	XYGN4972-2022-01	3052308M	6375	0	6375	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	251.42	f			M004115	调质-80KSI	XYGN4972-2022-01	3052308M	6250	0	6250	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	254.43	f			M004116	调质-80KSI	XYGN4972-2022-01	3052308M	6325	0	6325	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	249.81	f			M004117	调质-80KSI	XYGN4972-2022-01	3052308M	6210	0	6210	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	248.6	f			M004118	调质-80KSI	XYGN4972-2022-01	3052308M	6180	0	6180	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	252.82	f			M004119	调质-80KSI	XYGN4972-2022-01	3052308M	6285	0	6285	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	248.8	f			M004120	调质-80KSI	XYGN4972-2022-01	3052308M	6185	0	6185	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	252.22	f			M004121	调质-80KSI	XYGN4972-2022-01	3052308M	6270	0	6270	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	252.62	f			M004122	调质-80KSI	XYGN4972-2022-01	3052308M	6280	0	6280	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	254.23	f			M004123	调质-80KSI	XYGN4972-2022-01	3052308M	6320	0	6320	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	258.25	f			M004124	调质-80KSI	XYGN4972-2022-01	3052308M	6420	0	6420	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	253.83	f			M004125	调质-80KSI	XYGN4972-2022-01	3052308M	6310	0	6310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	251.01	f			M004126	调质-80KSI	XYGN4972-2022-01	3052308M	6240	0	6240	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	253.83	f			M004127	调质-80KSI	XYGN4972-2022-01	3052308M	6310	0	6310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	263.28	f			M004130	调质-80KSI	XYGN4972-2022-01	3052308M	6545	0	6545	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	252.82	f			M004131	调质-80KSI	XYGN4972-2022-01	3052308M	6285	0	6285	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	19.11	f			M004133	调质-80KSI	XYGN4972-2022-01	3052308M	475	0	475	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	8.25	f			M004134	调质-80KSI	XYGN4972-2022-01	3052308M	205	0	205	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	17.38	f			M004135	调质-80KSI	XYGN4972-2022-01	3052308M	432	0	432	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*22.5	0	115.25	f			M004136	调质-80KSI	XYGN4972-2022-01	3052308M	2865	0	2865	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*20	0	20.34	f			M000323	调质-80KSI	XYGN4018.1-2021-02	2050706M	550	0	550	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*20	0	2.22	f			M000334	调质-80KSI	XYGN4018.1-2021-02	2050706M	60	0	60	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*20	0	1.66	f			M000339	调质-80KSI	XYGN4018.1-2021-02	2050706M	45	0	45	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*15	0	188.65	f			M000346	调质-80KSI	XYGN4018.1-2021-02	2050706M	6800	0	6800	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*15	0	57.43	f			M000347	调质-80KSI	XYGN4018.1-2021-02	2050706M	2070	0	2070	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*15	0	195.86	f			M000349	调质-80KSI	XYGN4018.1-2021-02	2050706M	7060	0	7060	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*15	0	21.16	f			M000351	调质-80KSI	XYGN4018.1-2021-02	2050706M	715	0	715	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*15	0	210.84	f			M000354	调质-80KSI	XYGN4018.1-2021-02	2050706M	7600	0	7600	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	107.12	f			Z23010216	调质-80KSI	XTG-JT-028-2019	119V-1547	3620	0	3620	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	95*15	0	125.77	f			M000115	调质-80KSI	XTG-JT-028-2019	119V-1547	4250	0	4250	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*15	0	91.83	f			M000357	调质-80KSI	XYGN4018.1-2021-02	2050706M	3310	0	3310	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	116*22	0	9.69	f			M000367	调质-80KSI	XYGN4018.1-2021-02	2050997M	190	0	190	0	0	0	湖北新冶钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*28	0	43.35	f			M000423	调质-80KSI	XYGN4018.1-2021-02	2051078M	430	0	430	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	80*15	0	1.08	f			M000429	调质-80KSI	XYGN4018.1-2021-02	2050705M	45	0	45	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	80*15	0	29.09	f			M000432	调质-80KSI	XYGN4018.1-2021-02	2050705M	1210	0	1210	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	80*15	0	4.21	f			M000441	调质-80KSI	XYGN4018.1-2021-02	2050705M	175	0	175	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	41.61	f			M002783	调质-80KSI	XYGN4972-2022-01	2055669M	540	0	540	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	604.17	f			M002784	调质-80KSI	XYGN4972-2022-01	2055669M	7840	0	7840	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	16.57	f			M002785	调质-80KSI	XYGN4972-2022-01	2055585A	215	0	215	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	16.18	f			M002786	调质-80KSI	XYGN4972-2022-01	2055585A	210	0	210	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	18.5	f			M002787	调质-80KSI	XYGN4972-2022-01	2055585A	240	0	240	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	20.42	f			M002788	调质-80KSI	XYGN4972-2022-01	2055669M	265	0	265	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	150*25	0	8.09	f			M002789	调质-80KSI	XYGN4972-2022-01	2055669M	105	0	105	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	122*20	0	131.8	f			M000461	调质-80KSI	XYGN4018.1-2021-02	2050997M	2620	0	2620	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	155*35	0	55.93	f			M000481	调质-80KSI	BMS S210 REV AA	418V1-1069	540	0	540	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	155*35	0	19.68	f			M000483	调质-80KSI	BMS S210 REV AA	418V1-1069	190	0	190	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	68.61	f			M000551	调质-80KSI	XYGN4018.1-2021-02	2050688M	1120	0	1120	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	23.28	f			M000566	调质-80KSI	XYGN4018.1-2021-02	2050688M	380	0	380	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	1.84	f			M000567	调质-80KSI	XYGN4018.1-2021-02	2050688M	30	0	30	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	475.95	f			M000569	调质-80KSI	XYGN4018.1-2021-02	2050688M	7770	0	7770	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	479.02	f			M000571	调质-80KSI	XYGN4018.1-2021-02	2050688M	7820	0	7820	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	447.16	f			M002764	调质-80KSI	XYGN4972-2022-01	2055653M	7300	0	7300	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	392.65	f			M002765	调质-80KSI	XYGN4972-2022-01	2055653M	6410	0	6410	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	436.14	f			M002766	调质-80KSI	XYGN4972-2022-01	2055653M	7120	0	7120	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	477.18	f			M002767	调质-80KSI	XYGN4972-2022-01	2055653M	7790	0	7790	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	477.79	f			M002768	调质-80KSI	XYGN4972-2022-01	2055653M	7800	0	7800	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	499.23	f			M002769	调质-80KSI	XYGN4972-2022-01	2055653M	8150	0	8150	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	492.49	f			M002770	调质-80KSI	XYGN4972-2022-01	2055653M	8040	0	8040	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	486.37	f			M002771	调质-80KSI	XYGN4972-2022-01	2055653M	7940	0	7940	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	437.36	f			M002772	调质-80KSI	XYGN4972-2022-01	2055653M	7140	0	7140	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	247.47	f			M002773	调质-80KSI	XYGN4972-2022-01	2055585A	4040	0	4040	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	247.47	f			M002774	调质-80KSI	XYGN4972-2022-01	2055585A	4040	0	4040	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	263.4	f			M002776	调质-80KSI	XYGN4972-2022-01	2055585A	4300	0	4300	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	156*18	0	21.44	f			M002778	调质-80KSI	XYGN4972-2022-01	2055585A	350	0	350	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	7.48	f			M000573	调质-80KSI	XYGN4018.1-2021-02	2051081M	108	0	108	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	8.31	f			M001929	调质-80KSI	XYGN4972-2022-01	2052672M	120	0	120	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	36.01	f			M001934	调质-80KSI	XYGN4972-2022-01	2052672M	520	0	520	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	8.66	f			M001935	调质-80KSI	XYGN4972-2022-01	2052672M	125	0	125	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	174*18	0	1.38	f			M001936	调质-80KSI	XYGN4972-2022-01	2052672M	20	0	20	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	6.63	f			M002384	调质-80KSI	XYGN4972-2022-01	2055048M	145	0	145	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	26.06	f			M002386	调质-80KSI	XYGN4972-2022-01	2055048M	570	0	570	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	13.72	f			M002389	调质-80KSI	XYGN4972-2022-01	2055048M	300	0	300	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	382.67	f			M002391	调质-80KSI	XYGN4972-2022-01	2055048M	8370	0	8370	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	17.37	f			M002392	调质-80KSI	XYGN4972-2022-01	2055048M	380	0	380	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	384.04	f			M002393	调质-80KSI	XYGN4972-2022-01	2055048M	8400	0	8400	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	398.68	f			M002394	调质-80KSI	XYGN4972-2022-01	2055048M	8720	0	8720	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	380.39	f			M002395	调质-80KSI	XYGN4972-2022-01	2055048M	8320	0	8320	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	4.11	f			M002396	调质-80KSI	XYGN4972-2022-01	2055048M	90	0	90	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	380.84	f			M002397	调质-80KSI	XYGN4972-2022-01	2055048M	8330	0	8330	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	338.33	f			M002398	调质-80KSI	XYGN4972-2022-01	2055048M	7400	0	7400	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	12.34	f			M002399	调质-80KSI	XYGN4972-2022-01	2055048M	270	0	270	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	383.13	f			M002400	调质-80KSI	XYGN4972-2022-01	2055048M	8380	0	8380	0	0	0	大冶特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	1.87	f			M001464	调质-80KSI	XTG-JY-C-010-2020	20M1499V	70	0	70	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	176.21	f			M001463	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6600	0	6600	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	178.08	f			M001460	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6670	0	6670	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	167.4	f			M001458	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6270	0	6270	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	1.6	f			M001470	调质-80KSI	XTG-JY-C-010-2020	20M1499V	60	0	60	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	1.74	f			M001468	调质-80KSI	XTG-JY-C-010-2020	20M1499V	65	0	65	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	95.85	f			M001469	调质-80KSI	XTG-JY-C-010-2020	20M1499V	3590	0	3590	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	181.02	f			M001467	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6780	0	6780	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	4.67	f			M001466	调质-80KSI	XTG-JY-C-010-2020	20M1499V	175	0	175	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	169.27	f			M001465	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6340	0	6340	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	172.47	f			M001483	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6460	0	6460	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	179.95	f			M001484	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6740	0	6740	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	180.75	f			M001487	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6770	0	6770	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	3.34	f			M001486	调质-80KSI	XTG-JY-C-010-2020	20M1499V	125	0	125	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	162.06	f			M001485	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6070	0	6070	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	171.41	f			M001474	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6420	0	6420	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	170.6	f			M001471	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6390	0	6390	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	181.28	f			M001475	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6790	0	6790	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	180.75	f			M001472	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6770	0	6770	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	181.02	f			M001473	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6780	0	6780	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	178.61	f			M001476	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6690	0	6690	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	173.01	f			M001478	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6480	0	6480	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	177.55	f			M001477	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6650	0	6650	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	160.19	f			M001479	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6000	0	6000	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	165.53	f			M001481	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6200	0	6200	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	162.86	f			M001482	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6100	0	6100	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	160.19	f			M001480	调质-80KSI	XTG-JY-C-010-2020	20M1499V	6000	0	6000	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	25.36	f			M001452	调质-80KSI	XTG-JY-C-010-2020	20M1499V	950	0	950	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	35.51	f			M001453	调质-80KSI	XTG-JY-C-010-2020	20M1499V	1330	0	1330	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	154.85	f			M001454	调质-80KSI	XTG-JY-C-010-2020	20M1499V	5800	0	5800	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	127*9.19	0	152.98	f			M001456	调质-80KSI	XTG-JY-C-010-2020	20M1499V	5730	0	5730	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	439.42	f			M003420	调质-80KSI	XYGN4972-2022-01	3072281A	9310	0	9310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	439.42	f			M003421	调质-80KSI	XYGN4972-2022-01	3072281A	9310	0	9310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	228.92	f			M003422	调质-80KSI	XYGN4972-2022-01	3072281A	4850	0	4850	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	439.9	f			M003423	调质-80KSI	XYGN4972-2022-01	3072281A	9320	0	9320	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	439.9	f			M003424	调质-80KSI	XYGN4972-2022-01	3072281A	9320	0	9320	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	439.42	f			M003425	调质-80KSI	XYGN4972-2022-01	3072281A	9310	0	9310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	441.31	f			M003426	调质-80KSI	XYGN4972-2022-01	3072281A	9350	0	9350	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	439.42	f			M003427	调质-80KSI	XYGN4972-2022-01	3072281A	9310	0	9310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	439.42	f			M003428	调质-80KSI	XYGN4972-2022-01	3072281A	9310	0	9310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	439.42	f			M003429	调质-80KSI	XYGN4972-2022-01	3072281A	9310	0	9310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	177.8*11.51	0	439.42	f			M003430	调质-80KSI	XYGN4972-2022-01	3072281A	9310	0	9310	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	90*13	0	60.48	f			Z23010217	调质-80KSI	XTG-JY-C-041-2021/FS-T-M-003	2042973V	2450	0	2450	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	108*30	0	7.5	f			Z23010218	调质-80KSI	XTG-JY-C-041-2021/FS-T-M-003	121V-2083	130	0	130	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	195*13	0	200.42	f			Z23010561				3435	0	3435	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	152*26	0	233.47	f			L672	调质-80KSI		21D3290V	2890	0	2890	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	178*10	0	21.54	f			Z230510-23				520	0	520	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	114*20	0	22.95	f			Z230510-24				495	0	495	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	102*22	0	25.82	f			Z230510-25				595	0	595	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	114*20	0	23.64	f			Z230510-27				510	0	510	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	88*15	0	15.12	f			Z230510-28				560	0	560	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	114*20	0	22.25	f			Z230510-32				480	0	480	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	121*18	0	18.29	f			Z230510-34				400	0	400	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_103	114*20	0	19.7	f			Z230510-35				425	0	425	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	310	0	3753.29	f			M004332	调质110KSI	XYGN5189.3-2023-01	3060346A	6330	0	6330	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	310	0	3735.5	f			M004333	调质110KSI	XYGN5189.3-2023-01	3060346A	6300	0	6300	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	310	0	3913.38	f			M004334	调质110KSI	XYGN5189.3-2023-01	3060346A	6600	0	6600	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	310	0	3735.5	f			M004335	调质110KSI	XYGN5189.3-2023-01	3060346A	6300	0	6300	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	280	0	2795.95	f			M004328	调质110KSI	XYGN5189.3-2023-01	3060346A	5780	0	5780	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	280	0	3773.08	f			M004329	调质110KSI	XYGN5189.3-2023-01	3060346A	7800	0	7800	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	280	0	3821.45	f			M004330	调质110KSI	XYGN5189.3-2023-01	3060346A	7900	0	7900	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	280	0	3758.57	f			M004331	调质110KSI	XYGN5189.3-2023-01	3060346A	7770	0	7770	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	250	0	2907.61	f			M004258	调质110KSI	XYGN5189.3-2023-01	3017455Z	7540	0	7540	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	250	0	2753.36	f			M004259	调质110KSI	XYGN5189.3-2023-01	3017455Z	7140	0	7140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	250	0	1596.49	f			M004260	调质110KSI	XYGN5189.3-2023-01	3017455Z	4140	0	4140	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	250	0	2552.84	f			M004261	调质110KSI	XYGN5189.3-2023-01	3017455Z	6620	0	6620	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	2090.4	f			M002136	调质110KSI	XYGN1992.6-2022-01	2018630Z	7000	0	7000	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	913.8	f			M002137	调质110KSI	XYGN1992.6-2022-01	2018630Z	3060	0	3060	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	2068	f			M002138	调质110KSI	XYGN1992.6-2022-01	2018630Z	6925	0	6925	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	1691.73	f			M002050	调质110KSI	XYGN1992.6-2022-01	2018630Z	5665	0	5665	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	41.81	f			M002051	调质110KSI	XYGN1992.6-2022-01	2018630Z	140	0	140	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	31.36	f			M002052	调质110KSI	XYGN1992.6-2022-01	2018630Z	105	0	105	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	47.78	f			 M001950	调质110KSI	XYGN1992.6-2022-01	2018630Z	160	0	160	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	2886.24	f			M003950	调质110KSI	XYGN5189.2-2022-01	3017454E	9665	0	9665	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	2886.24	f			M003951	调质110KSI	XYGN5189.2-2022-01	3017454E	9665	0	9665	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	2875.79	f			M003952	调质110KSI	XYGN5189.2-2022-01	3017454E	9630	0	9630	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	545	f			M003953	调质110KSI	XYGN5189.2-2022-01	3017454E	1825	0	1825	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	2883.25	f			M004064	调质110KSI	XYGN5189.2-2022-01	3017454E	9655	0	9655	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	220	0	2880.27	f			M004065	调质110KSI	XYGN5189.2-2022-01	3017454E	9645	0	9645	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	190	0	1940.04	f			M004093	调质110KSI	XYGN5189.2-2022-01	3017454Z	8710	0	8710	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	190	0	2142.73	f			M004094	调质110KSI	XYGN5189.2-2022-01	3017454Z	9620	0	9620	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	190	0	2082.59	f			M004096	调质110KSI	XYGN5189.2-2022-01	3017454Z	9350	0	9350	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	70.97	f			M002607	调质	XYGN5189.2-2022-01	2032359Z	355	0	355	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	66.97	f			M003856	调质110KSI	XYGN1992.6-2022-01	2018630Z	335	0	335	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	227.3	f			M003857	调质110KSI	XYGN1992.6-2022-01	2018630Z	1137	0	1137	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	229.89	f			M003858	调质110KSI	XYGN1992.6-2022-01	2018630Z	1150	0	1150	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	229.49	f			M003860	调质110KSI	XYGN1992.6-2022-01	2018630Z	1148	0	1148	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	1891.13	f			M003939	调质110KSI	XYGN5189.2-2022-01	3017454Z	9460	0	9460	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	170	0	1720.72	f			M003791	调质	XYGN5189.2-2022-01	3017454Z	9650	0	9650	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	170	0	1717.15	f			M003792	调质	XYGN5189.2-2022-01	3017454Z	9630	0	9630	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	170	0	1720.72	f			M003793	调质	XYGN5189.2-2022-01	3017454Z	9650	0	9650	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	170	0	25.86	f			M003794	调质	XYGN5189.2-2022-01	3017454Z	145	0	145	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	170	0	1720.72	f			M003795	调质	XYGN5189.2-2022-01	3017454Z	9650	0	9650	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	160	0	1506.86	f			M004066	调质	XYGN5189.2-2022-01	3017454E	9540	0	9540	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	160	0	1525.03	f			M004067	调质	XYGN5189.2-2022-01	3017454E	9655	0	9655	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	160	0	1528.19	f			M004068	调质	XYGN5189.2-2022-01	3017454E	9675	0	9675	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	160	0	1522.66	f			M004069	调质	XYGN5189.2-2022-01	3017454E	9640	0	9640	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	160	0	1523.45	f			M004070	调质	XYGN5189.2-2022-01	3017454E	9645	0	9645	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	160	0	1523.45	f			M004071	调质	XYGN5189.2-2022-01	3017454E	9645	0	9645	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	160	0	916.12	f			M004097	调质	XYGN5189.2-2022-01	3017454E	5800	0	5800	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	160	0	1525.82	f			M004098	调质	XYGN5189.2-2022-01	3017454E	9660	0	9660	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_111	-	20	0	f			锯口费	-			0	0	0	0	0	0			否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	160	0	1524.24	f			M004100	调质	XYGN5189.2-2022-01	3017454E	9650	0	9650	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	160	0	1525.03	f			M004101	调质	XYGN5189.2-2022-01	3017454E	9655	0	9655	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1225.82	f			M005202	调质110KSI	XYGN5189.2-2022-01	3018946Z	8830	0	8830	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1366.04	f			M005203	调质110KSI	XYGN5189.2-2022-01	3018946Z	9840	0	9840	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1341.05	f			M005204	调质110KSI	XYGN5189.2-2022-01	3018946Z	9660	0	9660	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1342.44	f			M005205	调质110KSI	XYGN5189.2-2022-01	3018946Z	9670	0	9670	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1341.05	f			M005206	调质110KSI	XYGN5189.2-2022-01	3018946Z	9660	0	9660	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1335.5	f			M005207	调质110KSI	XYGN5189.2-2022-01	3018946Z	9620	0	9620	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1341.74	f			M005208	调质110KSI	XYGN5189.2-2022-01	3018946Z	9665	0	9665	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1341.05	f			M005209	调质110KSI	XYGN5189.2-2022-01	3018946Z	9660	0	9660	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1342.44	f			M005210	调质110KSI	XYGN5189.2-2022-01	3018946Z	9670	0	9670	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1341.74	f			M005211	调质110KSI	XYGN5189.2-2022-01	3018946Z	9665	0	9665	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1342.44	f			M005212	调质110KSI	XYGN5189.2-2022-01	3018946Z	9670	0	9670	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1341.05	f			M005213	调质110KSI	XYGN5189.2-2022-01	3018946Z	9660	0	9660	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1341.74	f			M005214	调质110KSI	XYGN5189.2-2022-01	3018946Z	9665	0	9665	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	1341.74	f			M005215	调质110KSI	XYGN5189.2-2022-01	3018946Z	9665	0	9665	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1141.6	f			M001270	调质	XYGN1992.6-2022-01	2016324Z	9440	0	9440	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	13.3	f			M001619	调质-110KSI	XYGN1992.6-2022-01	2018629Z	110	0	110	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	35.67	f	换料		M003742	调质-110KSI	JX-2021-01	F22306309XA	295	0	295	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1168.81	f			M005188	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9665	0	9665	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1166.99	f			M005189	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9650	0	9650	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1166.99	f			M005190	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9650	0	9650	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	691.73	f			M005192	调质-110KSI	XYGN5189.2-2022-01	3018947Z	5720	0	5720	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1164.58	f			M005193	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9630	0	9630	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1165.78	f			M005194	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9640	0	9640	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1165.18	f			M005195	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9635	0	9635	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1164.58	f			M005196	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9630	0	9630	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1165.18	f			M005197	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9635	0	9635	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1164.58	f			M005198	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9630	0	9630	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1169.41	f			M005199	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9670	0	9670	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	842.9	f			M005200	调质-110KSI	XYGN5189.2-2022-01	3018947Z	6970	0	6970	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1169.41	f			M005201	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9670	0	9670	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1165.78	f			M005412	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9640	0	9640	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1129.5	f			M005413	调质-110KSI	XYGN5189.2-2022-01	3018947Z	9340	0	9340	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	5.74	f			M000860	调质	XYGN1992.6-2022-01	2016324Z	55	0	55	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	5.21	f			Z23010519	调质	XYGN1992.6-2022-01	2016324Z	50	0	50	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	1005.19	f			M004103	调质	XYGN5189.2-2022-01	3017454Z	9640	0	9640	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	1006.23	f			M004104	调质	XYGN5189.2-2022-01	3017454Z	9650	0	9650	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	968.17	f			M004105	调质	XYGN5189.2-2022-01	3017454Z	9285	0	9285	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	915.52	f			M004106	调质	XYGN5189.2-2022-01	3017454Z	8780	0	8780	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	1007.28	f			M004107	调质	XYGN5189.2-2022-01	3017454Z	9660	0	9660	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	419.7	f			M004108	调质	XYGN5189.2-2022-01	3017454Z	4025	0	4025	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	1007.28	f			M004109	调质	XYGN5189.2-2022-01	3017454Z	9660	0	9660	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	1007.8	f			M004110	调质	XYGN5189.2-2022-01	3017454Z	9665	0	9665	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	120	0	861.38	f			M002116	调质110KSI	XYGN5189.2-2022-01	2031049Z	9695	0	9695	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	120	0	116.39	f			M002119	调质110KSI	XYGN5189.2-2022-01	2031049Z	1310	0	1310	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	719.69	f			M001303	调质	XYGN1992.6-2022-01	2016897Z	9640	0	9640	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	11.2	f			M001304	调质	XYGN1992.6-2022-01	2016897Z	150	0	150	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	663.33	f			M001305	调质	XYGN1992.6-2022-01	2016897Z	8885	0	8885	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	720.44	f			M001307	调质	XYGN1992.6-2022-01	2016897Z	9650	0	9650	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	719.69	f			M001308	调质	XYGN1992.6-2022-01	2016897Z	9640	0	9640	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	10.45	f			M001309	调质	XYGN1992.6-2022-01	2016897Z	140	0	140	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	3.96	f			M002122	调质110KSI	XYGN5189.2-2022-01	2031049Z	53	0	53	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	1.87	f			M002124	调质110KSI	XYGN5189.2-2022-01	2031049Z	25	0	25	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	4.85	f			M002129	调质110KSI	XYGN5189.2-2022-01	2031049Z	65	0	65	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	456.9	f			M002134	调质110KSI	XYGN5189.2-2022-01	2031049Z	6120	0	6120	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	90	0	2.75	f			M002039	调质110KSI	XYGN1992.6-2022-01	2018629E	55	0	55	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	90	0	1	f			M002043	调质110KSI	XYGN1992.6-2022-01	2018629E	20	0	20	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	90	0	3	f			M003114	调质110KSI	XYGN1992.6-2022-01	2018629E	60	0	60	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	23.99	f			M000536	热轧	JX2534-2010-01	E12200905XA	120	0	120	0	0	0	江阴兴澄	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	1959.1	f			M000537	热轧	JX2534-2010-01	E12200905XA	9800	0	9800	0	0	0	江阴兴澄	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	1277.34	f			M000540	热轧	JX2534-2010-01	E12200905XA	12250	0	12250	0	0	0	江阴兴澄	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	187.69	f			M000541	热轧	JX2534-2010-01	E12200905XA	1800	0	1800	0	0	0	江阴兴澄	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	1277.34	f			M000542	热轧	JX2534-2010-01	E12200905XA	12250	0	12250	0	0	0	江阴兴澄	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	130	0	1277.34	f			M000543	热轧	JX2534-2010-01	E12200905XA	12250	0	12250	0	0	0	江阴兴澄	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	1185.13	f			M000544	热轧	JX2534-2016-01	E12203975XX	9800	0	9800	0	0	0	江阴兴澄	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	981.97	f			M000547	热轧	JX2534-2016-01	E12203975XX	8120	0	8120	0	0	0	江阴兴澄	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	18.74	f			Z23010538	热轧			155	0	155	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	262	0	471.7	f	已卖		M003766	固溶时效		3KH80092	1103	0	1103	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	206	0	265.17	f	已卖		M003765			3KH80092	1003	0	1003	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	168	0	225.95	f			M003264	固溶时效	API STANARD 6ACRA-2015(2019)	3KD10274	1285	0	1285	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	168	0	513.79	f			M003763	固溶时效		3KD70559	2922	0	2922	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	168	0	119.57	f			M003764	固溶时效		3KD70560	680	0	680	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	158	0	681.98	f			M004323	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD30255	4385	0	4385	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	158	0	365.49	f			M004324	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD30256	2350	0	2350	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	148	0	70.96	f			M003262	固溶时效	API STANARD 6ACRA-2015(2019)	3KD30176	520	0	520	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	148	0	556.49	f			M003263	固溶时效	API STANARD 6ACRA-2015(2019)	3KD30181	4078	0	4078	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	146.5	0	141.73	f			M004325	固溶时效	API STANARD 6ACRA-2015(2019)	3KD10349	1060	0	1060	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	146.5	0	501.41	f			M004326	固溶时效	API STANARD 6ACRA-2015(2019)	3KD10347	3750	0	3750	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	146.5	0	171.15	f			M004327	固溶时效	API STANARD 6ACRA-2015(2019)	3KD30254	1280	0	1280	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	138	0	19.34	f			M003254	固溶时效	API STANARD 6ACRA-2015(2019)	3KD30163	163	0	163	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	138	0	37.97	f			M003258	固溶时效	API STANARD 6ACRA-2015(2019)	3KD30164	320	0	320	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	138	0	186.86	f			M003931	固溶时效	API STANARD 6ACRA-2015(2019)	3KD70758	1575	0	1575	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	138	0	191.02	f			M003932	固溶时效	API STANARD 6ACRA-2015(2019)	3KD70758	1610	0	1610	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	138	0	184.85	f			M003933	固溶时效	API STANARD 6ACRA-2015(2019)	3KD70758	1558	0	1558	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	138	0	169.31	f	1010+414		M003935	固溶时效	API STANARD 6ACRA-2015(2019)	3KD70758	1427	0	1427	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	138	0	396.86	f			M005414	固溶时效	API STANARD 6ACRA-2015(2019)	3KD71035	3345	0	3345	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	138	0	396.86	f			M005415	固溶时效	API STANARD 6ACRA-2015(2019)	3KD71052	3345	0	3345	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	138	0	135.25	f			M005416	固溶时效	API STANARD 6ACRA-2015(2019)	3KD71053	1140	0	1140	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	130	0	71.6	f			M004063	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD10344	680	0	680	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	152	0	277.8	f			M003756	固溶时效	API STANARD 6ACRA-2015(2019)	3KD70551	1930	0	1930	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	152	0	269.88	f			M004161	固溶时效	API STANARD 6ACRA-2015(2019)	3KD10336	1875	0	1875	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	152	0	380.72	f			M004322	固溶时效	API STANARD 6ACRA-2015(2019)	3KD10340	2645	0	2645	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	152	0	467.8	f			M004162	固溶时效	API STANARD 6ACRA-2015(2019)	 3KD10338	3250	0	3250	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	17.81	f			M003089	固溶时效	API STANARD 6ACRA-2015(2019)	3KD80335	353	0	353	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	5.8	f			M003090	固溶时效	API STANARD 6ACRA-2015(2019)	3KD80335	115	0	115	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	2.17	f			M003255	固溶时效	API STANARD 6ACRA-2015(2019)	3KD30172	43	0	43	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	6.01	f			M003294	固溶时效	API STANARD 6ACRA-2015(2019)	3KD30175	119	0	119	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	6.56	f			M003296	固溶时效	API STANARD 6ACRA-2015(2019)	3KD30175	130	0	130	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	150	0	32.52	f	1110处有切口		M000881	固溶时效120KSI	ASTM-B637-2016	1D70645	232	0	232	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	145	0	120.51	f	有缺陷		M001729	固溶时效120KSI	XYGN5226-2022-01-006	2420188R	920	0	920	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	138	0	18.86	f			M001724	固溶时效120KSI	XYGN5226-2022-01-006	2420218R	159	0	159	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	130	0	558.55	f			M004302	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD10345	5305	0	5305	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	122	0	123.51	f			M003580	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70550	1332	0	1332	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	122	0	14.37	f			M003585	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70547	155	0	155	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	2.19	f	中间打了68孔		L801	固溶时效120KSI	YQ-JS-M-006B	L210045	29	0	29	0	0	0	重庆重材	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	100	0	18.25	f			M000882	固溶时效120KSI	ASTM-B637-2016	1D70643	293	0	293	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	100	0	9.03	f			M000883	固溶时效120KSI	ASTM-B637-2016	1D70643	145	0	145	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	231.43	f			M004312	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70740	3070	0	3070	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	338.09	f			M004313	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70744	4485	0	4485	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	300.78	f			M004314	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70744	3990	0	3990	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	310.58	f			M004315	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70740	4120	0	4120	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	296.63	f			M004316	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70747	3935	0	3935	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	318.87	f			M004317	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70747	4230	0	4230	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	283.44	f			M004318	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70748	3760	0	3760	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	271	f			M004319	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70748	3595	0	3595	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	323.39	f			M004320	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70745	4290	0	4290	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	110	0	284.19	f			M004321	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70745	3770	0	3770	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	100	0	260.41	f			M004296	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70746	4180	0	4180	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	100	0	297.79	f			M004297	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70746	4780	0	4780	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	100	0	300.91	f			M004298	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70742	4830	0	4830	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	100	0	280.35	f			M004299	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70742	4500	0	4500	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	100	0	286.58	f			M004300	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70741	4600	0	4600	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	100	0	167.59	f			M004301	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70741	2690	0	2690	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	163.25	f			M004303	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70558	3235	0	3235	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	163.25	f			M004304	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70558	3235	0	3235	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	204.12	f			M004305	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70558	4045	0	4045	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	285.62	f			M004306	固溶时效	API STANDARD 6ACRA-2015(2019)	3KH80094	5660	0	5660	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	244.75	f			M004307	固溶时效	API STANDARD 6ACRA-2015(2019)	3KH80094	4850	0	4850	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	202.86	f			M004308	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70557	4020	0	4020	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	203.97	f			M004309	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70557	4042	0	4042	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	163.25	f			M004310	固溶时效	API STANDARD 6ACRA-2015(2019)	3KD70557	3235	0	3235	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_114	65	0	12.43	f			Z230413-1	固溶	ASEM SB446-2015	272-0079	477	0	477	0	0	0	宝钢特种	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	80	0	39.87	f			M000885	固溶时效120KSI	ASTM-B637-2016	0D20001	1000	0	1000	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	65	0	103.71	f			M004023	固溶时效	ASTM B637-2016	3KHD70033	3940	0	3940	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	65	0	90.02	f			M004025	固溶时效	ASTM B637-2016	3KHD70033	3420	0	3420	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	65	0	76.33	f			M004026	固溶时效	ASTM B637-2016	3KHD70033	2900	0	2900	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	65	0	63.7	f			M004027	固溶时效	ASTM B637-2016	3KHD70033	2420	0	2420	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	65	0	102.26	f			M004028	固溶时效	ASTM B637-2016	3KHD70033	3885	0	3885	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	60	0	110.79	f			M004720	固溶时效	ASTM  B637-2016	3KD70234	4940	0	4940	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	60	0	105.86	f			M004721	固溶时效	ASTM  B637-2016	3KD70234	4720	0	4720	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	60	0	105.41	f			M004722	固溶时效	ASTM  B637-2016	3KD70234	4700	0	4700	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	60	0	109.67	f			M004723	固溶时效	ASTM  B637-2016	3KD70234	4890	0	4890	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	60	0	102.38	f			M004724	固溶时效	ASTM  B637-2016	3KD70234	4565	0	4565	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	60	0	102.72	f			M004725	固溶时效	ASTM  B637-2016	3KD70234	4580	0	4580	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	60	0	119.88	f			M004726	固溶时效	ASTM  B637-2016	3KD70311	5345	0	5345	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	60	0	111.36	f			M004727	固溶时效	ASTM  B637-2016	3KD70311	4965	0	4965	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	60	0	89.71	f			M004728	固溶时效	ASTM  B637-2016	3KD70311	4000	0	4000	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	60	0	101.94	f			M004729	固溶时效	ASTM  B637-2016	3KD70311	4545	0	4545	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	55	0	29.68	f			M000886	固溶时效120KSI	ASTM-B637-2016	0D70338	1575	0	1575	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	45	0	15.2	f			M000887	固溶时效120KSI	ASTM-B637-2016	0D70727	1205	0	1205	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	45	0	30.63	f			M000888	固溶时效120KSI	ASTM-B637-2016	0D70727	2428	0	2428	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	45	0	28.57	f			M000889	固溶时效120KSI	ASTM-B637-2016	0D70727	2265	0	2265	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	45	0	27.73	f			M000891	固溶时效120KSI	ASTM-B637-2016	0D70727	2198	0	2198	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	45	0	1.14	f			M000240	固溶时效120KSI	ASTM-B637-2016	0D70727	90	0	90	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	30	0	13.43	f			M000892	固溶时效120KSI	ASTM-B637-2016	1D70645	2396	0	2396	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	30	0	14.75	f			M000895	固溶时效120KSI	ASTM-B637-2016	1D70645	2630	0	2630	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	35	0	9.16	f			M000899	固溶时效120KSI	ASTM-B637-2016	1D70645	1200	0	1200	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	30	0	15.46	f			M000902	固溶时效120KSI	ASTM-B637-2016	1D70645	2758	0	2758	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	25	0	4.82	f			M000903	固溶时效120KSI	ASTM-B637-2016	7D70138	1238	0	1238	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	25	0	0.69	f			M000893	固溶时效120KSI	ASTM-B637-2016	7D70138	178	0	178	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	25	0	7.13	f			M000901	固溶时效120KSI	ASTM-B637-2016	7D70138	1830	0	1830	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	25	0	8.64	f			M000898	固溶时效120KSI	ASTM-B637-2016	7D70138	2220	0	2220	0	0	0	中航上大	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	90	0	7.92	f			Z23010207				157	0	157	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	73	0	6.64	f			Z23010208				200	0	200	0	0	0	取芯材	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_109	73	0	6.64	f			Z23010209				200	0	200	0	0	0	取芯材	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.47	f			M005046	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9945	0	9945	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.47	f			M005047	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9945	0	9945	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.11	f			M005048	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9940	0	9940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.11	f			M005049	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9940	0	9940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.11	f			M005050	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9940	0	9940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.11	f			M005051	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9940	0	9940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.11	f			M005052	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9940	0	9940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	697.82	f			M004979	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7700	0	7700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*39	0	1076.76	f			M005226	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	6220	0	6220	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*39	0	1080.23	f			M005227	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	6240	0	6240	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*39	0	1090.61	f			M005228	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	6300	0	6300	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*39	0	1101	f			M005229	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	6360	0	6360	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*39	0	1068.11	f			M005230	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	6170	0	6170	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*39	0	1094.08	f			M005231	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	6320	0	6320	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*39	0	1061.18	f			M005232	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	6130	0	6130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*39	0	1054.26	f			M005233	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	6090	0	6090	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*39	0	1047.33	f			M005234	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	6050	0	6050	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*39	0	1059.45	f			M005235	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	6120	0	6120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*35	0	586.84	f			M002238	调质110KSI	API SPEC 5CT&FS-T-M-011	TX22-06530LG	3405	0	3405	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*35	0	1163.33	f			M002240	调质110KSI	API SPEC 5CT&FS-T-M-011	TX22-06530LG	6750	0	6750	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*35	0	1185.73	f			M002241	调质110KSI	API SPEC 5CT&FS-T-M-011	TX22-06530LG	6880	0	6880	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*35	0	1099.56	f			M002242	调质110KSI	API SPEC 5CT&FS-T-M-011	TX22-06530LG	6380	0	6380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*35	0	1101.29	f			M002243	调质110KSI	API SPEC 5CT&FS-T-M-011	TX22-06530LG	6390	0	6390	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*35	0	1123.69	f			M002244	调质110KSI	API SPEC 5CT&FS-T-M-011	TX22-06530LG	6520	0	6520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*35	0	1175.39	f			M002245	调质110KSI	API SPEC 5CT&FS-T-M-011	TX22-06530LG	6820	0	6820	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*35	0	1177.98	f			M002246	调质110KSI	API SPEC 5CT&FS-T-M-011	TX22-06530LG	6835	0	6835	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*35	0	1149.54	f			M002247	调质110KSI	API SPEC 5CT&FS-T-M-011	TX22-06530LG	6670	0	6670	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1113.2	f			M002143	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7540	0	7540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1113.2	f			M002144	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7540	0	7540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1110.24	f			M002145	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7520	0	7520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1098.43	f			M002148	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7440	0	7440	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1096.95	f			M002149	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7430	0	7430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1105.81	f			M002150	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7490	0	7490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1037.9	f			M002151	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7030	0	7030	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1102.86	f			M002152	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7470	0	7470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1048.23	f			M002153	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7100	0	7100	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1095.48	f			M002154	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7420	0	7420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1113.93	f			M002155	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7545	0	7545	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1104.34	f			M002156	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7480	0	7480	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1085.14	f			M002157	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7350	0	7350	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1111.72	f			M002158	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7530	0	7530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1111.72	f			M002159	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7530	0	7530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1113.2	f			M002160	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7540	0	7540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1102.86	f			M002161	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7470	0	7470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1111.72	f			M002162	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7530	0	7530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1108.77	f			M002163	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7510	0	7510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1110.24	f			M002164	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7520	0	7520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	143.21	f			M002165	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	970	0	970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1088.1	f			M002166	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7370	0	7370	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1114.67	f			M002167	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7550	0	7550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1110.24	f			M002168	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7520	0	7520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1113.2	f			M002170	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7540	0	7540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*28	0	1096.95	f			M002172	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	7430	0	7430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*20	0	38.57	f			M002184	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	380	0	380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*20	0	373.51	f			M002185	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	3680	0	3680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*20	0	697.28	f			M002186	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6870	0	6870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*20	0	700.32	f			M002187	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6900	0	6900	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*20	0	668.86	f			M002191	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6590	0	6590	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*20	0	701.34	f			M002301	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6910	0	6910	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	544.83	f			M002219	调质110KSI	API SPEC 5CT & FS-T-M-011C	21B-04608	8250	0	8250	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	568.6	f			M002220	调质110KSI	API SPEC 5CT & FS-T-M-011C	21B-04608	8610	0	8610	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	586.43	f			M002221	调质110KSI	API SPEC 5CT & FS-T-M-011C	21B-04608	8880	0	8880	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	478.13	f			M002222	调质110KSI	API SPEC 5CT & FS-T-M-011C	21B-04608	7240	0	7240	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	598.98	f			M002223	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	9070	0	9070	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	565.96	f			M002224	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	8570	0	8570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	568.6	f			M002225	调质110KSI	API SPEC 5CT & FS-T-M-011C	21B-04608	8610	0	8610	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	583.79	f			M002226	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	8840	0	8840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	552.75	f			M002227	调质110KSI	API SPEC 5CT & FS-T-M-011C	21B-04608	8370	0	8370	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	581.81	f			M002228	调质110KSI	API SPEC 5CT & FS-T-M-011C	21B-04608	8810	0	8810	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	530.96	f			M002229	调质110KSI	API SPEC 5CT & FS-T-M-011C	21B-04608	8040	0	8040	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	561.34	f			M002230	调质110KSI	API SPEC 5CT & FS-T-M-011C	21B-04608	8500	0	8500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	538.88	f			M002231	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	8160	0	8160	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	591.05	f			M002232	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	8950	0	8950	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	509.82	f			M002233	调质110KSI	API SPEC 5CT & FS-T-M-011C	21B-04608	7720	0	7720	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	587.75	f			M002234	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	8900	0	8900	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	558.69	f			M002235	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	8460	0	8460	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	532.94	f			M002236	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	8040	0	8040	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	584.45	f			M002237	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	8850	0	8850	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	526.33	f			L713	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	499.92	f			L715	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	7570	0	7570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	216*28	0	1133.24	f			M004453	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	8730	0	8730	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	216*28	0	1098.19	f			M004448	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	8460	0	8460	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	216*28	0	1142.33	f			M004449	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	8800	0	8800	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	216*28	0	1099.49	f			M004451	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	8470	0	8470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	216*28	0	1112.47	f			M004452	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03587LG	8570	0	8570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	210*33	0	1086	f			M002209	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6880	0	6880	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	210*33	0	1089.16	f			M002210	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6900	0	6900	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	210*33	0	1101.78	f			M002211	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6980	0	6980	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	210*33	0	1059.16	f			M002212	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6710	0	6710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	210*33	0	1095.47	f			M002213	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6940	0	6940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	210*33	0	1056.01	f			M002214	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6690	0	6690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	210*33	0	1046.54	f			M002215	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6630	0	6630	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	210*33	0	1074.95	f			M002216	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6810	0	6810	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	210*33	0	812.92	f			M002217	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	5150	0	5150	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	210*33	0	1067.06	f			M002218	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6760	0	6760	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	4.23	f			M001973	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	35	0	35	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	807.17	f			M001974	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6680	0	6680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	764.28	f			M001975	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6325	0	6325	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	580	f			B230110-4	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	4800	0	4800	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	55.58	f			B230110-5	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	460	0	460	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	118.42	f			B230110-6	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	980	0	980	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	24.17	f			B230110-7	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	200	0	200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	17.52	f			B230110-8	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	145	0	145	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	810.8	f			B230110-9	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	6710	0	6710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	142.58	f			B230110-10	调质110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06530LG	1180	0	1180	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	770.92	f			M003482	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX2206530LG	6380	0	6380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	793.88	f			M003483	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX2206530LG	6570	0	6570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	812	f			M003484	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX2206530LG	6720	0	6720	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	1103.21	f			M005217	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	9130	0	9130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	1093.55	f			M005218	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	9050	0	9050	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	1070.59	f			M005219	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	8860	0	8860	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	1064.55	f			M005220	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	8810	0	8810	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	1104.42	f			M005221	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	9140	0	9140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	1083.88	f			M005223	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	8970	0	8970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	537.87	f			M002248	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6550	0	6550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	547.73	f			M002249	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6670	0	6670	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	509.95	f			M002250	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6210	0	6210	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	562.51	f			M002251	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6850	0	6850	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	552.24	f			M002252	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6725	0	6725	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	528.02	f			M002253	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	1000	0	1000	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	559.22	f			M002254	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6780	0	6780	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	559.22	f			M002255	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	975	0	975	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	561.69	f			M002256	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6840	0	6840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	562.92	f			M002257	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6855	0	6855	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	562.51	f			M002258	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6850	0	6850	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	562.51	f			M002259	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6850	0	6850	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	525.55	f			M002260	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6400	0	6400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	559.22	f			M002262	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6810	0	6810	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	556.76	f			M002263	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6780	0	6780	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	560.45	f			M002264	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6825	0	6825	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*18	0	554.3	f			M002265	调质110KSI	API SPEC 5CT & FS-T-M-011C	22704942XG	6750	0	6750	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*35	0	54.85	f			B230110-159	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	410	0	410	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*35	0	14.72	f			B230110-160	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06529LG	110	0	110	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	730.99	f			M005163	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6535	0	6535	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	725.96	f			M005164	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6490	0	6490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	734.91	f			M005165	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6570	0	6570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	733.23	f			M005166	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6555	0	6555	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	734.35	f			M005167	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6565	0	6565	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	730.99	f			M005168	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6535	0	6535	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	691.84	f			M005169	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6185	0	6185	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	704.7	f			M005170	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6300	0	6300	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	733.79	f			M005272	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6560	0	6560	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	731.55	f			M005273	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6540	0	6540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	724.84	f			M005274	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6480	0	6480	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	730.43	f			M005275	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6530	0	6530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	728.19	f			M005276	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6510	0	6510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	190*28	0	737.14	f			M005277	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03586LG	6590	0	6590	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	174*28	0	29.23	f			M002576	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	290	0	290	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	174*28	0	103.83	f			M002577	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	1030	0	1030	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	174*28	0	65.02	f			M002580	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	645	0	645	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	174*28	0	657.28	f			M002581	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	6520	0	6520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	174*28	0	13.41	f			M002584	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	133	0	133	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	174*28	0	65.02	f			M002586	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	645	0	645	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	174*28	0	10.08	f			M002588	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	100	0	100	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	186*20	0	283.68	f			M002530	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	3465	0	3465	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	186*20	0	615.67	f			M002534	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	7520	0	7520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	186*20	0	623.45	f			M002535	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	7615	0	7615	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	186*20	0	627.95	f			M002538	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	7670	0	7670	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	186*20	0	614.85	f			M002539	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	7510	0	7510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	186*20	0	627.54	f			M002540	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	7665	0	7665	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	186*20	0	627.95	f			M002541	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	7670	0	7670	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	186*20	0	628.77	f			M002543	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	7680	0	7680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	186*20	0	622.63	f			M002545	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06533LG	7605	0	7605	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	184*20	0	53.42	f			M002176	调质-110KSI		TX22-03076LG	610	0	610	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	592.46	f			M005278	调质-110KSI		E12302999XW	6200	0	6200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	601.06	f			M005279	调质-110KSI		E12302999XW	6290	0	6290	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	598.19	f			M005280	调质-110KSI		E12302999XW	6260	0	6260	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	598.19	f			M005281	调质-110KSI		E12302999XW	6260	0	6260	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	597.23	f			M005282	调质-110KSI		E12302999XW	6250	0	6250	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	607.75	f			M005283	调质-110KSI		E12302999XW	6360	0	6360	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	658.39	f			M005284	调质-110KSI		E12302999XW	6890	0	6890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	607.75	f			M005285	调质-110KSI		E12302999XW	6360	0	6360	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	658.39	f			M005286	调质-110KSI		E12302999XW	6890	0	6890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	602.97	f			M005287	调质-110KSI		E12302999XW	6310	0	6310	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	619.21	f			M005288	调质-110KSI		E12302999XW	6480	0	6480	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	623.03	f			M005289	调质-110KSI		E12302999XW	6520	0	6520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	620.17	f			M005290	调质-110KSI		E12302999XW	6490	0	6490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	655.52	f			M005291	调质-110KSI		E12302999XW	6860	0	6860	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	658.39	f			M005292	调质-110KSI		E12302999XW	6890	0	6890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	622.08	f			M005293	调质-110KSI		E12302999XW	6510	0	6510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	641.19	f			M005294	调质-110KSI		E12302999XW	6710	0	6710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	649.79	f			M005295	调质-110KSI		E12302999XW	6800	0	6800	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	89.29	f			M001059	调质-110KSI	API SPEC 5CT&	TX22-01720LG	775	0	775	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	82.95	f			B230110-150	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06534LG	720	0	720	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	885.98	f			M004484	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7690	0	7690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	891.16	f			M004485	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7735	0	7735	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	880.22	f			M004486	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7640	0	7640	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	881.94	f			M004487	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7655	0	7655	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	842.2	f			M004488	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7310	0	7310	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	884.82	f			M004489	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7680	0	7680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	849.11	f			M004490	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7370	0	7370	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	860.63	f			M004491	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7470	0	7470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	868.12	f			M004492	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7535	0	7535	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	888.28	f			M004493	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7710	0	7710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	885.98	f			M004494	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7690	0	7690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	891.16	f			M004495	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7735	0	7735	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	832.4	f			M004496	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7225	0	7225	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	880.22	f			M004497	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7640	0	7640	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	891.74	f			M004498	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7740	0	7740	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	887.13	f			M004499	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7700	0	7700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	841.62	f			M004500	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7305	0	7305	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	860.05	f			M004501	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7465	0	7465	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	884.82	f			M004502	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7680	0	7680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	888.28	f			M004503	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7710	0	7710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	887.13	f			M004504	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7700	0	7700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	890.59	f			M004505	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7730	0	7730	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	892.89	f			M004506	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7750	0	7750	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*32	0	887.13	f			M004507	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7700	0	7700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	503.45	f			M004510	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8350	0	8350	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	495.61	f			M004511	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8220	0	8220	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	509.48	f			M004512	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8450	0	8450	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	508.28	f			M004513	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8430	0	8430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	511.89	f			M004514	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8490	0	8490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	510.69	f			M004515	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8470	0	8470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	513.1	f			M004516	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8510	0	8510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	513.7	f			M004517	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8520	0	8520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	513.1	f			M004518	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8510	0	8510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	491.39	f			M004519	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8150	0	8150	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	510.69	f			M004520	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8470	0	8470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	499.23	f			M004521	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8280	0	8280	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	512.5	f			M004522	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8500	0	8500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	513.1	f			M004523	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8510	0	8510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	512.5	f			M004524	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8500	0	8500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	513.7	f			M004525	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8520	0	8520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	512.5	f			M004526	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8500	0	8500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	512.5	f			M004527	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8500	0	8500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	483.56	f			M004528	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8020	0	8020	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	511.89	f			M004529	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8490	0	8490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*15	0	492	f			M004530	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8160	0	8160	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	888.08	f			M003587		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	8275	0	8275	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	843.54	f			M003588		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	7860	0	7860	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	879.49	f			M003589		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	8195	0	8195	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	851.59	f			M003590		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	7935	0	7935	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	877.34	f			M003591		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	8175	0	8175	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	891.83	f			M003592		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	8310	0	8310	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	892.91	f			M003593		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	8320	0	8320	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	889.69	f			M003594		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	8290	0	8290	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	836.56	f			M003595		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	7795	0	7795	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	875.73	f			M003596		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	8160	0	8160	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	841.93	f			M003597		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	7845	0	7845	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*32	0	885.39	f			M003565		API SPEC 5CT&FS-T-M-011B-3	TZ23-03328LG	8250	0	8250	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	626.4	f			M003357	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7350	0	7350	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	627.26	f			M003358	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7360	0	7360	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	619.59	f			M003359	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7270	0	7270	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	92.9	f			M003360	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	1090	0	1090	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	622.14	f			M003361	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7300	0	7300	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	644.3	f			M003362	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7560	0	7560	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	657.08	f			M003363	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7710	0	7710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	634.07	f			M003364	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7440	0	7440	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	637.48	f			M003366	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7480	0	7480	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	628.96	f			M003367	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7380	0	7380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	617.88	f			M003368	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7250	0	7250	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*24	0	640.04	f			M003370	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22004749MG	7510	0	7510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	637.68	f			M005171	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7550	0	7550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	616.14	f			M005172	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7295	0	7295	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	650.35	f			M005173	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7700	0	7700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	645.28	f			M005174	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7640	0	7640	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	641.48	f			M005175	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7595	0	7595	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	633.03	f			M005176	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7495	0	7495	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	634.3	f			M005177	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7510	0	7510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	655.84	f			M005178	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7765	0	7765	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	638.94	f			M005179	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7565	0	7565	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	641.9	f			M005180	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7600	0	7600	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	651.19	f			M005181	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7710	0	7710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	589.53	f			M005182	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	6980	0	6980	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	662.17	f			M005183	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7840	0	7840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	662.17	f			M005184	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7840	0	7840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	655.84	f			M005185	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7765	0	7765	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	664.7	f			M005186	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7870	0	7870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	162*25	0	662.17	f			M005187	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	7840	0	7840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	870.11	f			M003796	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8130	0	8130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	872.25	f			M003797	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8150	0	8150	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	872.78	f			M003798	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8155	0	8155	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	872.25	f			M003799	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8150	0	8150	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	867.97	f			M003800	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8110	0	8110	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	872.25	f			M003801	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8150	0	8150	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	874.39	f			M003802	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8170	0	8170	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	872.78	f			M003803	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8155	0	8155	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	872.25	f			M003804	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8150	0	8150	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	871.18	f			M003805	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8140	0	8140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	877.6	f			M003806	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8200	0	8200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	838	f			M003807	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	7830	0	7830	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	871.18	f			M003808	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8140	0	8140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	869.04	f			M003809	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8120	0	8120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	867.97	f			M003810	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8110	0	8110	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	872.25	f			M003811	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8150	0	8150	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	862.62	f			M003812	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8060	0	8060	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	867.97	f			M003813	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8110	0	8110	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	873.32	f			M003814	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8160	0	8160	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	872.78	f			M003815	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8155	0	8155	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	827.3	f			M003816	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	7730	0	7730	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	876.53	f			M003817	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8190	0	8190	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	870.11	f			M003818	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8130	0	8130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	870.11	f			M003819	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8130	0	8130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	873.32	f			M003820	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8160	0	8160	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	870.64	f			M003821	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8135	0	8135	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	873.32	f			M003822	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8160	0	8160	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	871.18	f			M003823	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8140	0	8140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	871.71	f			M003824	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8145	0	8145	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	877.6	f			M003825	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8200	0	8200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	879.21	f			M003826	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8215	0	8215	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	851.91	f			M003827	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	7960	0	7960	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	873.85	f			M003828	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8165	0	8165	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	870.11	f			M003829	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8130	0	8130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	226.89	f			M003830	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	2120	0	2120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	871.71	f			M003831	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8145	0	8145	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	868.5	f			M003832	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8115	0	8115	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*35	0	872.25	f			M003833	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TZ23-03328LG	8150	0	8150	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	832.15	f			M003495	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	7940	0	7940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	836.34	f			M003496	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	7980	0	7980	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	833.2	f			M003498	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	7950	0	7950	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	830.06	f			M003499	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	7920	0	7920	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	782.89	f			M003500	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	7470	0	7470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	835.3	f			M003502	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	415.03	f			M003503	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	3960	0	3960	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	80.7	f			M003505	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	770	0	770	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	833.2	f			M003506	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	7950	0	7950	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	832.15	f			M003507	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	7940	0	7940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*34	0	835.3	f			M003508	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	2308235MJL	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*24	0	618.41	f			M002200	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06533LG	6270	0	6270	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*24	0	620.81	f			M002201	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06533LG	7770	0	7770	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*24	0	626.4	f			M002202	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06533LG	7840	0	7840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*24	0	612.82	f			M002203	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06533LG	7670	0	7670	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*24	0	623.21	f			M002204	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06533LG	7800	0	7800	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	159*24	0	625.2	f			M002207	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06533LG	795	0	795	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	47.17	f			M002589	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	770	0	770	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	455.13	f			M002590	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	7430	0	7430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	460.64	f			M002591	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	7520	0	7520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	514.55	f			M002592	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	8400	0	8400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	423.28	f			M002593	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	6910	0	6910	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	483	f			M002594	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	7885	0	7885	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	441.04	f			M002595	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	7200	0	7200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	456.35	f			M002596	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	7450	0	7450	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	453.29	f			M002597	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	7400	0	7400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	431.85	f			M002598	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	7050	0	7050	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	447.16	f			M002599	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	55204783HL	7300	0	7300	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	514.55	f			M002954	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22504783HL	8400	0	8400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	516.38	f			M002955	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22504783HL	8430	0	8430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	516.69	f			M002956	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22504783HL	8435	0	8435	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	178.87	f			M002960	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22504783HL	2920	0	2920	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	86.98	f			M003577	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22504783HL	1420	0	1420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	502.29	f			M005131	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8200	0	8200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	517	f			M005132	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8440	0	8440	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	511.79	f			M005133	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8355	0	8355	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	522.51	f			M005134	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8530	0	8530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	518.83	f			M005135	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8470	0	8470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	522.82	f			M005136	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8535	0	8535	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	499.84	f			M005137	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8160	0	8160	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	200*45	0	134.16	f			Z23010537	热轧			780	0	780	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	520.36	f			M005138	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8495	0	8495	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	579.78	f			M005139	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	9465	0	9465	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	519.14	f			M005140	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8475	0	8475	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	521.28	f			M005141	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8510	0	8510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	507.2	f			M005142	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8280	0	8280	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	499.84	f			M005143	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8160	0	8160	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	497.39	f			M005144	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8120	0	8120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	505.66	f			M005145	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8255	0	8255	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	516.38	f			M005146	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8430	0	8430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	523.43	f			M005147	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8545	0	8545	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	521.9	f			M005148	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8520	0	8520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	509.34	f			M005150	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8315	0	8315	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	519.75	f			M005151	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8485	0	8485	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	520.67	f			M005152	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8500	0	8500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	519.45	f			M005153	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8480	0	8480	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	515.77	f			M005154	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8420	0	8420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	521.59	f			M005155	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8515	0	8515	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	509.65	f			M005156	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8320	0	8320	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	514.55	f			M005157	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8400	0	8400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	501.99	f			M005158	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8195	0	8195	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	510.56	f			M005159	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8335	0	8335	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	507.81	f			M005160	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8290	0	8290	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	520.06	f			M005161	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8490	0	8490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	156*18	0	521.9	f			M005162	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03328LG	8520	0	8520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	720.15	f			M005072	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	9345	0	9345	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	724.39	f			M005073	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	9400	0	9400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	647.33	f			M005074	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	8400	0	8400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	718.99	f			M005075	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	9330	0	9330	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	646.94	f			M005076	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	8395	0	8395	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	130*20	0	38.52	f			Z23010542	热轧			710	0	710	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_107	80	0	108.59	f			Z23010564	热轧			2750	0	2750	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_107	150	0	149.93	f			Z23010565	热轧			1080	0	1080	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_105	219*25	0	282.26	f			M001946	热轧	GB/T8162-2018	2016314F	2360	0	2360	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_105	219*25	0	1126.04	f			M001947	热轧	GB/T8162-2018	2016314F	9415	0	9415	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_105	219*25	0	1132.62	f			M001948	热轧	GB/T8162-2018	2016314F	9470	0	9470	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_105	219*25	0	1100.33	f			M001949	热轧	GB/T8162-2018	2016314F	9200	0	9200	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_105	150*30	0	173.11	f			Z230331-2	未调			1950	0	1950	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_114	65	0	25.55	f			Z23010211	固溶	ASEM SB446-2015	272-0079	980	0	980	0	0	0	宝钢特种	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_114	65	0	14.94	f			Z230413-2	固溶	ASEM SB446-2015	272-0079	573	0	573	0	0	0	宝钢特种	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_106	93*14	0	112.7	f			Z23010228	调质80KSI			3510	0	3510	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	653.1	f			M005077	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	8475	0	8475	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	561.79	f			M005078	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	7290	0	7290	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_108	121*32	0	467.74	f			L750	调质	API SPEC  5CT 10th	201106026	6660	0	6660	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_108	121*32	0	446.67	f			L751	调质	API SPEC  5CT 10th	201106026	6360	0	6360	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_108	121*32	0	474.06	f			L752	调质	API SPEC  5CT 10th	201106026	6750	0	6750	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_108	121*32	0	516.91	f			L755	调质	API SPEC  5CT 10th	201106026	7360	0	7360	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_108	121*32	0	505.67	f			M001515	调质	API SPEC  5CT 10th	22105175	7200	0	7200	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_108	121*32	0	511.29	f			M001519	调质	API SPEC  5CT 10th	22105175	7280	0	7280	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_108	121*32	0	479.33	f			M001522	调质	API SPEC  5CT 10th	22105175	6825	0	6825	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_108	121*32	0	457.21	f			M001523	调质	API SPEC  5CT 10th	22105175	6510	0	6510	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_108	121*32	0	311.83	f	内孔大\n3450+1190		M001524	调质	API SPEC  5CT 10th	22105175	4440	0	4440	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	125	0	26.51	f			L051	热轧			275	0	275	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	125	0	22.66	f			L052	热轧			235	0	235	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	130	0	6.26	f			L040	热轧			60	0	60	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	125	0	31.33	f			L053	热轧			325	0	325	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	100	0	183.25	f			Z23010556	热轧			2970	0	2970	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	90	0	74.47	f			Z23010557	热轧			1490	0	1490	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	220	0	95.56	f			Z23010558	热轧			320	0	320	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	125	0	22.66	f			Z23010559	热轧			235	0	235	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	100	0	58	f			Z23010560	热轧			940	0	940	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	120	0	27.99	f			Z230921-75	热轧			315	0	315	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_111	125	0	75.68	f			Z230921-78	热轧			785	0	785	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_112	35	0	11.34	f			Z23010665	调质110KSI			1500	0	1500	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_112	60	0	43.98	f			Z23010566	调质110KSI			1980	0	1980	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	647.33	f			M005079	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	8400	0	8400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	726.31	f			M005080	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	9425	0	9425	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	722.46	f			M005081	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	9375	0	9375	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	720.53	f			M005082	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	9350	0	9350	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	545.6	f			M005083	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	7080	0	7080	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	646.17	f			M005084	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	8385	0	8385	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	651.56	f			M005085	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	82304012ZT	8455	0	8455	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	543.29	f			M005086	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7050	0	7050	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	530.58	f			M005087	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	6885	0	6885	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	519.4	f			M005088	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	6740	0	6740	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	559.09	f			M005089	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7255	0	7255	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	562.56	f			M005090	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7300	0	7300	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	564.87	f			M005091	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7330	0	7330	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	575.66	f			M005092	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7470	0	7470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	564.1	f			M005093	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7320	0	7320	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	626.52	f			M005094	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	8130	0	8130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	220	0	1742.49	f			M004164	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	5835	0	5835	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	220	0	1929.14	f			M004165	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	6460	0	6460	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	220	0	754.93	f			M004159	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	2528	0	2528	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	220	0	2256.13	f			M004167	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	7555	0	7555	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	200	0	1700.45	f			M004168	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	6890	0	6890	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	200	0	1759.68	f			M004169	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	7130	0	7130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	200	0	1789.3	f			M004170	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	7250	0	7250	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	200	0	1763.39	f			M004171	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	7145	0	7145	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	200	0	1722.66	f			M004172	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	6980	0	6980	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	200	0	1672.07	f			M004173	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	6775	0	6775	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	170	0	251.42	f			M001959	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023879	1410	0	1410	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	170	0	1401.54	f			M004174	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	7860	0	7860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	170	0	1401.54	f			M004175	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	7860	0	7860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	170	0	1287.42	f			M004176	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	7220	0	7220	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	170	0	1372.12	f			M004177	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	7695	0	7695	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	170	0	1467.52	f			M004178	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	8230	0	8230	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	170	0	1512.09	f			M004179	调质-80KSI	QJ/DT01.24669-2021-B/0	23210023626	8480	0	8480	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	135	0	817.5	f			M002353	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023890	7270	0	7270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	135	0	444.17	f			M002355	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023890	3950	0	3950	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	135	0	10.12	f			M002356	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023890	90	0	90	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	135	0	195.66	f			M002357	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023890	1740	0	1740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	115	0	661.35	f			M002139	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023890	8105	0	8105	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	115	0	636.47	f			M002343	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023890	7800	0	7800	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	115	0	638.91	f			M002345	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023890	7830	0	7830	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	115	0	345.57	f			M002351	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023890	4235	0	4235	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	18	0	12.06	f			M001533	热轧		22209120988	6035	0	6035	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	18	0	12.06	f			M001534	热轧		22209120988	6035	0	6035	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	18	0	12.07	f			M001535	热轧		22209120988	6040	0	6040	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	18	0	12.05	f			M001536	热轧		22209120988	6030	0	6030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	18	0	12.05	f			M001537	热轧		22209120988	6030	0	6030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	18	0	12.07	f			M001538	热轧		22209120988	6040	0	6040	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	18	0	11.96	f			M001539	热轧		22209120988	5985	0	5985	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_108	18	0	12.05	f			M001540	热轧		22209120988	6030	0	6030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	568.72	f			M005095	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7380	0	7380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	544.83	f			M005096	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7070	0	7070	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	560.63	f			M005097	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7275	0	7275	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	572.57	f			M005098	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7430	0	7430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	592.23	f			M005099	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7685	0	7685	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	150*25	0	567.18	f			M005100	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	823040821ZT	7360	0	7360	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	549.97	f			M003307	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	6750	0	6750	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	539.78	f			M003308	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	6625	0	6625	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	542.63	f			M003309	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	6660	0	6660	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	348.23	f			M003310	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	4274	0	4274	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	544.26	f			M003311	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	6680	0	6680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	82.29	f			M003312	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	1010	0	1010	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	71.7	f			M003313	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	880	0	880	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	76.59	f			M003314	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	940	0	940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	75.77	f			M003316	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	930	0	930	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	40.74	f			M003485	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	500	0	500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	543.45	f			M003491	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	6670	0	6670	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	569.52	f			M003492	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	6990	0	6990	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	1.63	f			M003494	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03583LG	20	0	20	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	731.25	f			M005053	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8975	0	8975	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	734.51	f			M005054	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9015	0	9015	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	730.85	f			M005055	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8970	0	8970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	725.96	f			M005056	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8910	0	8910	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	724.33	f			M005057	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8890	0	8890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	733.29	f			M005058	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9000	0	9000	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	704.77	f			M005059	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8650	0	8650	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	431.71	f			L781	调质-80KSI			11370	0	11370	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	37.97	f			L782	调质-80KSI			1000	0	1000	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	418.04	f			L783	调质-80KSI			11010	0	11010	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	431.71	f			L784	调质-80KSI			11370	0	11370	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	418.42	f			L785	调质-80KSI			11020	0	11020	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	431.71	f			L787	调质-80KSI			11370	0	11370	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	431.71	f			L788	调质-80KSI			11370	0	11370	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	418.8	f			L789	调质-80KSI			11030	0	11030	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	418.04	f			L790	调质-80KSI			11010	0	11010	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	409.69	f			L791	调质-80KSI			10790	0	10790	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	409.69	f			L792	调质-80KSI			10790	0	10790	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	418.8	f			L793	调质-80KSI			11030	0	11030	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	418.8	f			L794	调质-80KSI			11030	0	11030	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	418.8	f			L795	调质-80KSI			11030	0	11030	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	114.3*15.6	0	139.35	f			L796	调质-80KSI			3670	0	3670	0	0	0	大无缝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	162*19	0	92.8	f			M000591	调质		22212770	1385	0	1385	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	135*17.5	0	61.36	f			M000598	调质		22213031	1210	0	1210	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	135*17.5	0	521.98	f			M000599	调质		22213031	10294	0	10294	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	135*17.5	0	20.28	f			M000600	调质		22213031	400	0	400	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	135*17.5	0	393.99	f			M000601	调质		22213031	7770	0	7770	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	135*17.5	0	514.22	f			M000602	调质		22213031	10141	0	10141	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	135*17.5	0	519.09	f			M000603	调质		22213031	10237	0	10237	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	190.7*19.5	0	648.97	f			M000607	调质		22212770	7883	0	7883	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	190.7*19.5	0	196.76	f			M000609	调质		22212770	2390	0	2390	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	127*7.25	0	241.5	f			M000612	调质		22211303	11280	0	11280	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	127*7.25	0	240.86	f			M000613	调质		22211303	11250	0	11250	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	127*7.25	0	240.86	f			M000614	调质		22211303	11250	0	11250	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_107	127*7.25	0	240.86	f			M000615	调质		22211303	11250	0	11250	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_109	139.7*7.72	0	283.92	f			L507				11300	0	11300	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_109	139.7*7.72	0	283.92	f			L508				11300	0	11300	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_109	177.8*12.65	0	218.95	f			L510				4250	0	4250	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_109	177.8*12.65	0	573.55	f			L511				11133	0	11133	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_109	127*9.19	0	259.06	f			L513				9703	0	9703	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_109	127*9.19	0	301.7	f			L514				11300	0	11300	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_109	139.7*7.72	0	283.92	f			L515				11300	0	11300	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_109	139.7*7.72	0	112.81	f			L516				4490	0	4490	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_109	200.03*18.5	0	97.31	f			Z23010533	调质-80KSI			1175	0	1175	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_109	200.03*18.5	0	109.73	f			Z23010534	调质-110KSI			1325	0	1325	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	731.66	f			M005060	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8980	0	8980	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	732.47	f			M005061	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8990	0	8990	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	729.62	f			M005062	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8955	0	8955	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	726.36	f			M005063	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8915	0	8915	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	695	f			M005064	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8530	0	8530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	731.66	f			M005065	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8980	0	8980	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	730.03	f			M005066	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8960	0	8960	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	730.85	f			M005067	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8970	0	8970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	730.44	f			M005068	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8965	0	8965	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.11	f			M005029	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9940	0	9940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	720.2	f			M005030	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9900	0	9900	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	701.28	f			M005031	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9640	0	9640	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	670	f			M005032	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9210	0	9210	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	697.64	f			M005033	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9590	0	9590	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.47	f			M005034	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9945	0	9945	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.83	f			M005035	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9950	0	9950	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.83	f			M005036	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9950	0	9950	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.11	f			M005037	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9940	0	9940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	705.65	f			M005038	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9700	0	9700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.47	f			M005039	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9945	0	9945	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.11	f			M005040	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9940	0	9940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.47	f			M005041	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9945	0	9945	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.83	f			M005042	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9950	0	9950	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.11	f			M005043	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9940	0	9940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.47	f			M005044	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9945	0	9945	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	143*25	0	723.47	f			M005045	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	9945	0	9945	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	697.82	f			M004980	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7700	0	7700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	701.89	f			M004981	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7745	0	7745	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	688.75	f			M004982	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7600	0	7600	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	692.83	f			M004983	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7645	0	7645	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	699.18	f			M004984	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7715	0	7715	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	690.11	f			M004985	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7615	0	7615	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	697.82	f			M004986	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7700	0	7700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	696	f			M004987	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7680	0	7680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	695.55	f			M004988	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7675	0	7675	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	652.5	f			M004989	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7200	0	7200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	698.72	f			M004990	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7710	0	7710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	697.82	f			M004991	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7700	0	7700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	669.27	f			M004992	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7385	0	7385	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	696.91	f			M004993	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7690	0	7690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	697.36	f			M004994	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7695	0	7695	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	705.97	f			M004995	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7790	0	7790	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	695.1	f			M004996	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7670	0	7670	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	694.64	f			M004997	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7665	0	7665	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	663.83	f			M004998	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7325	0	7325	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	707.79	f			M004999	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7810	0	7810	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*35	0	696.91	f			M005000	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	7690	0	7690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	502.87	f			M003061	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6880	0	6880	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	499.95	f			M003062	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6840	0	6840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	502.14	f			M003063	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6870	0	6870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	500.68	f			M003064	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6850	0	6850	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	502.87	f			M003065	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6880	0	6880	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	462.67	f			M003066	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6330	0	6330	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	502.14	f			M003067	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6870	0	6870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	503.61	f			M003068	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6890	0	6890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	502.14	f			M003069	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6870	0	6870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	502.14	f			M003070	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6870	0	6870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	503.61	f			M003071	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6890	0	6890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	503.61	f			M003072	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6890	0	6890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	502.14	f			M003073	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6870	0	6870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	503.61	f			M003074	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6890	0	6890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	502.14	f			M003075	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6870	0	6870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	502.87	f			M003076	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6880	0	6880	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	503.61	f			M003077	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6890	0	6890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	499.95	f			M003078	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6840	0	6840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	475.83	f			M003079	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6510	0	6510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	502.14	f			M003080	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6870	0	6870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	499.95	f			M003081	调质125KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06534LG	6840	0	6840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	644.92	f			M005001	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9510	0	9510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	626.61	f			M005002	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9240	0	9240	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	660.52	f			M005003	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9740	0	9740	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	660.52	f			M005004	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9740	0	9740	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	661.2	f			M005005	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9750	0	9750	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	639.5	f			M005006	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9430	0	9430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	640.17	f			M005007	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9440	0	9440	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	632.04	f			M005008	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9320	0	9320	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	630.68	f			M005009	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9300	0	9300	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	440.8	f			M005010	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6500	0	6500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	444.19	f			M005011	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6550	0	6550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	431.98	f			M005012	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6370	0	6370	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	441.48	f			M005013	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6510	0	6510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	444.87	f			M005014	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6560	0	6560	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	442.83	f			M005015	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6530	0	6530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	444.19	f			M005016	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6550	0	6550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	445.54	f			M005017	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6570	0	6570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	437.41	f			M005018	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6450	0	6450	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	441.48	f			M005019	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6510	0	6510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	428.59	f			M005020	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6320	0	6320	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	446.22	f			M005021	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6580	0	6580	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	442.83	f			M005022	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6530	0	6530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	442.15	f			M005023	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	6520	0	6520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	649.33	f			M005024	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9575	0	9575	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	633.73	f			M005025	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9345	0	9345	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	664.25	f			M005026	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9795	0	9795	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	659.84	f			M005027	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9730	0	9730	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	135*25	0	656.79	f			M005028	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302986XW	9685	0	9685	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*25	0	426.38	f			M000801	热轧	GB/T 8162-2018	22B02604	3565	0	3565	0	0	0	海鑫达	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*25	0	528.64	f			M000802	热轧	GB/T 8162-2018	22B02604	4420	0	4420	0	0	0	海鑫达	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	19.81	f			M001530	调质	API SPEC 5CT 10th	TX22-03018LG	230	0	230	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	741.43	f			M004454	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8610	0	8610	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	731.96	f			M004455	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8500	0	8500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	737.99	f			M004456	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8570	0	8570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	734.54	f			M004457	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8530	0	8530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	741.43	f			M004458	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8610	0	8610	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	738.85	f			M004459	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8580	0	8580	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	736.26	f			M004460	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8550	0	8550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	734.54	f			M004461	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8530	0	8530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	712.15	f			M004462	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8270	0	8270	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	737.99	f			M004463	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8570	0	8570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	740.57	f			M004464	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8600	0	8600	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	730.24	f			M004465	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8480	0	8480	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	730.67	f			M004466	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8485	0	8485	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	740.57	f			M004467	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8600	0	8600	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	731.1	f			M004468	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8490	0	8490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	691.49	f			M004469	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8030	0	8030	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	385.1	f			M004470	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	4472	0	4472	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	718.18	f			M004471	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8340	0	8340	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	729.37	f			M004472	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8470	0	8470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	651.87	f			M004473	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	7570	0	7570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	739.71	f			M004474	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8590	0	8590	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	739.71	f			M004475	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8590	0	8590	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	723.35	f			M004476	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8400	0	8400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	737.12	f			M004477	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8560	0	8560	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	731.96	f			M004478	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8500	0	8500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	724.21	f			M004479	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8410	0	8410	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	735.4	f			M004480	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8540	0	8540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	737.99	f			M004481	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8570	0	8570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	718.18	f			M004482	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8340	0	8340	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*36	0	733.68	f			M004483	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8520	0	8520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*25	0	515.34	f			M003337	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12303030XW	7740	0	7740	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*25	0	529.99	f			M003338	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12303030XW	7960	0	7960	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*25	0	406.48	f			M003340	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12303030XW	6105	0	6105	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*25	0	517.34	f			M003342	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12303030XW	7770	0	7770	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*25	0	506.02	f			M003343	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12303030XW	7600	0	7600	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*25	0	639.19	f			M003345	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12303030XW	9600	0	9600	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*25	0	506.02	f			M003346	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12303030XW	7600	0	7600	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*25	0	633.19	f			M003349	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12303030XW	9510	0	9510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*25	0	632.53	f			M003354	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12303030XW	9500	0	9500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	96.52	f			M003657	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	1520	0	1520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	541.97	f			M003658	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8535	0	8535	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	539.11	f			M003659	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8490	0	8490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	158.11	f			M003660	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	2490	0	2490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	540.7	f			M003661	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8515	0	8515	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	543.56	f			M003662	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8560	0	8560	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	541.02	f			M003663	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8520	0	8520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	544.51	f			M003664	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8575	0	8575	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	542.92	f			M003665	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8550	0	8550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	521.33	f			M003666	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8210	0	8210	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	542.29	f			M003667	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8540	0	8540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	544.83	f			M003668	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8580	0	8580	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	537.84	f			M003669	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8470	0	8470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	541.65	f			M003670	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8530	0	8530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	542.92	f			M003672	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8550	0	8550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	541.02	f			M003673	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8520	0	8520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	543.56	f			M003674	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8560	0	8560	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	542.29	f			M003675	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8540	0	8540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	544.19	f			M003676	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8570	0	8570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	539.75	f			M003677	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8500	0	8500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	128*25	0	525.14	f			M003678	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	8270	0	8270	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	530.43	f			M003633	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	6680	0	6680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	49.63	f			M003634	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	625	0	625	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	566.16	f			M003635	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	7130	0	7130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	563.78	f			M003636	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	7100	0	7100	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	558.62	f			M003637	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	7035	0	7035	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	563.78	f			M003638	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	7100	0	7100	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	569.73	f			M003639	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	7175	0	7175	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	532.41	f			M003640	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	6705	0	6705	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	451.82	f			M003641	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	5690	0	5690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	79.41	f			M003642	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	1000	0	1000	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	3.18	f			M003643	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	40	0	40	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	551.47	f			M003644	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	6945	0	6945	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	127*35	0	530.82	f			M003645	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	823040121ZT	6685	0	6685	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	417.54	f			M004919	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8300	0	8300	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	402.7	f			M004920	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8005	0	8005	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	419.56	f			M004921	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8340	0	8340	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	421.57	f			M004922	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8380	0	8380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	421.06	f			M004923	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8370	0	8370	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	420.81	f			M004924	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8365	0	8365	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	419.05	f			M004925	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8330	0	8330	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	386.35	f			M004926	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	7680	0	7680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	422.07	f			M004927	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8390	0	8390	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	420.56	f			M004928	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8360	0	8360	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	422.07	f			M004929	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8390	0	8390	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	420.81	f			M004930	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8365	0	8365	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	420.56	f			M004931	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8360	0	8360	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	400.94	f			M004932	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	421.57	f			M004933	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8380	0	8380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	421.32	f			M004934	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8375	0	8375	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	421.57	f			M004935	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8380	0	8380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	398.93	f			M004936	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	7930	0	7930	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	423.58	f			M004937	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8420	0	8420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	423.58	f			M004938	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8420	0	8420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	420.81	f			M004939	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8365	0	8365	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	403.46	f			M004940	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8020	0	8020	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	423.58	f			M004941	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8420	0	8420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	422.57	f			M004942	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8400	0	8400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	122*20	0	423.08	f			M004943	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03584LG	8410	0	8410	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	18.26	f			M001443	调质-110KSI	GB/T 8162-2018	22215036	260	0	260	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	9.97	f			M001444	调质-110KSI	GB/T 8162-2018	22215036	142	0	142	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	3.16	f			M001451	调质-110KSI	GB/T 8162-2018	22215036	45	0	45	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	94.81	f			M003693	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	1350	0	1350	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	639.11	f			M003696	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	9100	0	9100	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	34.76	f			M003697	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	495	0	495	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	632.09	f			M003698	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	9000	0	9000	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	29.15	f			M003701	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	415	0	415	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	717.77	f			M003702	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	10220	0	10220	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	718.47	f			M003704	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	10230	0	10230	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	716.36	f			M003705	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	10200	0	10200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	713.55	f			M003706	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	10160	0	10160	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	714.26	f			M003707	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	10170	0	10170	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	718.47	f			M003708	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	10230	0	10230	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*32	0	718.47	f			M003710	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03584LG	10230	0	10230	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*30	0	47.2	f			Z23010544	热轧			550	0	550	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	79.63	f			B230110-54	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06531LG	115	0	115	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	398.13	f			M005101	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6200	0	6200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	442.76	f			M005102	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6895	0	6895	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	403.91	f			M005103	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6290	0	6290	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	421.89	f			M005104	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6570	0	6570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	443.08	f			M005105	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6900	0	6900	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	407.76	f			M005106	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6350	0	6350	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	408.08	f			M005107	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6355	0	6355	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	420.61	f			M005108	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6550	0	6550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	427.67	f			M005109	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6660	0	6660	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	410.65	f			M005110	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6395	0	6395	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	414.18	f			M005111	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6450	0	6450	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	403.59	f			M005112	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6285	0	6285	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	416.75	f			M005113	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6490	0	6490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	409.05	f			M005114	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6370	0	6370	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	416.75	f			M005115	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6490	0	6490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	422.53	f			M005116	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6580	0	6580	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	406.8	f			M005117	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6335	0	6335	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	430.88	f			M005118	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6710	0	6710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	415.15	f			M005119	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6465	0	6465	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	425.42	f			M005120	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6625	0	6625	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	441.15	f			M005121	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6870	0	6870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	402.63	f			M005122	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6270	0	6270	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	441.15	f			M005123	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6870	0	6870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	410.97	f			M005124	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6400	0	6400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	445.01	f			M005125	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6930	0	6930	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	442.76	f			M005126	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6895	0	6895	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	405.84	f			M005127	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6320	0	6320	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	436.98	f			M005128	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6805	0	6805	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	412.9	f			M005129	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6430	0	6430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*28	0	418.04	f			M005130	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	E12302990XW	6510	0	6510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	498.33	f			M002964	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8420	0	8420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	477.61	f			M002965	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8070	0	8070	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	498.92	f			M002966	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8430	0	8430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	501.29	f			M002967	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8470	0	8470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	500.7	f			M002968	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8460	0	8460	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	499.51	f			M002969	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8440	0	8440	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	470.51	f			M002970	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	7950	0	7950	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	498.33	f			M002971	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8420	0	8420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	479.39	f			M002972	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8100	0	8100	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	500.1	f			M002973	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8450	0	8450	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	498.92	f			M002974	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8430	0	8430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	500.7	f			M002975	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8460	0	8460	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	500.7	f			M002976	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8460	0	8460	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	498.92	f			M002977	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8430	0	8430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	500.1	f			M002979	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8450	0	8450	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	506.02	f			M002980	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8550	0	8550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	498.92	f			M002981	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8430	0	8430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	498.33	f			M002982	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8420	0	8420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	498.33	f			M002983	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8420	0	8420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	23.67	f			M003051	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	400	0	400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	12.72	f			M003052	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	215	0	215	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	497.74	f			M003053	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8410	0	8410	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	500.1	f			M003054	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8450	0	8450	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	142.04	f			M003055	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	2400	0	2400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	502.47	f			M003056	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8490	0	8490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	498.92	f			M003058	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8430	0	8430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	501.29	f			M003059	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8470	0	8470	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*25	0	505.14	f			M003060	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	622120689ZT	8535	0	8535	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	122.86	f			M003653	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	623050389ZT	2190	0	2190	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	11.67	f			M003655	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	623050389ZT	208	0	208	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	375.88	f			M004790	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6700	0	6700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	373.07	f			M004791	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6650	0	6650	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	375.32	f			M004792	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6690	0	6690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	383.73	f			M004793	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6840	0	6840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	380.93	f			M004903	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6790	0	6790	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	391.59	f			M004904	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6980	0	6980	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	384.3	f			M004905	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6850	0	6850	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	376.44	f			M004906	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6710	0	6710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	380.37	f			M004907	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6780	0	6780	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	382.61	f			M004908	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6820	0	6820	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	364.66	f			M004909	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6500	0	6500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	387.66	f			M004910	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6910	0	6910	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	376.44	f			M004911	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6710	0	6710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	386.54	f			M004912	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6890	0	6890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	388.22	f			M004913	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6920	0	6920	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	368.03	f			M004914	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6560	0	6560	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	388.22	f			M004915	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6920	0	6920	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	389.34	f			M004916	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6940	0	6940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	384.3	f			M004917	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6850	0	6850	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	116*25	0	382.05	f			M004918	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623050389ZT	6810	0	6810	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	376.23	f			M003317	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6520	0	6520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	376.81	f			M003318	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6530	0	6530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	376.81	f			M003319	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6530	0	6530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	382.58	f			M003320	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6630	0	6630	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	384.31	f			M003321	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6660	0	6660	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	377.96	f			M003322	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6550	0	6550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	377.39	f			M003323	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6540	0	6540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	23.08	f			M003324	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	400	0	400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	380.27	f			M003325	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6590	0	6590	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	180.04	f			M003326	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	3120	0	3120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	377.96	f			M003327	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6550	0	6550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	383.16	f			M003328	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6640	0	6640	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	377.39	f			M003329	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6540	0	6540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	365.85	f			M003330	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6340	0	6340	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	376.23	f			M003331	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6520	0	6520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	382	f			M003332	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6620	0	6620	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	375.08	f			M003333	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6500	0	6500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	384.31	f			M003334	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6660	0	6660	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	379.69	f			M003335	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6580	0	6580	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	383.73	f			M003336	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6650	0	6650	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	379.69	f			M003523	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6580	0	6580	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	375.66	f			M003524	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6510	0	6510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	382	f			M003525	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6620	0	6620	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	382.58	f			M003527	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	6630	0	6630	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	388.64	f			M005069	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6735	0	6735	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	384.6	f			M005070	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6665	0	6665	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	386.62	f			M005071	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6700	0	6700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	386.04	f			M005296	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6690	0	6690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	385.47	f			M005297	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6680	0	6680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	371.04	f			M005298	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6430	0	6430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	369.31	f			M005299	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6400	0	6400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	387.2	f			M005300	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6710	0	6710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	368.15	f			M005301	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6380	0	6380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	385.75	f			M005302	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6685	0	6685	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	386.04	f			M005303	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6690	0	6690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	388.93	f			M005304	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6740	0	6740	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	386.91	f			M005305	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6705	0	6705	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	387.77	f			M005306	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6720	0	6720	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	388.06	f			M005307	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6725	0	6725	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	388.35	f			M005308	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6730	0	6730	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	388.35	f			M005309	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6730	0	6730	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	388.93	f			M005310	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6740	0	6740	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	388.35	f			M005311	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6730	0	6730	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	367	f			M005312	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6360	0	6360	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	385.47	f			M005313	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6680	0	6680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	384.89	f			M005314	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6670	0	6670	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	389.5	f			M005315	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6750	0	6750	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	400.15	f			M002993	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	23802277XG	7820	0	7820	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	351.02	f			M002994	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	23802277XG	6860	0	6860	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	376.1	f			M002998	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	23802277XG	7350	0	7350	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	371.49	f			M002999	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	23802277XG	7260	0	7260	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	64.47	f			M003000	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	23802277XG	1260	0	1260	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	352.56	f			M003001	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	23802277XG	6890	0	6890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	211.84	f			M003002	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	23802277XG	4140	0	4140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	353.58	f			M003003	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	23802277XG	6910	0	6910	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	400.66	f			M003004	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	23802277XG	7830	0	7830	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	353.07	f			M003005	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	23802277XG	6900	0	6900	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	495.32	f			M003679	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9680	0	9680	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	496.34	f			M003680	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9700	0	9700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	496.86	f			M003681	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9710	0	9710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	495.83	f			M003682	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9690	0	9690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	485.09	f			M003683	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9480	0	9480	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	487.13	f			M003684	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9520	0	9520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	481.5	f			M003685	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9410	0	9410	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	448.24	f			M003686	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	8760	0	8760	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	494.3	f			M003687	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9660	0	9660	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	497.37	f			M003688	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9720	0	9720	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	496.34	f			M003689	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9700	0	9700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	500.95	f			M003690	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9790	0	9790	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	495.83	f			M003691	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	9690	0	9690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	445.17	f			M003692	调质-110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03228LG	8700	0	8700	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	405.26	f			M004944	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7920	0	7920	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	406.8	f			M004945	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7950	0	7950	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	394.52	f			M004946	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7710	0	7710	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	405.26	f			M004947	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7920	0	7920	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	405.26	f			M004948	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7920	0	7920	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	405.52	f			M004949	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7925	0	7925	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	403.47	f			M004950	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7885	0	7885	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	406.29	f			M004951	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7940	0	7940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	410.89	f			M004952	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	8030	0	8030	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	406.8	f			M004953	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7950	0	7950	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	392.47	f			M004954	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7670	0	7670	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	408.84	f			M004955	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7990	0	7990	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	407.82	f			M004956	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	406.29	f			M004957	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7940	0	7940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	409	f			M004958	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7993	0	7993	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	406.29	f			M004959	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7940	0	7940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	400.15	f			M004960	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7820	0	7820	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	408.33	f			M004961	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7980	0	7980	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	407.05	f			M004962	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7955	0	7955	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	400.66	f			M004963	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7830	0	7830	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	408.84	f			M004964	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7990	0	7990	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	365.35	f			M004965	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7140	0	7140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	359.21	f			M004966	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7020	0	7020	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	381.72	f			M004967	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7460	0	7460	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	407.31	f			M004968	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7960	0	7960	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	405.77	f			M004969	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7930	0	7930	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	389.91	f			M004970	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7620	0	7620	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	397.84	f			M004971	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7775	0	7775	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	496.09	f			M004972	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	9695	0	9695	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	406.29	f			M004973	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7940	0	7940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	448.5	f			M004974	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	8765	0	8765	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	413.96	f			M004975	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	8090	0	8090	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	399.12	f			M004976	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7800	0	7800	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	389.4	f			M004977	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	7610	0	7610	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*25	0	448.24	f			M004978	调质-110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TZ23-03228LG	8760	0	8760	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	13.77	f			M002946	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	290	0	290	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	92	f			M002947	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	1938	0	1938	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	178.25	f			M002951	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	3755	0	3755	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	177.78	f			M002952	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	3745	0	3745	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	19.46	f			M002953	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	410	0	410	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	16.38	f			M002937	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	345	0	345	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	16.61	f			M002938	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	350	0	350	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	16.14	f			M002939	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	340	0	340	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	16.85	f			M002940	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	355	0	355	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	16.61	f			M002941	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	350	0	350	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	5.22	f			M002942	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	110	0	110	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	18.51	f			M002943	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	390	0	390	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*25	0	16.85	f			M002945	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	TX22-06532LG	355	0	355	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	396.51	f			M002507	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7960	0	7960	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	12.45	f			M002510	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	250	0	250	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.01	f			M002512	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.01	f			M002513	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	396.51	f			M002514	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7960	0	7960	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.01	f			M002515	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.01	f			M002517	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.01	f			M002518	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	396.76	f			M002519	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7965	0	7965	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	396.76	f			M002520	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7965	0	7965	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	396.51	f			M002521	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7960	0	7960	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.26	f			M002522	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7975	0	7975	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.01	f			M002523	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.01	f			M002524	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	396.76	f			M002525	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7965	0	7965	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.01	f			M002526	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.01	f			M002527	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*20	0	397.01	f			M002528	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	TX22-06531LG	7970	0	7970	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*24	0	9.69	f			M002552	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011C	622120688ZT	195	0	195	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*22	0	8.68	f			M001191	调质-110KSI	API SPEC 5CT&	22605904HL	200	0	200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	81.16	f			M003006	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	1870	0	1870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	81.16	f			M003007	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	1870	0	1870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	82.68	f			M003008	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	1905	0	1905	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	81.16	f			M003010	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	1870	0	1870	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	82.46	f			M003011	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	1900	0	1900	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	82.46	f			M003012	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	1900	0	1900	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	347.21	f			M003013	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	8000	0	8000	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	342.66	f			M003014	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	7895	0	7895	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	347.21	f			M003015	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	8000	0	8000	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	346.78	f			M003016	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	7990	0	7990	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	347.21	f			M003017	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	8000	0	8000	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	347.21	f			M003018	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	8000	0	8000	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	347.21	f			M003019	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	8000	0	8000	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	332.46	f			M003020	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	7660	0	7660	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	348.51	f			M003021	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	8030	0	8030	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	326.38	f			M003024	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	7520	0	7520	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	346.56	f			M003025	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	7985	0	7985	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	346.78	f			M003027	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	7990	0	7990	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*20	0	346.78	f			M003028	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	22511845XG	7990	0	7990	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	327.99	f			M003435	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8110	0	8110	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	306.96	f			M003436	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7590	0	7590	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	288.76	f			M003437	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7140	0	7140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	319.09	f			M003438	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7890	0	7890	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	266.52	f			M003439	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	6590	0	6590	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	307.36	f			M003440	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7600	0	7600	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	326.37	f			M003441	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8070	0	8070	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	287.95	f			M003442	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7120	0	7120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	327.58	f			M003443	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8100	0	8100	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	264.49	f			M003444	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	6540	0	6540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	319.9	f			M003445	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7910	0	7910	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	334.05	f			M003446	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8260	0	8260	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	262.88	f			M003447	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	6500	0	6500	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	327.58	f			M003448	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8100	0	8100	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	329.2	f			M003449	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8140	0	8140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	328.39	f			M003450	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8120	0	8120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	334.05	f			M003451	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8260	0	8260	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	262.47	f			M003452	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	6490	0	6490	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	334.05	f			M003453	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8260	0	8260	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	331.63	f			M003454	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8200	0	8200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	314.24	f			M003455	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7770	0	7770	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	308.58	f			M003456	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7630	0	7630	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	304.94	f			M003457	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7540	0	7540	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	311	f			M003458	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7690	0	7690	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	305.74	f			M003459	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7560	0	7560	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	302.51	f			M003460	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7480	0	7480	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	292.4	f			M003461	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7230	0	7230	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	313.43	f			M003462	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7750	0	7750	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	263.28	f			M003463	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	6510	0	6510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	305.74	f			M003464	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7560	0	7560	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	331.63	f			M003465	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8200	0	8200	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	304.53	f			M003466	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7530	0	7530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	326.77	f			M003467	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	8080	0	8080	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	290.38	f			M003468	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	7180	0	7180	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	102*20	0	264.9	f			M003469	调质-80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623010673ZT	6550	0	6550	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	373.58	f			M003470	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	8530	0	8530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	375.77	f			M003471	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	8580	0	8580	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	367.89	f			M003472	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	8400	0	8400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	375.33	f			M003473	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	8570	0	8570	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	367.45	f			M003474	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	8390	0	8390	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	367.45	f			M003475	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	8390	0	8390	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	329.79	f			M003476	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	7530	0	7530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	347.74	f			M003477	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	7940	0	7940	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	355.62	f			M003478	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	8120	0	8120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	373.58	f			M003479	调质80KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040107ZT	8530	0	8530	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	356.5	f			M003598	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	8140	0	8140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	325.84	f			M003599	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7440	0	7440	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	323.22	f			M003600	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7380	0	7380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	328.91	f			M003601	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7510	0	7510	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	325.19	f			M003602	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7425	0	7425	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	325.23	f			M003603	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7426	0	7426	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	325.62	f			M003604	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7435	0	7435	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	323.43	f			M003605	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7385	0	7385	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	373.8	f			M003606	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	8535	0	8535	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	323	f			M003607	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7375	0	7375	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	324.75	f			M003608	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7415	0	7415	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	5.69	f			M003609	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	130	0	130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	8.98	f			M003610	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	205	0	205	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	305.48	f			M003611	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	6975	0	6975	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	289.49	f			M003612	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	6610	0	6610	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	324.31	f			M003613	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7405	0	7405	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	270	f			M003614	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	6165	0	6165	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	319.49	f			M003615	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7295	0	7295	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	326.06	f			M003616	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7445	0	7445	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	324.97	f			M003617	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7420	0	7420	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	372.05	f			M003618	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	8495	0	8495	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	325.84	f			M003619	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7440	0	7440	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	354.97	f			M003620	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	8105	0	8105	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	325.19	f			M003621	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7425	0	7425	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	325.19	f			M003622	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7425	0	7425	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	292.12	f			M003623	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	6670	0	6670	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	293.22	f			M003624	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	6695	0	6695	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	311.83	f			M003625	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7120	0	7120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	327.38	f			M003626	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7475	0	7475	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	156.26	f			M003627	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	3568	0	3568	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	272.63	f			M003628	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	6225	0	6225	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	267.81	f			M003629	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	6115	0	6115	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	270.66	f			M003630	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	6180	0	6180	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	325.41	f			M003631	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7430	0	7430	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	326.94	f			M003632	调质110KSI	API SPEC 5CT&FS-T-M-011B-3	TZ23-03229LG	7465	0	7465	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	235.82	f			M005236	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6130	0	6130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	236.2	f			M005237	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6140	0	6140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	238.13	f			M005238	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6190	0	6190	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	234.66	f			M005239	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6100	0	6100	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	235.05	f			M005240	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6110	0	6110	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	237.36	f			M005241	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6170	0	6170	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	237.36	f			M005242	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6170	0	6170	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	340.07	f			M005243	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	8840	0	8840	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	342.76	f			M005244	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	8910	0	8910	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	355.46	f			M005245	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	9240	0	9240	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	361.61	f			M005246	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	9400	0	9400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	360.84	f			M005247	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	9380	0	9380	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	355.07	f			M005248	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	9230	0	9230	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	345.84	f			M005249	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	8990	0	8990	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	237.36	f			M005250	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6170	0	6170	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	235.43	f			M005251	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6120	0	6120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	235.24	f			M005252	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6115	0	6115	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	233.9	f			M005253	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6080	0	6080	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	236.2	f			M005254	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6140	0	6140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	235.82	f			M005255	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6130	0	6130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	236.59	f			M005256	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6150	0	6150	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	359.31	f			M005257	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	9340	0	9340	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	345.46	f			M005258	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	8980	0	8980	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	363.15	f			M005259	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	9440	0	9440	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	362	f			M005260	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	9410	0	9410	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	355.46	f			M005261	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	9240	0	9240	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	361.61	f			M005262	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	9400	0	9400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	361.61	f			M005263	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	9400	0	9400	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	235.05	f			M005264	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6110	0	6110	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	236.97	f			M005265	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6160	0	6160	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	235.43	f			M005266	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6120	0	6120	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	237.36	f			M005267	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6170	0	6170	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	236.59	f			M005268	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6150	0	6150	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	236.2	f			M005269	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6140	0	6140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	236.2	f			M005270	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	6140	0	6140	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*20	0	210.04	f			M005271	调质110KSI	API SPEC 5CT 10th PSL2 & FS-T-M-011B	623040105ZT	5460	0	5460	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	42.03	f			B230110-58	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06236LG	1235	0	1235	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	94.95	f			B230110-59	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06236LG	2790	0	2790	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	2.21	f			B230110-62	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06236LG	65	0	65	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	44.92	f			B230110-63	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06236LG	1320	0	1320	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	45.26	f			B230110-65	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06236LG	1330	0	1330	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	38.45	f			B230110-66	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06236LG	1130	0	1130	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	40.16	f			B230110-67	调质-110KSI	API SPEC 5CT & FS-T-M-011C	TX22-06236LG	1180	0	1180	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	43.56	f			M002912	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1280	0	1280	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	44.24	f			M002913	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1300	0	1300	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	43.22	f			M002914	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1270	0	1270	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	8.34	f			M002915	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	245	0	245	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	40.97	f			M002916	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1204	0	1204	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	44.24	f			M002917	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1300	0	1300	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	37.09	f			M002919	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1090	0	1090	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	40.16	f			M002920	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1180	0	1180	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	26.2	f			M002921	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	770	0	770	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	44.38	f			M002924	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1304	0	1304	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	168*30	0	168.45	f			Z23010548	热轧			1650	0	1650	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	40.5	f			M002925	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1190	0	1190	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	3.4	f			M002926	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	100	0	100	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	40.16	f			M002927	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1180	0	1180	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*20	0	41.52	f			M002929	调质-110KSI	API SPEC 5CT 10th & FS-T-M-011B	TX22-06236LG	1220	0	1220	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	83*14	0	179.38	f			M003961	调质110KSI	XYGN4525.2-2021-01	3016362Z	7530	0	7530	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	83*14	0	19.06	f			M004044	调质110KSI	XYGN4525.2-2021-01	3016362Z	800	0	800	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	83*14	0	95.31	f			M004054	调质110KSI	XYGN4525.2-2021-01	3016362Z	4001	0	4001	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	83*14	0	180.81	f			M004055	调质110KSI	XYGN4525.2-2021-01	3016362Z	7590	0	7590	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	24.52	f			L451	调质-110KSI	API SPEC 5CT 10th&技术协议 P110	0300486MSG	425	0	425	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	4.04	f			L456	调质-110KSI	API SPEC 5CT 10th&技术协议 P110	0300486MSG	70	0	70	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*30	0	23.19	f			L484	热轧			285	0	285	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*28	0	512.34	f			L487	热轧			4240	0	4240	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*16	0	79.54	f			L490	热轧	TJBY-1911-1合同/API 5CT 9th	R1913247-1	1920	0	1920	0	0	0	新兴铸管	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*40	0	951.69	f			L493	未调			5390	0	5390	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*32	0	419.81	f			L497	热轧			7000	0	7000	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	184*20	0	583.99	f			L520	调质-110KSI			7220	0	7220	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*45	0	794.26	f			L597	热轧			4530	0	4530	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*13	0	41.6	f			L710	调质-110KSI			630	0	630	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	38.1	f			M001829	调质-80KSI	GB/T 8162-2018	22215036	870	0	870	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	35.47	f			M001830	调质-80KSI	GB/T 8162-2018	22215036	810	0	810	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	6.35	f			M001831	调质-80KSI	GB/T 8162-2018	22215036	145	0	145	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	8.76	f			M001832	调质-80KSI	GB/T 8162-2018	22215036	200	0	200	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	5.91	f			M001833	调质-80KSI	GB/T 8162-2018	22215036	135	0	135	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	262.78	f			M001834-1	调质-80KSI	GB/T 8162-2018	22215036	6000	0	6000	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	195.77	f			M001834-2	调质-80KSI	GB/T 8162-2018	22215036	4470	0	4470	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	13.14	f			M001835	调质-80KSI	GB/T 8162-2018	22215036	300	0	300	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	1.75	f			M001836	调质-80KSI	GB/T 8162-2018	22215036	40	0	40	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	44.23	f			M001837	调质-80KSI	GB/T 8162-2018	22204584	1010	0	1010	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	524.46	f			M001838	调质-80KSI	GB/T 8162-2018	22204584	11975	0	11975	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	98*24	0	63.94	f			M001839	调质-80KSI	GB/T 8162-2018	22204584	1460	0	1460	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*19	0	142.18	f			M001840-2	调质-80KSI	GB/T 8162-2018	22104584	4335	0	4335	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*19	0	17.38	f			M001841	调质-80KSI	GB/T 8162-2018	22104584	530	0	530	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*19	0	272.22	f			M001843	调质-80KSI	GB/T 8162-2018	22104584	8300	0	8300	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*19	0	128.24	f			M001844-2	调质-80KSI	GB/T 8162-2018	22104584	3910	0	3910	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*19	0	129.55	f			M001845-2	调质-80KSI	GB/T 8162-2018	22104584	3950	0	3950	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*19	0	2.95	f			M001847	调质-80KSI	GB/T 8162-2018	22104584	90	0	90	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*19	0	129.55	f			M001848-2	调质-80KSI	GB/T 8162-2018	22104584	3950	0	3950	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*19	0	180.72	f			M001849	调质-80KSI	GB/T 8162-2018	22104584	5510	0	5510	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*19	0	138.41	f			M001852-2	调质-80KSI	GB/T 8162-2018	22104584	4220	0	4220	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	89*19	0	16.4	f			M001854	调质-80KSI	GB/T 8162-2018	22104584	500	0	500	0	0	0	衡阳华菱	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	225.52	f			L764	调质-110KSI			2360	0	2360	0	0	0	江苏常宝	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	1.46	f			L475	热轧			20	0	20	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*26	0	2.92	f			L482	热轧			40	0	40	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	53.99	f			Z23010549	热轧			565	0	565	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	64.98	f			Z23010550	热轧			680	0	680	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*25	0	35.84	f			Z23010504	调质110KSI			380	0	380	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*16	0	29	f			Z23010505	调质110KSI			700	0	700	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	178*25	0	75.46	f			Z23010506	调质110KSI			800	0	800	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*12	0	22.05	f			Z23010507	调质110KSI			360	0	360	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	200*25	0	87.93	f			Z23010508	调质110KSI			815	0	815	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	200*20	0	82.56	f			Z23010509	调质110KSI			930	0	930	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*35	0	98.24	f			Z23010510	调质110KSI			785	0	785	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	174*30	0	96.94	f			Z23010511	调质110KSI			910	0	910	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	180*25	0	86	f			Z23010514	调质110KSI			900	0	900	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	146*28	0	10.18	f			Z23010517	调质110KSI			125	0	125	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	200*15	0	75.62	f			Z23010518	调质110KSI			1105	0	1105	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	108*30	0	15	f			Z23010521	调质110KSI			260	0	260	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*20	0	124.55	f			Z23010522	调质110KSI			1380	0	1380	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*12	0	66.16	f			Z23010523	调质110KSI			1080	0	1080	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*35	0	34.68	f			Z23010524	调质110KSI			410	0	410	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	203*20	0	143.51	f			Z23010525	调质110KSI			1590	0	1590	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	219*25	0	236.21	f			Z23010527	调质110KSI			1975	0	1975	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	184*20	0	7.68	f			L519	调质			95	0	95	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	140*30	0	289.71	f			L488	热轧			3560	0	3560	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	120*40	0	159.4	f			Z230331-1	未调			2020	0	2020	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*17	0	22.24	f			Z230510-17	未调			510	0	510	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*17	0	22.24	f			Z230510-18	未调			510	0	510	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	121*17	0	22.24	f			Z230510-20	未调			510	0	510	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	133*20	0	27.87	f			Z230510-21	未调			500	0	500	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
4_102	83*14	0	18.1	f			Z230510-22	未调			760	0	760	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_107	110	0	83.62	f	 		M000844-B	热轧	 	 	1120	0	1120	0	0	0	 	天津	否				0	0	0	0	0	0	f	f	f	 	KT202312-01
3_110	110	0	223.97	f			M000844-A	热轧	GB/T3077-2015	179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	3000	0	3000	0	0	0	鑫禹泽	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_110	150	0	480.33	f			M001787	热轧	GB/T3077-2015	179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	3460	0	3460	0	0	0	重庆钢铁	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_110	120	0	266.54	f			Z23010562	热轧			3000	0	3000	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_110	160	0	154.79	f			M003855	热轧	GB/T3077-2015	179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	980	0	980	0	0	0	重庆钢铁	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_110	220	0	132.89	f			M005364	未正火	GB/T3077-2015	179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	445	0	445	0	0	0	重庆钢铁	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	1692.35	f			M001235	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121255	5185	0	5185	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	1689.08	f			M001236	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121255	5175	0	5175	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	1130.95	f			M001239	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121255	3465	0	3465	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	1693.98	f			M001557	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121255	5190	0	5190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	1693.98	f			M001559	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121255	5190	0	5190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	1693.98	f			M001561	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121255	5190	0	5190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	1445.92	f			M003104	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120491	4430	0	4430	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	1292.52	f			M003105	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120491	3960	0	3960	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	2049.75	f			M003106	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120491	6280	0	6280	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	2049.75	f			M003107	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120491	6280	0	6280	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	230	0	1853.91	f			M003108	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120491	5680	0	5680	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	8.96	f			M001701	调质-110KSI	QJ/DT01.24548-2021-B/0	22209112176	30	0	30	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	34.34	f			L395	调质-110KSI	QJ/DT01.24548-2021-A/0	21209122762	115	0	115	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	119.45	f	黑皮		Z23010214	调质-110KSI	QJ/DT01.24548-2021-A/0	21209122762	400	0	400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1496.13	f			M002651	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120039	5010	0	5010	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1540.92	f			M002652	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120039	5160	0	5160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1549.88	f			M002653	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120039	5190	0	5190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1028.77	f			M002654	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120039	3445	0	3445	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1033.25	f			M002655	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120039	3460	0	3460	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1039.23	f			M002657	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120039	3480	0	3480	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1030.27	f			M002658	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120039	3450	0	3450	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1033.25	f			M002659	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120039	3460	0	3460	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1027.28	f			M002660	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120039	3440	0	3440	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1912.71	f			M003092	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6405	0	6405	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1956.01	f			M003093	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6550	0	6550	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1929.14	f			M003094	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6460	0	6460	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1956.01	f			M003095	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6550	0	6550	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1836.56	f			M003096	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1948.55	f			M003097	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6525	0	6525	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1966.47	f	有缺陷		M003098	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6585	0	6585	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1973.93	f			M003099	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6610	0	6610	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	2003.79	f			M003100	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6710	0	6710	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1997.82	f			M003101	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6690	0	6690	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1914.21	f			M003102	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6410	0	6410	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1981.4	f			M003103	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120492	6635	0	6635	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1549.88	f			M004626	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121074	5190	0	5190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1548.39	f			M004627	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121074	5185	0	5185	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	400.16	f			M004628	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121074	1340	0	1340	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1549.88	f			M004629	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121074	5190	0	5190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	220	0	1030.27	f			M004630	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121074	3450	0	3450	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	210	0	1844.82	f			M002336	调质-110KSI	QJ/DT01.24548-2021-B/0	22209122786	6780	0	6780	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	210	0	1842.1	f			M002337	调质-110KSI	QJ/DT01.24548-2021-B/0	22209122786	6770	0	6770	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	210	0	1858.42	f			M002338	调质-110KSI	QJ/DT01.24548-2021-B/0	22209122786	6830	0	6830	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	210	0	1844.82	f			M002339	调质-110KSI	QJ/DT01.24548-2021-B/0	22209122786	6780	0	6780	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	210	0	1289.74	f			M000812	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111769	4740	0	4740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	210	0	95.23	f			Z23010215	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111769	350	0	350	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	49.36	f			M001243	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121256	200	0	200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1409.23	f			M001244	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121256	5710	0	5710	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1431.44	f			M001245	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121256	5800	0	5800	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1422.8	f			M001247	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121256	5765	0	5765	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1411.7	f			M001248	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121256	5720	0	5720	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1445.01	f			M001249	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121256	5855	0	5855	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	97.49	f			M001250	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121256	395	0	395	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	301.1	f			M001252	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121256	1220	0	1220	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	7.9	f			L373	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111772	32	0	32	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1380.35	f			L354	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111772	5593	0	5593	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1406.76	f			L355	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111772	5700	0	5700	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1332.72	f			L353	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111772	5400	0	5400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1244.61	f			L352	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111772	5043	0	5043	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1290.76	f			L351	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111772	5230	0	5230	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1195.75	f			L350	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111772	4845	0	4845	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1113.07	f			L349	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111772	4510	0	4510	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	200	0	1389.98	f			M001594	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121256	5632	0	5632	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1189.42	f			L240	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5340	0	5340	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1275.61	f			L241	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5727	0	5727	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1301.9	f			L242	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5845	0	5845	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1189.42	f			L156	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5340	0	5340	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1313.03	f			L391	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5895	0	5895	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1311.92	f			L390	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5890	0	5890	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1184.96	f			L387	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5320	0	5320	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1282.97	f			L389	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5760	0	5760	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1300.78	f			L386	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5840	0	5840	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1262.92	f			L388	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5670	0	5670	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	1294.77	f			L253	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	5813	0	5813	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	537.91	f			L375	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	2415	0	2415	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	190	0	445.47	f			L374	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111775	2000	0	2000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	180	0	675.69	f			L367	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111778	3380	0	3380	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	180	0	703.68	f			L380	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111778	3520	0	3520	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	180	0	683.69	f			L378	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111778	3420	0	3420	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	180	0	661.7	f			L368	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111778	3310	0	3310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	180	0	29.99	f			L366	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111778	150	0	150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	180	0	239.89	f			L376	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111778	1200	0	1200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	180	0	71.97	f			L205	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111778	360	0	360	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	180	0	52.98	f			L192	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111778	265	0	265	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	180	0	95.96	f			M371	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111778	480	0	480	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	1053.83	f			M001576	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	5910	0	5910	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	1056.5	f			M001577	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	5925	0	5925	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	1063.64	f			M001578	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	5965	0	5965	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	47.25	f			M001579	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	265	0	265	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	173.86	f			M001581	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	975	0	975	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	2.67	f			M001586	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	15	0	15	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	1069.88	f			M001589	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	6000	0	6000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	1055.61	f			M001590	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	5920	0	5920	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	1050.26	f			M001591	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	5890	0	5890	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	1052.94	f			M001592	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	5905	0	5905	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	170	0	1044.91	f			M001593	调质-110KSI	QJ/DT01.24548-2021-A/0	22209121261	5860	0	5860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	165	0	4.2	f			L196	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111779	25	0	25	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	160	0	1115.14	f			M004606	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121074	7060	0	7060	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	160	0	1122.25	f			M004607	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121074	7105	0	7105	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	160	0	1143.57	f			M004608	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121074	7240	0	7240	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	160	0	1156.21	f			M004609	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121074	7320	0	7320	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	160	0	1072.49	f			M004610	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121074	6790	0	6790	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	160	0	1118.3	f			M004611	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121074	7080	0	7080	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	160	0	1124.62	f			M004612	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121074	7120	0	7120	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	160	0	1138.83	f			M004613	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121074	7210	0	7210	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	155	0	140.82	f			M003267	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120311	950	0	950	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	155	0	316.33	f			M003268	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120311	2134	0	2134	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	155	0	1236.27	f			M003270	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120311	8340	0	8340	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	155	0	1257.77	f			M003271	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120311	8485	0	8485	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	155	0	1307.43	f			M003272	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120311	8820	0	8820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	155	0	1265.18	f			M003273	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120311	8535	0	8535	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	854.47	f			M004614	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	6155	0	6155	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	855.86	f			M004615	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	6165	0	6165	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	862.1	f			M004616	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	6210	0	6210	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	855.16	f			M004618	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	832.95	f			M004619	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	6000	0	6000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	855.16	f			M004620	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	857.94	f			M004621	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	6180	0	6180	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	852.39	f			M004622	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	832.95	f			M004623	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	6000	0	6000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	839.89	f			M004624	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	6050	0	6050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	39.57	f			M004625	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121068	285	0	285	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	846.83	f			M005350	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121068	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	839.89	f			M005351	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121068	6050	0	6050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	856.55	f			M005352	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121068	6170	0	6170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	845.44	f			M005353	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121068	6090	0	6090	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	860.72	f			M005354	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121068	6200	0	6200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	857.94	f			M005355	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121068	6180	0	6180	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	842.67	f			M005356	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121068	6070	0	6070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	823.23	f			M005357	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121068	5930	0	5930	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	824.62	f			M005358	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121068	5940	0	5940	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	799.63	f			M005359	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121068	5760	0	5760	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	807.22	f			M004203	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121054	6675	0	6675	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	834.91	f			M004204	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121054	6904	0	6904	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	830.2	f			M004205	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121054	6865	0	6865	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	846.52	f			M004206	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121054	7000	0	7000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	846.52	f			M004207	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121054	7000	0	7000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	844.11	f			M004208	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121054	6980	0	6980	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	817.5	f			M004209	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121054	6760	0	6760	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	355.54	f			M005344	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121054	2940	0	2940	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	857.41	f			M005345	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121054	7090	0	7090	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	853.78	f			M005346	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121054	7060	0	7060	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	832.01	f			M005347	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121054	6880	0	6880	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	854.99	f			M005348	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121054	7070	0	7070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	790.9	f			M005349	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121054	6540	0	6540	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	802.99	f			M005360	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121054	6640	0	6640	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	825.97	f			M005361	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121054	6830	0	6830	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	749.78	f			M005362	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121054	6200	0	6200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	805.41	f			M005363	调质-110KSI	QJ/DT01.24548-2021-B/0	23209121054	6660	0	6660	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	135	0	9	f			L143	调质-110KSI	QJ/DT01.24548-2021-A/0	2120911874	80	0	80	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	135	0	2.81	f			L134	调质-110KSI	QJ/DT01.24548-2021-A/0	2120911874	25	0	25	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	135	0	94.91	f	302+302+240		L128	调质-110KSI	QJ/DT01.24548-2021-A/0	2120911874	844	0	844	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	135	0	18.89	f			L124	调质-110KSI	QJ/DT01.24548-2021-A/0	2120911874	168	0	168	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	135	0	9	f			L123	调质-110KSI	QJ/DT01.24548-2021-A/0	2120911874	80	0	80	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	135	0	1.91	f			L137	调质-110KSI	QJ/DT01.24548-2021-A/0	2120911874	17	0	17	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	135	0	8.21	f			L131	调质-110KSI	QJ/DT01.24548-2021-A/0	2120911874	73	0	73	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	638.15	f			M003279	调质-110KSI	QJ/DT01.24548-2021-B/0	21209120311	6120	0	6120	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	326.17	f			M003280	调质-110KSI	QJ/DT01.24548-2021-B/0	21209120311	3128	0	3128	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	605.83	f			M003281	调质-110KSI	QJ/DT01.24548-2021-B/0	21209120311	5810	0	5810	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	95.41	f			M003282	调质-110KSI	QJ/DT01.24548-2021-B/0	21209120311	915	0	915	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	878.5	f			M003865	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	8425	0	8425	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	852.95	f			M003866	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	8180	0	8180	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	15.12	f			M003867	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	145	0	145	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	858.69	f			M003868	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	8235	0	8235	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	860.77	f			M003869	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	8255	0	8255	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	875.37	f			M003870	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	8395	0	8395	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	662.65	f			M003871	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	6355	0	6355	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	643.89	f			M003872	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	6175	0	6175	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	668.39	f			M003873	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	6410	0	6410	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	53.18	f			M003874	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	510	0	510	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	859.21	f			M003875	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	8240	0	8240	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	844.61	f			M003876	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	8100	0	8100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	27.63	f			M003877	调质-110KSI	QJ/DT01.24548-2021-B/O	23209120491	265	0	265	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	624.6	f			M005336	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121103	5990	0	5990	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	601.66	f			M005337	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121103	5770	0	5770	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	583.93	f			M005338	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121103	5600	0	5600	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	641.28	f			M005339	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121103	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	641.28	f			M005340	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121103	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	641.28	f			M005341	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121103	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	625.64	f			M005342	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121103	6000	0	6000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	130	0	641.28	f			M005343	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121103	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	6.22	f			L155	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	70	0	70	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	9.77	f			L345	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	110	0	110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	11.55	f			L348	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	130	0	130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	11.55	f			L231	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	130	0	130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	8.53	f			Z230405-1	调质-110KSI	QJ/DT01.24548-2021-A/0		96	0	96	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	584.18	f			M004210	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121037	6575	0	6575	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	599.72	f			M004211	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121037	6750	0	6750	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	611.27	f			M004215	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121037	6880	0	6880	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	596.17	f			M004216	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121037	6710	0	6710	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	610.39	f			M004217	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121037	6870	0	6870	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	609.5	f			M004218	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121037	6860	0	6860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	541.97	f			M004219	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121037	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	442.02	f			M004221	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121037	4975	0	4975	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	610.39	f			M004226	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121037	6870	0	6870	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	120	0	609.94	f			M004233	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121037	6865	0	6865	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	115	0	63.16	f			L271	调质-110KSI	QJ/DT01.24548-2021-A/0	2021135317	774	0	774	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	10.83	f			M001881	调质-110KSI	QJ/DT01.24548-2021-B/0	22209112176	145	0	145	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	524.84	f			M001897	调质-110KSI	QJ/DT01.24548-2021-B/0	22209112176	7030	0	7030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	6.35	f			M001902	调质-110KSI	QJ/DT01.24548-2021-B/0	22209112176	85	0	85	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	499.08	f			M001904	调质-110KSI	QJ/DT01.24548-2021-B/0	22209112176	6685	0	6685	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	9.71	f			L279	调质-110KSI	QJ/DT01.24548-2021-B/0	22209112176	130	0	130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	11.2	f			L174	调质-110KSI	QJ/DT01.24548-2021-B/0	22209112176	150	0	150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	25.38	f			M003266	调质-110KSI	QJ/DT01.24548-2021-B/0	22209112176	340	0	340	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	606.21	f			M005316	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8120	0	8120	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	630.85	f			M005317	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8450	0	8450	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	605.47	f			M005318	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8110	0	8110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	586.8	f			M005319	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	7860	0	7860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	604.72	f			M005320	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8100	0	8100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	605.47	f			M005321	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8110	0	8110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	605.47	f			M005322	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8110	0	8110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	605.47	f			M005323	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8110	0	8110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	606.96	f			M005324	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8130	0	8130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	630.85	f			M005325	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8450	0	8450	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	601.74	f			M005326	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8060	0	8060	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	602.48	f			M005328	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8070	0	8070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	27.25	f			M005330	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	365	0	365	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	592.78	f			M005331	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	7940	0	7940	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	605.47	f			M005332	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8110	0	8110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	605.47	f			M005333	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8110	0	8110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	604.72	f			M005334	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	8100	0	8100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	592.03	f			M005335	调质-110KSI	QJ/DT01.24548-2021-C/0	23209121218	7930	0	7930	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	100	0	8.33	f			M003290	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120311	135	0	135	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	100	0	53.37	f			M003292	调质-110KSI	QJ/DT01.24548-2021-B/0	23209120311	865	0	865	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	92	0	11.49	f			L256	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111899	220	0	220	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	92	0	73.37	f			L340	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111899	1405	0	1405	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	92	0	7.83	f			L338	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111899	150	0	150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	92	0	12.79	f			L339	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111899	245	0	245	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	92	0	0	f			L326	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111899	18	0	18	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	92	0	237.61	f			L274	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111899	4550	0	4550	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	92	0	14.1	f			L273	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111899	270	0	270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	92	0	225.08	f			L259	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111899	4310	0	4310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	92	0	230.3	f			L263	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111899	4410	0	4410	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	15.4	f			M000724	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	390	0	390	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	94.38	f			M000721	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	2390	0	2390	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	95.96	f			M000720	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	2430	0	2430	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	229.03	f			M000718	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5800	0	5800	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	93.78	f			M000717	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	2375	0	2375	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	11.45	f			M000716	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	290	0	290	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	229.03	f			M000714	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5800	0	5800	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	229.03	f			M000713	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5800	0	5800	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	229.03	f			M000712	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5800	0	5800	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	229.03	f			M000711	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5800	0	5800	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	227.85	f			M000710	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5770	0	5770	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	80	0	211.66	f			M000709	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5360	0	5360	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	129.27	f			L107	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5820	0	5820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	128.39	f			L108	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5780	0	5780	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	129.27	f			L104	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5820	0	5820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	129.27	f			L112	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5820	0	5820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	44.31	f	1395+600		L111	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	1995	0	1995	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	118.95	f			L114	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5355	0	5355	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	129.27	f			L110	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5820	0	5820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	129.27	f			L118	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5820	0	5820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	1.89	f			L122	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	85	0	85	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	129.27	f			L119	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5820	0	5820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	129.27	f			L116	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5820	0	5820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	108.39	f			L120	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	4880	0	4880	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	60	0	129.27	f			L117	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111837	5820	0	5820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	150	0	4.16	f			Z230510-1	调质-110KSI			30	0	30	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	140	0	71.35	f	打孔70		Z230510-2	调质-110KSI			590	0	590	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	155	0	68.93	f	打孔55		Z230510-3	调质-110KSI			465	0	465	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	92	0	3.86	f			Z230510-5	调质-110KSI	QJ/DT01.24548-2021-A/0	21209111899	74	0	74	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_104	110	0	24.64	f	打孔55		Z230510-6	调质-110KSI	QJ/DT01.24548-2021-B/0	22209112176	330	0	330	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	310	0	438.18	f			M001870	调质-80KSI	QJ/DT01.24412-2020-B/0	22210023812	739	0	739	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	305	0	401.77	f			M001872	调质-80KSI	QJ/DT01.24412-2020-B/0	22210023855	700	0	700	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	58.23	f			M001553	调质-80KSI	QJ/DT01.24412-2020-B/0	22210023579	195	0	195	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	2054.56	f			M002304	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020032	6880	0	6880	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	32.85	f			M002305	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020032	110	0	110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	19.41	f	自用		M002307	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020032	65	0	65	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	198.59	f	135+530		M002309	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020032	665	0	665	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	53.75	f			M000646	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021283	180	0	180	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	2006.78	f			M001542	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010854	6720	0	6720	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	88.69	f	87+210		M001544	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010854	297	0	297	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	2063.52	f			M001545	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010854	6910	0	6910	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	1964.97	f			M001547	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010854	6580	0	6580	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	1636.48	f			M001549	调质-80KSI	QJ/DT01.24412-2020-B/0	22210023579	5480	0	5480	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	5.97	f	自用		M001550	调质-80KSI	QJ/DT01.24412-2020-B/0	22210023579	20	0	20	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	13.44	f			M001570	调质-80KSI	QJ/DT01.24412-2020-B/0	22210023812	45	0	45	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	62.71	f			M001684	调质-80KSI	QJ/DT01.24412-2020-B/0	22210023812	210	0	210	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	220	0	71.67	f			M000512	调质-80KSI	QJ/DT01.24412-2020-B/0	22210023812	240	0	240	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	210	0	1779.51	f			M002312	调质-80KSI	QJ/DT01.24412-2020-B/0	22210024862	6540	0	6540	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	210	0	73.47	f			M002313	调质-80KSI	QJ/DT01.24412-2020-B/0	22210024862	270	0	270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	210	0	480.25	f			M001968	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023855	1765	0	1765	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	210	0	1866.59	f			M001970	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023855	6860	0	6860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	210	0	235.09	f	660+200		M001971	调质-80KSI	QJ/DT01.24669-2021-B/0	22210023855	864	0	864	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	200	0	1554.84	f			M002314	调质-80KSI	QJ/DT01.24412-2020-A/0	23210020022	6300	0	6300	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	200	0	1456.12	f			M002315	调质-80KSI	QJ/DT01.24412-2020-A/0	23210020022	5900	0	5900	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	200	0	128.34	f			M002316	调质-80KSI	QJ/DT01.24412-2020-A/0	23210020022	520	0	520	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	200	0	608.36	f	2255处切断		M002317	调质-80KSI	QJ/DT01.24412-2020-A/0	23210020022	2465	0	2465	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	190	0	38.98	f			M000678	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021288	175	0	175	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	190	0	135.87	f			M000679	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021288	610	0	610	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	190	0	651.51	f			M000680	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021288	2925	0	2925	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	68.97	f			M000661	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021288	345	0	345	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	1201.45	f			M000662	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021288	6010	0	6010	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	1115.49	f			M000663	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021288	5580	0	5580	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	1156.47	f			M000698	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021288	5785	0	5785	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	1381.36	f			M002320	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020022	6910	0	6910	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	1347.38	f			M002321	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020022	6740	0	6740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	374.83	f			M002322	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020022	1875	0	1875	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	1374.37	f			M002323	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020022	6875	0	6875	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	1385.36	f			M002324	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020022	6930	0	6930	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	1381.36	f			M002325	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020022	6910	0	6910	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	1373.37	f			M002326	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020022	6870	0	6870	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	1256.42	f			M002327	调质-80KSI	QJ/DT01.24412-2020-B/0	23210020022	6285	0	6285	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	30.31	f			M001680	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	170	0	170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	43.69	f			M001682	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	245	0	245	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1205.4	f			M001683	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6760	0	6760	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1161.71	f			M002329	调质-80KSI	QJ-DT01.24412-2020-B/0	22210025474	6515	0	6515	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1197.37	f			M002330	调质-80KSI	QJ-DT01.24412-2020-B/0	22210025474	6715	0	6715	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1182.22	f			M002331	调质-80KSI	QJ-DT01.24412-2020-B/0	22210025474	6630	0	6630	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1166.17	f			M002332	调质-80KSI	QJ-DT01.24412-2020-B/0	22210025474	6540	0	6540	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1187.56	f			M002333	调质-80KSI	QJ-DT01.24412-2020-B/0	22210025474	6660	0	6660	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1198.26	f			M002334	调质-80KSI	QJ-DT01.24412-2020-B/0	22210025474	6720	0	6720	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1200.05	f			M002335	调质-80KSI	QJ-DT01.24412-2020-B/0	22210025474	6730	0	6730	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	105.2	f			M001676	调质-80KSI	QJ-DT01.24412-2020-B/0	22210025474	590	0	590	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	74.89	f			M002626	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	420	0	420	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	7.13	f			M002628	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	40	0	40	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	55.28	f			M002629	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	310	0	310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	121.25	f	90+590		M002633	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	680	0	680	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	52.6	f			M002634	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	295	0	295	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1160.82	f			M002637	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	6510	0	6510	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	62.41	f			M002638	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	350	0	350	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	6.24	f			M002640	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	35	0	35	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1157.25	f			M002641	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	6490	0	6490	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1171.52	f			M002642	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	6570	0	6570	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1094.84	f			M002643	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	170	0	1194.7	f			M002644	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020566	6700	0	6700	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	160	0	6.79	f			M001598	调质-80KSI	QJ-DT01.24412-2020-B/0	22210010854	43	0	43	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	160	0	12.64	f			M001602	调质-80KSI	QJ-DT01.24412-2020-B/0	22210010854	80	0	80	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	160	0	9.48	f			M001620	调质-80KSI	QJ-DT01.24412-2020-B/0	22210010854	60	0	60	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	160	0	1138.83	f			M004180	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	7210	0	7210	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	160	0	1140.41	f			M004181	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	7220	0	7220	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	160	0	55.28	f			M004182	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	350	0	350	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	160	0	1154.63	f			M004183	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	7310	0	7310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	55.53	f			M001688	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010854	400	0	400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	83.99	f			M001694	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010854	605	0	605	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	7.64	f			M000653	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021293	55	0	55	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	18.05	f			M000659	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021293	130	0	130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	8.33	f			M002804	调质-80KSI	QJ/DT01.24412-2020-B/0	22210020445	60	0	60	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	796.86	f			M004184	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	792.69	f			M004185	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	5710	0	5710	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	792.69	f			M004186	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	5710	0	5710	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	858.63	f			M004187	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6185	0	6185	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	841.97	f			M004188	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6065	0	6065	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	830.17	f			M004189	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	5980	0	5980	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	842.67	f			M004190	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6070	0	6070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	701.07	f			M004191	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	5050	0	5050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	771.87	f			M004341	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5560	0	5560	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	843.36	f			M004342	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6075	0	6075	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	802.41	f			M004343	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5780	0	5780	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	839.2	f			M004344	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6045	0	6045	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	848.91	f			M004348	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6115	0	6115	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	842.67	f			M004350	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6070	0	6070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	857.94	f			M004345	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6180	0	6180	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	859.33	f			M004346	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6190	0	6190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	869.04	f			M004347	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6260	0	6260	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	860.72	f			M004349	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6200	0	6200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	870.43	f			M004352	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6270	0	6270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	823.23	f			M004353	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	5930	0	5930	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	702.45	f			M004354	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	5060	0	5060	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	839.89	f			M004355	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6050	0	6050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	870.43	f			M004356	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6270	0	6270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	860.72	f			M004357	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6200	0	6200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	842.67	f			M004358	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6070	0	6070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	860.72	f			M004359	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6200	0	6200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	870.43	f			M004360	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6270	0	6270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	870.43	f			M004361	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6270	0	6270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	860.72	f			M004362	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6200	0	6200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	150	0	846.83	f			M004363	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023328	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	13.91	f			M002719	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025810	115	0	115	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	3.39	f			M002720	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025810	28	0	28	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	9.67	f			M002724	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025810	80	0	80	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	1.81	f			L037	调质-80KSI	QJ/DT01.24412-2020-A/0	22210022373	15	0	15	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	854.99	f			M004192	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	7070	0	7070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	852.57	f			M004193	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	7050	0	7050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	829.59	f			M004194	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6860	0	6860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	850.15	f			M004195	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	7030	0	7030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	812.66	f			M004196	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6720	0	6720	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	852.57	f			M004197	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	7050	0	7050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	796.94	f			M004198	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6590	0	6590	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	828.99	f			M004199	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6855	0	6855	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	853.78	f			M004200	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	7060	0	7060	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	735.27	f			M004201	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6080	0	6080	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	748.57	f			M004202	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6190	0	6190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	833.22	f			M004635	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6890	0	6890	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	799.36	f			M004636	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6610	0	6610	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	813.87	f			M004637	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6730	0	6730	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	839.27	f			M004638	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6940	0	6940	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	798.15	f			M004639	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6600	0	6600	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	788.48	f			M004640	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6520	0	6520	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	811.45	f			M004641	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6710	0	6710	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	763.08	f			M004642	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6310	0	6310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	705.03	f			M004643	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5830	0	5830	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	495.82	f			M004644	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	4100	0	4100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	552.66	f			M004645	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	4570	0	4570	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	628.85	f			M004646	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5200	0	5200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	620.38	f			M004647	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5130	0	5130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	790.9	f			M004433	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6540	0	6540	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	730.43	f			M004434	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6040	0	6040	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	836.85	f			M004435	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6920	0	6920	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	838.06	f			M004436	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6930	0	6930	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	754.62	f			M004437	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6240	0	6240	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	771.55	f			M004438	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	6380	0	6380	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	712.29	f			M004439	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	5890	0	5890	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	650.61	f			M004440	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023013	5380	0	5380	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	460.75	f			M004441	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	3810	0	3810	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	597.4	f			M004442	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	4940	0	4940	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	544.19	f			M004443	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	4500	0	4500	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	140	0	753.41	f			M004444	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6230	0	6230	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	1.56	f			L090	调质-80KSI	QJ/DT01.24412-2020-A/0	21209121840	15	0	15	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	6.05	f			L089	调质-80KSI	QJ/DT01.24412-2020-A/0	21209121840	58	0	58	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	2.09	f			L084	调质-80KSI	QJ/DT01.24412-2020-A/0	21209121840	20	0	20	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	3.65	f			M002699	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	35	0	35	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	19.81	f			M002701	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	190	0	190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	52.66	f			M002728	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	505	0	505	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	189.26	f			M002729	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	1815	0	1815	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	201.77	f			M002730	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	1935	0	1935	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	406.66	f			M002731	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	3900	0	3900	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	10.43	f			M002732	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	100	0	100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	641.28	f			M004415	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	637.11	f			M004416	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	6110	0	6110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	734.08	f			M004417	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	7040	0	7040	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	636.07	f			M004418	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	836.27	f			M004419	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8020	0	8020	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	836.79	f			M004420	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8025	0	8025	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	835.23	f			M004421	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8010	0	8010	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	836.27	f			M004422	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8020	0	8020	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	834.18	f			M004423	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8000	0	8000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	834.18	f			M004424	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8000	0	8000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	804.99	f			M004425	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	7720	0	7720	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	834.71	f			M004426	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8005	0	8005	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	796.65	f			M004427	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	7640	0	7640	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	804.47	f			M004428	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	7715	0	7715	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	802.9	f			M004429	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	7700	0	7700	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	837.31	f			M004430	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8030	0	8030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	836.27	f			M004431	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8020	0	8020	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	833.14	f			M004432	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	7990	0	7990	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	791.43	f			M004570	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	7590	0	7590	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	841.48	f			M004571	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8070	0	8070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	834.18	f			M004572	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8000	0	8000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	821.67	f			M004573	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	7880	0	7880	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	835.23	f			M004574	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	8010	0	8010	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	803.94	f			M004575	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023106	7710	0	7710	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	642.32	f			M004407	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023624	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	643.36	f			M004408	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023624	6170	0	6170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	640.24	f			M004409	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023624	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	640.24	f			M004410	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023624	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	370.17	f			M004411	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023624	3550	0	3550	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	340.97	f			M004412	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023624	3270	0	3270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	643.36	f			M004413	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023624	6170	0	6170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	130	0	642.32	f			M004414	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023624	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	604.17	f			M002812	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	6800	0	6800	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	605.94	f			M002813	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	6820	0	6820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	299.42	f			M002814	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	3370	0	3370	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	609.5	f			M002816	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	6860	0	6860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	607.28	f			M002817	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	6835	0	6835	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	619.27	f			M002819	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	6970	0	6970	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	607.72	f			M002820	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	6840	0	6840	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	614.83	f			M002825	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	6920	0	6920	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	607.72	f			M002826	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	6840	0	6840	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	624.6	f			M002827	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	7030	0	7030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	25.77	f			M002830	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	290	0	290	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	480.22	f			M002832	调质-80KSI	QJ-DT01.24412-2020-B/0	22210020445	5405	0	5405	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	617.49	f			M004631	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6950	0	6950	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	604.17	f			M004632	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6800	0	6800	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	615.72	f			M004633	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6930	0	6930	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	614.83	f			M004634	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6920	0	6920	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	469.12	f			M004552	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	5280	0	5280	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	508.21	f			M004553	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	5720	0	5720	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	509.99	f			M004554	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	618.38	f			M004559	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6960	0	6960	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	637.04	f			M004560	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	7170	0	7170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	568.63	f			M004561	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6400	0	6400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	648.59	f			M004562	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	7300	0	7300	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	626.38	f			M004563	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	7050	0	7050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	614.83	f			M004564	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6920	0	6920	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	662.36	f			M004565	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	7455	0	7455	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	713.89	f			M004566	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	8035	0	8035	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	715.23	f			M004567	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	8050	0	8050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	715.23	f			M004568	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	8050	0	8050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	715.23	f			M004569	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	8050	0	8050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	621.05	f			M004671	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6990	0	6990	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	613.94	f			M004672	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6910	0	6910	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	622.82	f			M004673	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	7010	0	7010	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	607.28	f			M004674	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6835	0	6835	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	605.05	f			M004675	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6810	0	6810	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	614.38	f			M004676	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6915	0	6915	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	649.48	f			M004677	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	7310	0	7310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	647.7	f			M004678	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	7290	0	7290	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	523.76	f			M004679	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	5895	0	5895	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	533.98	f			M004680	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6010	0	6010	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	586.4	f			M004681	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6600	0	6600	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	537.09	f			M004682	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	6045	0	6045	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	715.23	f			M004687	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	8050	0	8050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	715.23	f			M004688	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	8050	0	8050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	677.02	f			M004689	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023136	7620	0	7620	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	590.39	f			M004683	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6645	0	6645	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	617.49	f			M004684	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6950	0	6950	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	612.16	f			M004685	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6890	0	6890	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	715.23	f			M004686	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	8050	0	8050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	414.72	f			M000961	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	5555	0	5555	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	398.3	f			M000962	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	5335	0	5335	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	410.61	f			M000963	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	5500	0	5500	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	403.89	f			M000964	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	5410	0	5410	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	383.36	f			M000965	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	5135	0	5135	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	400.16	f			M000966	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	5360	0	5360	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	371.79	f			M000971	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	4980	0	4980	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	397.92	f			M000973	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	5330	0	5330	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	410.61	f			M000974	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	5500	0	5500	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	415.47	f			M000975	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	5565	0	5565	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	3.73	f			M000976	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	50	0	50	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	25.76	f			M000978	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	345	0	345	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	11.2	f			M000979	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	150	0	150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	2.24	f			M000980	调质-80KSI	QJ-DT01.24412-2020-A/0	22210022373	30	0	30	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	5.23	f			M002736	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	70	0	70	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	2.24	f			M002737	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	30	0	30	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	18.29	f			M002738	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	245	0	245	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	1.87	f			M002739	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	25	0	25	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	453.17	f			M002740	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	6070	0	6070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	449.44	f			M002741	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	6020	0	6020	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	453.17	f			M002742	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	6070	0	6070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	453.91	f			M002744	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	6080	0	6080	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	453.17	f			M002745	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	6070	0	6070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	451.67	f			M002746	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	6050	0	6050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	453.91	f			M002747	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	6080	0	6080	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	397.18	f			M004555	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010670	5320	0	5320	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	396.43	f			M004556	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010670	5310	0	5310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	437.49	f			M004557	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010670	5860	0	5860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	368.81	f			M004558	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010670	4940	0	4940	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	461.38	f			M004690	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6180	0	6180	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	331.48	f			M004692	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	4440	0	4440	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	306.09	f			M004693	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	4100	0	4100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	436	f			M004694	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5840	0	5840	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	287.43	f			M004695	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	3850	0	3850	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	304.23	f			M004697	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	4075	0	4075	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	316.55	f			M004698	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	4240	0	4240	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	288.18	f			M004699	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	3860	0	3860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	412.11	f			M004701	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5520	0	5520	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	342.68	f			M004702	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	4590	0	4590	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	416.29	f			M004703	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5576	0	5576	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	404.64	f			M004704	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5420	0	5420	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	407.25	f			M004705	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5455	0	5455	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	411.36	f			M004706	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5510	0	5510	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	433.76	f			M004707	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5810	0	5810	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	512.15	f			M004708	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6860	0	6860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	428.16	f			M004709	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5735	0	5735	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	430.02	f			M004710	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5760	0	5760	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	609.95	f			M004711	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8170	0	8170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	612.19	f			M004712	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8200	0	8200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	600.24	f			M004713	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8040	0	8040	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	620.4	f			M004714	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8310	0	8310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	585.31	f			M004715	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	7840	0	7840	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	600.24	f			M004716	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8040	0	8040	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	593.52	f			M004717	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	7950	0	7950	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	523.35	f			M004718	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	7010	0	7010	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	618.16	f			M004719	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8280	0	8280	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	489.75	f			M004691	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	6560	0	6560	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	212.03	f			M004696	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	2840	0	2840	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	384.86	f			M004700	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	5155	0	5155	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	617.41	f			M004582	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8270	0	8270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	568.89	f			M004583	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	7620	0	7620	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	615.92	f			M004584	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8250	0	8250	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	609.2	f			M004585	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8160	0	8160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	479.3	f			M004586	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	6420	0	6420	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	582.32	f			M004587	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	7800	0	7800	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	615.92	f			M004588	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8250	0	8250	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	605.84	f			M004589	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8115	0	8115	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	662.95	f			M004590	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8880	0	8880	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	583.82	f			M004591	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	7820	0	7820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	608.45	f			M004592	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8150	0	8150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	613.68	f			M004593	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8220	0	8220	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	610.69	f			M004594	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8180	0	8180	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	620.4	f			M004595	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8310	0	8310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	618.53	f			M004596	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8285	0	8285	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	565.9	f			M004597	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	7580	0	7580	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	608.45	f			M004598	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8150	0	8150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	599.5	f			M004599	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8030	0	8030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	616.67	f			M004600	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8260	0	8260	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	622.27	f			M004601	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8335	0	8335	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	599.5	f			M004602	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8030	0	8030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	486.02	f			M004603	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	6510	0	6510	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	602.48	f			M004604	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8070	0	8070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	110	0	599.5	f			M004605	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023205	8030	0	8030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	3.7	f			L004	调质-80KSI	QJ-DT01.24412-2020-A/0	21209123087	60	0	60	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	12.96	f			L010	调质-80KSI	QJ-DT01.24412-2020-A/0	21209123087	210	0	210	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	15.12	f			L011	调质-80KSI	QJ-DT01.24412-2020-A/0	21209123087	245	0	245	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	3.09	f			M001003	调质-80KSI	QJ-DT01.24412-2020-A/0	22209120311	50	0	50	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	8.02	f			M001004	调质-80KSI	QJ-DT01.24412-2020-A/0	22209120311	130	0	130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	2.78	f			M001006	调质-80KSI	QJ-DT01.24412-2020-A/0	22209120311	45	0	45	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	7.77	f			M001007	调质-80KSI	QJ-DT01.24412-2020-A/0	22209120311	126	0	126	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	4.75	f			M001009	调质-80KSI	QJ-DT01.24412-2020-A/0	22209120311	77	0	77	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	56.76	f			M001011	调质-80KSI	QJ-DT01.24412-2020-A/0	22209120311	920	0	920	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	3.21	f			M001014	调质-80KSI	QJ-DT01.24412-2020-A/0	22209120311	52	0	52	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	29.31	f			L100	调质-80KSI	QJ-DT01.24412-2020-A/0	22209120311	475	0	475	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	1.11	f			M002748	调质-80KSI	QJ-DT01.24412-2020-B/0	23210020445	18	0	18	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	398.58	f			M004374	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6460	0	6460	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	411.23	f			M004375	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6665	0	6665	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	388.09	f			M004376	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6290	0	6290	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	399.2	f			M004377	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6470	0	6470	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	389.94	f			M004378	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6320	0	6320	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	400.43	f			M004379	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6490	0	6490	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	370.82	f			M004380	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6010	0	6010	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	377.3	f			M004381	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6115	0	6115	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	368.04	f			M004391	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5965	0	5965	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	354.78	f			M004392	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5750	0	5750	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	364.03	f			M004393	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5900	0	5900	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	366.19	f			M004394	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5935	0	5935	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	362.18	f			M004395	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5870	0	5870	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	329.48	f			M004396	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5340	0	5340	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	374.52	f			M004397	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6070	0	6070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	371.43	f			M004398	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6020	0	6020	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	410.31	f			M004399	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6650	0	6650	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	375.14	f			M004400	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6080	0	6080	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	389.33	f			M004401	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6310	0	6310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	387.78	f			M004402	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6285	0	6285	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	352.31	f			M004403	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5710	0	5710	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	354.16	f			M004404	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	358.17	f			M004405	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	5805	0	5805	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	375.44	f			M004406	调质-80KSI	QJ/DT01.24412-2020-B/0	23210010659	6085	0	6085	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	389.94	f			M004364	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6320	0	6320	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	363.41	f			M004365	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	5890	0	5890	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	377.3	f			M004366	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6115	0	6115	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	385.01	f			M004367	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6240	0	6240	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	393.03	f			M004368	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6370	0	6370	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	381.31	f			M004369	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6180	0	6180	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	386.24	f			M004370	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6260	0	6260	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	391.18	f			M004371	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6340	0	6340	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	381.31	f			M004372	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6180	0	6180	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	383.77	f			M004373	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6220	0	6220	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	389.94	f			M004382	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6320	0	6320	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	372.36	f			M004383	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6035	0	6035	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	386.86	f			M004384	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6270	0	6270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	395.5	f			M004385	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6410	0	6410	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	392.41	f			M004386	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6360	0	6360	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	339.35	f			M004387	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	5500	0	5500	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	335.03	f			M004388	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	5430	0	5430	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	371.74	f			M004389	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6025	0	6025	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	383.77	f			M004390	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6220	0	6220	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	368.35	f			M004648	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	5970	0	5970	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	381.92	f			M004649	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6190	0	6190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	376.99	f			M004650	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6110	0	6110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	367.12	f			M004651	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	5950	0	5950	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	370.2	f			M004652	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6000	0	6000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	386.86	f			M004653	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6270	0	6270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	373.9	f			M004654	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6060	0	6060	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	395.5	f			M004655	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6410	0	6410	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	396.73	f			M004656	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6430	0	6430	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	385.01	f			M004657	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6240	0	6240	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	382.54	f			M004658	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6200	0	6200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	384.39	f			M004659	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6230	0	6230	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	386.24	f			M004660	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6260	0	6260	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	394.88	f			M004661	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6400	0	6400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	389.33	f			M004662	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6310	0	6310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	386.86	f			M004663	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6270	0	6270	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	374.52	f			M004664	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6070	0	6070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	385.63	f			M004665	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6250	0	6250	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	385.63	f			M004666	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6250	0	6250	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	397.97	f			M004667	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6450	0	6450	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	382.54	f			M004668	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6200	0	6200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	381.92	f			M004669	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6190	0	6190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	100	0	391.18	f			M004670	调质-80KSI	QJ/DT01.24412-2020-B/0	23210023179	6340	0	6340	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	90	0	72.47	f			L630	调质-80KSI	QJ/DT01.24412-2020-A/0	21209123087	1450	0	1450	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	290.98	f			M002835	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6090	0	6090	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	274.5	f			M002836	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	5745	0	5745	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	291.46	f			M002837	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	292.89	f			M002838	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6130	0	6130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	293.37	f			M002839	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	290.98	f			M002840	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6090	0	6090	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	290.98	f			M002841	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6090	0	6090	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	292.42	f			M002842	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6120	0	6120	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	291.94	f			M002843	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6110	0	6110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	291.46	f			M002844	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	291.46	f			M002845	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	292.42	f			M002846	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6120	0	6120	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	292.42	f			M002847	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6120	0	6120	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	291.46	f			M002848	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	79.79	f			M002849	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	1670	0	1670	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	24.37	f			M002853	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	510	0	510	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	88	0	8.12	f			M002854	调质-80KSI	QJ/DT01.24412-2020-B/0	22210025713	170	0	170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	17.77	f			M002866	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	450	0	450	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	243.25	f			M002868	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	14.81	f			M002869	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	375	0	375	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	18.16	f			M002871	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	460	0	460	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	218.76	f			M002876	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	5540	0	5540	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	238.9	f			M002878	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6050	0	6050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	12.44	f			M002880	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	315	0	315	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	237.32	f			M002882	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6010	0	6010	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	252.72	f			M002883	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6400	0	6400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	253.51	f			M002884	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6420	0	6420	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	252.33	f			M002885	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6390	0	6390	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	253.12	f			M002886	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6410	0	6410	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	200.6	f			M002887	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	5080	0	5080	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	253.51	f			M002888	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6420	0	6420	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	253.51	f			M002889	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6420	0	6420	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	252.72	f			M002890	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6400	0	6400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	238.11	f			M002891	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6030	0	6030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	238.9	f			M002892	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6050	0	6050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	237.72	f			M002893	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6020	0	6020	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	238.51	f			M002894	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6040	0	6040	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	16.39	f			M002895	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	415	0	415	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	144.53	f			M002896	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	3660	0	3660	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	236.93	f			M002897	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6000	0	6000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	228.24	f			M002898	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	5780	0	5780	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	239.69	f			M002899	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6070	0	6070	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	231.4	f			M002900	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	5860	0	5860	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	35.54	f			M002901	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	900	0	900	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	237.72	f			M002902	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6020	0	6020	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	238.51	f			M002903	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6040	0	6040	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	237.72	f			M002904	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6020	0	6020	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	237.72	f			M002905	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6020	0	6020	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	237.32	f			M002906	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6010	0	6010	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	238.11	f			M002907	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6030	0	6030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	238.51	f			M002909	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6040	0	6040	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	238.11	f			M002910	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6030	0	6030	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	80	0	237.72	f			M002911	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6020	0	6020	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	4.23	f			M000754	调质-80KSI	QJ/DT01.24412-2020-A/0	21209123087	140	0	140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	6.95	f			M000760	调质-80KSI	QJ/DT01.24412-2020-A/0	21209123087	230	0	230	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	51.4	f	1200+500		M000762	调质-80KSI	QJ/DT01.24412-2020-A/0	21209123087	1700	0	1700	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	30.23	f			M000763	调质-80KSI	QJ/DT01.24412-2020-A/0	21209123087	1000	0	1000	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	2.12	f			M000764	调质-80KSI	QJ/DT01.24412-2020-A/0	21209123087	70	0	70	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	75.88	f			M002661	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	2510	0	2510	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	190.47	f			M002662	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6300	0	6300	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	182.91	f			M002663	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6050	0	6050	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	189.86	f			M002664	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6280	0	6280	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	190.17	f			M002665	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6290	0	6290	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	185.03	f			M002666	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6120	0	6120	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	190.17	f			M002668	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6290	0	6290	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	201.65	f			M002669	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6670	0	6670	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	201.65	f			M002676	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6670	0	6670	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	202.86	f			M002677	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6710	0	6710	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	201.96	f			M002678	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	6680	0	6680	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	5.29	f			M002680	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	175	0	175	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	70	0	2.72	f			M002681	调质-80KSI	QJ/DT01.24412-2020-B/0	22209122737	90	0	90	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000904	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.72	f			M000905	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5750	0	5750	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.72	f			M000906	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5750	0	5750	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000907	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000908	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.27	f			M000909	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5730	0	5730	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000910	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000911	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.94	f			M000913	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5760	0	5760	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000914	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.61	f			M000915	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5745	0	5745	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.61	f			M000918	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5745	0	5745	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	4.22	f			M000922	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	190	0	190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	16.21	f			M000925	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	730	0	730	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	2.22	f			M000928	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	100	0	100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	33.98	f			M000930	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	1530	0	1530	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000931	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000933	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.27	f			M000934	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5730	0	5730	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000937	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.61	f			M000938	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5745	0	5745	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000939	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	60	0	127.5	f			M000940	调质-80KSI	QJ/DT01.24412-2020-A/0	22210021787	5740	0	5740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.73	f			M003878	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6595	0	6595	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.65	f			M003879	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6590	0	6590	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.65	f			M003880	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6590	0	6590	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	89.7	f			M003881	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	5815	0	5815	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	97.95	f			M003882	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6350	0	6350	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.42	f			M003883	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6575	0	6575	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.65	f			M003884	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6590	0	6590	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.34	f			M003885	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6570	0	6570	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.73	f			M003886	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6595	0	6595	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.81	f			M003887	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6600	0	6600	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.5	f			M003888	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6580	0	6580	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.81	f			M003889	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6600	0	6600	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	94.63	f			M003890	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6135	0	6135	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.65	f			M003891	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6590	0	6590	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.57	f			M003892	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6585	0	6585	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.81	f			M003893	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6600	0	6600	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.5	f			M003894	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6580	0	6580	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.57	f			M003895	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6585	0	6585	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.57	f			M003896	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6585	0	6585	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	79.52	f			M003897	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	5155	0	5155	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	47.89	f			M003898	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	3105	0	3105	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.57	f			M003899	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6585	0	6585	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.81	f			M003900	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6600	0	6600	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	101.65	f			M003901	调质-80KSI	QJ/DT01.24412-2020-B/0	23210021903	6590	0	6590	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	40	0	63.38	f			M002424	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6420	0	6420	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	40	0	63.18	f			M002425	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6400	0	6400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	40	0	63.18	f			M002426	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6400	0	6400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	40	0	63.18	f			M002427	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6400	0	6400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	40	0	63.28	f			M002428	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6410	0	6410	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	40	0	63.18	f			M002430	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6400	0	6400	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	40	0	63.38	f			M002431	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6420	0	6420	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	40	0	37.71	f			M002436	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	3820	0	3820	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	40	0	63.38	f			M002441	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6420	0	6420	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	40	0	47.09	f			M002451	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	4770	0	4770	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.15	f			M002452	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	33.93	f			M002453	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6110	0	6110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	28.1	f			M002454	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	5060	0	5060	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	33.76	f			M002455	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6080	0	6080	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.32	f			M002456	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6180	0	6180	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.26	f			M002457	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6170	0	6170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.1	f			M002458	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	33.87	f			M002459	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.15	f			M002460	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.37	f			M002461	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6190	0	6190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.15	f			M002462	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	33.98	f			M002463	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6120	0	6120	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.21	f			M002464	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.21	f			M002465	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.1	f			M002466	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	33.87	f			M002467	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	33.82	f			M002468	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6090	0	6090	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.37	f			M002469	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6190	0	6190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.15	f			M002470	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.21	f			M002471	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.26	f			M002472	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6170	0	6170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.04	f			M002473	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6130	0	6130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.43	f			M002474	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6200	0	6200	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	35.04	f			M002475	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6310	0	6310	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.37	f			M002476	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6190	0	6190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.21	f			M002477	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.26	f			M002478	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6170	0	6170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.15	f			M002479	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.37	f			M002480	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6190	0	6190	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.15	f			M002481	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.21	f			M002482	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.15	f			M002483	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.1	f			M002484	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	33.93	f			M002485	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6110	0	6110	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.15	f			M002486	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.54	f			M002487	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6220	0	6220	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.21	f			M002488	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6160	0	6160	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.15	f			M002489	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6150	0	6150	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	33.87	f			M002490	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6100	0	6100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.26	f			M002492	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6170	0	6170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	20.05	f			M002493	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	3610	0	3610	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.1	f			M002494	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.26	f			M002495	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6170	0	6170	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.1	f			M002496	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.1	f			M002497	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.04	f			M002498	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6130	0	6130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.04	f			M002499	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6130	0	6130	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	34.1	f			M002500	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	6140	0	6140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	30	0	5.19	f			M002501	调质-80KSI	QJ/DT01.24412-2020-B/0	22210010849	935	0	935	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	120	0	8	f			M000190	调质-80KSI	QJ/DT01.24412-2020-A/0	22209120311	90	0	90	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	90	0	72.47	f			L030	调质-80KSI	QJ/DT01.24412-2020-A/0	21209123087	1450	0	1450	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	210	0	57.14	f			Z23010314	调质-80KSI	QJ/DT01.24412-2020-A/0		210	0	210	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	185	0	156.26	f			L027	调质-80KSI	QJ/DT01.24412-2020-A/0		740	0	740	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	185	0	21.12	f			L065	调质-80KSI	QJ/DT01.24412-2020-A/0		100	0	100	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	185	0	5.28	f			Z23020323	调质-80KSI	QJ/DT01.24412-2020-A/0		25	0	25	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	185	0	80.24	f			Z23010313	调质-80KSI	QJ/DT01.24412-2020-A/0		380	0	380	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	185	0	10.14	f			Z23010315	调质-80KSI	QJ/DT01.24412-2020-A/0		48	0	48	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	185	0	36.95	f			Z23010316	调质-80KSI	QJ/DT01.24412-2020-A/0		175	0	175	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	185	0	66.52	f			Z23010318	调质-80KSI	QJ/DT01.24412-2020-A/0		315	0	315	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	67.97	f			Z23010307	调质-80KSI	QJ/DT01.24412-2020-A/0		340	0	340	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	180	0	67.97	f			Z23010317	调质-80KSI	QJ/DT01.24412-2020-A/0		340	0	340	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	165	0	23.52	f			Z23010310	调质-80KSI	QJ/DT01.24412-2020-A/0		140	0	140	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	165	0	9.24	f			Z23010311	调质-80KSI	QJ/DT01.24412-2020-A/0		55	0	55	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	165	0	31.08	f			Z23010319	调质-80KSI	QJ/DT01.24412-2020-A/0		185	0	185	0	0	0	抚顺特钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	90	0	24.99	f			Z230510-23-A	调质-80KSI			500	0	500	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	90	0	19.74	f			Z230510-36	调质-80KSI			395	0	395	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_103	50	0	10.49	f			Z230510-37	调质-80KSI			680	0	680	0	0	0		天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	110	0	17.92	f	110*32打孔 110*32		M002125	调质110KSI	XYGN5189.2-2022-01	2031049Z	240	0	240	0	0	0	大冶特殊	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	33.52	f	一端偏壁 140*50.8		M003834	调质110KSI	JX-2021-01	F22306309XA	300	0	300	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	16.76	f	一端偏壁 140*50.8		M003835	调质110KSI	JX-2021-01	F22306309XA	150	0	150	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	547.54	f	一端偏壁 140*50.8		M003836	调质110KSI	JX-2021-01	F22306309XA	4900	0	4900	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	547.54	f	一端偏壁 140*50.8		M003837	调质110KSI	JX-2021-01	F22306309XA	4900	0	4900	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	547.54	f	一端偏壁 140*50.8		M003838	调质110KSI	JX-2021-01	F22306309XA	4900	0	4900	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	546.98	f	一端偏壁 140*50.8		M003839	调质110KSI	JX-2021-01	F22306309XA	4895	0	4895	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	548.66	f	一端偏壁 140*50.8		M003840	调质110KSI	JX-2021-01	F22306309XA	4910	0	4910	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	547.54	f	一端偏壁 140*50.8		M003841	调质110KSI	JX-2021-01	F22306309XA	4900	0	4900	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	547.54	f	一端偏壁 140*50.8		M003842	调质110KSI	JX-2021-01	F22306309XA	4900	0	4900	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	545.31	f	一端偏壁 140*50.8		M003843	调质110KSI	JX-2021-01	F22306309XA	4880	0	4880	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	547.54	f	一端偏壁 140*50.8		M003844	调质110KSI	JX-2021-01	F22306309XA	4900	0	4900	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	545.87	f	一端偏壁 140*50.8		M003845	调质110KSI	JX-2021-01	F22306309XA	4885	0	4885	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	140	0	548.1	f	一端偏壁 140*50.8		M003846	调质110KSI	JX-2021-01	F22306309XA	4905	0	4905	0	0	0	兴澄特钢+浩运	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	170.41	f	一端偏壁 180*50.8		M003848	调质110KSI	XYGN1992.6-2022-01	2016234Z	1525	0	1525	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	537.49	f	一端偏壁 180*50.8		M003849	调质110KSI	XYGN1992.6-2022-01	2016234Z	4810	0	4810	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	540.84	f	一端偏壁 180*50.8		M003850	调质110KSI	XYGN1992.6-2022-01	2016234Z	4840	0	4840	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	167.62	f	一端偏壁 180*50.8		M003851	调质110KSI	XYGN1992.6-2022-01	2016234Z	1500	0	1500	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	180	0	539.72	f	一端偏壁 180*50.8		M003852	调质110KSI	XYGN1992.6-2022-01	2016234Z	4830	0	4830	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	537.49	f	一端偏壁 150*50.8		M003853	调质110KSI	XYGN5189.2-2022-01	3014166Z	4810	0	4810	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
3_105	150	0	365.4	f	一端偏壁 150*50.8		M003854	调质110KSI	XYGN5189.2-2022-01	3014166Z	3270	0	3270	0	0	0	大冶特殊钢	天津	否				0	0	0	0	0	0	f	f	f		KT202312-01
\.


--
-- Data for Name: tableset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tableset (id, table_name, field_name, data_type, show_name, show_width, ctr_type, option_value, is_show, show_order, inout_show, inout_order, default_value, all_edit, is_use, inout_width) FROM stdin;
179	库存调入	备注	文本	备注	12	普通输入		t	7	t	3		t	t	12
306	库存调出	文本字段1	文本	原因	6	下拉列表	盘亏_下错料	t	2	t	1		t	t	6
199	入库单据	日期	文本	入库日期	5	普通输入		t	2	t	2		t	t	4
209	入库单据	实数字段1	实数	来料重量	4	普通输入		t	5	t	4		t	t	2.5
218	入库单据	实数字段2	实数	实际重量	4	普通输入		t	6	t	5		t	t	2.5
301	库存调出	日期	文本	日期	4	普通输入		t	1	t	2		t	t	5
201	入库单据	经办人	文本	经办人	4	普通输入	张继成_刘树芳_李华同	t	4	f	10	李华同	t	t	4
318	库存调出	备注	文本	备注	12	普通输入		t	7	t	3		t	t	12
204	入库单据	文本字段10	文本	审核	4	普通输入		t	9	f	12		t	t	6
319	库存调出	经办人	文本	经办人	4	普通输入	张裕华_刘杰同_李正民	t	3	f	5		t	t	4
327	库存调出	文本字段7	文本	区域	6	普通输入		t	6	f	6		t	t	6
169	库存调入	日期	文本	日期	4	普通输入		t	1	t	2		t	t	5
103	商品规格	单位	文本	单位	2	普通输入		f	21	f	1		t	f	2
173	库存调入	实数字段4	实数	实数字段4	4	普通输入		f	26	f	29		t	f	4
205	入库单据	整数字段1	整数	整数字段1	4	普通输入		f	25	f	20		t	f	4
153	销售单据	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	14	f	10		t	f	4
141	销售单据	整数字段1	整数	整数字段1	4	普通输入		f	23	f	20		t	f	4
277	发货单据	布尔字段1	布尔	发货完成	3	二值选一	是_否	f	18	f	6		t	f	3
259	出库单据	文本字段1	文本	交货日期	4	普通输入		f	19	f	5		t	f	4
67	客户	联系人	文本	联系人	4	普通输入		t	2	t	2		t	t	4
68	客户	电话	文本	电话	6	普通输入		t	3	t	3		t	t	6
69	客户	地址	文本	公司地址	10	普通输入		t	4	t	4		t	t	12
77	客户	文本字段7	文本	简称	6	普通输入		t	15	t	8		t	t	6
39	供应商	停用	布尔	停用	4	二值选一	是_否	t	6	f	7		t	t	4
40	供应商	备注	文本	备注	10	普通输入		t	7	t	6		t	t	10
38	供应商	地址	文本	公司地址	10	普通输入		t	5	t	4		t	t	10
36	供应商	联系人	文本	联系人	4	普通输入		t	2	t	2		t	t	4
213	入库单据	是否含税	布尔	是否含税	4	二值选一	是_否	f	19	f	5	是	t	f	4
41	供应商	文本字段1	文本	简称	6	普通输入		t	4	t	5		t	t	6
35	供应商	名称	文本	名称	10	普通输入		t	1	t	1		t	t	10
226	入库单据	实数字段3	实数	理论重量	4	普通输入		t	7	t	6		t	t	2.5
224	入库单据	备注	文本	备注	8	普通输入		t	12	t	7		t	t	6
216	入库单据	文本字段2	文本	质检	4	普通输入		t	10	f	9		t	t	4
231	入库单据	文本字段7	文本	区域	3	普通输入		t	11	f	11		t	t	3
278	发货单据	文本字段2	文本	发货方式	4	普通输入		t	5	t	5		t	t	4
283	发货单据	备注	文本	备注	8	普通输入		t	14	t	10		t	t	8
275	发货单据	经办人	文本	经办人	4	普通输入	张继成_刘树芳_李华同	t	10	f	12	李华同	t	t	4
285	发货单据	文本字段7	文本	区域	3	普通输入		t	13	f	13		t	t	3
137	销售单据	文本字段6	文本	合同编号	5	普通输入		t	1	t	1		t	t	8
273	发货单据	日期	文本	发货日期	5	普通输入		t	4	t	4		t	t	4
134	销售单据	日期	文本	订单日期	5	普通输入		t	2	t	2		t	t	4
135	销售单据	应结金额	实数	单据金额	4	普通输入		t	3	t	3		t	t	4
159	销售单据	文本字段2	文本	交货日期	5	普通输入		t	8	t	5		t	t	4
167	销售单据	布尔字段1	布尔	发货完成	3	二值选一	是_否	t	9	t	6		t	t	3
160	销售单据	文本字段5	文本	发票金额	4	普通输入		t	10	t	7		t	t	4
163	销售单据	文本字段4	文本	发票号	10	普通输入		t	11	t	8		t	t	10
158	销售单据	备注	文本	备注	8	普通输入		t	13	t	9		t	t	6
168	销售单据	经办人	文本	经办人	4	普通输入	张继成_刘树芳_李华同	t	5	f	11	李华同	t	t	4
138	销售单据	文本字段7	文本	区域	3	普通输入		t	12	f	12		t	t	3
1	采购单据	日期	文本	日期	5	普通输入		t	2	t	2		t	t	4
2	采购单据	应结金额	实数	金额	4	普通输入		t	3	t	3		t	t	4
8	采购单据	经办人	文本	经办人	4	普通输入		t	5	f	8		t	t	4
121	商品规格	文本字段8	文本	合格	2	普通输入		f	17	f	6		t	t	3
10	采购单据	文本字段1	文本	合同编号	6	普通输入		t	1	t	1		t	t	6
105	商品规格	文本字段1	文本	物料号	5	普通输入		t	1	f	7		t	t	5
133	商品规格	库位	文本	库位	4	普通输入		t	12	f	8		t	t	4
112	商品规格	文本字段4	文本	炉号	5	普通输入		t	6	f	10		t	t	5
114	商品规格	整数字段1	整数	入库长度	4	普通输入		t	8	f	12		t	t	4
115	商品规格	整数字段2	整数	切分	3	普通输入		t	9	f	13		t	t	3
116	商品规格	整数字段3	整数	库存长度	4	普通输入		t	10	f	14		t	t	4
107	商品规格	出售价格	实数	售价	3	普通输入		t	7	f	15		t	t	3
108	商品规格	库存下限	实数	理论重量	4	普通输入		t	11	f	16		t	t	4
110	商品规格	备注	文本	备注	5	普通输入		t	15	f	17		t	t	5
124	商品规格	整数字段4	整数	顺序	2	普通输入		f	16	f	18		t	t	2
102	商品规格	规格型号	文本	规格	5	普通输入		t	2	t	1		t	t	5
104	商品规格	文本字段2	文本	状态	6	普通输入		t	3	t	2		t	t	6
257	出库单据	文本字段8	文本	文本字段8	6	普通输入		f	20	f	17		t	f	6
175	库存调入	经办人	文本	经办人	4	普通输入	张裕华_刘杰同_李正民	t	3	f	5		t	t	4
324	库存调出	文本字段10	文本	审核	4	普通输入		t	5	f	7		t	t	6
178	库存调入	文本字段10	文本	审核	4	普通输入		t	5	f	7		t	t	6
76	客户	备注	文本	备注	10	普通输入		t	17	t	9		t	t	10
75	客户	停用	布尔	停用	4	二值选一	是_否	t	16	f	10		t	t	4
37	供应商	电话	文本	手机	6	普通输入		t	3	t	3		t	t	6
227	入库单据	文本字段6	文本	采购单号	10	普通输入		t	1	t	1		t	t	8
194	库存调入	文本字段1	文本	原因	6	下拉列表	下错料_销售退货_盘盈	t	2	t	1		t	t	6
43	供应商	文本字段3	文本	文本字段3	6	普通输入		f	9	f	9		t	f	6
303	库存调出	文本字段9	文本	文本字段9	6	普通输入		f	16	f	18		t	f	6
304	库存调出	整数字段2	整数	整数字段2	4	普通输入		f	18	f	21		t	f	4
247	出库单据	是否含税	布尔	是否含税	4	二值选一	是_否	f	16	f	5	是	t	f	4
264	出库单据	其他费用	实数	其他费用	4	普通输入		f	18	f	8		t	f	4
80	客户	文本字段1	文本	税号	6	普通输入		t	11	f	11		t	t	6
81	客户	文本字段2	文本	开户行	6	普通输入		t	12	f	12		t	t	6
228	入库单据	文本字段5	文本	到货日期	5	普通输入		t	3	t	3		t	t	4
82	客户	文本字段3	文本	账号	6	普通输入		t	13	f	13		t	t	6
66	客户	名称	文本	名称	10	普通输入		t	1	t	1		t	t	10
83	客户	文本字段4	文本	行号	6	普通输入		t	14	f	14		t	t	6
329	库存调出	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	4	f	4		t	t	4
174	库存调入	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	4	f	4		t	t	4
212	入库单据	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	8	f	8		t	t	4
45	供应商	文本字段5	文本	文本字段5	6	普通输入		f	11	f	11		t	f	6
170	库存调入	文本字段7	文本	区域	6	普通输入		t	6	f	6		t	t	6
48	供应商	文本字段8	文本	文本字段8	6	普通输入		f	14	f	14		t	f	6
61	供应商	实数字段5	实数	实数字段5	4	普通输入		f	27	f	27		t	f	4
44	供应商	文本字段4	文本	文本字段4	6	普通输入		f	10	f	10		t	f	6
230	入库单据	其他费用	实数	其他费用	4	普通输入		f	21	f	8		t	f	4
207	入库单据	整数字段5	整数	整数字段5	4	普通输入		f	29	f	24		t	f	4
42	供应商	文本字段2	文本	收货地址	10	普通输入		f	8	f	8		t	f	6
59	供应商	实数字段3	实数	实数字段3	4	普通输入		f	25	f	25		t	f	4
65	供应商	布尔字段3	布尔	布尔字段3	4	二值选一	是_否	f	31	f	31		t	f	4
328	库存调出	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	30	f	33		t	f	4
152	销售单据	实数字段6	实数	实数字段6	4	普通输入		f	34	f	31		t	f	4
47	供应商	文本字段7	文本	文本字段7	6	普通输入		f	13	f	13		t	f	6
290	发货单据	实数字段4	实数	实数字段4	4	普通输入		f	31	f	29		t	f	4
258	出库单据	备注	文本	备注	8	普通输入		t	9	t	5		t	t	6
246	出库单据	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	6	f	7		t	t	4
250	出库单据	文本字段2	文本	图片	4	普通输入		f	10	f	8		t	t	4
235	出库单据	经办人	文本	经办人	4	普通输入	张继成_刘树芳_李华同	t	5	f	9	李华同	t	t	4
265	出库单据	文本字段7	文本	区域	3	普通输入		t	8	f	10		t	t	3
238	出库单据	文本字段10	文本	审核	4	普通输入		t	7	f	11		t	t	6
282	发货单据	文本字段4	文本	销售单号	6	普通输入		t	2	t	2		t	t	6
262	出库单据	文本字段5	文本	合同编号	4	普通输入		t	2	t	2		t	t	8
256	出库单据	文本字段4	文本	客户	10	普通输入		t	3	t	3		t	t	10
295	发货单据	文本字段3	文本	合同号	6	普通输入		t	3	t	3		t	t	8
281	发货单据	文本字段5	文本	客户	10	普通输入		t	6	t	6		t	t	10
296	发货单据	文本字段8	文本	收货人	4	普通输入		t	7	t	7		t	t	4
288	发货单据	文本字段9	文本	收货电话	6	普通输入		t	8	t	8		t	t	5
297	发货单据	文本字段1	文本	收货地址	10	普通输入		t	9	t	9		t	t	10
286	发货单据	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	11	f	11		t	t	4
267	发货单据	文本字段10	文本	审核	4	普通输入		t	12	f	14		t	t	6
155	销售单据	是否欠款	布尔	是否欠款	3	二值选一	是_否	t	4	t	4	是	t	t	3
233	出库单据	日期	文本	日期	4	普通输入		t	4	t	4		t	t	4
154	销售单据	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	6	f	10		t	t	4
140	销售单据	文本字段10	文本	审核	4	普通输入		t	7	f	13		t	t	6
9	采购单据	备注	文本	备注	8	普通输入		t	10	t	6		t	t	6
34	采购单据	布尔字段3	布尔	提交审核	4	二值选一	是_否	t	6	f	7		t	t	4
16	采购单据	文本字段7	文本	区域	4	普通输入		t	9	f	9		t	t	6
19	采购单据	文本字段10	文本	审核	4	普通输入		t	7	f	10		t	t	6
113	商品规格	文本字段6	文本	区域	3	普通输入		t	13	f	11		t	t	3
33	采购单据	布尔字段2	布尔	入库完成	4	二值选一	是_否	t	8	t	5		t	t	4
106	商品规格	文本字段3	文本	执行标准	7	普通输入		t	4	t	3		t	t	12
111	商品规格	文本字段5	文本	生产厂家	5	普通输入		t	5	f	9		t	t	5
18	采购单据	文本字段9	文本	文本字段9	6	普通输入		f	22	f	18		t	f	6
260	出库单据	实数字段3	实数	实数字段3	4	普通输入		f	30	f	28		t	f	4
245	出库单据	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	34	f	33		t	f	4
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
252	出库单据	实数字段2	实数	实数字段2	4	普通输入		f	29	f	27		t	f	4
311	库存调出	整数字段1	整数	整数字段1	4	普通输入		f	17	f	20		t	f	4
64	供应商	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	30	f	30		t	f	4
28	采购单据	实数字段3	实数	实数字段3	4	普通输入		f	31	f	28		t	f	4
11	采购单据	文本字段2	文本	文本字段2	4	普通输入		f	17	f	7		t	f	4
151	销售单据	实数字段5	实数	实数字段5	4	普通输入		f	33	f	30		t	f	4
21	采购单据	整数字段2	整数	整数字段2	4	普通输入		f	24	f	21		t	f	4
208	入库单据	整数字段6	整数	整数字段6	4	普通输入		f	30	f	25		t	f	4
176	库存调入	文本字段2	文本	文本字段2	6	普通输入		f	9	f	6		t	f	6
72	客户	优惠折扣	实数	优惠折扣	4	普通输入		f	20	f	7		t	f	4
181	库存调入	整数字段3	整数	整数字段3	4	普通输入		f	19	f	22		t	f	4
73	客户	信用评价	文本	收货人	4	普通输入	极好_优秀_良好_中等_较差	t	5	t	5		t	t	4
305	库存调出	实数字段1	实数	实数字段1	4	普通输入		f	23	f	26		t	f	4
315	库存调出	布尔字段1	布尔	布尔字段1	4	二值选一	是_否	f	29	f	32		t	f	4
96	客户	实数字段1	实数	实数字段1	4	普通输入		f	31	f	31		t	f	4
191	库存调入	整数字段2	整数	整数字段2	4	普通输入		f	18	f	21		t	f	4
234	出库单据	应结金额	实数	单据金额	4	普通输入		f	13	f	3		t	f	4
129	商品规格	实数字段6	实数	实数字段6	4	普通输入		f	30	f	28		t	f	4
70	客户	税率	实数	税率	3	普通输入		f	18	f	9		t	f	3
131	商品规格	布尔字段2	布尔	布尔字段2	3	二值选一	是_否	f	31	f	30		t	f	3
197	库存调入	文本字段8	文本	文本字段8	6	普通输入		f	15	f	17		t	f	6
268	发货单据	整数字段1	整数	整数字段1	4	普通输入		f	22	f	20		t	f	4
87	客户	整数字段1	整数	整数字段1	4	普通输入		f	22	f	22		t	f	4
214	入库单据	实数字段4	实数	实数字段4	4	普通输入		f	31	f	29		t	f	4
229	入库单据	已记账	布尔	已审核	4	二值选一	是_否	f	15	f	9		t	f	4
220	入库单据	文本字段3	文本	文本字段3	4	普通输入		f	17	f	10		t	f	4
202	入库单据	已结金额	实数	已结金额	4	普通输入		f	20	f	4		t	f	4
298	发货单据	实数字段3	实数	实数字段3	4	普通输入		f	30	f	28		t	f	4
3	采购单据	已结金额	实数	已结金额	4	普通输入		f	15	f	3		t	f	4
171	库存调入	文本字段9	文本	文本字段9	6	普通输入		f	16	f	18		t	f	6
242	出库单据	整数字段6	整数	整数字段6	4	普通输入		f	27	f	25		t	f	4
249	出库单据	实数字段5	实数	实数字段5	4	普通输入		f	32	f	30		t	f	4
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
320	库存调出	其他费用	实数	相关费用	4	普通输入		f	9	f	2		t	f	4
330	库存调出	实数字段3	实数	实数字段3	4	普通输入		f	25	f	28		t	f	4
326	库存调出	文本字段4	文本	文本字段4	6	普通输入		f	12	f	13		t	f	6
210	入库单据	布尔字段1	布尔	已质检	3	二值选一	是_否	f	16	f	7		t	f	3
144	销售单据	整数字段3	整数	整数字段3	4	普通输入		f	25	f	22		t	f	4
276	发货单据	布尔字段2	布尔	布尔字段2	4	二值选一	是_否	f	34	f	33		t	f	4
236	出库单据	已结金额	实数	已结金额	4	普通输入		f	17	f	4		t	f	4
317	库存调出	实数字段4	实数	实数字段4	4	普通输入		f	26	f	29		t	f	4
54	供应商	整数字段4	整数	整数字段4	4	普通输入		f	20	f	20		t	f	4
56	供应商	整数字段6	整数	整数字段6	4	普通输入		f	22	f	22		t	f	4
248	出库单据	实数字段4	实数	实数字段4	4	普通输入		f	31	f	29		t	f	4
118	商品规格	实数字段2	实数	进货价格	4	普通输入		f	23	f	17		t	f	4
119	商品规格	实数字段3	实数	实数字段3	4	普通输入		f	24	f	18		t	f	4
78	客户	文本字段9	文本	收货地址	10	普通输入		t	7	t	7		t	t	6
53	供应商	整数字段3	整数	整数字段3	4	普通输入		f	19	f	19		t	f	4
161	销售单据	已记账	布尔	已记账	4	二值选一	是_否	f	15	f	11		t	f	4
89	客户	整数字段3	整数	整数字段3	4	普通输入		f	24	f	24		t	f	4
91	客户	整数字段5	整数	整数字段5	4	普通输入		f	26	f	26		t	f	4
272	发货单据	实数字段1	实数	实数字段1	4	普通输入		f	28	f	26		t	f	4
180	库存调入	已记账	布尔	已记账	4	二值选一	是_否	f	11	f	9		t	f	4
185	库存调入	整数字段5	整数	整数字段5	4	普通输入		f	21	f	24		t	f	4
253	出库单据	整数字段4	整数	整数字段4	4	普通输入		f	25	f	23		t	f	4
49	供应商	文本字段9	文本	文本字段9	6	普通输入		f	15	f	15		t	f	6
162	销售单据	文本字段1	文本	交货日期	4	普通输入		f	20	f	5		t	f	4
149	销售单据	实数字段3	实数	实数字段3	4	普通输入		f	31	f	28		t	f	4
52	供应商	整数字段2	整数	整数字段2	4	普通输入		f	18	f	18		t	f	4
55	供应商	整数字段5	整数	整数字段5	4	普通输入		f	21	f	21		t	f	4
58	供应商	实数字段2	实数	实数字段2	4	普通输入		f	24	f	24		t	f	4
92	客户	整数字段6	整数	整数字段6	4	普通输入		f	27	f	27		t	f	4
254	出库单据	文本字段3	文本	文本字段3	4	普通输入		f	14	f	9		t	f	4
74	客户	地区	文本	收货电话	6	普通输入		t	6	t	6		t	t	6
30	采购单据	实数字段5	实数	实数字段5	4	普通输入		f	33	f	30		t	f	4
314	库存调出	实数字段5	实数	实数字段5	4	普通输入		f	27	f	30		t	f	4
57	供应商	实数字段1	实数	实数字段1	4	普通输入		f	23	f	23		t	f	4
63	供应商	布尔字段1	布尔	布尔字段1	4	二值选一	是_否	f	29	f	29		t	f	4
46	供应商	文本字段6	文本	文本字段6	6	普通输入		f	12	f	12		t	f	6
14	采购单据	文本字段5	文本	文本字段5	6	普通输入		f	19	f	14		t	f	6
183	库存调入	文本字段6	文本	文本字段6	6	普通输入		f	14	f	15		t	f	6
86	客户	文本字段8	文本	收票地址	6	普通输入		t	10	f	17		t	t	6
266	出库单据	实数字段6	实数	实数字段6	4	普通输入		f	33	f	31		t	f	4
313	库存调出	整数字段5	整数	整数字段5	4	普通输入		f	21	f	24		t	f	4
88	客户	整数字段2	整数	整数字段2	4	普通输入		f	23	f	23		t	f	4
17	采购单据	文本字段8	文本	文本字段8	6	普通输入		f	21	f	17		t	f	6
24	采购单据	整数字段5	整数	整数字段5	4	普通输入		f	27	f	24		t	f	4
239	出库单据	整数字段1	整数	整数字段1	4	普通输入		f	22	f	20		t	f	4
251	出库单据	整数字段3	整数	整数字段3	4	普通输入		f	24	f	22		t	f	4
60	供应商	实数字段4	实数	实数字段4	4	普通输入		f	26	f	26		t	f	4
62	供应商	实数字段6	实数	实数字段6	4	普通输入		f	28	f	28		t	f	4
51	供应商	整数字段1	整数	整数字段1	4	普通输入		f	17	f	17		t	f	4
5	采购单据	是否欠款	布尔	是否欠款	4	二值选一	是_否	f	12	f	5	是	t	f	4
255	出库单据	是否欠款	布尔	是否欠款	3	二值选一	是_否	f	15	f	4	是	t	f	3
237	出库单据	文本字段9	文本	文本字段9	6	普通输入		f	21	f	18		t	f	6
200	入库单据	应结金额	实数	单据金额	4	普通输入		f	13	f	6		t	f	4
156	销售单据	其他费用	实数	其他费用	4	普通输入		f	19	f	8		t	f	4
165	销售单据	是否含税	布尔	是否含税	4	二值选一	是_否	f	17	f	5	是	t	f	4
219	入库单据	整数字段4	整数	整数字段4	4	普通输入		f	28	f	23		t	f	4
32	采购单据	布尔字段1	布尔	已到货	4	二值选一	是_否	f	11	f	4		t	f	4
184	库存调入	整数字段1	整数	整数字段1	4	普通输入		f	17	f	20		t	f	4
263	出库单据	已记账	布尔	已审核	4	二值选一	是_否	f	11	f	8		t	f	4
240	出库单据	整数字段2	整数	整数字段2	4	普通输入		f	23	f	21		t	f	4
241	出库单据	整数字段5	整数	整数字段5	4	普通输入		f	26	f	24		t	f	4
243	出库单据	实数字段1	实数	实数字段1	4	普通输入		f	28	f	26		t	f	4
71	客户	含税	布尔	含税	4	二值选一	是_否	f	19	f	10	是	t	f	4
98	客户	实数字段3	实数	实数字段3	4	普通输入		f	33	f	33		t	f	4
109	商品规格	停用	布尔	停用	3	二值选一	是_否	f	20	f	9		t	f	3
323	库存调出	文本字段3	文本	文本字段3	6	普通输入		f	8	f	12		t	f	6
29	采购单据	实数字段4	实数	实数字段4	4	普通输入		f	32	f	29		t	f	4
182	库存调入	整数字段4	整数	整数字段4	4	普通输入		f	20	f	23		t	f	4
130	商品规格	布尔字段1	布尔	布尔字段1	3	二值选一	是_否	f	19	f	29	是	t	f	3
136	销售单据	已结金额	实数	已结金额	4	普通输入		f	18	f	4		t	f	4
150	销售单据	实数字段4	实数	实数字段4	4	普通输入		f	32	f	29		t	f	4
280	发货单据	是否欠款	布尔	是否欠款	3	二值选一	是_否	f	16	f	4	是	t	f	3
189	库存调入	实数字段6	实数	实数字段6	4	普通输入		f	28	f	31		t	f	4
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
244	出库单据	布尔字段1	布尔	发货完成	3	二值选一	是_否	f	12	f	6		t	t	3
261	出库单据	文本字段6	文本	销售单号	10	普通输入		t	1	t	1		t	t	9
279	发货单据	文本字段6	文本	出库单号	6	普通输入		t	1	t	1		t	t	8
12	采购单据	文本字段3	文本	到货日期	5	普通输入		t	4	t	4		t	t	4
122	商品规格	文本字段9	文本	原物料号	4	普通输入		f	18	f	4		t	t	4
120	商品规格	文本字段7	文本	切完	3	下拉列表	否_是	t	14	f	5		t	t	3
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
4_101	4	17-4 无缝钢管	174wfgg	f
4_107	4	3Cr-L80 无缝钢管	3crl80wfgg	f
4_104	4	4140 无缝钢管	4140wfgg	f
4_102	4	42CrMo 无缝钢管	42crmowfgg	f
4_108	4	C110 无缝钢管	c110wfgg	f
4_103	4	L80-13Cr 无缝钢管	l8013crwfgg	f
4_106	4	L80-9Cr 无缝钢管	l809crwfgg	f
3_101	3	17-4 圆钢	174yg	f
3_111	3	20Cr13 圆钢	20cr13yg	f
3_113	3	4130M7 圆钢	4130m7yg	f
4_109	4	P110套管接箍料	p110tgjgl	f
4_110	4	Supper13Cr 无缝钢管	supper13crwfgg	f
3_107	3	20CrMnTi 圆钢	20crmntiyg	f
4_105	4	20CrMnTi 无缝钢管	20crmntiwfgg	f
3_114	3	625 圆钢	625yg	f
4_111	4	-- 锯口费	jkf	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (name, password, phone, failed, get_pass, rights, confirm, theme, area, duty) FROM stdin;
朱玉树	522c17b35905d7f09edc671b6db0c44b	18522561838	0	0	材料采购，商品销售，库存状态，客户管理，入库明细，用户设置，采购查询，销售查询，采购入库，供应商管理，出库明细，库存设置，跨区查库存，销售出库，业务往来，单据审核，调整库存，反审单据，入库查询，批量导入，出库查询，导出数据，调库查询，	t		天津	总经理
唐文静	f87374f9b1c985c17f454025fb11283e		0	0	材料采购，商品销售，库存状态，客户管理，入库明细，采购查询，销售查询，采购入库，供应商管理，出库明细，跨区查库存，销售出库，业务往来，调整库存，入库查询，出库查询，调库查询，	t		天津	库管
张金宝	1080dcf0f283701d426fefa224667a8a	13102101346	0	0	材料采购，商品销售，库存状态，客户管理，入库明细，采购查询，销售查询，采购入库，供应商管理，出库明细，跨区查库存，销售出库，业务往来，调整库存，入库查询，出库查询，导出数据，调库查询，	t		天津	销售
admin	f44f1d43c7e4b8eeaabb5526198dfd8c	13920953285	0	5	材料采购，商品销售，库存状态，客户管理，入库明细，用户设置，采购查询，销售查询，采购入库，供应商管理，出库明细，库存设置，跨区查库存，销售出库，业务往来，单据审核，调整库存，反审单据，入库查询，出库查询, 批量导入，调库查询，导出数据	t	blue	天津	总经理
\.


--
-- Name: customers_ID_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."customers_ID_seq"', 46, true);


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

