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
  snippets: Snippet[] // Changed to expect an array of Snippet objects
  // This defines the scroll distance (in pixels) that each snippet "pins" for.
  // Higher value means it stays centered for longer while user scrolls.
  pauseDurationScrollDistance?: number
}

export function TextScroller({ snippets, pauseDurationScrollDistance = 500 }: TextScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const snippetRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!containerRef.current || snippets.length === 0) return

    // Kill existing ScrollTriggers to prevent duplicates on re-renders
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())

    // Detect if running inside an iframe (like v0 preview)
    const isInsideIframe = typeof window !== "undefined" && window.self !== window.top

    // Set the scroller for all ScrollTriggers created within this useEffect
    ScrollTrigger.defaults({
      scroller: containerRef.current,
    })

    const totalSnippets = snippets.length

    // Calculate total scroll height needed for the animation
    // If pinning is disabled, the scroll height is just the sum of snippet heights + some buffer
    // If pinning is enabled, it's the sum of (viewport height + pause distance) for each snippet
    const totalScrollHeight = isInsideIframe
      ? totalSnippets * window.innerHeight * 0.75 // Less height needed if not pinning
      : totalSnippets * (window.innerHeight + pauseDurationScrollDistance) + 0.5 * window.innerHeight

    // Create a master timeline that sequences snippet animations
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: `+=${totalScrollHeight}`,
        scrub: 1,
        // Disable pinning if inside an iframe to avoid SecurityError
        pin: !isInsideIframe,
        pinType: "fixed", // This will only apply if pin is true
        markers: false, // Set to true for debugging scroll positions
      },
    })

    snippets.forEach((snippet, i) => {
      const snippetEl = snippetRefs.current[i]
      if (!snippetEl) return

      // Initial state: Hidden below the viewport, centered horizontally
      gsap.set(snippetEl, {
        yPercent: 100,
        opacity: 0,
        position: "absolute",
        top: "50%",
        left: "50%",
        xPercent: -50,
        yPercent: -50,
        width: "90%",
        zIndex: totalSnippets - i,
      })

      // Calculate timeline position based on whether pinning is active
      const timelinePosition = isInsideIframe
        ? i * ((window.innerHeight * 0.75) / window.innerHeight) // Simpler progression if no pinning
        : i * (1 + pauseDurationScrollDistance / window.innerHeight)

      masterTl
        .to(snippetEl, { yPercent: 0, opacity: 1, duration: 1 }, timelinePosition) // Slide in to center
        .to(
          snippetEl,
          {
            yPercent: 0,
            opacity: 1,
            duration: isInsideIframe ? 0.5 : pauseDurationScrollDistance / window.innerHeight,
          }, // Shorter "hold" if not pinning
          timelinePosition + 1,
        )
        .to(
          snippetEl,
          { yPercent: -100, opacity: 0, duration: 1 },
          timelinePosition + 1 + (isInsideIframe ? 0.5 : pauseDurationScrollDistance / window.innerHeight),
        )
    })

    // Clean up ScrollTriggers on unmount
    return () => {
      masterTl.kill()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [snippets, pauseDurationScrollDistance])

  // Create a dummy div to provide scrollable height within the container
  // This is crucial because `pin: true` on the container (when active) prevents its children from
  // naturally creating scroll height. The master timeline then maps this dummy scroll
  // height to the snippet animations.
  const dummyScrollHeight =
    snippets.length *
      (window.innerHeight +
        (typeof window !== "undefined" && window.self !== window.top ? 0 : pauseDurationScrollDistance)) +
    window.innerHeight * 0.5

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        ref={containerRef}
        className="relative w-full h-full"
        style={{ overflowY: "scroll", WebkitOverflowScrolling: "touch" }}
      >
        <div style={{ height: `${dummyScrollHeight}px` }} aria-hidden="true" />

        {snippets.map((snippet, i) => (
          <div
            key={snippet.id} // Use snippet.id for key
            ref={(el) => (snippetRefs.current[i] = el)}
            className="text-center text-3xl font-bold text-gray-200"
            style={{
              pointerEvents: "none",
            }}
          >
            {snippet.content} {/* Render snippet content */}
          </div>
        ))}
      </div>
    </div>
  )
}
