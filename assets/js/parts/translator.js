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

    // 产品名称映射表
    const product_name_map = new Map([
        ["圆钢", "Bar"],
        ["无缝钢管", "Pipe"],
        ["套管接箍料", "Casing Coupling Material"],
        ["调质", "Quenched and Tempered"],
        ["固溶", "Solution Treated"],
        ["时效", "Aged"],
        ["热轧", "Hot Rolled"],
        ["锻造态", "As Forged"],
        ["锻造", "Forged"],
        ["未正火", "Untreated"],
        ["正回火", "Double Tempered"],
        ["未调", "Non-Quenched and Tempered"],
        ["挤压", "Extruded"],
        ["退火", "Annealed"],
        ["态", "State"],
        ["固熔酸洗", "Solution Treated and Pickled"],
        ["号钢", "Steel Grade"],
        ["双", "Double"],
        ["非标", "Non-Standard"],
        ["其他", "Others"],
        ["钢管", "Steel Pipe"],
        ["无缝管", "Seamless Tube"],
        ["焊接管", "Welded Pipe"],
        ["合金钢", "Alloy Steel"],
        ["碳素钢", "Carbon Steel"],
        ["不锈钢", "Stainless Steel"],
        ["特种钢", "Special Steel"],
        ["轴承钢", "Bearing Steel"],
        ["工具钢", "Tool Steel"],
        ["弹簧钢", "Spring Steel"],
        ["齿轮钢", "Gear Steel"],
        ["模具钢", "Die Steel"],
        ["高速钢", "High Speed Steel"],
        ["耐热钢", "Heat Resistant Steel"],
        ["耐蚀钢", "Corrosion Resistant Steel"],
        ["低合金钢", "Low Alloy Steel"],
        ["高合金钢", "High Alloy Steel"],
        ["铸钢", "Cast Steel"],
        ["锻钢", "Forged Steel"],
        ["冷拔钢", "Cold Drawn Steel"],
        ["热处理钢", "Heat Treated Steel"],
        ["表面处理钢", "Surface Treated Steel"],
        ["镀锌钢", "Galvanized Steel"],
        ["涂层钢", "Coated Steel"],
        ["异型钢", "Special Shaped Steel"],
        ["方钢", "Square Bar"],
        ["扁钢", "Flat Bar"],
        ["六角钢", "Hexagonal Bar"],
        ["角钢", "Angle Steel"],
        ["槽钢", "Channel Steel"],
        ["工字钢", "I-Beam Steel"],
        ["H型钢", "H-Beam Steel"],
        ["钢板", "Steel Plate"],
        ["钢带", "Steel Strip"],
        ["钢丝", "Steel Wire"],
        ["钢缆", "Steel Cable"],
        ["无缝钢", "Seamless Steel"],
        ["焊接钢", "Welded Steel"],
        ["螺旋焊管", "Spiral Welded Pipe"],
        ["直缝焊管", "Straight Seam Welded Pipe"],
        ["石油套管", "Oil Casing"],
        ["钻杆", "Drill Pipe"],
        ["油管", "Oil Pipe"],
        ["套管", "Casing"],
        ["接箍", "Coupling"],
        ["法兰", "Flange"],
        ["弯头", "Elbow"],
        ["三通", "Tee"],
        ["四通", "Cross"],
        ["阀门", "Valve"],
        ["管件", "Pipe Fitting"],
        ["铸件", "Casting"],
        ["锻件", "Forging"],
        ["冲压件", "Stamping"],
        ["焊接件", "Welding"],
        ["机械零件", "Mechanical Parts"],
        ["结构件", "Structural Parts"],
        ["紧固件", "Fastener"],
        ["螺栓", "Bolt"],
        ["螺母", "Nut"],
        ["垫圈", "Washer"],
        ["铆钉", "Rivet"],
        ["销钉", "Pin"],
        ["轴承", "Bearing"],
        ["齿轮", "Gear"],
        ["链条", "Chain"],
        ["皮带", "Belt"],
        ["传动件", "Transmission Parts"],
        ["泵", "Pump"],
        ["风机", "Fan"],
        ["电机", "Motor"],
        ["减速机", "Reducer"],
        ["机床", "Machine Tool"],
        ["模具", "Mold"],
        ["夹具", "Fixture"],
        ["量具", "Measuring Tool"],
        ["刃具", "Cutting Tool"],
        ["磨具", "Grinding Tool"],
        ["工量具", "Tool and Measuring Instrument"],
        ["标准件", "Standard Parts"],
        ["非标准件", "Non-Standard Parts"],
        ["定制件", "Custom Parts"],
        ["备件", "Spare Parts"],
        ["消耗品", "Consumables"],
        ["原料", "Raw Material"],
        ["半成品", "Semi-Finished Product"],
        ["成品", "Finished Product"],
        ["废料", "Scrap"],
        ["边角料", "Offcut"],
        ["下脚料", "Waste Material"],
        ["回收料", "Recycled Material"],
        ["进口料", "Imported Material"],
        ["国产料", "Domestic Material"],
        ["库存料", "Stock Material"],
        ["现货", "Spot Goods"],
        ["期货", "Future Goods"],
        ["订货", "Order Goods"],
        ["定制", "Custom"],
        ["加工", "Processing"],
        ["切割", "Cutting"],
        ["打孔", "Punching"],
        ["弯曲", "Bending"],
        ["焊接", "Welding"],
        ["表面处理", "Surface Treatment"],
        ["热处理", "Heat Treatment"],
        ["涂装", "Painting"],
        ["镀层", "Plating"],
        ["抛光", "Polishing"],
        ["研磨", "Grinding"],
        ["清洗", "Cleaning"],
        ["包装", "Packaging"],
        ["运输", "Transportation"],
        ["仓储", "Storage"],
        ["物流", "Logistics"],
        ["服务", "Service"],
        ["咨询", "Consultation"],
        ["技术支持", "Technical Support"],
        ["培训", "Training"],
        ["维护", "Maintenance"],
        ["维修", "Repair"],
        ["更换", "Replacement"],
        ["升级", "Upgrade"],
        ["改造", "Renovation"],
        ["安装", "Installation"],
        ["调试", "Debugging"],
        ["验收", "Acceptance"],
        ["质检", "Quality Inspection"],
        ["测试", "Testing"],
        ["检验", "Inspection"],
        ["认证", "Certification"],
        ["标准", "Standard"],
        ["规范", "Specification"],
        ["要求", "Requirement"],
        ["参数", "Parameter"],
        ["性能", "Performance"],
        ["特性", "Characteristic"],
        ["优势", "Advantage"],
        ["劣势", "Disadvantage"],
        ["适用范围", "Application Range"],
        ["使用条件", "Usage Condition"],
        ["存储条件", "Storage Condition"],
        ["运输条件", "Transportation Condition"],
        ["安全要求", "Safety Requirement"],
        ["环保要求", "Environmental Requirement"],
        ["质量保证", "Quality Assurance"],
        ["售后服务", "After-Sales Service"],
        ["保修", "Warranty"],
        ["保质期", "Shelf Life"],
        ["有效期", "Validity Period"],
        ["生产日期", "Production Date"],
        ["出厂日期", "Factory Date"],
        ["检验日期", "Inspection Date"],
        ["发货日期", "Shipping Date"],
        ["到货日期", "Arrival Date"],
        ["使用日期", "Usage Date"],
        ["报废日期", "Scrap Date"],
        ["追溯", "Traceability"],
        ["批次", "Batch"],
        ["炉号", "Heat Number"],
        ["牌号", "Grade"],
        ["规格", "Specification"],
        ["尺寸", "Dimension"],
        ["重量", "Weight"],
        ["长度", "Length"],
        ["宽度", "Width"],
        ["高度", "Height"],
        ["直径", "Diameter"],
        ["壁厚", "Wall Thickness"],
        ["厚度", "Thickness"],
        ["公差", "Tolerance"],
        ["精度", "Precision"],
        ["表面质量", "Surface Quality"],
        ["内部质量", "Internal Quality"],
        ["化学成分", "Chemical Composition"],
        ["机械性能", "Mechanical Properties"],
        ["物理性能", "Physical Properties"],
        ["工艺性能", "Process Performance"],
        ["焊接性能", "Welding Performance"],
        ["切削性能", "Cutting Performance"],
        ["成型性能", "Forming Performance"],
        ["热处理性能", "Heat Treatment Performance"],
        ["耐腐蚀性能", "Corrosion Resistance"],
        ["耐磨性能", "Wear Resistance"],
        ["强度", "Strength"],
        ["硬度", "Hardness"],
        ["塑性", "Plasticity"],
        ["韧性", "Toughness"],
        ["疲劳性能", "Fatigue Performance"],
        ["冲击性能", "Impact Performance"],
        ["拉伸性能", "Tensile Performance"],
        ["压缩性能", "Compressive Performance"],
        ["弯曲性能", "Bending Performance"],
        ["扭转性能", "Torsion Performance"],
        ["剪切性能", "Shear Performance"],
        ["断裂性能", "Fracture Performance"],
        ["蠕变性能", "Creep Performance"],
        ["高温性能", "High Temperature Performance"],
        ["低温性能", "Low Temperature Performance"],
        ["磁性", "Magnetic Property"],
        ["导电性", "Conductivity"],
        ["导热性", "Thermal Conductivity"],
        ["膨胀系数", "Expansion Coefficient"],
        ["密度", "Density"],
        ["比重", "Specific Gravity"],
        ["熔点", "Melting Point"],
        ["沸点", "Boiling Point"],
        ["临界点", "Critical Point"],
        ["相变温度", "Phase Transition Temperature"],
        ["晶体结构", "Crystal Structure"],
        ["微观结构", "Microstructure"],
        ["宏观结构", "Macrostructure"],
        ["缺陷", "Defect"],
        ["夹杂", "Inclusion"],
        ["气孔", "Porosity"],
        ["裂纹", "Crack"],
        ["变形", "Deformation"],
        ["残余应力", "Residual Stress"],
        ["表面应力", "Surface Stress"],
        ["内部应力", "Internal Stress"],
        ["应力集中", "Stress Concentration"],
        ["疲劳裂纹", "Fatigue Crack"],
        ["腐蚀坑", "Corrosion Pit"],
        ["磨损痕迹", "Wear Mark"],
        ["氧化层", "Oxide Layer"],
        ["涂层厚度", "Coating Thickness"],
        ["附着力", "Adhesion"],
        ["光泽度", "Glossiness"],
        ["粗糙度", "Roughness"],
        ["平整度", "Flatness"],
        ["垂直度", "Perpendicularity"],
        ["平行度", "Parallelism"],
        ["同轴度", "Coaxiality"],
        ["圆度", "Roundness"],
        ["圆柱度", "Cylindricity"],
        ["直线度", "Straightness"],
        ["平面度", "Planarity"],
        ["位置度", "Position Tolerance"],
        ["形位公差", "Geometric Tolerance"],
        ["尺寸公差", "Dimensional Tolerance"],
        ["角度公差", "Angular Tolerance"],
        ["长度公差", "Length Tolerance"],
        ["质量公差", "Mass Tolerance"],
        ["重量公差", "Weight Tolerance"],
        ["密度公差", "Density Tolerance"],
        ["成分公差", "Composition Tolerance"],
        ["性能公差", "Property Tolerance"],
        ["检测方法", "Detection Method"],
        ["检验标准", "Inspection Standard"],
        ["测试标准", "Test Standard"],
        ["验收标准", "Acceptance Standard"],
        ["质量标准", "Quality Standard"],
        ["安全标准", "Safety Standard"],
        ["环保标准", "Environmental Standard"],
        ["国际标准", "International Standard"],
        ["国家标准", "National Standard"],
        ["行业标准", "Industry Standard"],
        ["企业标准", "Enterprise Standard"],
        ["内部标准", "Internal Standard"],
        ["客户标准", "Customer Standard"],
        ["供应商标准", "Supplier Standard"],
        ["合同标准", "Contract Standard"],
        ["设计标准", "Design Standard"],
        ["制造标准", "Manufacturing Standard"],
        ["装配标准", "Assembly Standard"],
        ["调试标准", "Commissioning Standard"],
        ["运行标准", "Operation Standard"],
        ["维护标准", "Maintenance Standard"],
        ["报废标准", "Scrap Standard"],
        ["回收标准", "Recycling Standard"],
        ["再利用标准", "Reuse Standard"],
        ["再制造标准", "Remanufacturing Standard"],
        ["生命周期", "Life Cycle"],
        ["使用寿命", "Service Life"],
        ["设计寿命", "Design Life"],
        ["经济寿命", "Economic Life"],
        ["技术寿命", "Technical Life"],
        ["物理寿命", "Physical Life"],
        ["化学寿命", "Chemical Life"],
        ["机械寿命", "Mechanical Life"],
        ["环境寿命", "Environmental Life"],
        ["可靠性", "Reliability"],
        ["可用性", "Availability"],
        ["可维护性", "Maintainability"],
        ["安全性", "Safety"],
        ["经济性", "Economy"],
        ["环保性", "Environmental Friendliness"],
        ["能源效率", "Energy Efficiency"],
        ["资源利用率", "Resource Utilization"],
        ["废物产生率", "Waste Generation Rate"],
        ["回收率", "Recycling Rate"],
        ["再利用率", "Reuse Rate"],
        ["循环利用", "Circular Utilization"],
        ["可持续性", "Sustainability"],
        ["绿色制造", "Green Manufacturing"],
        ["清洁生产", "Clean Production"],
        ["低碳经济", "Low Carbon Economy"],
        ["循环经济", "Circular Economy"],
        ["生态设计", "Ecological Design"],
        ["环境影响", "Environmental Impact"],
        ["碳足迹", "Carbon Footprint"],
        ["水足迹", "Water Footprint"],
        ["生态足迹", "Ecological Footprint"],
        ["生命周期评估", "Life Cycle Assessment"],
        ["环境标志", "Environmental Label"],
        ["绿色标志", "Green Label"],
        ["节能标志", "Energy Saving Label"],
        ["环保标志", "Environmental Protection Label"],
        ["认证标志", "Certification Label"],
        ["质量标志", "Quality Label"],
        ["安全标志", "Safety Label"],
        ["CE标志", "CE Mark"],
        ["UL标志", "UL Mark"],
        ["ISO标志", "ISO Mark"],
        ["GB标志", "GB Mark"],
        ["API标志", "API Mark"],
        ["ASTM标志", "ASTM Mark"],
        ["JIS标志", "JIS Mark"],
        ["DIN标志", "DIN Mark"],
        ["BS标志", "BS Mark"],
        ["EN标志", "EN Mark"],
        ["ASME标志", "ASME Mark"],
        ["AWS标志", "AWS Mark"],
        ["SAE标志", "SAE Mark"],
        ["ANSI标志", "ANSI Mark"],
        ["IEC标志", "IEC Mark"],
        ["IEEE标志", "IEEE Mark"],
        ["NEMA标志", "NEMA Mark"],
        ["NFPA标志", "NFPA Mark"],
        ["OSHA标志", "OSHA Mark"],
        ["EPA标志", "EPA Mark"],
        ["FDA标志", "FDA Mark"],
        ["DOT标志", "DOT Mark"],
        ["FAA标志", "FAA Mark"],
        ["FCC标志", "FCC Mark"],
        ["TUV标志", "TUV Mark"],
        ["CSA标志", "CSA Mark"],
        ["VDE标志", "VDE Mark"],
        ["SEV标志", "SEV Mark"],
        ["SEMKO标志", "SEMKO Mark"],
        ["NEMKO标志", "NEMKO Mark"],
        ["FIMKO标志", "FIMKO Mark"],
        ["DEMKO标志", "DEMKO Mark"],
        ["KEUR标志", "KEUR Mark"],
        ["OVE标志", "OVE Mark"],
        ["EI标志", "EI Mark"],
        ["BEAB标志", "BEAB Mark"],
        ["ITS标志", "ITS Mark"],
        ["SAA标志", "SAA Mark"],
        ["PSE标志", "PSE Mark"],
        ["CCC标志", "CCC Mark"],
        ["CQC标志", "CQC Mark"],
        ["CMA标志", "CMA Mark"],
        ["CNAS标志", "CNAS Mark"],
        ["CAL标志", "CAL Mark"],
        ["NQI标志", "NQI Mark"],
        ["CTC标志", "CTC Mark"],
        ["ITC标志", "ITC Mark"]
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
     * 将产品名称翻译为英文
     * @param {string} text - 中文文本
     * @returns {string} 翻译后的文本
     */
    function translateProductNameToEn(text) {
        if (!text) return text;

        let result = text;
        product_name_map.forEach((en, zh) => {
            result = result.replace(new RegExp(zh, 'g'), en);
        });
        return result;
    }

    /**
     * 将产品名称翻译为中文
     * @param {string} text - 英文文本
     * @returns {string} 翻译后的文本
     */
    function translateProductNameToZh(text) {
        if (!text) return text;

        let result = text;
        product_name_map.forEach((en, zh) => {
            result = result.replace(new RegExp(en, 'g'), zh);
        });
        return result;
    }

    /**
     * 根据当前语言翻译产品名称字段
     * @param {string} text - 原始文本
     * @param {string} lang - 目标语言 ('en' 或 'zh')
     * @returns {string} 翻译后的文本
     */
    function translateProductName(text, lang) {
        if (lang === 'en') {
            return translateProductNameToEn(text);
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
        translateProductName,
        translateFields,
        translateStatusToEn,
        translateStatusToZh,
        translateManufacturerToEn,
        translateManufacturerToZh,
        translateProductNameToEn,
        translateProductNameToZh
    };
})();

// 支持CommonJS和全局变量
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Translator;
}