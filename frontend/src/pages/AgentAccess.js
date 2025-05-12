import React, { useState } from "react";
import PlasmaSphereButton from "../components/PlasmaSphereButton";
import AgentChatbox from "./AgentChatbox"; // stai già usando questa versione aggiornata

const AgentAccess = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [agentWorking, setAgentWorking] = useState(false); // stato IA attiva

  return (
    <>
      <PlasmaSphereButton
        isActive={agentWorking}
        onClick={() => setChatOpen((prev) => !prev)}
      />

      {chatOpen && (
        <AgentChatbox
          onStartThinking={() => setAgentWorking(true)}
          onStopThinking={() => setAgentWorking(false)}
        />
      )}
    </>
  );
};

export default AgentAccess;
