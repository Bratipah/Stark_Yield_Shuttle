"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { Mesh } from "three"
import { OrbitControls, Sphere } from "@react-three/drei"

function BitcoinSphere() {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3
    }
  })

  return (
    <group>
      <Sphere ref={meshRef} args={[1.5, 64, 64]}>
        <meshStandardMaterial
          color="#ff8c42"
          metalness={0.8}
          roughness={0.2}
          emissive="#ff8c42"
          emissiveIntensity={0.2}
        />
      </Sphere>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#4fd1c5" />
    </group>
  )
}

export function Bitcoin3D() {
  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/80 to-blue-900/60 backdrop-blur-sm border border-blue-500/20 shadow-2xl shadow-blue-500/20">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <BitcoinSphere />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  )
}
