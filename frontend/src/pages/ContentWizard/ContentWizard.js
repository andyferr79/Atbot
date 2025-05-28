import React, { useState } from "react";
import StructureInfoStep from "./StructureInfoStep";
import RoomDetailsStep from "./RoomDetailsStep";
import PhotoUploadStep from "./PhotoUploadStep";
import TranslationsStep from "./TranslationsStep";
import MappingStep from "./MappingStep";
import FinalReviewStep from "./FinalReviewStep";
import "../../styles/styles/ContentWizard.css";

const steps = [
  "Struttura",
  "Camere",
  "Foto",
  "Traduzioni",
  "Mappatura",
  "Riepilogo",
];

const ContentWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    structure: {},
    rooms: [],
    photos: { structure: [], rooms: {} },
    translations: {},
    mapping: {},
  });

  const goNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StructureInfoStep
            data={wizardData.structure}
            onUpdate={(data) =>
              setWizardData({ ...wizardData, structure: data })
            }
            onNext={goNext}
          />
        );
      case 1:
        return (
          <RoomDetailsStep
            data={wizardData.rooms}
            onUpdate={(data) => setWizardData({ ...wizardData, rooms: data })}
            onNext={goNext}
          />
        );
      case 2:
        return (
          <PhotoUploadStep
            data={wizardData.photos}
            onUpdate={(data) => setWizardData({ ...wizardData, photos: data })}
            onNext={goNext}
          />
        );
      case 3:
        return (
          <TranslationsStep
            data={wizardData.translations}
            onUpdate={(data) =>
              setWizardData({ ...wizardData, translations: data })
            }
            onNext={goNext}
          />
        );
      case 4:
        return (
          <MappingStep
            data={wizardData.mapping}
            onUpdate={(data) => setWizardData({ ...wizardData, mapping: data })}
            onNext={goNext}
          />
        );
      case 5:
        return (
          <FinalReviewStep
            data={wizardData}
            onNext={() => console.log("✅ Contenuti pronti per OTA")}
          />
        );
      default:
        return <div>Step non trovato</div>;
    }
  };

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h1>Contenuti richiesti OTA</h1>
        <p>
          Step {currentStep + 1} di {steps.length}: {steps[currentStep]}
        </p>
        <div className="wizard-stepper">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`step ${
                index === currentStep
                  ? "active"
                  : index < currentStep
                  ? "done"
                  : ""
              }`}
            >
              <span>{index + 1}</span> {step}
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-body">{renderStep()}</div>

      <div className="wizard-footer">
        {currentStep > 0 && (
          <button className="btn" onClick={goBack}>
            Indietro
          </button>
        )}
        {/* Il pulsante Avanti è integrato nei singoli step */}
      </div>
    </div>
  );
};

export default ContentWizard;
