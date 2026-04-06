; Literals
(true) @boolean
(false) @boolean
(null) @constant.builtin
(number) @number
(string) @string
(escape_sequence) @string.escape

; Comments
(comment) @comment

; Special variables
(everything) @variable.builtin
(this) @variable.builtin
(parent) @variable.builtin
(parameter) @variable.parameter

; Functions
(function_call
  function: (identifier) @function.call)

(namespaced_call
  namespace: (identifier) @module)
(namespaced_call
  function: (identifier) @function.call)

; Properties and fields
(dot_access
  (identifier) @property)
(dereference_access
  (identifier) @property)
(property_pair
  key: (identifier) @property)

; Object entry keys
(object_entry
  key: (identifier) @property)

; Spread
(spread) @punctuation.special

; Fallback identifier
(identifier) @variable

; Operators
[
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "&&"
  "||"
  "!"
  "+"
  "-"
  "*"
  "/"
  "%"
  "**"
  "=>"
  "->"
  "|"
  ".."
  "..."
] @operator

; Keyword operators
[
  "in"
  "match"
  "asc"
  "desc"
] @keyword.operator

; Namespace separator
"::" @punctuation.special

; Brackets
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

; Delimiters
[
  ","
  ":"
] @punctuation.delimiter

"." @punctuation.delimiter
