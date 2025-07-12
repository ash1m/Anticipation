"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group, Mesh } from "three"
import { Line } from "@react-three/drei"

interface SpiralProps {
  radius?: number
  turns?: number
  height?: number
  frequency?: number
  amplitude?: number
  speed?: number
  color?: string
  lineWidth?: number
  ballSpeed?: number // This will now be derived from loopTime
  enableBallEasing?: boolean
  loopTime?: number // New prop: time in seconds for one loop
}

// Easing function: EaseInOutQuad
// t: current time, b: beginning value, c: change in value, d: duration
// For normalized time (0 to 1), this simplifies to:
const easeInOutQuad = (t: number) => {
  t *= 2
  if (t < 1) return 0.5 * t * t
  return -0.5 * (--t * (t - 2) - 1)
}

export function Spiral({
  radius = 1.5,
  turns = 1,
  height = 1.0,
  frequency = 0.5,
  amplitude = 0.0,
  speed = 0.0, // Rotation Speed
  color = "#8884d8",
  lineWidth = 3,
  // ballSpeed = 0.2, // No longer directly used as a prop
  enableBallEasing = true, // Default to true
  loopTime = 5, // Default loop time in seconds
}: SpiralProps) {
  const groupRef = useRef<Group>(null)
  const ballRef = useRef<Mesh>(null)

  const { spiralPoints, totalT } = useMemo(() => {
    const points: number[] = []
    const numPoints = 500
    const totalT = Math.PI * 2 * turns

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * totalT
      // Adjust z to pivot around the center of the spiral's height
      const z = (t / totalT) * height - height / 2 + amplitude * Math.sin(t * frequency)
      const x = radius * Math.cos(t)
      // Negate y to make the spiral travel clockwise
      const y = -radius * Math.sin(t)
      points.push(x, y, z)
    }
    return { spiralPoints: points, totalT }
  }, [radius, turns, height, frequency, amplitude])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed
    }

    if (ballRef.current) {
      // Calculate normalized time (0 to 1) for the ball's loop
      // Use loopTime to determine the speed: 1 loop per 'loopTime' seconds
      const loopSpeed = 1 / loopTime
      let normalizedTime = (state.clock.elapsedTime * loopSpeed) % 1

      // Apply easing if enabled
      if (enableBallEasing) {
        normalizedTime = easeInOutQuad(normalizedTime)
      }

      // Calculate the current 't' value along the spiral based on eased progress
      const currentT = normalizedTime * totalT

      // Calculate ball's position using the same spiral equations
      const x = radius * Math.cos(currentT)
      // To make the ball travel clockwise, negate the y-coordinate
      const y = -radius * Math.sin(currentT)
      // Adjust z to pivot around the center of the spiral's height
      const z = (currentT / totalT) * height - height / 2 + amplitude * Math.sin(currentT * frequency)

      ballRef.current.position.set(x, y, z)
    }
  })

  return (
    <group ref={groupRef} rotation-y={Math.PI / 2}>
      {" "}
      {/* Added initial 90-degree counter-clockwise rotation */}
      <Line points={spiralPoints} color={color} lineWidth={lineWidth} />
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </group>
  )
}
