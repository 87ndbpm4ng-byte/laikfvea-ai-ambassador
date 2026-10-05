import type { SupportedLanguage } from "@/types/language";
import type { ExhibitionProductId } from "@/types/product";

type LocalizedText = Readonly<Record<SupportedLanguage, string>>;

export type ProductGalleryImage = {
  src: string;
  alt: LocalizedText;
};

export type ExhibitionProductCatalogEntry = {
  id: ExhibitionProductId;
  description: LocalizedText;
  atAGlance: Readonly<Record<SupportedLanguage, readonly string[]>>;
  howItWorks: LocalizedText;
  care: LocalizedText;
  images: readonly [ProductGalleryImage, ...ProductGalleryImage[]];
};

const text = (en: string, ru: string, zh: string, yue: string, fr: string): LocalizedText => ({
  en, ru, zh, yue, fr,
});

const facts = (
  en: readonly string[],
  ru: readonly string[],
  zh: readonly string[],
  yue: readonly string[],
  fr: readonly string[],
): ExhibitionProductCatalogEntry["atAGlance"] => ({ en, ru, zh, yue, fr });

/**
 * Exhibition presentation copy only. Operational detail remains in the
 * product-specific approved manuals and is not duplicated as retrieval logic.
 */
export const exhibitionProductCatalog: Readonly<
  Record<ExhibitionProductId, ExhibitionProductCatalogEntry>
> = {
  "air-purifier": {
    id: "air-purifier",
    description: text(
      "A compact indoor purifier with a photocatalytic glass element and UV-A activation.",
      "Компактный очиститель воздуха для помещений с фотокаталитическим стеклянным элементом и УФ-А активацией.",
      "采用光催化玻璃元件和 UV-A 活化技术的紧凑型室内空气净化器。",
      "採用光催化玻璃元件同 UV-A 活化技術嘅輕巧室內空氣淨化器。",
      "Un purificateur d’air intérieur compact avec élément en verre photocatalytique et activation UV-A.",
    ),
    atAGlance: facts(
      ["Up to 20.25 m² coverage", "Night, Day and Boost modes", "Glass active element with a pre-filter"],
      ["Площадь до 20,25 м²", "Режимы Night, Day и Boost", "Стеклянный активный элемент с предварительным фильтром"],
      ["覆盖面积最高 20.25 平方米", "夜间、日间和增强模式", "玻璃活性元件配前置过滤网"],
      ["覆蓋面積最高 20.25 平方米", "夜間、日間同增強模式", "玻璃活性元件配前置濾網"],
      ["Jusqu’à 20,25 m²", "Modes Nuit, Jour et Boost", "Élément actif en verre avec préfiltre"],
    ),
    howItWorks: text(
      "Air passes through a pre-filter and a glass photocatalytic element activated by 365 nm UV-A.",
      "Воздух проходит через предварительный фильтр и стеклянный фотокаталитический элемент, активируемый УФ-А 365 нм.",
      "空气先经过前置过滤网，再经过由 365 纳米 UV-A 活化的玻璃光催化元件。",
      "空氣先經過前置濾網，再經過由 365 納米 UV-A 活化嘅玻璃光催化元件。",
      "L’air traverse un préfiltre puis un élément photocatalytique en verre activé par UV-A à 365 nm.",
    ),
    care: text(
      "Keep the air openings clear. The pre-filter is the routine replaceable part; the glass element is long-life.",
      "Не закрывайте воздухозаборники. Предварительный фильтр является регулярно заменяемой частью; стеклянный элемент рассчитан на длительный срок службы.",
      "保持进出风口畅通。前置过滤网是常规更换部件，玻璃元件为长寿命部件。",
      "保持進出風口暢通。前置濾網係日常更換部件，玻璃元件屬長壽命部件。",
      "Gardez les ouvertures d’air dégagées. Le préfiltre est l’élément à remplacer périodiquement; l’élément en verre est conçu pour durer.",
    ),
    images: [
      { src: "/products/air-purifier-m-size/hero-white-isolated.png", alt: text("White Air Purifier M Size", "Белый очиститель воздуха M Size", "白色 M Size 空气净化器", "白色 M Size 空氣淨化器", "Purificateur d’air M Size blanc") },
      { src: "/products/air-purifier-m-size/desk-use.png", alt: text("Air Purifier M Size on a desk", "Очиститель воздуха M Size на столе", "桌面上的 M Size 空气净化器", "枱面上嘅 M Size 空氣淨化器", "Purificateur d’air M Size sur un bureau") },
      { src: "/products/air-purifier-m-size/hero.png", alt: text("Air Purifier M Size", "Очиститель воздуха M Size", "M Size 空气净化器", "M Size 空氣淨化器", "Purificateur d’air M Size") },
      { src: "/products/air-purifier-m-size/bedroom-use.png", alt: text("Air Purifier M Size in a bedroom", "Очиститель воздуха M Size в спальне", "卧室中的 M Size 空气净化器", "睡房中嘅 M Size 空氣淨化器", "Purificateur d’air M Size dans une chambre") },
      { src: "/products/air-purifier-m-size/controls.png", alt: text("Air Purifier M Size controls", "Панель управления очистителя воздуха M Size", "M Size 空气净化器控制面板", "M Size 空氣淨化器控制面板", "Commandes du Purificateur d’air M Size") },
    ],
  },
  "water-ionizer": {
    id: "water-ionizer",
    description: text(
      "A portable countertop system that prepares four functional-water programs through controlled electrolysis.",
      "Портативная настольная система, которая готовит четыре программы функциональной воды с помощью контролируемого электролиза.",
      "一款通过受控电解制备四种功能水程序的便携式台面设备。",
      "一款透過受控電解製備四種功能水程序嘅便攜式枱面設備。",
      "Un système de comptoir portable qui prépare quatre programmes d’eau fonctionnelle par électrolyse contrôlée.",
    ),
    atAGlance: facts(
      ["Four water programs", "Up to 3.5 L per batch", "No permanent plumbing"],
      ["Четыре программы воды", "До 3,5 л за цикл", "Без стационарного подключения к водопроводу"],
      ["四种水程序", "每次最多 3.5 升", "无需固定管道安装"],
      ["四種水程序", "每次最多 3.5 升", "毋須固定管道安裝"],
      ["Quatre programmes d’eau", "Jusqu’à 3,5 L par cycle", "Sans plomberie permanente"],
    ),
    howItWorks: text(
      "A controlled electrical current acts on suitable mineralized drinking water between electrodes separated by a membrane.",
      "Контролируемый электрический ток действует на подходящую минерализованную питьевую воду между электродами, разделёнными мембраной.",
      "受控电流在由膜分隔的电极之间作用于适合的矿化饮用水。",
      "受控電流喺由膜分隔嘅電極之間作用於合適嘅礦化飲用水。",
      "Un courant électrique contrôlé agit sur une eau potable minéralisée adaptée, entre des électrodes séparées par une membrane.",
    ),
    care: text(
      "Use suitable source water and follow the manual for membrane care, descaling and cleaning.",
      "Используйте подходящую исходную воду и следуйте инструкции по уходу за мембраной, удалению накипи и очистке.",
      "请使用合适的源水，并遵循手册中的膜维护、除垢和清洁说明。",
      "請使用合適嘅源水，並遵循說明書中關於膜保養、除垢同清潔嘅指引。",
      "Utilisez une eau source adaptée et suivez le manuel pour l’entretien de la membrane, le détartrage et le nettoyage.",
    ),
    images: [
      { src: "/products/water-ionizer/hero.png", alt: text("Water Ionizer", "Ионизатор воды", "水离子机", "水離子機", "Ioniseur d’eau") },
      { src: "/products/water-ionizer/pouring.png", alt: text("Water being poured from the Water Ionizer", "Вода из ионизатора воды", "从水离子机倒水", "從水離子機倒水", "Eau versée depuis l’ioniseur") },
      { src: "/products/water-ionizer/internal-tank.png", alt: text("Water Ionizer internal tank", "Внутренний резервуар ионизатора воды", "水离子机内部水箱", "水離子機內部水箱", "Réservoir interne de l’ioniseur") },
      { src: "/products/water-ionizer/care.png", alt: text("Water Ionizer care detail", "Деталь ухода за ионизатором воды", "水离子机维护细节", "水離子機保養細節", "Détail d’entretien de l’ioniseur") },
    ],
  },
  advanced: {
    id: "advanced",
    description: text(
      "An advanced portable hydrogen-water bottle with high-concentration, inhalation and smart functions.",
      "Продвинутая портативная бутылка для водородной воды с высокой концентрацией, ингаляцией и интеллектуальными функциями.",
      "一款具备高浓度、吸入和智能功能的高级便携式氢水瓶。",
      "一款具備高濃度、吸入同智能功能嘅高階便攜式氫水樽。",
      "Une bouteille d’eau hydrogénée portable avancée avec fonctions haute concentration, inhalation et connectées.",
    ),
    atAGlance: facts(
      ["350 mL capacity", "3-minute and 18-minute modes", "USB-C and wireless charging"],
      ["Объём 350 мл", "Режимы на 3 и 18 минут", "USB-C и беспроводная зарядка"],
      ["350 毫升容量", "3 分钟和 18 分钟模式", "USB-C 和无线充电"],
      ["350 毫升容量", "3 分鐘同 18 分鐘模式", "USB-C 同無線充電"],
      ["Capacité de 350 mL", "Modes de 3 et 18 minutes", "Recharge USB-C et sans fil"],
    ),
    howItWorks: text(
      "SPE electrolysis with a membrane and platinum-coated titanium electrode prepares hydrogen water in the selected mode.",
      "SPE-электролиз с мембраной и титановым электродом с платиновым покрытием готовит водородную воду в выбранном режиме.",
      "采用带膜和镀铂钛电极的 SPE 电解技术，按所选模式制备氢水。",
      "採用帶膜同鍍鉑鈦電極嘅 SPE 電解技術，按所選模式製備氫水。",
      "L’électrolyse SPE avec membrane et électrode en titane plaquée platine prépare l’eau hydrogénée dans le mode sélectionné.",
    ),
    care: text(
      "Use the self-cleaning function monthly, keep the charging port dry, and do not generate hydrogen while charging.",
      "Ежемесячно используйте самоочистку, держите порт зарядки сухим и не запускайте генерацию водорода во время зарядки.",
      "每月使用自清洁功能，保持充电口干燥，充电时不要制氢。",
      "每月使用自清潔功能，保持充電口乾爽，充電時唔好製氫。",
      "Utilisez l’auto-nettoyage chaque mois, gardez le port de charge au sec et ne produisez pas d’hydrogène pendant la charge.",
    ),
    images: [
      { src: "/products/hydrogen-bottle-pro/hero.png", alt: text("Hydrogen Water Bottle PRO", "Бутылка для водородной воды PRO", "PRO 氢水瓶", "PRO 氫水樽", "Bouteille d’eau hydrogénée PRO") },
      { src: "/products/hydrogen-bottle-pro/mineralisation-use.png", alt: text("Hydrogen Water Bottle PRO mineralisation use", "Минерализация с бутылкой PRO", "PRO 氢水瓶矿化使用", "PRO 氫水樽礦化使用", "Utilisation de la minéralisation avec la bouteille PRO") },
      { src: "/products/hydrogen-bottle-pro/inhalation.png", alt: text("Hydrogen Water Bottle PRO inhalation accessory", "Аксессуар для ингаляции PRO", "PRO 氢水瓶吸入配件", "PRO 氫水樽吸入配件", "Accessoire d’inhalation de la bouteille PRO") },
    ],
  },
  everyday: {
    id: "everyday",
    description: text(
      "A simple portable bottle for preparing fresh hydrogen water in an everyday routine.",
      "Простая портативная бутылка для приготовления свежей водородной воды в повседневной жизни.",
      "一款简单便携的氢水瓶，适合日常制备新鲜氢水。",
      "一款簡單便攜嘅氫水樽，適合日常製備新鮮氫水。",
      "Une bouteille portable simple pour préparer de l’eau hydrogénée fraîche au quotidien.",
    ),
    atAGlance: facts(
      ["400 mL capacity", "Approximately 5-minute cycle", "One-button operation with USB-C charging"],
      ["Объём 400 мл", "Цикл примерно 5 минут", "Управление одной кнопкой и зарядка USB-C"],
      ["400 毫升容量", "约 5 分钟循环", "一键操作和 USB-C 充电"],
      ["400 毫升容量", "約 5 分鐘循環", "一鍵操作同 USB-C 充電"],
      ["Capacité de 400 mL", "Cycle d’environ 5 minutes", "Un bouton et recharge USB-C"],
    ),
    howItWorks: text(
      "Fill with drinking water, press the button, and let the selected cycle prepare fresh hydrogen water.",
      "Наполните питьевой водой, нажмите кнопку и дайте циклу приготовить свежую водородную воду.",
      "加入饮用水，按下按钮，让循环制备新鲜氢水。",
      "加入飲用水，撳掣，等循環製備新鮮氫水。",
      "Remplissez d’eau potable, appuyez sur le bouton et laissez le cycle préparer de l’eau hydrogénée fraîche.",
    ),
    care: text(
      "Use drinking water, rinse regularly, and keep the charging port dry.",
      "Используйте питьевую воду, регулярно промывайте бутылку и держите порт зарядки сухим.",
      "请使用饮用水，定期冲洗，并保持充电口干燥。",
      "請使用飲用水，定期沖洗，並保持充電口乾爽。",
      "Utilisez de l’eau potable, rincez régulièrement et gardez le port de charge au sec.",
    ),
    images: [
      { src: "/products/hydrogen-bottle-go/hero.png", alt: text("Hydrogen Water Bottle GO", "Бутылка для водородной воды GO", "GO 氢水瓶", "GO 氫水樽", "Bouteille d’eau hydrogénée GO") },
      { src: "/products/hydrogen-bottle-go/fill-and-use.png", alt: text("Hydrogen Water Bottle GO being filled", "Наполнение бутылки GO", "正在加水的 GO 氢水瓶", "正在加水嘅 GO 氫水樽", "Bouteille GO en cours de remplissage") },
      { src: "/products/hydrogen-bottle-go/lifestyle.png", alt: text("Hydrogen Water Bottle GO in use", "Бутылка GO в использовании", "使用中的 GO 氢水瓶", "使用中嘅 GO 氫水樽", "Bouteille GO en utilisation") },
    ],
  },
  "air-humidifier": {
    id: "air-humidifier",
    description: text(
      "A compact ultrasonic humidifier with aroma and ambient-light functions.",
      "Компактный ультразвуковой увлажнитель воздуха с функциями ароматизации и атмосферной подсветки.",
      "一款带有香薰和氛围灯功能的紧凑型超声波加湿器。",
      "一款配備香薰同氣氛燈功能嘅輕巧超聲波加濕器。",
      "Un humidificateur ultrasonique compact avec fonctions d’aromathérapie et d’éclairage d’ambiance.",
    ),
    atAGlance: facts(
      ["2.4 L tank", "Four mist settings", "2, 4 or 6-hour timer"],
      ["Бак 2,4 л", "Четыре режима тумана", "Таймер на 2, 4 или 6 часов"],
      ["2.4 升水箱", "四种雾化档位", "2、4 或 6 小时定时"],
      ["2.4 升水箱", "四種霧化檔位", "2、4 或 6 小時計時"],
      ["Réservoir de 2,4 L", "Quatre réglages de brume", "Minuterie de 2, 4 ou 6 heures"],
    ),
    howItWorks: text(
      "An ultrasonic membrane turns water into a fine mist, which the fan distributes around the room.",
      "Ультразвуковая мембрана превращает воду в мелкий туман, который вентилятор распределяет по помещению.",
      "超声波膜将水转化为细雾，再由风扇扩散到室内。",
      "超聲波膜將水轉化為細霧，再由風扇擴散到室內。",
      "Une membrane ultrasonique transforme l’eau en fine brume, que le ventilateur diffuse dans la pièce.",
    ),
    care: text(
      "Use fresh water, drain and dry the unit for storage, and clean it at least monthly with the power disconnected.",
      "Используйте свежую воду, сливайте и высушивайте устройство перед хранением, а также очищайте его не реже одного раза в месяц при отключённом питании.",
      "请使用新鲜水，存放前排水并晾干设备，并在断电后至少每月清洁一次。",
      "請使用新鮮水，存放前排水並晾乾設備，並喺斷電後至少每月清潔一次。",
      "Utilisez de l’eau fraîche, videz et séchez l’appareil avant le rangement, et nettoyez-le au moins une fois par mois hors tension.",
    ),
    images: [
      { src: "/products/air-humidifier/hero-white-isolated.png", alt: text("White Air Humidifier", "Белый увлажнитель воздуха", "白色空气加湿器", "白色空氣加濕器", "Humidificateur d’air blanc") },
      { src: "/products/air-humidifier/hero-dining-table.png", alt: text("Air Humidifier on a dining table", "Увлажнитель воздуха на обеденном столе", "餐桌上的空气加湿器", "餐枱上嘅空氣加濕器", "Humidificateur d’air sur une table à manger") },
      { src: "/products/air-humidifier/hero.png", alt: text("Air Humidifier", "Увлажнитель воздуха", "空气加湿器", "空氣加濕器", "Humidificateur d’air") },
      { src: "/products/air-humidifier/room-use.png", alt: text("Air Humidifier in a room", "Увлажнитель воздуха в комнате", "房间中的空气加湿器", "房間中嘅空氣加濕器", "Humidificateur d’air dans une pièce") },
      { src: "/products/air-humidifier/controls.png", alt: text("Air Humidifier controls", "Панель управления увлажнителя воздуха", "空气加湿器控制面板", "空氣加濕器控制面板", "Commandes de l’humidificateur d’air") },
      { src: "/products/air-humidifier/aroma-light.png", alt: text("Air Humidifier aroma and ambient light detail", "Деталь ароматизации и подсветки увлажнителя", "加湿器香薰和氛围灯细节", "加濕器香薰同氣氛燈細節", "Détail aromathérapie et éclairage de l’humidificateur") },
    ],
  },
  "face-body-generator": {
    id: "face-body-generator",
    description: text(
      "A portable device that creates hydrogen-enriched ultrafine mist for face and body use.",
      "Портативное устройство, создающее обогащённый водородом ультратонкий туман для лица и тела.",
      "一款为面部和身体使用而产生富氢超细雾的便携式设备。",
      "一款為面部同身體使用而產生富氫超細霧嘅便攜式設備。",
      "Un appareil portable qui crée une brume ultrafine enrichie en hydrogène pour le visage et le corps.",
    ),
    atAGlance: facts(
      ["15 mL reservoir", "Approximately 55-second cycle", "USB-C rechargeable"],
      ["Резервуар 15 мл", "Цикл примерно 55 секунд", "Зарядка через USB-C"],
      ["15 毫升水箱", "约 55 秒循环", "USB-C 充电"],
      ["15 毫升水箱", "約 55 秒循環", "USB-C 充電"],
      ["Réservoir de 15 mL", "Cycle d’environ 55 secondes", "Rechargeable par USB-C"],
    ),
    howItWorks: text(
      "Ultrasonic atomization creates a fine mist from suitable water, with molecular hydrogen in the mist.",
      "Ультразвуковое распыление создаёт мелкий туман из подходящей воды с молекулярным водородом в тумане.",
      "超声波雾化将合适的水转化为细雾，雾中含有分子氢。",
      "超聲波霧化將合適嘅水轉化為細霧，霧中含有分子氫。",
      "L’atomisation ultrasonique crée une fine brume à partir d’une eau adaptée, avec de l’hydrogène moléculaire dans la brume.",
    ),
    care: text(
      "Keep the nozzle and USB port clean. Use the recommended water only; do not add cosmetics, essential oils or Silver Ion water.",
      "Держите распылитель и USB-порт в чистоте. Используйте только рекомендованную воду; не добавляйте косметику, эфирные масла или воду с ионами серебра.",
      "保持喷嘴和 USB 接口清洁。仅使用推荐的水；不要加入化妆品、精油或含银离子水。",
      "保持噴嘴同 USB 接口清潔。只可使用建議嘅水；唔好加入化妝品、精油或含銀離子水。",
      "Gardez la buse et le port USB propres. Utilisez uniquement l’eau recommandée; n’ajoutez ni cosmétiques, ni huiles essentielles, ni eau aux ions d’argent.",
    ),
    images: [
      { src: "/products/h2-generator-face-body/hero.png", alt: text("H₂ Generator Face & Body", "Генератор H₂ для лица и тела", "面部及身体 H₂ 生成器", "面部及身體 H₂ 生成器", "Générateur H₂ visage et corps") },
      { src: "/products/h2-generator-face-body/face-use.png", alt: text("H₂ Generator Face & Body in use", "Использование генератора H₂ для лица и тела", "正在使用的面部及身体 H₂ 生成器", "使用中嘅面部及身體 H₂ 生成器", "Générateur H₂ visage et corps en utilisation") },
      { src: "/products/h2-generator-face-body/lifestyle.png", alt: text("H₂ Generator Face & Body lifestyle view", "Генератор H₂ для лица и тела", "面部及身体 H₂ 生成器生活场景", "面部及身體 H₂ 生成器生活場景", "Vue d’usage du générateur H₂ visage et corps") },
    ],
  },
};

export function getExhibitionProductCatalog(productId: ExhibitionProductId) {
  return exhibitionProductCatalog[productId];
}

export function isExhibitionProductId(productId: string): productId is ExhibitionProductId {
  return productId in exhibitionProductCatalog;
}
