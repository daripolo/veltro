export interface Language {
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: Language[] = [
  { name: "English", nativeName: "English", flag: "🇺🇸" },
  { name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { name: "French", nativeName: "Français", flag: "🇫🇷" },
  { name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
];
