"use client"

import { useState, useCallback, useEffect } from "react"
import { SpiralCanvas } from "@/components/spiral-canvas"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TextScroller } from "@/components/text-scroller"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { SortableSnippetList } from "@/components/sortable-snippet-list"
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

// Define type for a snippet with a unique ID
interface Snippet {
  id: string
  content: string
}

// Default properties for a single spiral, increased by 200% (doubled) from previous values
const DEFAULT_SPIRAL_PROPS: SpiralProps = {
  radius: 1.5 * 0.25 * 2,
  turns: 1,
  height: 1.0 * 0.25 * 2,
  frequency: 0.5,
  amplitude: 0.0,
  speed: 0.0,
  color: "#8884d8",
  lineWidth: 3,
  ballSpeed: 0.2,
  enableBallEasing: true,
  loopTime: 5,
}

const NUM_SPIRALS = 1

// New default camera position
const DEFAULT_CAMERA_POSITION: Vector3Tuple = [-2.91, 0.08, -0.73]

export default function Home() {
  // State for all spirals' configurations
  const [spiralsConfig, setSpiralsConfig] = useState<SpiralProps[]>(
    Array.from({ length: NUM_SPIRALS }, () => ({ ...DEFAULT_SPIRAL_PROPS })),
  )
  // State for the currently selected spiral to control
  const [selectedSpiralIndex, setSelectedSpiralIndex] = useState(0)

  const [cameraPositions, setCameraPositions] = useState<Vector3Tuple[]>(
    Array.from({ length: NUM_SPIRALS }, () => [...DEFAULT_CAMERA_POSITION]),
  )
  const [isOrthographic, setIsOrthographic] = useState(true)

  // State for table data, initialized from localStorage or defaults
  const [tableData, setTableData] = useState<string[][]>(() => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("spiralTableData")
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          if (
            Array.isArray(parsedData) &&
            parsedData.length === NUM_SPIRALS &&
            parsedData.every((arr) => Array.isArray(arr) && arr.length === 5)
          ) {
            return parsedData
          }
        } catch (e) {
          console.error("Failed to parse table data from localStorage", e)
        }
      }
    }
    return Array.from({ length: NUM_SPIRALS }, () => Array.from({ length: 5 }, (_, i) => `Spiral Data Row ${i + 1}`))
  })

  // State for text snippets, initialized from localStorage or defaults
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    if (typeof window !== "undefined") {
      const savedSnippets = localStorage.getItem("textSnippets")
      if (savedSnippets) {
        try {
          return JSON.parse(savedSnippets) as Snippet[]
        } catch (e) {
          console.error("Failed to parse text snippets from localStorage", e)
        }
      }
    }
    // Default snippets if nothing is saved or parsing fails
    return [
      { id: "1", content: "Welcome to the interactive spiral animation!" },
      { id: "2", content: "Scroll down to discover more features." },
      { id: "3", content: "Each snippet will pause for a moment." },
      { id: "4", content: "You can scroll faster to speed up transitions." },
      { id: "5", content: "Scrolling up will bring back previous snippets." },
      { id: "6", content: "Enjoy exploring the possibilities!" },
    ]
  })

  // Effect to save table data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("spiralTableData", JSON.stringify(tableData))
    }
  }, [tableData])

  // Effect to save snippets to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("textSnippets", JSON.stringify(snippets))
    }
  }, [snippets])

  // Helper function to handle slider changes for the selected spiral
  const handleSliderChange = useCallback(
    (propName: keyof SpiralProps, value: number[]) => {
      setSpiralsConfig((prevConfigs) => {
        const newConfigs = [...prevConfigs]
        newConfigs[selectedSpiralIndex] = {
          ...newConfigs[selectedSpiralIndex],
          [propName]: value[0],
        }
        return newConfigs
      })
    },
    [selectedSpiralIndex],
  )

  const handleCameraUpdate = useCallback((spiralIndex: number, position: Vector3Tuple) => {
    setCameraPositions((prevPositions) => {
      const newPositions = [...prevPositions]
      newPositions[spiralIndex] = position
      return newPositions
    })
  }, [])

  const handleTableDataChange = useCallback((spiralIndex: number, rowIndex: number, newValue: string) => {
    setTableData((prevData) => {
      const newTableData = [...prevData]
      const newSpiralRows = [...newTableData[spiralIndex]]
      newSpiralRows[rowIndex] = newValue
      newTableData[spiralIndex] = newSpiralRows
      return newTableData
    })
  }, [])

  // Snippet management functions
  const handleAddSnippet = useCallback(() => {
    setSnippets((prevSnippets) => [
      ...prevSnippets,
      { id: String(Date.now()), content: `New Snippet ${prevSnippets.length + 1}` },
    ])
  }, [])

  const handleUpdateSnippet = useCallback((id: string, newContent: string) => {
    setSnippets((prevSnippets) =>
      prevSnippets.map((snippet) => (snippet.id === id ? { ...snippet, content: newContent } : snippet)),
    )
  }, [])

  const handleDeleteSnippet = useCallback((id: string) => {
    setSnippets((prevSnippets) => prevSnippets.filter((snippet) => snippet.id !== id))
  }, [])

  const handleReorderSnippets = useCallback((newOrder: Snippet[]) => {
    setSnippets(newOrder)
  }, [])

  // Helper function to render a slider control
  const renderSlider = useCallback(
    (label: string, propName: keyof SpiralProps, min: number, max: number, step: number) => {
      const currentValue = spiralsConfig[selectedSpiralIndex][propName] as number
      return (
        <div className="grid gap-2">
          <Label
            className="text-xs font-extralight text-center"
            htmlFor={label.toLowerCase().replace(/\s/g, "-")}
          >{`${label}: ${currentValue.toFixed(step < 1 ? 2 : 0)}`}</Label>
          <Slider
            id={label.toLowerCase().replace(/\s/g, "-")}
            min={min}
            max={max}
            step={step}
            value={[currentValue]}
            onValueChange={(val) => handleSliderChange(propName, val)}
            className="w-[200px]"
          />
        </div>
      )
    },
    [spiralsConfig, selectedSpiralIndex, handleSliderChange],
  )

  return (
    <div className="flex h-screen w-full bg-gray-900 text-white">
      {/* Sliders Sidebar */}
      <div className="flex w-[250px] flex-col gap-6 border-r border-gray-700 bg-gray-800 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold">Spiral Controls</h2>
        {/* Dropdown to select spiral (only one now, but kept for consistency if more are added later) */}
        {NUM_SPIRALS > 1 && (
          <div className="grid gap-2">
            <Label htmlFor="select-spiral">Select Spiral</Label>
            <Select
              value={String(selectedSpiralIndex)}
              onValueChange={(value) => setSelectedSpiralIndex(Number(value))}
            >
              <SelectTrigger id="select-spiral" className="w-[200px]">
                <SelectValue placeholder="Select a spiral" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: NUM_SPIRALS }).map((_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    Spiral {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Real-time position display */}
        <div className="grid gap-2 p-3 bg-gray-700 rounded">
          <Label className="font-extralight text-xs">Camera Position </Label>
          <div className="text-xs font-mono text-green-400">
            X: {cameraPositions[selectedSpiralIndex][0].toFixed(2)}
          </div>
          <div className="text-xs font-mono text-green-400">
            Y: {cameraPositions[selectedSpiralIndex][1].toFixed(2)}
          </div>
          <div className="text-xs font-mono text-green-400">
            Z: {cameraPositions[selectedSpiralIndex][2].toFixed(2)}
          </div>
        </div>
        {/* Sliders for the selected spiral */}
        {renderSlider("Radius", "radius", 0.1, 5, 0.01)}
        {renderSlider("Turns", "turns", 1, 20, 1)}
        {renderSlider("Height", "height", 0.01, 10, 0.01)}
        {renderSlider("Frequency", "frequency", 0.1, 10, 0.1)}
        {renderSlider("Amplitude", "amplitude", 0, 2, 0.01)}
        {renderSlider("Rotation Speed", "speed", 0, 5, 0.1)}
        {renderSlider("Line Width", "lineWidth", 1, 10, 1)}
        {renderSlider("Loop Time (s)", "loopTime", 0.1, 20, 0.1)}
        {/* Control for ball easing */}
        <div className="flex items-center justify-between gap-2">
          <Label className="font-extralight tracking-normal text-xs" htmlFor="ball-easing">
            Enable Ball Easing
          </Label>
          <Switch
            id="ball-easing"
            checked={spiralsConfig[selectedSpiralIndex].enableBallEasing}
            onCheckedChange={(checked) => handleSliderChange("enableBallEasing", [checked ? 1 : 0])}
          />
        </div>
        {/* New switch for camera type */}
        <div className="flex items-center justify-between gap-2">
          <Label className="font-extralight tracking-normal text-xs" htmlFor="camera-type">
            Orthographic Camera
          </Label>
          <Switch id="camera-type" checked={isOrthographic} onCheckedChange={setIsOrthographic} />
        </div>
        {/* Snippet Management Section */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-bold mb-4">Text Snippets</h3>
          <Button onClick={handleAddSnippet} className="w-full mb-4">
            <PlusIcon className="mr-2 h-4 w-4" /> Add New Snippet
          </Button>
          <SortableSnippetList
            snippets={snippets}
            onUpdateSnippet={handleUpdateSnippet}
            onDeleteSnippet={handleDeleteSnippet}
            onReorderSnippets={handleReorderSnippets}
          />
        </div>
      </div>

      {/* Main content area: Two columns */}
      <div className="flex flex-1 h-full">
        {/* Left Column: Spiral Canvas and Table (50% width) */}
        <div className="w-1/2 flex flex-col items-center justify-center">
          {spiralsConfig.map((config, i) => (
            <SpiralCanvas
              key={i}
              spiralConfig={config}
              onCameraUpdate={(position) => handleCameraUpdate(i, position)}
              isOrthographic={isOrthographic}
              cameraPosition={cameraPositions[i]}
              tableRows={tableData[i]}
              onTableDataChange={(rowIndex, newValue) => handleTableDataChange(i, rowIndex, newValue)}
            />
          ))}
        </div>

        {/* Right Column: Text Scroller (50% width) */}
        <div className="w-1/2 relative h-full flex items-center justify-center bg-gray-800 border-l border-gray-700">
          {/* Pass the full snippets array directly */}
          <TextScroller snippets={snippets} pauseDurationScrollDistance={500} />
        </div>
      </div>
    </div>
  )
}
