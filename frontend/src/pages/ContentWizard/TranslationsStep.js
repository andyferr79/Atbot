import React, { useState } from "react";
import "../../styles/styles/TranslationsStep.css";

const LANGUAGES = [
  { code: "en", label: "Inglese" },
  { code: "fr", label: "Francese" },
  { code: "es", label: "Spagnolo" },
  { code: "de", label: "Tedesco" },
  { code: "pt", label: "Portoghese" },
  { code: "ar", label: "Arabo" },
  { code: "th", label: "Thailandese" },
  { code: "ja", label: "Giapponese" },
  { code: "ko", label: "Coreano" },
  { code: "tl", label: "Tagalog" },
  { code: "en-AU", label: "Inglese (Australia)" },
  { code: "el", label: "Greco" },
  { code: "nl", label: "Olandese" },
  { code: "pl", label: "Polacco" },
  { code: "sv", label: "Svedese" },
];

const TranslationsStep = ({ data = {}, onUpdate, onNext }) => {
  const [translations, setTranslations] = useState({ ...data });
  const [generating, setGenerating] = useState(false);

  const handleChange = (code, value) => {
    setTranslations((prev) => ({ ...prev, [code]: value }));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const generated = {};
      LANGUAGES.forEach((lang) => {
        generated[lang.code] = `Traduzione automatica in ${lang.label}`;
      });
      setTranslations(generated);
      setGenerating(false);
    }, 1500);
  };

  const handleNext = () => {
    onUpdate(translations);
    onNext();
  };

  return (
    <div className="translations-step">
      <h2>Traduzioni obbligatorie</h2>
      <p>Inserisci o genera automaticamente le descrizioni multilingua.</p>

      <div className="generate-translations">
        <button
          className="btn ghost"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating
            ? "Generazione in corso..."
            : "Genera traduzioni automaticamente"}
        </button>
      </div>

      <div className="translations-grid">
        {LANGUAGES.map(({ code, label }) => (
          <div key={code} className="translation-box">
            <label>{label}</label>
            <textarea
              rows={3}
              value={translations[code] || ""}
              onChange={(e) => handleChange(code, e.target.value)}
              placeholder={`Descrizione in ${label}`}
            />
          </div>
        ))}
      </div>

      <div className="structure-footer">
        <button onClick={handleNext} className="btn primary">
          Avanti
        </button>
      </div>
    </div>
  );
};

export default TranslationsStep;
