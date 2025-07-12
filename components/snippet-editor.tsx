"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { GripVerticalIcon, Trash2Icon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface SnippetEditorProps {
  id: string
  content: string
  onContentChange: (id: string, newContent: string) => void
  onDelete: (id: string) => void
  x: number // New prop for x position
  y: number // New prop for y position
  isVisible: boolean // New prop for visibility
}

export function SnippetEditor({ id, content, onContentChange, onDelete, x, y, isVisible }: SnippetEditorProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-1 p-2 bg-gray-700 rounded-md shadow-sm mb-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" {...listeners} {...attributes} className="cursor-grab">
          <GripVerticalIcon className="h-4 w-4 text-gray-400" />
          <span className="sr-only">Drag to reorder</span>
        </Button>
        <Textarea
          value={content}
          onChange={(e) => onContentChange(id, e.target.value)}
          className="flex-1 bg-gray-600 border-none text-sm resize-none h-auto min-h-[40px]"
          rows={1}
          aria-label={`Edit snippet ${id}`}
        />
        <Button variant="ghost" size="icon" onClick={() => onDelete(id)} className="text-red-400 hover:text-red-500">
          <Trash2Icon className="h-4 w-4" />
          <span className="sr-only">Delete snippet</span>
        </Button>
      </div>
      {/* Debugging display for X and Y positions */}
      <div className="text-xs text-gray-400 font-mono pl-8">
        {isVisible ? (
          <>
            X: {x.toFixed(0)} Y: {y.toFixed(0)}
          </>
        ) : (
          "Out of Viewport (X: 0 Y: 0)"
        )}
      </div>
    </div>
  )
}
