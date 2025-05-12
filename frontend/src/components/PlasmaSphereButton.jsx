// PlasmaSphereButton.jsx
// PlasmaSphereButton.jsx
import React from "react";

import { Canvas } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import "../styles/PlasmaSphereButton.css";

const PlasmaSphereButton = ({ isActive, onClick }) => {
  return (
    <div className="plasma-agent-button" onClick={onClick}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={2} />
        <Sparkles
          count={30}
          scale={2}
          size={2}
          speed={0.5}
          color={isActive ? "#00ff99" : "#00f0ff"}
        />
        <Sphere args={[1, 64, 64]} scale={1.2}>
          <MeshDistortMaterial
            color={isActive ? "#00ff99" : "#00f0ff"}
            distort={isActive ? 0.7 : 0.3}
            speed={isActive ? 4 : 1.5}
            metalness={1}
            roughness={0}
          />
        </Sphere>
      </Canvas>
    </div>
  );
};

export default PlasmaSphereButton;
