import type { GuideId } from "@/types/guide";
import type { ProductId } from "@/types/product";
import type { SupportedLanguage } from "@/types/language";

type TopicCopy = { title: string; description: string; question: string };

type UiCopy = {
  languageHeading: string;
  languagesAria: string;
  back: string;
  guidedConversation: string;
  specialistsHeading: string;
  specialistsSupport: string;
  specialistsAria: string;
  visualPreview: string;
  visualPreviewUnavailable: (name: string) => string;
  guideRole: Record<GuideId, string>;
  guideDisplayName: Record<GuideId, string>;
  guideDescription: Record<GuideId, string>;
  speakWith: (name: string) => string;
  conversationWith: (name: string) => string;
  conversationAria: string;
  askQuestion: (name: string) => string;
  whatToUnderstand: string;
  welcomeSupport: (name: string) => string;
  youAsked: string;
  preparingResponse: string;
  quickTopics: string;
  chooseStartingPoint: string;
  topics: Record<GuideId, Record<string, TopicCopy>>;
  exploreProducts: string;
  viewProduct: (name: string) => string;
  sending: string;
  send: string;
  endSession: string;
  stillExploring: string;
  restartCountdown: (seconds: number) => string;
  continueSession: string;
  visualUnavailable: string;
  voiceRemainsAvailable: string;
  voiceOnlyMode: string;
  visualPreparing: string;
  visualReady: string;
  visualListening: (name: string) => string;
  visualThinking: string;
  visualSpeaking: (name: string) => string;
  reconnect: string;
  talkTo: (name: string) => string;
  tapAndAsk: string;
  talk: string;
  stop: string;
  ready: string;
  readyFor: (name: string) => string;
  voiceReadyFor: (name: string) => string;
  listening: string;
  thinking: string;
  speaking: string;
  speakingFor: (name: string) => string;
  gettingReady: (name: string) => string;
  wordsAppear: string;
  preparingAnswer: (name: string) => string;
  answeringNow: (name: string) => string;
  voiceGettingReady: string;
  talkHint: string;
  stopListeningAria: (name: string) => string;
  interruptAria: (name: string) => string;
  speakAria: (name: string) => string;
  playResponse: string;
  recognitionUnavailable: string;
  synthesisUnavailable: string;
  activationFailed: string;
  escapeHint: string;
  microphoneDenied: string;
  recognitionTimeout: string;
  recognitionFailed: string;
  productExplorer: string;
  productExplorerSupport: string;
  viewProductLabel: string;
  compareProducts: string;
  backToConversation: string;
  keyFeatures: string;
  useCases: string;
  compare: string;
  askGuide: string;
  compareBottles: string;
  comparisonSupport: string;
  feature: string;
  askComparison: string;
  backToProducts: string;
  thankYou: string;
  startAgain: string;
  returnToConversation: string;
  productOverview: Record<ProductId, string>;
  productFeatures: Record<ProductId, readonly string[]>;
  productUseCases: Record<ProductId, readonly string[]>;
  comparisonRows: Record<
    string,
    { label: string; everyday: string; advanced: string }
  >;
};

const en: UiCopy = {
  languageHeading: "Choose your language",
  languagesAria: "Languages",
  back: "Back",
  guidedConversation: "A guided product conversation",
  specialistsHeading: "Meet your AI specialists",
  specialistsSupport: "Choose who you would like to speak with.",
  specialistsAria: "AI specialists",
  visualPreview: "Visual preview",
  visualPreviewUnavailable: (name) => `${name} visual preview unavailable`,
  guideRole: { daniel: "Technology Specialist", emily: "Wellness Specialist" },
  guideDisplayName: { daniel: "Daniel", emily: "Emily" },
  guideDescription: {
    daniel:
      "Explains product technology, engineering, materials and technical features.",
    emily:
      "Explains everyday use, hydration, wellness and how the products fit into daily life.",
  },
  speakWith: (name) => `Speak with ${name}`,
  conversationWith: (name) => `Conversation with ${name}`,
  conversationAria: "Conversation",
  askQuestion: (name) => `Ask ${name} a question`,
  whatToUnderstand: "What would you like to understand?",
  welcomeSupport: (name) =>
    `Ask ${name} directly, or begin with one of the topics below.`,
  youAsked: "You asked",
  preparingResponse: "Preparing response",
  quickTopics: "Quick topics",
  chooseStartingPoint: "Choose a starting point",
  topics: {
    daniel: {
      "hydrogen-water-overview": { title: "Hydrogen technology", description: "Understand the core principles.", question: "How does hydrogen water work?" },
      "product-comparison": { title: "Product comparison", description: "Review the documented differences.", question: "Compare the available products" },
      "product-guidance": { title: "Choosing a product", description: "Explore which option may suit your needs.", question: "Which product is right for me?" },
      "hydrogen-inhalation": { title: "Hydrogen inhalation", description: "Explore the documented capability.", question: "Explain hydrogen inhalation" },
    },
    emily: {
      "hydrogen-water-overview": { title: "Hydrogen water", description: "Start with a clear introduction.", question: "How does hydrogen water work?" },
      "product-comparison": { title: "Product differences", description: "Understand the options simply.", question: "Compare the available products" },
      "product-guidance": { title: "Choosing a product", description: "Consider everyday routines and needs.", question: "Which product is right for me?" },
      "hydrogen-inhalation": { title: "Hydrogen inhalation", description: "Ask about the available information.", question: "Explain hydrogen inhalation" },
    },
  },
  exploreProducts: "Explore products",
  viewProduct: (name) => `View ${name}`,
  sending: "Sending",
  send: "Send",
  endSession: "End session",
  stillExploring: "Still exploring?",
  restartCountdown: (seconds) => `This session will restart in ${seconds} seconds.`,
  continueSession: "Continue session",
  visualUnavailable: "Visual session unavailable.",
  voiceRemainsAvailable: "Voice conversation remains available.",
  voiceOnlyMode: "Voice-only mode",
  visualPreparing: "Preparing the visual connection.",
  visualReady: "Ask a question when you’re ready.",
  visualListening: (name) => `${name} is paying attention.`,
  visualThinking: "Considering your question.",
  visualSpeaking: (name) => `${name} is answering now.`,
  reconnect: "Reconnect",
  talkTo: (name) => `Talk to ${name}`,
  tapAndAsk: "Tap and ask your question.",
  talk: "Talk",
  stop: "Stop",
  ready: "Ready",
  readyFor: () => "Ready",
  voiceReadyFor: () => "Ready",
  listening: "Listening…",
  thinking: "Preparing an answer…",
  speaking: "Speaking…",
  speakingFor: () => "Speaking…",
  gettingReady: (name) => `${name} is getting ready…`,
  wordsAppear: "Your words will appear here.",
  preparingAnswer: (name) => `${name} is preparing a response.`,
  answeringNow: (name) => `${name} is answering now.`,
  voiceGettingReady: "Voice is getting ready.",
  talkHint: "Tap Talk, then ask your question.",
  stopListeningAria: (name) => `Stop listening and send your question to ${name}`,
  interruptAria: (name) => `Interrupt ${name} and talk`,
  speakAria: (name) => `Speak with ${name}`,
  playResponse: "Play response",
  recognitionUnavailable: "Voice input isn’t available in this browser. You can still type your question.",
  synthesisUnavailable: "Spoken responses aren’t available here. Answers will remain visible on screen.",
  activationFailed: "Voice is available through Talk. You can still type below.",
  escapeHint: "Press Escape at any time to stop audio.",
  microphoneDenied: "Microphone access was not granted. You can still type your question.",
  recognitionTimeout: "I didn’t hear a question. Tap Talk and try again.",
  recognitionFailed: "I couldn’t hear that clearly. Please try again or type your question.",
  productExplorer: "Product Explorer",
  productExplorerSupport: "Explore the available products and their key capabilities.",
  viewProductLabel: "View product",
  compareProducts: "Compare Products",
  backToConversation: "Back to Conversation",
  keyFeatures: "Key features",
  useCases: "Use cases",
  compare: "Compare",
  askGuide: "Ask the guide",
  compareBottles: "Compare the bottles",
  comparisonSupport: "A simple view of the listed capabilities.",
  feature: "Feature",
  askComparison: "Ask about this comparison",
  backToProducts: "Back to Products",
  thankYou: "Thank you for visiting.",
  startAgain: "Start Again",
  returnToConversation: "Return to Conversation",
  productOverview: {
    everyday: "A compact everyday bottle designed for portable hydrogen water generation.",
    advanced: "An advanced hydrogen bottle with hydrogen water generation and additional capabilities.",
  },
  productFeatures: {
    everyday: ["Compact everyday bottle", "Hydrogen water generation", "Portable design"],
    advanced: ["Advanced hydrogen bottle", "Hydrogen water generation", "Inhalation capability", "Mineralisation support"],
  },
  productUseCases: { everyday: ["Everyday use", "Portable use"], advanced: ["Advanced use", "Hydrogen inhalation"] },
  comparisonRows: {
    "intended-use": { label: "Intended use", everyday: "Everyday use", advanced: "Advanced use" },
    portability: { label: "Portability", everyday: "Portable design", advanced: "Advanced bottle" },
    "hydrogen-water": { label: "Hydrogen water", everyday: "Included", advanced: "Included" },
    inhalation: { label: "Inhalation", everyday: "Not included", advanced: "Included" },
    mineralisation: { label: "Mineralisation", everyday: "Not included", advanced: "Included" },
  },
};

const ru: UiCopy = {
  ...en,
  languageHeading: "Выберите язык",
  languagesAria: "Языки",
  back: "Назад",
  guidedConversation: "Персональная консультация о продуктах",
  specialistsHeading: "Познакомьтесь с AI-специалистами",
  specialistsSupport: "Выберите специалиста для разговора.",
  specialistsAria: "AI-специалисты",
  visualPreview: "Предпросмотр",
  visualPreviewUnavailable: (name) => `Видеопревью ${name === "Daniel" ? "Дэниела" : "Эмили"} недоступно`,
  guideRole: { daniel: "Технологический специалист", emily: "Специалист по здоровому образу жизни" },
  guideDisplayName: { daniel: "Дэниел", emily: "Эмили" },
  guideDescription: {
    daniel: "Объясняет технологии, инженерные решения, материалы и технические особенности продуктов.",
    emily: "Рассказывает о повседневном использовании, гидратации и месте продуктов в привычном образе жизни.",
  },
  speakWith: (name) => `Поговорить с ${name === "Daniel" ? "Дэниелом" : "Эмили"}`,
  conversationWith: (name) => `Разговор с ${name === "Daniel" ? "Дэниелом" : "Эмили"}`,
  conversationAria: "Разговор",
  askQuestion: (name) => `Задайте вопрос ${name === "Daniel" ? "Дэниелу" : "Эмили"}`,
  whatToUnderstand: "Что вас интересует?",
  welcomeSupport: (name) => `Задайте вопрос ${name === "Daniel" ? "Дэниелу" : "Эмили"} или выберите одну из тем ниже.`,
  youAsked: "Ваш вопрос",
  preparingResponse: "Подготовка ответа",
  quickTopics: "Быстрые вопросы",
  chooseStartingPoint: "Выберите вопрос",
  topics: {
    daniel: {
      "hydrogen-water-overview": { title: "Водородная технология", description: "Как работает технология насыщения воды водородом.", question: "Как работает водородная вода?" },
      "product-comparison": { title: "Сравнение моделей", description: "Основные различия между доступными моделями.", question: "Сравни доступные продукты" },
      "product-guidance": { title: "Какую модель выбрать", description: "Сравните варианты и их особенности.", question: "Какой продукт мне подойдёт?" },
      "hydrogen-inhalation": { title: "Водородная ингаляция", description: "Как работает функция ингаляции.", question: "Расскажи о водородной ингаляции" },
    },
    emily: {
      "hydrogen-water-overview": { title: "Водородная технология", description: "Как работает технология насыщения воды водородом.", question: "Как работает водородная вода?" },
      "product-comparison": { title: "Сравнение моделей", description: "Основные различия между доступными моделями.", question: "Сравни доступные продукты" },
      "product-guidance": { title: "Какую модель выбрать", description: "Сравните варианты и их особенности.", question: "Какой продукт мне подойдёт?" },
      "hydrogen-inhalation": { title: "Водородная ингаляция", description: "Как работает функция ингаляции.", question: "Расскажи о водородной ингаляции" },
    },
  },
  exploreProducts: "Посмотреть модели",
  viewProduct: (name) => `Открыть ${name}`,
  sending: "Отправка",
  send: "Отправить",
  endSession: "Завершить разговор",
  stillExploring: "Продолжаете знакомство?",
  restartCountdown: (seconds) => `Сеанс перезапустится через ${seconds} сек.`,
  continueSession: "Продолжить сеанс",
  visualUnavailable: "Видеосеанс недоступен.",
  voiceRemainsAvailable: "Голосовой разговор остаётся доступным.",
  voiceOnlyMode: "Голосовой режим",
  visualPreparing: "Подготавливаем видеосвязь.",
  visualReady: "Задайте вопрос, когда будете готовы.",
  visualListening: (name) => `${name === "Daniel" ? "Дэниел" : "Эмили"} вас слушает.`,
  visualThinking: "Обдумываем ваш вопрос.",
  visualSpeaking: (name) => `${name === "Daniel" ? "Дэниел" : "Эмили"} отвечает.`,
  reconnect: "Подключить снова",
  talkTo: (name) => `Поговорить с ${name === "Daniel" ? "Дэниелом" : "Эмили"}`,
  tapAndAsk: "Задайте вопрос голосом.",
  talk: "Говорить",
  stop: "Остановить",
  ready: "Готов к разговору",
  readyFor: (name) => name === "Daniel" ? "Готов к разговору" : "Готова к разговору",
  voiceReadyFor: (name) => name === "Daniel" ? "Готов" : "Готова",
  listening: "Слушаю…",
  thinking: "Готовлю ответ…",
  speaking: "Отвечает…",
  speakingFor: (name) => `${name === "Daniel" ? "Дэниел" : "Эмили"} отвечает…`,
  gettingReady: (name) => `${name === "Daniel" ? "Дэниел" : "Эмили"} готовится…`,
  wordsAppear: "Ваши слова появятся здесь.",
  preparingAnswer: () => "Готовлю ответ…",
  answeringNow: (name) => `${name === "Daniel" ? "Дэниел" : "Эмили"} отвечает…`,
  voiceGettingReady: "Голос подготавливается.",
  talkHint: "Задайте вопрос, когда будете готовы.",
  stopListeningAria: (name) => `Остановить запись и отправить вопрос ${name === "Daniel" ? "Дэниелу" : "Эмили"}`,
  interruptAria: (name) => `Прервать ${name === "Daniel" ? "Дэниела" : "Эмили"} и задать вопрос`,
  speakAria: (name) => `Говорить с ${name === "Daniel" ? "Дэниелом" : "Эмили"}`,
  playResponse: "Воспроизвести ответ",
  recognitionUnavailable: "Голосовой ввод недоступен в этом браузере. Вопрос можно напечатать.",
  synthesisUnavailable: "Озвучивание здесь недоступно. Ответ останется на экране.",
  activationFailed: "Можно также задать вопрос текстом.",
  escapeHint: "Можно также задать вопрос текстом.",
  microphoneDenied: "Доступ к микрофону не предоставлен. Вопрос можно напечатать.",
  recognitionTimeout: "Я не услышал вопрос. Нажмите «Говорить» и попробуйте ещё раз.",
  recognitionFailed: "Не удалось разобрать вопрос. Попробуйте ещё раз или напечатайте его.",
  productExplorer: "Каталог продуктов",
  productExplorerSupport: "Познакомьтесь с доступными продуктами и их основными возможностями.",
  viewProductLabel: "Открыть продукт",
  compareProducts: "Сравнить продукты",
  backToConversation: "Вернуться к разговору",
  keyFeatures: "Основные функции",
  useCases: "Варианты использования",
  compare: "Сравнить",
  askGuide: "Спросить специалиста",
  compareBottles: "Сравнение бутылок",
  comparisonSupport: "Простое сравнение указанных возможностей.",
  feature: "Функция",
  askComparison: "Спросить об этом сравнении",
  backToProducts: "Вернуться к продуктам",
  thankYou: "Спасибо за визит.",
  startAgain: "Начать заново",
  returnToConversation: "Вернуться к разговору",
  productOverview: {
    everyday: "Компактная бутылка для повседневного использования и портативной генерации водородной воды.",
    advanced: "Усовершенствованная водородная бутылка с генерацией водородной воды и дополнительными возможностями.",
  },
  productFeatures: {
    everyday: ["Компактная бутылка для повседневного использования", "Генерация водородной воды", "Портативная конструкция"],
    advanced: ["Усовершенствованная водородная бутылка", "Генерация водородной воды", "Возможность ингаляции", "Поддержка минерализации"],
  },
  productUseCases: { everyday: ["Повседневное использование", "Портативное использование"], advanced: ["Расширенное использование", "Водородная ингаляция"] },
  comparisonRows: {
    "intended-use": { label: "Назначение", everyday: "Повседневное использование", advanced: "Расширенное использование" },
    portability: { label: "Портативность", everyday: "Портативная конструкция", advanced: "Усовершенствованная бутылка" },
    "hydrogen-water": { label: "Водородная вода", everyday: "Предусмотрено", advanced: "Предусмотрено" },
    inhalation: { label: "Ингаляция", everyday: "Не предусмотрено", advanced: "Предусмотрено" },
    mineralisation: { label: "Минерализация", everyday: "Не предусмотрено", advanced: "Предусмотрено" },
  },
};

const zh: UiCopy = {
  ...en,
  languageHeading: "请选择语言",
  languagesAria: "语言",
  back: "返回",
  guidedConversation: "产品智能讲解",
  specialistsHeading: "认识您的 AI 专家",
  specialistsSupport: "请选择您想交流的专家。",
  specialistsAria: "AI 专家",
  visualPreview: "形象预览",
  visualPreviewUnavailable: (name) => `${name} 的形象预览暂时不可用`,
  guideRole: { daniel: "技术专家", emily: "健康生活专家" },
  guideDisplayName: { daniel: "Daniel", emily: "Emily" },
  guideDescription: {
    daniel: "讲解产品技术、工程设计、材料和技术特点。",
    emily: "介绍日常使用、补水习惯、健康生活方式以及产品如何融入日常生活。",
  },
  speakWith: (name) => `与 ${name} 交流`,
  conversationWith: (name) => `与 ${name} 对话`,
  conversationAria: "对话",
  askQuestion: (name) => `向 ${name} 提问`,
  whatToUnderstand: "您想了解什么？",
  welcomeSupport: (name) => `向 ${name} 提问，或从下方选择一个问题。`,
  youAsked: "您的问题",
  preparingResponse: "正在准备回答",
  quickTopics: "快捷问题",
  chooseStartingPoint: "请选择一个问题",
  topics: {
    daniel: {
      "hydrogen-water-overview": { title: "氢水技术", description: "了解水中溶解氢气的基本原理。", question: "氢水是如何工作的？" },
      "product-comparison": { title: "产品对比", description: "了解现有产品的主要区别。", question: "请比较现有产品" },
      "product-guidance": { title: "如何选择产品", description: "了解不同产品的特点。", question: "哪款产品更适合我？" },
      "hydrogen-inhalation": { title: "氢气吸入", description: "了解氢气吸入功能的工作方式。", question: "请介绍氢气吸入功能" },
    },
    emily: {
      "hydrogen-water-overview": { title: "氢水", description: "从简单清晰的介绍开始了解。", question: "氢水是如何工作的？" },
      "product-comparison": { title: "产品区别", description: "轻松了解不同选择。", question: "请比较现有产品" },
      "product-guidance": { title: "如何选择产品", description: "结合日常习惯了解不同选择。", question: "哪款产品更适合我的日常使用？" },
      "hydrogen-inhalation": { title: "氢气吸入", description: "了解现有资料中的相关信息。", question: "请介绍氢气吸入功能" },
    },
  },
  exploreProducts: "查看产品",
  viewProduct: (name) => `查看 ${name}`,
  sending: "正在发送",
  send: "发送",
  endSession: "结束对话",
  stillExploring: "还在了解吗？",
  restartCountdown: (seconds) => `本次对话将在 ${seconds} 秒后重置。`,
  continueSession: "继续对话",
  visualUnavailable: "视频形象暂时不可用。",
  voiceRemainsAvailable: "仍可继续语音对话。",
  voiceOnlyMode: "纯语音模式",
  visualPreparing: "正在准备视频连接。",
  visualReady: "准备好后，请提出您的问题。",
  visualListening: (name) => `${name} 正在聆听。`,
  visualThinking: "正在思考您的问题。",
  visualSpeaking: (name) => `${name} 正在回答。`,
  reconnect: "重新连接",
  talkTo: (name) => `与 ${name} 交流`,
  tapAndAsk: "点击后说出您的问题。",
  talk: "开始说话",
  stop: "停止",
  ready: "已准备好",
  readyFor: () => "已准备好交流",
  voiceReadyFor: () => "已准备好",
  listening: "正在聆听…",
  thinking: "正在准备回答…",
  speaking: "正在回答…",
  speakingFor: (name) => `${name} 正在回答…`,
  gettingReady: (name) => `${name} 正在准备…`,
  wordsAppear: "您说的话会显示在这里。",
  preparingAnswer: (name) => `${name} 正在准备回答。`,
  answeringNow: (name) => `${name} 正在回答。`,
  voiceGettingReady: "语音正在准备中。",
  talkHint: "点击“开始说话”，然后提出您的问题。",
  stopListeningAria: (name) => `停止聆听并将问题发送给 ${name}`,
  interruptAria: (name) => `打断 ${name} 并开始说话`,
  speakAria: (name) => `与 ${name} 交流`,
  playResponse: "播放回答",
  recognitionUnavailable: "此浏览器暂不支持语音输入，您仍可输入问题。",
  synthesisUnavailable: "此处暂不支持语音回答，回答会继续显示在屏幕上。",
  activationFailed: "语音可通过“开始说话”使用，您也可以输入问题。",
  escapeHint: "随时按 Esc 键即可停止语音。",
  microphoneDenied: "未获得麦克风权限，您仍可输入问题。",
  recognitionTimeout: "没有听到您的问题，请点击“开始说话”后再试一次。",
  recognitionFailed: "没有听清您的问题，请再试一次或直接输入问题。",
  productExplorer: "产品一览",
  productExplorerSupport: "了解现有产品及其主要功能。",
  viewProductLabel: "查看产品",
  compareProducts: "比较产品",
  backToConversation: "返回对话",
  keyFeatures: "主要功能",
  useCases: "使用场景",
  compare: "比较",
  askGuide: "询问专家",
  compareBottles: "比较两款水瓶",
  comparisonSupport: "清晰查看已列出的功能。",
  feature: "功能",
  askComparison: "询问此次比较",
  backToProducts: "返回产品列表",
  thankYou: "感谢您的体验。",
  startAgain: "重新开始",
  returnToConversation: "返回对话",
  productOverview: {
    everyday: "一款适合日常携带、可生成氢水的便携水瓶。",
    advanced: "一款可生成氢水并提供更多功能的进阶氢水瓶。",
  },
  productFeatures: {
    everyday: ["日常便携水瓶", "生成氢水", "便携设计"],
    advanced: ["进阶氢水瓶", "生成氢水", "氢气吸入功能", "支持矿化"],
  },
  productUseCases: { everyday: ["日常使用", "便携使用"], advanced: ["进阶使用", "氢气吸入"] },
  comparisonRows: {
    "intended-use": { label: "适用场景", everyday: "日常使用", advanced: "进阶使用" },
    portability: { label: "便携性", everyday: "便携设计", advanced: "进阶水瓶" },
    "hydrogen-water": { label: "氢水", everyday: "支持", advanced: "支持" },
    inhalation: { label: "氢气吸入", everyday: "不支持", advanced: "支持" },
    mineralisation: { label: "矿化", everyday: "不支持", advanced: "支持" },
  },
};

export const UI_COPY: Record<SupportedLanguage, UiCopy> = { en, ru, zh };

export function getUiCopy(language: SupportedLanguage) {
  return UI_COPY[language];
}
