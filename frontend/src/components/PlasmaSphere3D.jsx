// PlasmaSphere3D.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";

const PlasmaSphere = () => {
  return (
    <Canvas style={{ height: "100vh", background: "black" }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={2} />
      <Sparkles count={50} scale={5} size={3} speed={0.4} color="#00f0ff" />
      <Sphere args={[1, 64, 64]} scale={1.5}>
        <MeshDistortMaterial
          color="#00f0ff"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0}
          metalness={1}
        />
      </Sphere>
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
    </Canvas>
  );
};

export default PlasmaSphere;
