/**
 * Creates GROQ highlight rules compatible with the Ace tokenizer.
 * Can be used standalone (e.g. in test harnesses) without Ace.
 */
export declare function createGroqHighlightRules(): Record<string, unknown[]>

/**
 * Ace-compatible highlight rules class for GROQ.
 */
export declare class GroqHighlightRules {
  $rules: Record<string, unknown[]>
}

/**
 * Ace-compatible mode class for GROQ.
 *
 * Usage:
 *   import {Mode} from '@sanity/ace-groq'
 *   editor.session.setMode(new Mode())
 */
export declare class Mode {
  HighlightRules: typeof GroqHighlightRules
  lineCommentStart: string
  $id: string
  getCompletions(): never[]
}
