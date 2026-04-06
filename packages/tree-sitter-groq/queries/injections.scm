; GROQ injection queries for JavaScript/TypeScript host languages.
; These tell tree-sitter-aware editors (Neovim, Zed, Emacs 29+) to parse
; template literal content as GROQ when it matches known patterns.
;
; Usage in Neovim: place in queries/groq/injections.scm or configure
; via nvim-treesitter. For Zed: add to language injection config.

; groq`...` - tagged template literal
((call_expression
  function: (identifier) @_fn
  arguments: (template_string) @injection.content)
 (#eq? @_fn "groq")
 (#set! injection.language "groq"))

; groq`...` - tagged template expression (no call parens)
((tagged_template_expression
  tag: (identifier) @_tag
  (template_string) @injection.content)
 (#eq? @_tag "groq")
 (#set! injection.language "groq"))

; defineQuery(`...`) - Sanity's defineQuery helper
((call_expression
  function: (identifier) @_fn
  arguments: (arguments
    (template_string) @injection.content))
 (#eq? @_fn "defineQuery")
 (#set! injection.language "groq"))

; /* groq */ `...` - comment-tagged template literal
; Note: support for this pattern varies by editor. Neovim's
; nvim-treesitter supports it natively for some languages.
