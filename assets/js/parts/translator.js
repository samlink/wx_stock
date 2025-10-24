/**
 * 翻译工具模块 - 用于翻译产品状态和厂家名称
 * Translator Module - For translating product status and manufacturer names
 */
var Translator = (function () {
    // 状态映射表
    const status_map = new Map([
        ["圆钢", "Bar"],
        ["无缝钢管", "Pipe"],
        ["套管接箍料", "Casing Coupling"],
        ["调质", "Q&T"],
        ["固溶", "Solution"],
        ["时效", "Aging"],
        ["热轧", "Hot Rolled"],
        ["锻造态", "As-Forged"],
        ["锻造", "Forged"],
        ["未正火", "Untreated"],
        ["正回火", "Double Tempering"],
        ["未调", "Non-Q&T"],
        ["挤压", "Extruded"],
        ["退火", "Annealed"],
        ["态", "State"],
        ["固熔酸洗", "Solution Treatment and Pickling"],
        ["号钢", "Steel"],
        ["双", 'Double'],
        ["非标", "Non-standard"],
        ["其他", "Others"]
    ]);

    // 厂家映射表
    const manufacturer_map = new Map([
        ["中航上大", "AVIC Shangda"],
        ["上大", "Shangda"],
        ["靖江特殊钢", "Jingjiang Special Steel"],
        ["烟台华新", "Yantai Huaxin"],
        ["江阴兴澄特种钢", "Jiangyin Xingcheng"],
        ["抚顺特钢", "Fushun Special Steel"],
        ["抚钢", "Fugang"],
        ["达利普", "Dalipu"],
        ["本钢钢铁", "Benxi Steel"],
        ["本钢", "Bengang"],
        ["中兴热处理", "Zhongxing Heat Treatment"],
        ["天津钢管制造", "Tianjin Pipe Manufacturing"],
        ["衡钢", "Hengyang Steel"],
        ["新兴铸管", "Xinxing Ductile Iron Pipes"],
        ["劝诚特钢", "Quancheng Special Steel"],
        ["劝诚", "Quancheng"],
        ["重庆重材", "Chongqing Heavy Materials"],
        ["取芯材", "Coring Material"],
        ["上海沪崎金属", "Shanghai Huzaki Metal"],
        ["湖北新冶钢", "Hubei Xinye"],
        ["冶钢", "Yegang"],
        ["浙江华东", "Zhejiang Huadong"],
        ["威亚塑料", "Weiya Plastics"],
        ["重庆钢铁", "Chongqing Steel"],
        ["宝山钢铁", "Baosteel"],
        ["宝钢特种", "Baosteel Special"],
        ["山东海鑫达", "Haixinda"],
        ["海鑫达", "Haixinda"],
        ["石钢", "Shigang"],
        ["东北轻合金", "Northeast Light Alloy"],
        ["大冶特殊钢", "Daye Special Steel"],
        ["大冶特殊", "Daye Special"],
        ["大冶特钢", "Daye Spec Steel"],
        ["青海国鑫铝业", "Qinghai Guoxin Aluminum"],
        ["山东中正钢管", "Shandong Zhongzheng Steel Pipe"],
        ["大无缝", "Da Wufeng"],
        ["莱钢", "Laiwu Steel"],
        ["上海朝展金属", "Shanghai Chaozhan Metal"],
        ["江苏常宝", "Jiangsu Changbao"],
        ["常宝", "Changbao"],
        ["衡阳华菱", "Hengyang Hualing"],
        ["威晟", "Weisheng"],
        ["鑫禹泽", "Xinyuze"],
        ["西宁特钢", "Xining Special Steel"],
        ["大钢", "Dagang"],
        ["上海祥巨金属", "Shanghai Xiangju Metal"],
        ["北满", "Beiman"],
        ["兴澄特钢+浩运", "Xingcheng Special Steel"],
        ["博威合金材料", "Baowei Alloy"],
        ["山东汇通", "Shandong Huitong"],
        ["湖南华菱钢铁", "Hunan Hualing Steel"],
        ["贝来钢管", "Beilai Tube"],
        ["钢管", "Pipe"],
        ["圆钢", "Bar"]
    ]);

    /**
     * 将状态翻译为英文
     * @param {string} text - 中文文本
     * @returns {string} 翻译后的文本
     */
    function translateStatusToEn(text) {
        if (!text) return text;
        
        let result = text;
        status_map.forEach((en, zh) => {
            result = result.replace(new RegExp(zh, 'g'), en);
        });
        return result;
    }

    /**
     * 将状态翻译为中文
     * @param {string} text - 英文文本
     * @returns {string} 翻译后的文本
     */
    function translateStatusToZh(text) {
        if (!text) return text;
        
        let result = text;
        status_map.forEach((en, zh) => {
            result = result.replace(new RegExp(en, 'g'), zh);
        });
        return result;
    }

    /**
     * 将厂家名称翻译为英文
     * @param {string} text - 中文文本
     * @returns {string} 翻译后的文本
     */
    function translateManufacturerToEn(text) {
        if (!text) return text;
        
        let result = text;
        manufacturer_map.forEach((en, zh) => {
            result = result.replace(new RegExp(zh, 'g'), en);
        });
        return result;
    }

    /**
     * 将厂家名称翻译为中文
     * @param {string} text - 英文文本
     * @returns {string} 翻译后的文本
     */
    function translateManufacturerToZh(text) {
        if (!text) return text;
        
        let result = text;
        manufacturer_map.forEach((en, zh) => {
            result = result.replace(new RegExp(en, 'g'), zh);
        });
        return result;
    }

    /**
     * 根据当前语言翻译状态字段
     * @param {string} text - 原始文本
     * @param {string} lang - 目标语言 ('en' 或 'zh')
     * @returns {string} 翻译后的文本
     */
    function translateStatus(text, lang) {
        if (lang === 'en') {
            return translateStatusToEn(text);
        }
        return text;
    }

    /**
     * 根据当前语言翻译厂家字段
     * @param {string} text - 原始文本
     * @param {string} lang - 目标语言 ('en' 或 'zh')
     * @returns {string} 翻译后的文本
     */
    function translateManufacturer(text, lang) {
        if (lang === 'en') {
            return translateManufacturerToEn(text);
        }
        return text;
    }

    /**
     * 批量翻译对象中的字段
     * @param {Object} obj - 包含需要翻译字段的对象
     * @param {string} lang - 目标语言 ('en' 或 'zh')
     * @returns {Object} 翻译后的对象
     */
    function translateFields(obj, lang) {
        if (!obj || lang !== 'en') return obj;

        const translated = { ...obj };
        
        // 翻译状态字段
        if (translated.status) {
            translated.status = translateStatusToEn(translated.status);
        }
        
        // 翻译厂家字段
        if (translated.manufacturer) {
            translated.manufacturer = translateManufacturerToEn(translated.manufacturer);
        }
        
        return translated;
    }

    // 公开的API
    return {
        translateStatus,
        translateManufacturer,
        translateFields,
        translateStatusToEn,
        translateStatusToZh,
        translateManufacturerToEn,
        translateManufacturerToZh
    };
})();

// 支持CommonJS和全局变量
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Translator;
}