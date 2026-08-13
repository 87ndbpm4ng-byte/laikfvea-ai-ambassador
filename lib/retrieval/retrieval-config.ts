export const RETRIEVAL_CONFIG = {
  maxChunks: 4,
  maxTotalCharacters: 4_800,
  maxRecentContextCharacters: 800,
  maxRecentMessages: 4,
  minimumChunkCharacters: 20,
  maximumChunkCharacters: 1_800,
  thresholds: {
    high: 13,
    medium: 7,
    low: 3,
  },
  weights: {
    exactPhrase: 8,
    headingTerm: 3,
    bodyTerm: 1,
    productMatch: 6,
    productMismatch: -20,
    intentMatch: 3,
    sectionTypeMatch: 4,
    recentContextTerm: 1,
    safetyMatch: 5,
  },
} as const;

export const RETRIEVAL_TOPIC_GROUPS = {
  product: {
    rules: [
      { pattern: /\b(?:bottle|product|model|generator)\b/i, terms: ["bottle", "generator"] },
      { pattern: /\bwater ionizer\b/i, terms: ["water ionizer", "electrolysis"] },
      {
        pattern: /\b(?:hydrogen water generator for face (?:&|and) body|portable hydrogen skin (?:humidifier|sprayer))\b/i,
        terms: ["portable hydrogen skin sprayer", "fine mist"],
      },
      {
        pattern: /\b(?:air purifier|capsula m size)\b/i,
        terms: ["air purifier", "capsula m size", "pre-filter", "glass-filter"],
      },
      {
        pattern: /\b(?:water mineralizer|severyanka mineral additive)\b/i,
        terms: ["water mineralizer", "severyanka", "mineral additive"],
      },
      {
        pattern: /\b(?:what(?:'s| is) in the box|what comes (?:in|with)|package contents|supplied with|does it include|accessories)\b/i,
        terms: ["package", "contents"],
      },
    ],
  },
  charging: {
    rules: [
      { pattern: /\bcharg(?:e|er|ing)\b/i, terms: ["charging"] },
      { pattern: /\b(?:usb(?:-c)?|type-c)\b/i, terms: ["charging port", "usb type-c"] },
      { pattern: /\bwireless(?: charging)?\b/i, terms: ["wireless charging"] },
      { pattern: /\b(?:power|cable|adapter)\b/i, terms: [] },
      { pattern: /\bbattery\b/i, terms: [] },
      { pattern: /\b(?:battery is low|low battery)\b/i, terms: ["below 10%", "low battery"] },
      { pattern: /\bbattery capacity\b/i, terms: ["main unit battery", "lid battery"] },
    ],
  },
  materials: {
    rules: [
      { pattern: /\b(?:made (?:from|of)|material|body|glass)\b/i, terms: ["body material"] },
      { pattern: /\belectrodes?\b/i, terms: ["electrode material"] },
      { pattern: /\bmembrane\b/i, terms: ["membrane type"] },
      { pattern: /\b(?:coating|titanium|platinum)\b/i, terms: [] },
    ],
  },
  specifications: {
    rules: [
      { pattern: /\b(?:capacity|volume|how much water)\b/i, terms: ["water capacity"] },
      { pattern: /\b(?:size|dimensions?)\b/i, terms: ["dimensions"] },
      { pattern: /\bweight\b/i, terms: ["net weight", "gross weight"] },
      { pattern: /\b(?:concentration|ppm|ppb|orp|how strong)\b/i, terms: ["hydrogen concentration"] },
      { pattern: /\b(?:cycle|mode)\b/i, terms: ["cycle", "duration"] },
      { pattern: /\b(?:specifications?|specs)\b/i, terms: ["technical specifications"] },
      { pattern: /\bhow long\b/i, terms: [] },
    ],
  },
  waterUse: {
    rules: [
      { pattern: /\b(?:(?:hot|cold) water|temperature)\b/i, terms: ["above 113"] },
      { pattern: /\b(?:sparkling|carbonated)(?: water| drinks?)?\b/i, terms: ["carbonated drinks"] },
      { pattern: /\b(?:tap|filtered|bottled|mineral) water\b/i, terms: ["drinking water"] },
      { pattern: /\bdrink (?:it )?immediately\b/i, terms: ["drink hydrogen water immediately"] },
      { pattern: /\b(?:store|save) (?:it|the water)|hydrogen last\b/i, terms: ["more than 4 hours"] },
      { pattern: /\b(?:run (?:it )?again|another cycle|second cycle|repeated cycle)\b/i, terms: ["electrolysis consecutively"] },
      { pattern: /\b(?:lemon|supplements?|coffee|tea)\b/i, terms: ["other liquids"] },
    ],
  },
  maintenance: {
    rules: [
      { pattern: /\b(?:first use|before (?:i|first) use|new bottle)\b/i, terms: ["initial setup", "self-cleaning"] },
      { pattern: /\b(?:running water|rinse it|rinse under)\b/i, terms: ["under running water"] },
      { pattern: /\b(?:haven't used|months|long-term storage|store it)\b/i, terms: ["not used for a long time"] },
      { pattern: /\b(?:clean|wash|dishwasher|maintenance|self-cleaning)\b/i, terms: [] },
    ],
  },
  inhalation: {
    rules: [
      { pattern: /\b(?:inhalation|inhale|inhaling|breathe hydrogen|breathing|nasal tube|inhaler|gas output|hydrogen tube)\b/i, terms: ["inhalation"] },
    ],
  },
  comparison: {
    rules: [{ pattern: /\b(?:compare|comparison|difference|better|which model|which one)\b/i, terms: ["comparison"] }],
  },
  safety: {
    rules: [
      { pattern: /\b(?:safe|safety|warning|children|child|pregnan|medical condition|medication|contraindication|cure|treat|inflammation|healthier|explode|chlorine|ozone)\b/i, terms: [] },
    ],
  },
  operation: {
    rules: [
      { pattern: /\b(?:operate|operation|setup|turn on|won't turn on|display|light|leak|bubbles?|hydrogen generation|electrolysis)\b/i, terms: [] },
      { pattern: /\b(?:mineralisation|mineralization|filter|cartridge)\b/i, terms: ["mineral cartridge"] },
    ],
  },
  science: {
    rules: [
      { pattern: /\b(?:hydrogen water|molecular hydrogen|pem|spe|electrolysis|oxidative stress|health benefit|wellness benefit|research)\b/i, terms: [] },
    ],
  },
} as const;

export type RetrievalTopicGroup = keyof typeof RETRIEVAL_TOPIC_GROUPS;

export const GREETING_TERMS = new Set([
  "hello",
  "hi",
  "hey",
  "thanks",
  "thank",
  "goodbye",
  "bye",
]);
