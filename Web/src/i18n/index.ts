import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import am from "./locales/am.json";

const savedLang = localStorage.getItem("erp_language") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    am: { translation: am },
  },
  lng: savedLang,
  fallbackLng: "en",
  showSupportNotice: false,
  interpolation: { escapeValue: false },
});

// Apply RTL direction when language changes
i18n.on("languageChanged", (lng) => {
  document.documentElement.dir = "ltr";
  document.documentElement.lang = lng;
  localStorage.setItem("erp_language", lng);
});

// Set initial direction
document.documentElement.dir = "ltr";
document.documentElement.lang = savedLang;

export default i18n;
