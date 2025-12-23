const TRANSLATIONS = {
    "TW": {
        "products": ["鞋", "運動鞋", "靴", "涼鞋", "拖鞋", "裙", "襯衫", "T恤", "褲", "牛仔褲", "夾克", "大衣", "泳衣", "內衣", "襪", "衛衣", "毛衣", "手錶", "眼鏡", "包", "背包", "錢包", "皮帶", "項鍊", "戒指", "手鏈", "耳環", "香水", "面霜", "乳液", "洗髮水", "肥皂", "牙刷", "吹風機", "手機", "平板", "耳機", "音箱", "筆電", "滑鼠"],
        "modifiers": ["便宜", "特價", "新款", "品牌", "二手", "正品", "輕便", "防水", "S號", "M號", "男款", "女款", "兒童", "奢華", "環保", "手工", "限量", "免運", "促銷", "熱賣"],
        "intents": ["買", "價格", "比價", "推薦", "評論", "哪買", "網購", "快送", "優惠", "折扣"],
        "suffixes": ["", " 台灣", " 2025"]
    },
    "MX": {
        "products": ["zapatos", "tenis", "botas", "sandalias", "vestido", "camisa", "playera", "pantalón", "jeans", "chaqueta", "abrigo", "falda", "reloj", "lentes", "bolsa", "mochila", "cartera", "cinturón", "collar", "anillo", "perfume", "crema", "champú", "celular", "tablet", "audífonos", "laptop"],
        "modifiers": ["barato", "oferta", "nuevo", "marca", "usado", "original", "ligero", "resistente", "talla S", "talla M", "hombre", "mujer", "niños", "lujo", "eco", "limitado", "envío gratis", "promo"],
        "intents": ["comprar", "precio", "comparar", "mejor", "reseñas", "dónde", "online", "rápido", "descuento"],
        "suffixes": ["", " méxico", " 2025"]
    },
    "DE": {
        "products": ["schuhe", "sneaker", "stiefel", "sandalen", "kleid", "hemd", "t-shirt", "hose", "jeans", "jacke", "mantel", "uhr", "brille", "tasche", "rucksack", "geldbörse", "gürtel", "kette", "ring", "parfüm", "creme", "shampoo", "handy", "tablet", "kopfhörer", "laptop", "maus"],
        "modifiers": ["günstig", "angebot", "neu", "marke", "gebraucht", "original", "leicht", "robust", "größe S", "größe M", "herren", "damen", "kinder", "luxus", "bio", "limitiert", "versandfrei", "aktion"],
        "intents": ["kaufen", "preis", "vergleich", "beste", "bewertung", "wo", "online", "schnell", "rabatt"],
        "suffixes": ["", " deutschland", " 2025"]
    },
    "IT": {
        "products": ["scarpe", "sneakers", "stivali", "sandali", "vestito", "camicia", "maglietta", "pantaloni", "jeans", "giacca", "cappotto", "orologio", "occhiali", "borsa", "zaino", "portafoglio", "cintura", "collana", "anello", "profumo", "crema", "shampoo", "cellulare", "tablet", "cuffie", "laptop", "mouse"],
        "modifiers": ["economico", "offerta", "nuovo", "marca", "usato", "originale", "leggero", "resistente", "taglia S", "taglia M", "uomo", "donna", "bambini", "lusso", "bio", "limitato", "spedizione gratis", "promo"],
        "intents": ["comprare", "prezzo", "confronto", "migliore", "recensioni", "dove", "online", "veloce", "sconto"],
        "suffixes": ["", " italia", " 2025"]
    },
    "AT": {
        "products": ["schuhe", "sneaker", "stiefel", "sandalen", "kleid", "hemd", "t-shirt", "hose", "jeans", "jacke", "mantel", "uhr", "brille", "tasche", "rucksack", "geldbörse", "gürtel", "kette", "ring", "parfüm", "creme", "shampoo", "handy", "tablet", "kopfhörer", "laptop", "maus"],
        "modifiers": ["günstig", "angebot", "neu", "marke", "gebraucht", "original", "leicht", "robust", "größe S", "größe M", "herren", "damen", "kinder", "luxus", "bio", "limitiert", "versandfrei", "aktion"],
        "intents": ["kaufen", "preis", "vergleich", "beste", "bewertung", "wo", "online", "schnell", "rabatt"],
        "suffixes": ["", " österreich", " 2025"]
    }
};

const PATTERNS = [
    {pattern: "{product} {modifier}", weight: 0.30},
    {pattern: "{modifier} {product}", weight: 0.30},
    {pattern: "{product} {intent}", weight: 0.20},
    {pattern: "{intent} {product}", weight: 0.15},
    {pattern: "{modifier} {product}{suffix}", weight: 0.05}
];

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function selectPatternByWeight() {
    const random = Math.random();
    let cumulative = 0;
    
    for (const item of PATTERNS) {
        cumulative += item.weight;
        if (random <= cumulative) {
            return item.pattern;
        }
    }
    
    return PATTERNS[0].pattern;
}

function generateKeyword(language) {
    const translation = TRANSLATIONS[language];
    if (!translation) {
        throw new Error(`Language ${language} not supported`);
    }
    
    const pattern = selectPatternByWeight();
    let keyword = pattern;
    
    // Replace placeholders
    if (keyword.includes('{product}')) {
        keyword = keyword.replace('{product}', getRandomElement(translation.products));
    }
    if (keyword.includes('{modifier}')) {
        keyword = keyword.replace('{modifier}', getRandomElement(translation.modifiers));
    }
    if (keyword.includes('{intent}')) {
        keyword = keyword.replace('{intent}', getRandomElement(translation.intents));
    }
    if (keyword.includes('{suffix}')) {
        keyword = keyword.replace('{suffix}', getRandomElement(translation.suffixes));
    }
    
    return keyword.trim();
}

function generateKeywords(language, count, removeDuplicates = false) {
    if (removeDuplicates) {
        // When removing duplicates, generate more than needed and then dedupe
        const uniqueKeywords = new Set();
        let attempts = 0;
        const maxAttempts = count * 3; // Generate up to 3x to get unique keywords
        
        while (uniqueKeywords.size < count && attempts < maxAttempts) {
            uniqueKeywords.add(generateKeyword(language));
            attempts++;
        }
        
        return Array.from(uniqueKeywords);
    } else {
        // Fast generation without deduplication
        const keywords = [];
        for (let i = 0; i < count; i++) {
            keywords.push(generateKeyword(language));
        }
        return keywords;
    }
}

function formatAsCSV(keywords) {
    return 'keyword\n' + keywords.join('\n');
}

function formatAsTXT(keywords) {
    return keywords.join('\n');
}

module.exports = {
    generateKeyword,
    generateKeywords,
    formatAsCSV,
    formatAsTXT
};
