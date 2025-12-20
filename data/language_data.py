"""
Language Data Module.

This module contains comprehensive language-specific datasets for keyword generation
across 5 languages: Italian (IT), Mexican Spanish (MX), German (DE), 
Taiwanese Mandarin (TW), and Austrian German (AT).

Classes:
    LanguageData: Central repository for all language-specific data.

Example:
    >>> from data.language_data import LanguageData
    >>> data = LanguageData()
    >>> brands = data.get_brands("IT")
    >>> products = data.get_products("MX")
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class LanguageDataset:
    """
    Container for language-specific dataset.
    
    Attributes:
        brands: List of brand names.
        products: List of product names.
        intents: List of search intents.
        modifiers: List of keyword modifiers.
        questions: List of question words/phrases.
        suffixes: List of keyword suffixes.
        templates: List of template strings for keyword generation.
    """
    
    brands: List[str]
    products: List[str]
    intents: List[str]
    modifiers: List[str]
    questions: List[str]
    suffixes: List[str]
    templates: List[str]


class LanguageData:
    """
    Central repository for language-specific keyword generation data.
    
    This class provides access to comprehensive datasets for multiple languages,
    including brands, products, intents, modifiers, questions, suffixes, and templates.
    
    Supported Languages:
        - IT: Italian
        - MX: Mexican Spanish
        - DE: German
        - TW: Taiwanese Mandarin
        - AT: Austrian German
    
    Example:
        >>> data = LanguageData()
        >>> brands = data.get_brands("IT")
        >>> templates = data.get_templates("MX")
        >>> languages = data.get_supported_languages()
    """
    
    def __init__(self):
        """Initialize language data repository."""
        self._data = self._load_all_data()
    
    def _load_all_data(self) -> Dict[str, LanguageDataset]:
        """
        Load all language datasets.
        
        Returns:
            Dictionary mapping language codes to datasets.
        """
        return {
            'IT': self._load_italian_data(),
            'MX': self._load_mexican_data(),
            'DE': self._load_german_data(),
            'TW': self._load_taiwanese_data(),
            'AT': self._load_austrian_data(),
        }
    
    def _load_italian_data(self) -> LanguageDataset:
        """Load Italian language dataset."""
        brands = [
            "Gucci", "Prada", "Versace", "Armani", "Dolce&Gabbana",
            "Ferrari", "Lamborghini", "Fiat", "Alfa Romeo", "Maserati",
            "Lavazza", "Barilla", "Ferrero", "Nutella", "Buitoni",
            "Campari", "Martini", "Aperol", "Cinzano", "Ramazzotti",
            "Luxottica", "Ray-Ban", "Oakley", "Persol", "Oliver Peoples",
            "Benetton", "Diesel", "Replay", "Stone Island", "Moncler",
            "Acqua di Parma", "Bulgari", "Salvatore Ferragamo", "Tod's", "Valentino",
            "Bottega Veneta", "Zegna", "Brioni", "Canali", "Etro",
            "Alessi", "Bialetti", "De'Longhi", "Smeg", "Technogym",
            "Pirelli", "Brembo", "Magneti Marelli", "Pininfarina", "Italdesign",
        ]
        
        products = [
            "scarpe", "borse", "vestiti", "giacche", "pantaloni",
            "magliette", "camicie", "gonne", "abiti", "cappotti",
            "occhiali", "orologi", "gioielli", "profumi", "cosmetici",
            "cinture", "portafogli", "zaini", "valigie", "ombrelli",
            "caffè", "pasta", "pizza", "gelato", "tiramisù",
            "vino", "olio", "formaggio", "prosciutto", "parmigiano",
            "automobili", "moto", "scooter", "biciclette", "monopattini",
            "smartphone", "tablet", "laptop", "cuffie", "smartwatch",
            "divani", "tavoli", "sedie", "letti", "armadi",
            "lampadari", "tappeti", "quadri", "specchi", "vasi",
            "libri", "riviste", "giornali", "fumetti", "poster",
            "televisori", "radio", "altoparlanti", "amplificatori", "giradischi",
            "frigoriferi", "lavatrici", "lavastoviglie", "forni", "microonde",
            "aspirapolvere", "ferri da stiro", "asciugacapelli", "rasoi", "spazzolini",
            "pentole", "padelle", "posate", "piatti", "bicchieri",
            "decorazioni", "candele", "cuscini", "coperte", "lenzuola",
            "scarpe da ginnastica", "stivali", "sandali", "ciabatte", "mocassini",
            "anelli", "collane", "bracciali", "orecchini", "spille",
            "trucco", "fondotinta", "rossetto", "mascara", "ombretto",
            "shampoo", "balsamo", "gel", "lacca", "tinture",
            "giocattoli", "peluche", "puzzle", "bambole", "macchinine",
            "videogames", "console", "controller", "giochi da tavolo", "carte",
        ]
        
        intents = [
            "comprare", "acquistare", "ordinare", "prenotare", "vendere",
            "cercare", "trovare", "scoprire", "esplorare", "vedere",
            "migliori", "economici", "offerte", "sconti", "promozioni",
            "nuovi", "usati", "vintage", "moderni", "classici",
            "online", "negozio", "shop", "store", "outlet",
            "consegna", "spedizione", "ritiro", "domicilio", "gratis",
        ]
        
        modifiers = [
            "lusso", "elegante", "raffinato", "esclusivo", "premium",
            "economico", "conveniente", "economici", "low cost", "risparmio",
            "italiano", "originale", "autentico", "made in Italy", "artigianale",
            "moderno", "contemporaneo", "design", "trendy", "fashion",
            "classico", "vintage", "retro", "tradizionale", "storico",
            "grande", "piccolo", "medio", "XL", "XXL",
            "rosso", "blu", "nero", "bianco", "verde",
            "uomo", "donna", "bambino", "ragazzo", "unisex",
        ]
        
        questions = [
            "dove", "come", "quanto costa", "quanto", "quale",
            "perché", "chi", "cosa", "quando", "come mai",
            "dove comprare", "come acquistare", "quanto spendere", "quale scegliere",
            "dove trovare", "come ordinare", "quanto costa", "quale è meglio",
        ]
        
        suffixes = [
            "online", "Italia", "Milano", "Roma", "2024",
            "prezzo", "costo", "offerta", "sconto", "promozione",
            "recensioni", "opinioni", "forum", "guida", "tutorial",
        ]
        
        templates = [
            "{brand} {product}",
            "{product} {brand}",
            "{intent} {product} {brand}",
            "{brand} {product} {modifier}",
            "{product} {modifier} {brand}",
            "{question} {product} {brand}",
            "{intent} {product} {modifier}",
            "{brand} {product} {intent}",
            "{product} {brand} {suffix}",
            "{brand} {product} {modifier} {suffix}",
            "{intent} {product} {brand} {modifier}",
            "{question} {brand} {product}",
            "{product} {modifier} {suffix}",
            "{brand} {product} {intent} {suffix}",
            "{modifier} {product} {brand}",
            "{intent} {modifier} {product}",
            "{question} {product} {modifier}",
            "{brand} {intent} {product}",
            "{product} {brand} {modifier} {intent}",
            "{modifier} {brand} {product} {suffix}",
            "{question} {intent} {product}",
            "{product} {suffix} {brand}",
            "{brand} {modifier} {product}",
            "{intent} {product} {suffix}",
            "{question} {product} {brand} {suffix}",
            "{modifier} {product} {intent}",
            "{brand} {product} {question}",
            "{product} {intent} {modifier}",
            "{intent} {brand} {product} {suffix}",
            "{question} {modifier} {product} {brand}",
        ]
        
        return LanguageDataset(
            brands=brands,
            products=products,
            intents=intents,
            modifiers=modifiers,
            questions=questions,
            suffixes=suffixes,
            templates=templates
        )
    
    def _load_mexican_data(self) -> LanguageDataset:
        """Load Mexican Spanish dataset."""
        brands = [
            "Corona", "Tecate", "Modelo", "Pacifico", "Indio",
            "Bimbo", "Marinela", "Gamesa", "Sabritas", "Barcel",
            "Cemex", "Femsa", "Telmex", "América Móvil", "Televisa",
            "Aeroméxico", "Volaris", "Interjet", "VivaAerobus", "Magnicharters",
            "Liverpool", "Palacio de Hierro", "Sanborns", "Sears", "Coppel",
            "Soriana", "Chedraui", "Walmart México", "Bodega Aurrera", "Sam's Club",
            "Grupo Lala", "Alpura", "Santa Clara", "Yakult", "Danone",
            "José Cuervo", "Sauza", "Don Julio", "Herradura", "Patrón",
            "Herdez", "Clemente Jacques", "La Costeña", "Del Monte", "McCormick",
            "Mexicana", "Jumex", "Del Valle", "Bonafont", "Ciel",
        ]
        
        products = [
            "zapatos", "bolsas", "ropa", "chamarras", "pantalones",
            "playeras", "camisas", "faldas", "vestidos", "abrigos",
            "lentes", "relojes", "joyería", "perfumes", "cosméticos",
            "cinturones", "carteras", "mochilas", "maletas", "paraguas",
            "cerveza", "tequila", "mezcal", "tacos", "tortas",
            "tamales", "pozole", "mole", "enchiladas", "quesadillas",
            "autos", "motos", "bicicletas", "camionetas", "coches",
            "celulares", "tablets", "computadoras", "audífonos", "smartwatches",
            "muebles", "sillones", "mesas", "sillas", "camas",
            "libreros", "closets", "burós", "escritorios", "estantes",
            "televisiones", "pantallas", "bocinas", "amplificadores", "reproductores",
            "refrigeradores", "lavadoras", "secadoras", "estufas", "microondas",
            "licuadoras", "batidoras", "tostadores", "cafeteras", "hornos",
            "ventiladores", "aires acondicionados", "calentadores", "purificadores", "humidificadores",
            "colchones", "almohadas", "sábanas", "cobijas", "edredones",
            "tenis", "botas", "sandalias", "huaraches", "chanclas",
            "anillos", "collares", "pulseras", "aretes", "broches",
            "maquillaje", "labiales", "máscaras", "sombras", "rubores",
            "champú", "acondicionador", "gel", "spray", "tintes",
            "juguetes", "peluches", "rompecabezas", "muñecas", "carritos",
        ]
        
        intents = [
            "comprar", "adquirir", "ordenar", "reservar", "vender",
            "buscar", "encontrar", "descubrir", "explorar", "ver",
            "mejores", "baratos", "ofertas", "descuentos", "promociones",
            "nuevos", "usados", "seminuevos", "modernos", "clásicos",
            "en línea", "tienda", "shop", "mercado", "plaza",
            "entrega", "envío", "recoger", "domicilio", "gratis",
        ]
        
        modifiers = [
            "lujo", "elegante", "fino", "exclusivo", "premium",
            "económico", "barato", "accesible", "low cost", "ahorro",
            "mexicano", "original", "auténtico", "hecho en México", "artesanal",
            "moderno", "contemporáneo", "diseño", "trendy", "fashion",
            "clásico", "vintage", "retro", "tradicional", "antiguo",
            "grande", "chico", "mediano", "XL", "XXL",
            "rojo", "azul", "negro", "blanco", "verde",
            "hombre", "mujer", "niño", "joven", "unisex",
        ]
        
        questions = [
            "dónde", "cómo", "cuánto cuesta", "cuánto", "cuál",
            "por qué", "quién", "qué", "cuándo", "para qué",
            "dónde comprar", "cómo comprar", "cuánto pagar", "cuál elegir",
            "dónde encontrar", "cómo ordenar", "cuánto vale", "cuál es mejor",
        ]
        
        suffixes = [
            "en línea", "México", "CDMX", "Guadalajara", "2024",
            "precio", "costo", "oferta", "descuento", "promoción",
            "reseñas", "opiniones", "foro", "guía", "tutorial",
        ]
        
        templates = [
            "{brand} {product}",
            "{product} {brand}",
            "{intent} {product} {brand}",
            "{brand} {product} {modifier}",
            "{product} {modifier} {brand}",
            "{question} {product} {brand}",
            "{intent} {product} {modifier}",
            "{brand} {product} {intent}",
            "{product} {brand} {suffix}",
            "{brand} {product} {modifier} {suffix}",
            "{intent} {product} {brand} {modifier}",
            "{question} {brand} {product}",
            "{product} {modifier} {suffix}",
            "{brand} {product} {intent} {suffix}",
            "{modifier} {product} {brand}",
            "{intent} {modifier} {product}",
            "{question} {product} {modifier}",
            "{brand} {intent} {product}",
            "{product} {brand} {modifier} {intent}",
            "{modifier} {brand} {product} {suffix}",
            "{question} {intent} {product}",
            "{product} {suffix} {brand}",
            "{brand} {modifier} {product}",
            "{intent} {product} {suffix}",
            "{question} {product} {brand} {suffix}",
            "{modifier} {product} {intent}",
            "{brand} {product} {question}",
            "{product} {intent} {modifier}",
            "{intent} {brand} {product} {suffix}",
            "{question} {modifier} {product} {brand}",
        ]
        
        return LanguageDataset(
            brands=brands,
            products=products,
            intents=intents,
            modifiers=modifiers,
            questions=questions,
            suffixes=suffixes,
            templates=templates
        )
    
    def _load_german_data(self) -> LanguageDataset:
        """Load German language dataset."""
        brands = [
            "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Porsche",
            "Adidas", "Puma", "Hugo Boss", "Escada", "Jil Sander",
            "Siemens", "Bosch", "Miele", "Braun", "Vorwerk",
            "Lufthansa", "Condor", "Eurowings", "TUIfly", "Ryanair",
            "Aldi", "Lidl", "Rewe", "Edeka", "Kaufland",
            "Deutsche Bank", "Commerzbank", "Allianz", "Munich Re", "DZ Bank",
            "SAP", "Infineon", "Continental", "BASF", "Bayer",
            "Nivea", "Schwarzkopf", "Wella", "Henkel", "Beiersdorf",
            "Ritter Sport", "Haribo", "Milka", "Lindt", "Ferrero",
            "Birkenstock", "Adilette", "Falke", "Schiesser", "Marc O'Polo",
        ]
        
        products = [
            "Schuhe", "Taschen", "Kleidung", "Jacken", "Hosen",
            "T-Shirts", "Hemden", "Röcke", "Kleider", "Mäntel",
            "Brillen", "Uhren", "Schmuck", "Parfüm", "Kosmetik",
            "Gürtel", "Geldbörsen", "Rucksäcke", "Koffer", "Regenschirme",
            "Bier", "Wein", "Wurst", "Käse", "Brot",
            "Schokolade", "Bonbons", "Kekse", "Kuchen", "Torten",
            "Autos", "Motorräder", "Fahrräder", "E-Bikes", "Roller",
            "Smartphones", "Tablets", "Laptops", "Kopfhörer", "Smartwatches",
            "Möbel", "Sofas", "Tische", "Stühle", "Betten",
            "Schränke", "Regale", "Kommoden", "Schreibtische", "Lampen",
            "Fernseher", "Radios", "Lautsprecher", "Verstärker", "Plattenspieler",
            "Kühlschränke", "Waschmaschinen", "Geschirrspüler", "Öfen", "Mikrowellen",
            "Staubsauger", "Bügeleisen", "Föhne", "Rasierer", "Zahnbürsten",
            "Töpfe", "Pfannen", "Besteck", "Teller", "Gläser",
            "Dekoration", "Kerzen", "Kissen", "Decken", "Bettwäsche",
            "Turnschuhe", "Stiefel", "Sandalen", "Hausschuhe", "Mokassins",
            "Ringe", "Halsketten", "Armbänder", "Ohrringe", "Broschen",
            "Make-up", "Foundation", "Lippenstift", "Mascara", "Lidschatten",
            "Shampoo", "Conditioner", "Gel", "Haarspray", "Haarfarbe",
            "Spielzeug", "Plüschtiere", "Puzzle", "Puppen", "Autos",
        ]
        
        intents = [
            "kaufen", "erwerben", "bestellen", "reservieren", "verkaufen",
            "suchen", "finden", "entdecken", "erkunden", "sehen",
            "beste", "günstige", "Angebote", "Rabatte", "Aktionen",
            "neue", "gebrauchte", "vintage", "moderne", "klassische",
            "online", "Geschäft", "Shop", "Store", "Outlet",
            "Lieferung", "Versand", "Abholung", "nach Hause", "gratis",
        ]
        
        modifiers = [
            "Luxus", "elegant", "edel", "exklusiv", "premium",
            "günstig", "preiswert", "billig", "low cost", "Schnäppchen",
            "deutsch", "original", "authentisch", "Made in Germany", "handgemacht",
            "modern", "zeitgenössisch", "Design", "trendy", "modisch",
            "klassisch", "vintage", "retro", "traditionell", "historisch",
            "groß", "klein", "mittel", "XL", "XXL",
            "rot", "blau", "schwarz", "weiß", "grün",
            "Herren", "Damen", "Kinder", "Jugend", "Unisex",
        ]
        
        questions = [
            "wo", "wie", "wie viel kostet", "wie viel", "welche",
            "warum", "wer", "was", "wann", "wieso",
            "wo kaufen", "wie kaufen", "wie viel zahlen", "welche wählen",
            "wo finden", "wie bestellen", "wie viel", "welche ist besser",
        ]
        
        suffixes = [
            "online", "Deutschland", "Berlin", "München", "2024",
            "Preis", "Kosten", "Angebot", "Rabatt", "Aktion",
            "Bewertungen", "Meinungen", "Forum", "Anleitung", "Tutorial",
        ]
        
        templates = [
            "{brand} {product}",
            "{product} {brand}",
            "{intent} {product} {brand}",
            "{brand} {product} {modifier}",
            "{product} {modifier} {brand}",
            "{question} {product} {brand}",
            "{intent} {product} {modifier}",
            "{brand} {product} {intent}",
            "{product} {brand} {suffix}",
            "{brand} {product} {modifier} {suffix}",
            "{intent} {product} {brand} {modifier}",
            "{question} {brand} {product}",
            "{product} {modifier} {suffix}",
            "{brand} {product} {intent} {suffix}",
            "{modifier} {product} {brand}",
            "{intent} {modifier} {product}",
            "{question} {product} {modifier}",
            "{brand} {intent} {product}",
            "{product} {brand} {modifier} {intent}",
            "{modifier} {brand} {product} {suffix}",
            "{question} {intent} {product}",
            "{product} {suffix} {brand}",
            "{brand} {modifier} {product}",
            "{intent} {product} {suffix}",
            "{question} {product} {brand} {suffix}",
            "{modifier} {product} {intent}",
            "{brand} {product} {question}",
            "{product} {intent} {modifier}",
            "{intent} {brand} {product} {suffix}",
            "{question} {modifier} {product} {brand}",
        ]
        
        return LanguageDataset(
            brands=brands,
            products=products,
            intents=intents,
            modifiers=modifiers,
            questions=questions,
            suffixes=suffixes,
            templates=templates
        )
    
    def _load_taiwanese_data(self) -> LanguageDataset:
        """Load Taiwanese Mandarin dataset."""
        brands = [
            "華碩", "宏碁", "技嘉", "微星", "聯發科",
            "台積電", "鴻海", "聯電", "日月光", "廣達",
            "統一", "康師傅", "義美", "金車", "黑松",
            "全家", "7-11", "萊爾富", "OK超商", "美廉社",
            "誠品", "金石堂", "博客來", "三民書局", "敦煌書局",
            "新光三越", "遠東百貨", "SOGO", "微風廣場", "101",
            "中華電信", "遠傳", "台灣大哥大", "亞太電信", "台灣之星",
            "長榮航空", "華航", "星宇航空", "虎航", "立榮航空",
            "捷安特", "美利達", "功學社", "光陽", "三陽",
            "台塑", "台化", "南亞", "台達電", "研華",
        ]
        
        products = [
            "鞋子", "包包", "衣服", "外套", "褲子",
            "T恤", "襯衫", "裙子", "洋裝", "大衣",
            "眼鏡", "手錶", "珠寶", "香水", "化妝品",
            "皮帶", "錢包", "背包", "行李箱", "雨傘",
            "茶", "咖啡", "珍珠奶茶", "鳳梨酥", "太陽餅",
            "牛肉麵", "滷肉飯", "小籠包", "蚵仔煎", "臭豆腐",
            "汽車", "機車", "腳踏車", "電動車", "滑板車",
            "手機", "平板", "筆電", "耳機", "智慧手錶",
            "家具", "沙發", "桌子", "椅子", "床",
            "書櫃", "衣櫃", "床頭櫃", "書桌", "燈具",
            "電視", "音響", "喇叭", "擴大機", "唱片機",
            "冰箱", "洗衣機", "洗碗機", "烤箱", "微波爐",
            "吸塵器", "電熨斗", "吹風機", "刮鬍刀", "電動牙刷",
            "鍋子", "平底鍋", "餐具", "盤子", "杯子",
            "裝飾", "蠟燭", "抱枕", "毯子", "床單",
            "運動鞋", "靴子", "涼鞋", "拖鞋", "休閒鞋",
            "戒指", "項鍊", "手鍊", "耳環", "胸針",
            "彩妝", "粉底", "口紅", "睫毛膏", "眼影",
            "洗髮精", "潤髮乳", "髮膠", "定型噴霧", "染髮劑",
            "玩具", "絨毛玩具", "拼圖", "娃娃", "玩具車",
        ]
        
        intents = [
            "購買", "買", "訂購", "預訂", "賣",
            "尋找", "找", "發現", "探索", "看",
            "最好", "便宜", "優惠", "折扣", "促銷",
            "新", "二手", "復古", "現代", "經典",
            "線上", "商店", "網購", "實體店", "特賣",
            "配送", "運送", "取貨", "宅配", "免費",
        ]
        
        modifiers = [
            "奢華", "優雅", "精緻", "獨家", "高級",
            "經濟", "便宜", "實惠", "平價", "省錢",
            "台灣", "原裝", "正品", "台灣製造", "手工",
            "現代", "當代", "設計", "流行", "時尚",
            "經典", "復古", "懷舊", "傳統", "古典",
            "大", "小", "中", "XL", "XXL",
            "紅", "藍", "黑", "白", "綠",
            "男", "女", "兒童", "青少年", "中性",
        ]
        
        questions = [
            "哪裡", "如何", "多少錢", "多少", "哪個",
            "為什麼", "誰", "什麼", "什麼時候", "怎麼",
            "哪裡買", "如何買", "多少錢", "哪個好",
            "哪裡找", "如何訂", "價格", "哪個最好",
        ]
        
        suffixes = [
            "線上", "台灣", "台北", "高雄", "2024",
            "價格", "價錢", "優惠", "折扣", "促銷",
            "評價", "心得", "論壇", "指南", "教學",
        ]
        
        templates = [
            "{brand} {product}",
            "{product} {brand}",
            "{intent} {product} {brand}",
            "{brand} {product} {modifier}",
            "{product} {modifier} {brand}",
            "{question} {product} {brand}",
            "{intent} {product} {modifier}",
            "{brand} {product} {intent}",
            "{product} {brand} {suffix}",
            "{brand} {product} {modifier} {suffix}",
            "{intent} {product} {brand} {modifier}",
            "{question} {brand} {product}",
            "{product} {modifier} {suffix}",
            "{brand} {product} {intent} {suffix}",
            "{modifier} {product} {brand}",
            "{intent} {modifier} {product}",
            "{question} {product} {modifier}",
            "{brand} {intent} {product}",
            "{product} {brand} {modifier} {intent}",
            "{modifier} {brand} {product} {suffix}",
            "{question} {intent} {product}",
            "{product} {suffix} {brand}",
            "{brand} {modifier} {product}",
            "{intent} {product} {suffix}",
            "{question} {product} {brand} {suffix}",
            "{modifier} {product} {intent}",
            "{brand} {product} {question}",
            "{product} {intent} {modifier}",
            "{intent} {brand} {product} {suffix}",
            "{question} {modifier} {product} {brand}",
        ]
        
        return LanguageDataset(
            brands=brands,
            products=products,
            intents=intents,
            modifiers=modifiers,
            questions=questions,
            suffixes=suffixes,
            templates=templates
        )
    
    def _load_austrian_data(self) -> LanguageDataset:
        """Load Austrian German dataset."""
        brands = [
            "Red Bull", "KTM", "Swarovski", "Riedel", "Gmundner Keramik",
            "Manner", "Mozartkugel", "Almdudler", "Stiegl", "Gösser",
            "OMV", "Voestalpine", "Raiffeisen", "Erste Bank", "Bank Austria",
            "Austrian Airlines", "Lauda Air", "People's", "Easyjet Austria", "Wizz Air",
            "Spar", "Billa", "Hofer", "Lidl", "Penny",
            "Wolford", "Loden Plankl", "Sportalm", "Hammerschmid", "Gössl",
            "Atomic", "Fischer", "Head", "Tyrolia", "Blizzard",
            "Julius Meinl", "Hornig", "Helmut Sachers", "Heindl", "Zotter",
            "Wiener Werkstätte", "Augarten", "J. & L. Lobmeyr", "Backhausen", "Wittmann",
            "Kärnten Milch", "Berglandmilch", "NÖM", "Schärdinger", "Tirol Milch",
        ]
        
        products = [
            "Schuhe", "Taschen", "Kleidung", "Jacken", "Hosen",
            "T-Shirts", "Hemden", "Röcke", "Dirndl", "Lederhosen",
            "Brillen", "Uhren", "Schmuck", "Parfüm", "Kosmetik",
            "Gürtel", "Geldbörsen", "Rucksäcke", "Koffer", "Schirme",
            "Bier", "Wein", "Most", "Schnaps", "Sturm",
            "Sachertorte", "Apfelstrudel", "Kaiserschmarrn", "Knödel", "Schnitzel",
            "Autos", "Motorräder", "Fahrräder", "E-Bikes", "Roller",
            "Handys", "Tablets", "Laptops", "Kopfhörer", "Smartwatches",
            "Möbel", "Sofas", "Tische", "Sessel", "Betten",
            "Kästen", "Regale", "Kommoden", "Schreibtische", "Lampen",
            "Fernseher", "Radios", "Lautsprecher", "Verstärker", "Plattenspieler",
            "Kühlschränke", "Waschmaschinen", "Geschirrspüler", "Backöfen", "Mikrowellen",
            "Staubsauger", "Bügeleisen", "Föhne", "Rasierapparate", "Zahnbürsten",
            "Töpfe", "Pfannen", "Besteck", "Teller", "Gläser",
            "Dekoration", "Kerzen", "Polster", "Decken", "Bettwäsche",
            "Turnschuhe", "Stiefel", "Sandalen", "Hausschuhe", "Slipper",
            "Ringe", "Ketten", "Armbänder", "Ohrringe", "Broschen",
            "Make-up", "Foundation", "Lippenstift", "Wimperntusche", "Lidschatten",
            "Shampoo", "Spülung", "Gel", "Haarspray", "Haarfarbe",
            "Spielzeug", "Plüschtiere", "Puzzle", "Puppen", "Spielzeugautos",
        ]
        
        intents = [
            "kaufen", "erwerben", "bestellen", "reservieren", "verkaufen",
            "suchen", "finden", "entdecken", "erkunden", "schauen",
            "beste", "günstige", "Angebote", "Rabatte", "Aktionen",
            "neue", "gebrauchte", "vintage", "moderne", "klassische",
            "online", "Geschäft", "Shop", "Laden", "Outlet",
            "Lieferung", "Versand", "Abholung", "nach Hause", "gratis",
        ]
        
        modifiers = [
            "Luxus", "elegant", "edel", "exklusiv", "premium",
            "günstig", "preiswert", "billig", "Schnäppchen", "Sparpreis",
            "österreichisch", "original", "authentisch", "Made in Austria", "handgemacht",
            "modern", "zeitgenössisch", "Design", "trendy", "modisch",
            "klassisch", "vintage", "retro", "traditionell", "historisch",
            "groß", "klein", "mittel", "XL", "XXL",
            "rot", "blau", "schwarz", "weiß", "grün",
            "Herren", "Damen", "Kinder", "Jugend", "Unisex",
        ]
        
        questions = [
            "wo", "wie", "wie viel kostet", "wie viel", "welche",
            "warum", "wer", "was", "wann", "wieso",
            "wo kaufen", "wie kaufen", "wie viel zahlen", "welche wählen",
            "wo finden", "wie bestellen", "Preis", "welche ist besser",
        ]
        
        suffixes = [
            "online", "Österreich", "Wien", "Salzburg", "2024",
            "Preis", "Kosten", "Angebot", "Rabatt", "Aktion",
            "Bewertungen", "Meinungen", "Forum", "Ratgeber", "Tutorial",
        ]
        
        templates = [
            "{brand} {product}",
            "{product} {brand}",
            "{intent} {product} {brand}",
            "{brand} {product} {modifier}",
            "{product} {modifier} {brand}",
            "{question} {product} {brand}",
            "{intent} {product} {modifier}",
            "{brand} {product} {intent}",
            "{product} {brand} {suffix}",
            "{brand} {product} {modifier} {suffix}",
            "{intent} {product} {brand} {modifier}",
            "{question} {brand} {product}",
            "{product} {modifier} {suffix}",
            "{brand} {product} {intent} {suffix}",
            "{modifier} {product} {brand}",
            "{intent} {modifier} {product}",
            "{question} {product} {modifier}",
            "{brand} {intent} {product}",
            "{product} {brand} {modifier} {intent}",
            "{modifier} {brand} {product} {suffix}",
            "{question} {intent} {product}",
            "{product} {suffix} {brand}",
            "{brand} {modifier} {product}",
            "{intent} {product} {suffix}",
            "{question} {product} {brand} {suffix}",
            "{modifier} {product} {intent}",
            "{brand} {product} {question}",
            "{product} {intent} {modifier}",
            "{intent} {brand} {product} {suffix}",
            "{question} {modifier} {product} {brand}",
        ]
        
        return LanguageDataset(
            brands=brands,
            products=products,
            intents=intents,
            modifiers=modifiers,
            questions=questions,
            suffixes=suffixes,
            templates=templates
        )
    
    def get_supported_languages(self) -> List[str]:
        """
        Get list of supported language codes.
        
        Returns:
            List of language codes.
        
        Example:
            >>> data = LanguageData()
            >>> languages = data.get_supported_languages()
            >>> 'IT' in languages
            True
        """
        return list(self._data.keys())
    
    def get_brands(self, language: str) -> List[str]:
        """Get brand list for language."""
        return self._data[language.upper()].brands
    
    def get_products(self, language: str) -> List[str]:
        """Get product list for language."""
        return self._data[language.upper()].products
    
    def get_intents(self, language: str) -> List[str]:
        """Get intent list for language."""
        return self._data[language.upper()].intents
    
    def get_modifiers(self, language: str) -> List[str]:
        """Get modifier list for language."""
        return self._data[language.upper()].modifiers
    
    def get_questions(self, language: str) -> List[str]:
        """Get question list for language."""
        return self._data[language.upper()].questions
    
    def get_suffixes(self, language: str) -> List[str]:
        """Get suffix list for language."""
        return self._data[language.upper()].suffixes
    
    def get_templates(self, language: str) -> List[str]:
        """Get template list for language."""
        return self._data[language.upper()].templates
    
    def get_dataset(self, language: str) -> LanguageDataset:
        """
        Get complete dataset for language.
        
        Args:
            language: Language code.
        
        Returns:
            Complete language dataset.
        
        Example:
            >>> data = LanguageData()
            >>> dataset = data.get_dataset("IT")
            >>> len(dataset.brands) > 0
            True
        """
        return self._data[language.upper()]
    
    def get_random_brand(self, language: str) -> str:
        """
        Get a random brand for a language.
        
        Args:
            language: Language code.
            
        Returns:
            Random brand name.
        """
        dataset = self.get_dataset(language)
        import random
        return random.choice(dataset.brands)
    
    def get_random_product(self, language: str) -> str:
        """Get random product for a language."""
        dataset = self.get_dataset(language)
        import random
        return random.choice(dataset.products)
    
    def get_random_intent(self, language: str) -> str:
        """Get random intent for a language."""
        dataset = self.get_dataset(language)
        import random
        return random.choice(dataset.intents)
    
    def get_random_modifier(self, language: str) -> str:
        """Get random modifier for a language."""
        dataset = self.get_dataset(language)
        import random
        return random.choice(dataset.modifiers)
    
    def get_random_question(self, language: str) -> str:
        """Get random question for a language."""
        dataset = self.get_dataset(language)
        import random
        return random.choice(dataset.questions)
    
    def get_random_suffix(self, language: str) -> str:
        """Get random suffix for a language."""
        dataset = self.get_dataset(language)
        import random
        return random.choice(dataset.suffixes)
    
    def get_random_template(self, language: str) -> str:
        """Get random template for a language."""
        dataset = self.get_dataset(language)
        import random
        return random.choice(dataset.templates)
    
    def search_brands(self, query: str, language: Optional[str] = None) -> List[str]:
        """
        Search for brands containing query string.
        
        Args:
            query: Search query.
            language: Optional language filter.
            
        Returns:
            List of matching brands.
        """
        query_lower = query.lower()
        results = []
        
        languages = [language] if language else self.get_supported_languages()
        
        for lang in languages:
            dataset = self.get_dataset(lang)
            for brand in dataset.brands:
                if query_lower in brand.lower():
                    results.append(brand)
        
        return list(set(results))
    
    def search_products(self, query: str, language: Optional[str] = None) -> List[str]:
        """Search for products containing query string."""
        query_lower = query.lower()
        results = []
        
        languages = [language] if language else self.get_supported_languages()
        
        for lang in languages:
            dataset = self.get_dataset(lang)
            for product in dataset.products:
                if query_lower in product.lower():
                    results.append(product)
        
        return list(set(results))
    
    def get_dataset_stats(self, language: str) -> Dict[str, int]:
        """
        Get statistics for a language dataset.
        
        Args:
            language: Language code.
            
        Returns:
            Dictionary of counts.
        """
        dataset = self.get_dataset(language)
        return {
            'brands': len(dataset.brands),
            'products': len(dataset.products),
            'intents': len(dataset.intents),
            'modifiers': len(dataset.modifiers),
            'questions': len(dataset.questions),
            'suffixes': len(dataset.suffixes),
            'templates': len(dataset.templates),
        }
    
    def get_all_stats(self) -> Dict[str, Dict[str, int]]:
        """
        Get statistics for all languages.
        
        Returns:
            Dictionary mapping language to stats.
        """
        return {
            lang: self.get_dataset_stats(lang)
            for lang in self.get_supported_languages()
        }
    
    def validate_language(self, language: str) -> bool:
        """
        Check if a language is supported.
        
        Args:
            language: Language code.
            
        Returns:
            True if supported.
        """
        return language.upper() in self._data
    
    def get_total_combinations(self, language: str) -> int:
        """
        Calculate total possible combinations for a language.
        
        Args:
            language: Language code.
            
        Returns:
            Number of possible combinations.
        """
        dataset = self.get_dataset(language)
        total = (len(dataset.brands) * 
                len(dataset.products) * 
                len(dataset.intents) * 
                len(dataset.modifiers) * 
                len(dataset.questions) * 
                len(dataset.suffixes) * 
                len(dataset.templates))
        return total
    
    def export_to_dict(self) -> Dict[str, Any]:
        """
        Export all language data to dictionary.
        
        Returns:
            Dictionary of all data.
        """
        result = {}
        for lang, dataset in self._data.items():
            result[lang] = {
                'brands': dataset.brands,
                'products': dataset.products,
                'intents': dataset.intents,
                'modifiers': dataset.modifiers,
                'questions': dataset.questions,
                'suffixes': dataset.suffixes,
                'templates': dataset.templates,
            }
        return result
    
    def get_language_name(self, language: str) -> str:
        """
        Get full language name from code.
        
        Args:
            language: Language code.
            
        Returns:
            Full language name.
        """
        names = {
            'IT': 'Italian',
            'MX': 'Mexican Spanish',
            'DE': 'German',
            'TW': 'Taiwanese Mandarin',
            'AT': 'Austrian German',
        }
        return names.get(language.upper(), 'Unknown')
    
    def __repr__(self) -> str:
        """String representation."""
        return f"LanguageData(languages={len(self._data)})"
    
    def __str__(self) -> str:
        """Human-readable string."""
        langs = ', '.join(self.get_supported_languages())
        return f"LanguageData supporting: {langs}"
    
    def __contains__(self, language: str) -> bool:
        """Check if language is supported."""
        return language.upper() in self._data
    
    def __len__(self) -> int:
        """Return number of supported languages."""
        return len(self._data)


# Global LANGUAGE_DATA dictionary for backward compatibility
LANGUAGE_DATA = {}
_language_data_instance = LanguageData()

for lang_code in _language_data_instance.get_supported_languages():
    dataset = _language_data_instance.get_dataset(lang_code)
    LANGUAGE_DATA[lang_code] = {
        'brands': dataset.brands,
        'products': dataset.products,
        'intents': dataset.intents,
        'modifiers': dataset.modifiers,
        'questions': dataset.questions,
        'suffixes': dataset.suffixes,
    }

# Global TEMPLATES list for backward compatibility
TEMPLATES = []
for lang_code in _language_data_instance.get_supported_languages():
    dataset = _language_data_instance.get_dataset(lang_code)
    TEMPLATES.extend(dataset.templates)

# Remove duplicates from templates
TEMPLATES = list(set(TEMPLATES))
