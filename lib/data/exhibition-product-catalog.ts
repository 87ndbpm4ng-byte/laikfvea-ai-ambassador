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
      "A compact air-purification system powered by photocatalytic technology. Light activates the catalytic surface inside the device as air passes through it. A mobile app supports device control, monitoring and replacement reminders; exterior colours and private-label/OEM/ODM customization are available for suitable projects.",
      "Компактная система очистки воздуха на основе фотокаталитической технологии. Свет активирует каталитическую поверхность внутри устройства, когда через него проходит воздух. Мобильное приложение поддерживает управление, мониторинг и напоминания о замене; для подходящих проектов доступны цвета корпуса и кастомизация Private Label/OEM/ODM.",
      "一款采用光催化技术的紧凑型空气净化系统。空气通过设备时，光会激活内部的催化表面。移动应用可用于控制、监测和更换提醒；适合的项目可提供外观颜色及 Private Label/OEM/ODM 定制。",
      "一款採用光催化技術嘅輕巧空氣淨化系統。空氣通過裝置時，光會啟動內部嘅催化表面。流動應用程式可用於控制、監察同更換提示；合適項目可提供外觀顏色及 Private Label/OEM/ODM 訂製。",
      "Un système compact de purification de l’air utilisant une technologie photocatalytique. La lumière active la surface catalytique à l’intérieur de l’appareil lorsque l’air y circule. Une application mobile permet le contrôle, le suivi et les rappels de remplacement; des couleurs et une personnalisation private label/OEM/ODM sont disponibles pour les projets adaptés.",
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
      { src: "/products/air-purifier-m-size/hero-white-isolated.png", alt: text("White Air Purifier", "Белый очиститель воздуха", "白色空气净化器", "白色空氣淨化器", "Purificateur d’air blanc") },
      { src: "/products/air-purifier-m-size/desk-use.png", alt: text("Air Purifier on a desk", "Очиститель воздуха на столе", "桌面上的空气净化器", "枱面上嘅空氣淨化器", "Purificateur d’air sur un bureau") },
      { src: "/products/air-purifier-m-size/lifestyle-fruit.png", alt: text("Air Purifier beside fruit", "Очиститель воздуха рядом с фруктами", "水果旁的空气净化器", "生果旁邊嘅空氣淨化器", "Purificateur d’air près de fruits") },
      { src: "/products/air-purifier-m-size/bedroom-use.png", alt: text("Air Purifier in a bedroom", "Очиститель воздуха в спальне", "卧室中的空气净化器", "睡房中嘅空氣淨化器", "Purificateur d’air dans une chambre") },
      { src: "/products/air-purifier-m-size/lifestyle-two-purifiers.png", alt: text("Two Air Purifiers", "Два очистителя воздуха", "两台空气净化器", "兩部空氣淨化器", "Deux purificateurs d’air") },
      { src: "/products/air-purifier-m-size/hero.png", alt: text("Air Purifier", "Очиститель воздуха", "空气净化器", "空氣淨化器", "Purificateur d’air") },
      { src: "/products/air-purifier-m-size/variant-purple.png", alt: text("Purple Air Purifier", "Фиолетовый очиститель воздуха", "紫色空气净化器", "紫色空氣淨化器", "Purificateur d’air violet") },
      { src: "/products/air-purifier-m-size/variant-black.png", alt: text("Black Air Purifier", "Чёрный очиститель воздуха", "黑色空气净化器", "黑色空氣淨化器", "Purificateur d’air noir") },
      { src: "/products/air-purifier-m-size/variant-green.png", alt: text("Green Air Purifier", "Зелёный очиститель воздуха", "绿色空气净化器", "綠色空氣淨化器", "Purificateur d’air vert") },
      { src: "/products/air-purifier-m-size/variant-gold.png", alt: text("Gold Air Purifier", "Золотистый очиститель воздуха", "金色空气净化器", "金色空氣淨化器", "Purificateur d’air doré") },
      { src: "/products/air-purifier-m-size/variant-turquoise.png", alt: text("Turquoise Air Purifier", "Бирюзовый очиститель воздуха", "青绿色空气净化器", "青綠色空氣淨化器", "Purificateur d’air turquoise") },
      { src: "/products/air-purifier-m-size/variant-red.png", alt: text("Red Air Purifier", "Красный очиститель воздуха", "红色空气净化器", "紅色空氣淨化器", "Purificateur d’air rouge") },
      { src: "/products/air-purifier-m-size/variant-cream.png", alt: text("Cream Air Purifier", "Кремовый очиститель воздуха", "米白色空气净化器", "米白色空氣淨化器", "Purificateur d’air crème") },
      { src: "/products/air-purifier-m-size/controls.png", alt: text("Air Purifier controls", "Панель управления очистителя воздуха", "空气净化器控制面板", "空氣淨化器控制面板", "Commandes du purificateur d’air") },
    ],
  },
  "water-ionizer": {
    id: "water-ionizer",
    description: text(
      "A multifunctional Water Ionizer that prepares alkaline, acidic, hydrogen and Silver Ion water in one device. Controlled electrolysis, hydrogen generation and a dedicated silver-electrode option support different water functions for daily drinking, food preparation and documented household applications. Its selectable pH range is 2.5–11.2.",
      "Многофункциональный ионизатор воды, который готовит щелочную, кислую, водородную воду и воду с ионами серебра в одном устройстве. Контролируемый электролиз, генерация водорода и отдельный вариант с серебряным электродом поддерживают разные функции воды для ежедневного питья, приготовления пищи и документированных бытовых применений. Выбираемый диапазон pH: 2,5–11,2.",
      "一台多功能水离子机，可在同一设备中制备碱性水、酸性水、氢水和银离子水。受控电解、制氢和专用银电极选项可支持日常饮用、食物准备及已记录的家庭用途。可选择的 pH 范围为 2.5–11.2。",
      "一部多功能水離子機，可喺同一部裝置製備鹼性水、酸性水、氫水同銀離子水。受控電解、製氫同專用銀電極選項可支援日常飲用、食物準備及已記錄嘅家居用途。可選 pH 範圍係 2.5–11.2。",
      "Un ioniseur d’eau multifonction qui prépare de l’eau alcaline, acide, hydrogénée et aux ions d’argent dans un seul appareil. L’électrolyse contrôlée, la génération d’hydrogène et une option d’électrode d’argent dédiée prennent en charge différentes fonctions de l’eau pour la boisson quotidienne, la préparation des aliments et des usages domestiques documentés. Sa plage de pH sélectionnable est de 2,5 à 11,2.",
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
      "A multifunctional portable bottle for preparing hydrogen-rich water in daily hydration routines. Choose a 3-minute quick hydrogen cycle or an 18-minute high-concentration cycle; the dedicated adapter and cannula support the documented inhalation function. It also includes mineralization, app-connected controls, USB-C charging and a storage compartment for travel, work, training and everyday use.",
      "Многофункциональная портативная бутылка для приготовления водородной воды в повседневном режиме гидратации. Выберите быстрый 3-минутный цикл или 18-минутный цикл высокой концентрации; специальный адаптер и канюля поддерживают документированную функцию ингаляции. Также предусмотрены минерализация, управление через приложение, зарядка USB-C и отсек для хранения — для поездок, работы, тренировок и повседневного использования.",
      "一款多功能便携水瓶，可在日常补水中制备富氢水。可选择 3 分钟快速制氢循环或 18 分钟高浓度循环；专用适配器和鼻导管支持已记录的吸入功能。它还配有矿化、应用程序控制、USB-C 充电和收纳仓，适合旅行、工作、训练和日常使用。",
      "一款多功能便攜水樽，可喺日常補水中製備富氫水。可選擇 3 分鐘快速製氫循環或 18 分鐘高濃度循環；專用轉接器同鼻導管支援已記錄嘅吸入功能。佢仲配有礦化、應用程式控制、USB-C 充電同收納格，適合旅行、工作、訓練同日常使用。",
      "Une bouteille portable multifonction pour préparer de l’eau enrichie en hydrogène dans les routines d’hydratation quotidiennes. Choisissez un cycle rapide de 3 minutes ou un cycle haute concentration de 18 minutes; l’adaptateur et la canule dédiés prennent en charge la fonction d’inhalation documentée. Elle comprend aussi la minéralisation, des commandes connectées à une application, une recharge USB-C et un compartiment de rangement pour les déplacements, le travail, l’entraînement et l’usage quotidien.",
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
      "A portable hydrogen-water bottle that uses electrolysis and a membrane system to prepare hydrogen-rich water. Its single approximately 5-minute cycle is designed for straightforward everyday use at home, at work, at the gym or while travelling. Colours, exterior design and branding can be customized for Private Label/OEM/ODM projects.",
      "Портативная бутылка для водородной воды, использующая электролиз и мембранную систему для приготовления водородной воды. Один цикл примерно на 5 минут рассчитан на простое ежедневное использование дома, на работе, в спортзале или в поездках. Для проектов Private Label/OEM/ODM можно настроить цвета, внешний дизайн и брендинг.",
      "一款采用电解和膜系统制备富氢水的便携氢水瓶。单一的约 5 分钟循环，适合在家、办公室、健身房或旅行中轻松日常使用。颜色、外观设计和品牌可为 Private Label/OEM/ODM 项目定制。",
      "一款採用電解同膜系統製備富氫水嘅便攜氫水樽。單一約 5 分鐘循環，適合喺屋企、辦公室、健身室或旅行時輕鬆日常使用。顏色、外觀設計同品牌可為 Private Label/OEM/ODM 項目訂製。",
      "Une bouteille d’eau hydrogénée portable qui utilise l’électrolyse et un système de membrane pour préparer de l’eau enrichie en hydrogène. Son unique cycle d’environ 5 minutes est conçu pour un usage quotidien simple à la maison, au travail, à la salle de sport ou en déplacement. Les couleurs, le design extérieur et le branding peuvent être personnalisés pour des projets Private Label/OEM/ODM.",
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
      "A multifunctional air humidifier and aroma diffuser designed to add comfort and atmosphere to indoor spaces. It combines ultrasonic humidification, aromatherapy and ambient lighting with touch control, multiple mist modes, adjustable lighting, timer settings and automatic shut-off. Exterior design and colours can be customized for Private Label/OEM/ODM projects.",
      "Многофункциональный увлажнитель воздуха и аромадиффузор, созданный для комфорта и атмосферы в помещениях. Он сочетает ультразвуковое увлажнение, ароматизацию и атмосферную подсветку с сенсорным управлением, несколькими режимами тумана, регулируемой подсветкой, таймером и автоматическим отключением. Для проектов Private Label/OEM/ODM можно настроить внешний дизайн и цвета.",
      "一款多功能空气加湿器和香薰扩香器，旨在为室内空间增添舒适感和氛围。它结合超声波加湿、香薰和氛围灯，配有触控、多种雾化模式、可调灯光、定时设置和自动关闭。外观设计和颜色可为 Private Label/OEM/ODM 项目定制。",
      "一款多功能空氣加濕器同香薰擴香器，旨在為室內空間增添舒適感同氣氛。佢結合超聲波加濕、香薰同氣氛燈，配有觸控、多種噴霧模式、可調燈光、定時設定同自動關機。外觀設計同顏色可為 Private Label/OEM/ODM 項目訂製。",
      "Un humidificateur d’air et diffuseur d’arômes multifonction, conçu pour apporter confort et ambiance aux espaces intérieurs. Il associe humidification ultrasonique, aromathérapie et éclairage d’ambiance avec commande tactile, plusieurs modes de brume, éclairage réglable, minuterie et arrêt automatique. Le design extérieur et les couleurs peuvent être personnalisés pour des projets Private Label/OEM/ODM.",
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
      "A face-and-body care device that uses electrolysis and ultrasonic atomization to create a hydrogen-enriched fine mist for external use. It is designed for facial cleansing, skin rinsing and everyday body-care routines. It is not a medical nebulizer or treatment device.",
      "Устройство для ухода за лицом и телом, использующее электролиз и ультразвуковое распыление для создания обогащённого водородом мелкого тумана для наружного применения. Оно предназначено для очищения лица, ополаскивания кожи и повседневного ухода за телом. Это не медицинский небулайзер и не устройство для лечения.",
      "一款面部和身体护理设备，使用电解和超声波雾化技术产生富氢细雾，供外部使用。适用于面部清洁、皮肤冲洗和日常身体护理。它不是医疗雾化器或治疗设备。",
      "一款面部同身體護理裝置，使用電解同超聲波霧化技術產生富氫細霧，供外部使用。適合面部清潔、皮膚沖洗同日常身體護理。佢唔係醫療霧化器或治療裝置。",
      "Un appareil de soin du visage et du corps qui utilise l’électrolyse et l’atomisation ultrasonique pour créer une fine brume enrichie en hydrogène à usage externe. Il est conçu pour le nettoyage du visage, le rinçage de la peau et les routines de soin du corps. Ce n’est ni un nébuliseur médical ni un dispositif de traitement.",
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
