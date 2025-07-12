"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber" // Import useThree
import { OrbitControls, Environment, OrthographicCamera } from "@react-three/drei"
import { Spiral } from "@/components/spiral"
import type { Vector3Tuple } from "@react-three/fiber"

// Define the type for spiral properties
interface SpiralProps {
  radius: number
  turns: number
  height: number
  frequency: number
  amplitude: number
  speed: number
  color: string
  lineWidth: number
  ballSpeed: number
  enableBallEasing: boolean
  loopTime: number
}

interface SpiralCanvasProps {
  spiralConfig: SpiralProps
  cameraPosition?: Vector3Tuple
  onCameraUpdate?: (position: Vector3Tuple) => void
  isOrthographic?: boolean // New prop for camera type
  tableRows: string[] // New prop for table data
  onTableDataChange: (rowIndex: number, newValue: string) => void // New prop for table data change
}

// Base pixel unit for converting 3D units to screen pixels for the HTML overlay
const BASE_PIXEL_UNIT = 100 // Adjust this value to scale the HTML square relative to the 3D scene

// Add this component inside the Canvas, after the Spiral component
function CameraTracker({ onUpdate }: { onUpdate?: (position: Vector3Tuple) => void }) {
  useFrame((state) => {
    if (onUpdate) {
      const { x, y, z } = state.camera.position
      onUpdate([x, y, z])
    }
  })
  return null
}

// New component to encapsulate the scene contents and useThree hook
function SceneContents({
  isOrthographic,
  cameraPosition,
  onCameraUpdate,
  spiralConfig,
  orthoSize,
  aspect,
}: {
  isOrthographic: boolean
  cameraPosition: Vector3Tuple
  onCameraUpdate?: (position: Vector3Tuple) => void
  spiralConfig: SpiralProps
  orthoSize: number
  aspect: number
}) {
  const { gl, camera } = useThree() // Get gl and camera from useThree

  return (
    <>
      {isOrthographic && (
        <OrthographicCamera
          makeDefault
          position={[5, 0, 0]} // Position along X-axis to view YZ plane (the circle)
          left={(-orthoSize * aspect) / 2}
          right={(orthoSize * aspect) / 2}
          top={orthoSize / 2}
          bottom={-orthoSize / 2}
          near={0.1}
          far={1000}
        />
      )}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Spiral {...spiralConfig} /> {/* Spiral is now at [0,0,0] in its own canvas */}
      <CameraTracker onUpdate={onCameraUpdate} />
      {/* Explicitly pass the camera and domElement to OrbitControls */}
      <OrbitControls enableZoom={false} enablePan={true} args={[camera, gl.domElement]} />
      <Environment preset="sunset" />
    </>
  )
}

export function SpiralCanvas({
  spiralConfig,
  cameraPosition = [0.37, 0.08, 2.98],
  onCameraUpdate,
  isOrthographic = false, // Default to perspective
  tableRows, // Destructure new prop
  onTableDataChange, // Destructure new prop
}: SpiralCanvasProps) {
  // Calculate the pixel dimensions for the individual square
  // Let's make the square frame 3 times the diameter of the spiral's base (doubled from 1.5x)
  const individualSquareSide3D = spiralConfig.radius * 2 * 3.0
  const individualSquarePx = individualSquareSide3D * BASE_PIXEL_UNIT

  const squareStyle = {
    width: `${individualSquarePx}px`,
    height: `${individualSquarePx}px`,
  }

  // Orthographic camera settings
  const orthoSize = spiralConfig.radius * 2.5 // Adjust this value to control the "zoom" in ortho view
  const aspect = individualSquarePx / individualSquarePx // Should be 1 for a square viewport

  return (
    <div className="relative flex-1 h-full flex flex-col items-center justify-center">
      {/* Middle Square Housing with Canvas */}
      <div className="relative border-2 border-gray-400 z-0" style={squareStyle}>
        <Canvas
          camera={!isOrthographic ? { position: cameraPosition, fov: 75 } : undefined} // Only set camera prop if not orthographic
          className="absolute inset-0 z-10 border-2 border-blue-500"
          gl={{ alpha: true }} // Make the canvas background transparent
        >
          {/* Render SceneContents inside Canvas */}
          <SceneContents
            isOrthographic={isOrthographic}
            cameraPosition={cameraPosition}
            onCameraUpdate={onCameraUpdate}
            spiralConfig={spiralConfig}
            orthoSize={orthoSize}
            aspect={aspect}
          />
        </Canvas>
      </div>
      {/* Table below the canvas */}
      <div className="mt-4 border border-gray-600 bg-gray-700 text-white p-2" style={{ width: squareStyle.width }}>
        {tableRows.map((rowText, rowIndex) => (
          <input
            key={rowIndex}
            type="text"
            value={rowText}
            onChange={(e) => onTableDataChange(rowIndex, e.target.value)}
            className="w-full bg-gray-600 border-none px-2 py-1 text-sm mb-1 last:mb-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={`Spiral Data Row ${rowIndex + 1}`}
            aria-label={`Spiral Data Row ${rowIndex + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
