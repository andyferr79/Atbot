import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

// ✅ Inizializzazione i18n
i18n
  .use(HttpApi) // 🔁 Carica i file da /locales/*.json
  .use(LanguageDetector) // 🌐 Rileva la lingua del browser
  .use(initReactI18next)
  .init({
    fallbackLng: "en", // 🔁 Lingua di default
    supportedLngs: [
      "en",
      "it",
      "fr",
      "es",
      "de",
      "pt",
      "ar",
      "th",
      "ja",
      "ko",
      "tl",
      "en-AU",
      "el",
      "nl",
      "pl",
      "sv",
    ],
    debug: false,
    interpolation: {
      escapeValue: false, // ⚠️ React già gestisce escaping
    },
    backend: {
      loadPath: "/locales/{{lng}}.json", // 🔁 Percorso dei file traduzione
    },
    detection: {
      order: [
        "localStorage",
        "navigator",
        "htmlTag",
        "cookie",
        "path",
        "subdomain",
      ],
      caches: ["localStorage"], // ✅ Salva lingua scelta
    },
  });

export default i18n;
