import {useEffect, useRef, useState, useCallback} from 'react'
import {format} from 'prettier/standalone'
import groqPlugin from '@sanity-labs/prettier-plugin-groq'

// Approximate character width for a monospace font at 14px.
// The actual width depends on the font, but for SF Mono / Menlo / Consolas
// at 14px, each character is roughly 8.4px wide.
const CHAR_WIDTH_PX = 8.4
const PANEL_PADDING_PX = 24 // 12px padding on each side

async function formatGroq(source: string, printWidth: number): Promise<string> {
  try {
    return await format(source, {
      parser: 'groq',
      plugins: [groqPlugin],
      printWidth,
    })
  } catch {
    // If formatting fails (invalid syntax, etc.), return source as-is
    return source
  }
}

/**
 * Hook that formats a GROQ query to fit a given container width.
 * Returns the formatted query and a ref to attach to the container
 * for width measurement.
 */
export function useFormattedQuery(rawQuery: string): {
  formattedQuery: string
  panelRef: React.RefObject<HTMLDivElement | null>
} {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [formattedQuery, setFormattedQuery] = useState(rawQuery)
  const [printWidth, setPrintWidth] = useState(80)

  // Measure panel width and compute character columns
  const measureWidth = useCallback(() => {
    if (!panelRef.current) return
    const pxWidth = panelRef.current.clientWidth - PANEL_PADDING_PX
    const chars = Math.max(20, Math.floor(pxWidth / CHAR_WIDTH_PX))
    setPrintWidth(chars)
  }, [])

  // Measure on mount and resize
  useEffect(() => {
    measureWidth()
    const observer = new ResizeObserver(measureWidth)
    if (panelRef.current) {
      observer.observe(panelRef.current)
    }
    return () => observer.disconnect()
  }, [measureWidth])

  // Format when query or width changes
  useEffect(() => {
    let cancelled = false
    formatGroq(rawQuery, printWidth).then((result) => {
      if (!cancelled) {
        setFormattedQuery(result.trimEnd())
      }
    })
    return () => {
      cancelled = true
    }
  }, [rawQuery, printWidth])

  return {formattedQuery, panelRef}
}
