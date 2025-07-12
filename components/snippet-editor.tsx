"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { GripVerticalIcon, Trash2Icon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea" // Using Textarea for potentially longer snippets

interface SnippetEditorProps {
  id: string
  content: string
  onContentChange: (id: string, newContent: string) => void
  onDelete: (id: string) => void
}

export function SnippetEditor({ id, content, onContentChange, onDelete }: SnippetEditorProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-gray-700 rounded-md shadow-sm mb-2">
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
  )
}
