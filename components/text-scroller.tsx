"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register ScrollTrigger plugin once
gsap.registerPlugin(ScrollTrigger)

// Define the Snippet interface here for TextScroller's internal use
interface Snippet {
  id: string
  content: string
}

interface TextScrollerProps {
  snippets: Snippet[]
  // This prop defines how much scroll distance each snippet's full transition (in and out) occupies.
  // A value of 1 means each snippet's animation spans 1 viewport height.
  // A value less than 1 (e.g., 0.75) means faster transitions, more overlap.
  // A value greater than 1 (e.g., 1.2) means slower transitions, more "pause" in between.
  snippetTransitionScrollFactor?: number
  onSnippetPositionUpdate?: (id: string, x: number, y: number, isVisible: boolean) => void // New prop
}

export function TextScroller({
  snippets,
  snippetTransitionScrollFactor = 1,
  onSnippetPositionUpdate,
}: TextScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const snippetRefs = useRef<(HTMLDivElement | null)[]>([])
  let totalScrollHeight: number // Declare the variable here

  useEffect(() => {
    if (!containerRef.current || snippets.length === 0) return

    // Clear any existing ScrollTriggers to prevent duplicates on re-renders
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())

    // Set the scroller for all ScrollTriggers created within this useEffect
    ScrollTrigger.defaults({
      scroller: containerRef.current,
    })

    const totalSnippets = snippets.length
    const viewportHeight = window.innerHeight

    // Define how much scroll distance each snippet's full cycle (enter, pause, exit) takes.
    // This is the "slot" size for each snippet on the timeline.
    const singleSnippetScrollSlot = viewportHeight * snippetTransitionScrollFactor

    // The total scroll height needed for the entire sequence.
    // Each snippet needs one 'singleSnippetScrollSlot' to complete its cycle.
    // Add an extra viewportHeight at the end to ensure the very last snippet fully exits.
    totalScrollHeight = totalSnippets * singleSnippetScrollSlot + viewportHeight

    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: `+=${totalScrollHeight}`,
        scrub: 1,
        pin: false,
        markers: false,
      },
    })

    snippets.forEach((snippet, i) => {
      const snippetEl = snippetRefs.current[i]
      if (!snippetEl) return

      // Initial state: hidden below the viewport, centered horizontally
      // Corrected: yPercent: 100 means the top of the element is at the bottom of the parent.
      // Combined with top: "50%" and yPercent: -50 for the animation, it will slide up to center.
      gsap.set(snippetEl, {
        yPercent: 100, // Corrected: Start with the top of the element at the bottom of the viewport
        opacity: 0,
        position: "absolute",
        top: "50%", // This is the reference point for yPercent
        left: "50%",
        xPercent: -50, // Center horizontally
        width: "90%", // Keep width consistent
        zIndex: totalSnippets - i, // Ensure correct stacking order (earlier snippets on top)
      })

      // Calculate timeline positions for this snippet's phases within its slot
      const entryPoint = i * singleSnippetScrollSlot // Start of this snippet's slot
      const pausePoint = entryPoint + singleSnippetScrollSlot / 3 // After 1/3 of its slot, it's fully in
      const exitPoint = entryPoint + (2 * singleSnippetScrollSlot) / 3 // After 2/3 of its slot, it starts exiting

      const phaseDuration = singleSnippetScrollSlot / 3 // Duration for each phase (entry, pause, exit)

      // 1. Slide in from bottom (yPercent: 100) to center (yPercent: -50)
      masterTl.to(
        snippetEl,
        {
          yPercent: -50, // Target: center of element at 50% from top
          opacity: 1,
          duration: phaseDuration,
        },
        entryPoint, // Start at the beginning of its slot
      )

      // 2. Slide out from center (yPercent: -50) to top (yPercent: -200)
      masterTl.to(
        snippetEl,
        {
          yPercent: -200, // Ensure it goes completely off-screen above
          opacity: 0,
          duration: phaseDuration,
        },
        exitPoint, // Start after the entry and pause phases
      )
    })

    // --- Debugging: Real-time position tracking ---
    const updateSnippetPositions = () => {
      snippetRefs.current.forEach((snippetEl, i) => {
        if (snippetEl && onSnippetPositionUpdate && snippets[i]) {
          const rect = snippetEl.getBoundingClientRect()
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight

          // Check if any part of the snippet is within the viewport
          const isVisible = rect.bottom > 0 && rect.top < viewportHeight && rect.right > 0 && rect.left < viewportWidth

          // Get center x and y relative to the viewport
          const centerX = rect.left + rect.width / 2
          const centerY = rect.top + rect.height / 2

          // Pass 0,0 if not visible, otherwise actual center coordinates
          onSnippetPositionUpdate(snippets[i].id, isVisible ? centerX : 0, isVisible ? centerY : 0, isVisible)
        }
      })
    }

    gsap.ticker.add(updateSnippetPositions) // Add to GSAP's ticker for continuous updates

    // Clean up ScrollTriggers and ticker on unmount
    return () => {
      masterTl.kill()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      gsap.ticker.remove(updateSnippetPositions) // Remove from GSAP's ticker
    }
  }, [snippets, snippetTransitionScrollFactor, onSnippetPositionUpdate]) // Add onSnippetPositionUpdate to dependencies

  // The dummy scroll height must match the 'end' value of the ScrollTrigger
  const finalDummyScrollHeight = totalScrollHeight

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        ref={containerRef}
        className="relative w-full h-full"
        style={{ overflowY: "scroll", WebkitOverflowScrolling: "touch" }}
      >
        <div style={{ height: `${finalDummyScrollHeight}px` }} aria-hidden="true" />

        {snippets.map((snippet, i) => (
          <div
            key={snippet.id}
            ref={(el) => (snippetRefs.current[i] = el)}
            className="text-center text-3xl font-bold text-gray-200"
            style={{
              pointerEvents: "none",
            }}
          >
            {snippet.content}
          </div>
        ))}
      </div>
    </div>
  )
}
