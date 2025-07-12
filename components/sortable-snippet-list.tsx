"use client"

import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { SnippetEditor } from "./snippet-editor"
import type { DragEndEvent } from "@dnd-kit/core"

interface Snippet {
  id: string
  content: string
}

interface SortableSnippetListProps {
  snippets: Snippet[]
  onUpdateSnippet: (id: string, newContent: string) => void
  onDeleteSnippet: (id: string) => void
  onReorderSnippets: (newOrder: Snippet[]) => void
}

export function SortableSnippetList({
  snippets,
  onUpdateSnippet,
  onDeleteSnippet,
  onReorderSnippets,
}: SortableSnippetListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, { currentCoordinates }) => {
        // Custom coordinate getter for keyboard sensor to allow vertical movement
        if (event.code === "ArrowUp") {
          return { x: currentCoordinates.x, y: currentCoordinates.y - 25 }
        }
        if (event.code === "ArrowDown") {
          return { x: currentCoordinates.x, y: currentCoordinates.y + 25 }
        }
        return currentCoordinates
      },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = snippets.findIndex((snippet) => snippet.id === active.id)
      const newIndex = snippets.findIndex((snippet) => snippet.id === over?.id)
      onReorderSnippets(arrayMove(snippets, oldIndex, newIndex))
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={snippets.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {snippets.map((snippet) => (
            <SnippetEditor
              key={snippet.id}
              id={snippet.id}
              content={snippet.content}
              onContentChange={onUpdateSnippet}
              onDelete={onDeleteSnippet}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
