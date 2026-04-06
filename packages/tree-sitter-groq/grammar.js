/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * Tree-sitter grammar for GROQ (Graph-Relational Object Queries).
 * https://www.sanity.io/docs/groq
 */
module.exports = grammar({
  name: "groq",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  precedences: ($) => [
    [
      "exponent",
      "unary",
      "multiplicative",
      "additive",
      "comparison",
      "not",
      "and",
      "or",
      "pair",
      "pipe",
    ],
  ],

  conflicts: ($) => [],

  rules: {
    // Entry point: a GROQ query is a single expression
    query: ($) => $._expression,

    _expression: ($) =>
      choice($.pipe_expression, $._non_pipe_expression),

    _non_pipe_expression: ($) =>
      choice(
        $.pair_expression,
        $._non_pair_expression,
      ),

    _non_pair_expression: ($) =>
      choice(
        $.or_expression,
        $._non_or_expression,
      ),

    _non_or_expression: ($) =>
      choice(
        $.and_expression,
        $._non_and_expression,
      ),

    _non_and_expression: ($) =>
      choice(
        $.not_expression,
        $._non_not_expression,
      ),

    _non_not_expression: ($) =>
      choice(
        $.comparison_expression,
        $._non_comparison_expression,
      ),

    _non_comparison_expression: ($) =>
      choice(
        $.additive_expression,
        $._non_additive_expression,
      ),

    _non_additive_expression: ($) =>
      choice(
        $.multiplicative_expression,
        $.unary_expression,
        $._non_multiplicative_expression,
      ),

    _non_multiplicative_expression: ($) =>
      choice(
        $.exponent_expression,
        $._non_exponent_expression,
      ),

    _non_exponent_expression: ($) => $._postfix_expression,

    // --- Binary/unary expression rules ---

    pipe_expression: ($) =>
      prec.left(
        "pipe",
        seq($._expression, "|", $._expression),
      ),

    pair_expression: ($) =>
      prec.right(
        "pair",
        seq($._non_pair_expression, "=>", $._non_pipe_expression),
      ),

    or_expression: ($) =>
      prec.left(
        "or",
        seq($._non_pair_expression, "||", $._non_pair_expression),
      ),

    and_expression: ($) =>
      prec.left(
        "and",
        seq($._non_or_expression, "&&", $._non_or_expression),
      ),

    not_expression: ($) =>
      prec("not", seq("!", $._non_and_expression)),

    comparison_expression: ($) =>
      prec.left(
        "comparison",
        seq(
          $._non_comparison_expression,
          choice("==", "!=", "<", ">", "<=", ">=", "in", "match"),
          $._non_comparison_expression,
        ),
      ),

    unary_expression: ($) =>
      prec("unary", seq(choice("+", "-"), $._postfix_expression)),

    additive_expression: ($) =>
      prec.left(
        "additive",
        seq(
          $._non_comparison_expression,
          choice("+", "-"),
          $._non_comparison_expression,
        ),
      ),

    multiplicative_expression: ($) =>
      prec.left(
        "multiplicative",
        seq(
          $._non_additive_expression,
          choice("/", "%", "*"),
          $._non_additive_expression,
        ),
      ),

    exponent_expression: ($) =>
      prec.right(
        "exponent",
        seq($._postfix_expression, "**", $._non_multiplicative_expression),
      ),

    // --- Postfix expressions ---

    _postfix_expression: ($) =>
      choice(
        $._primary_expression,
        $.filter,
        $.projection,
        $.dot_access,
        $.dereference,
        $.dereference_access,
        $.array_postfix,
        $.asc_postfix,
        $.desc_postfix,
      ),

    filter: ($) =>
      seq($._postfix_expression, "[", $.filter_content, "]"),

    filter_content: ($) =>
      choice(
        $.range,
        $._expression,
      ),

    range: ($) =>
      seq($._expression, choice("..", "..."), $._expression),

    projection: ($) =>
      seq($._postfix_expression, "{", $.projection_body, "}"),

    projection_body: ($) =>
      seq(
        $.projection_entry,
        repeat(seq(",", $.projection_entry)),
        optional(","),
      ),

    projection_entry: ($) =>
      choice(
        $.spread,
        $.property_pair,
        $._expression,
      ),

    spread: (_) => "...",

    property_pair: ($) =>
      seq(
        field("key", choice($.identifier, $.string)),
        ":",
        field("value", $._expression),
      ),

    dot_access: ($) =>
      seq($._postfix_expression, ".", $.identifier),

    dereference: ($) =>
      seq($._postfix_expression, "->"),

    dereference_access: ($) =>
      seq($._postfix_expression, "->", $.identifier),

    array_postfix: ($) =>
      seq($._postfix_expression, "[", "]"),

    asc_postfix: ($) =>
      seq($._postfix_expression, "asc"),

    desc_postfix: ($) =>
      seq($._postfix_expression, "desc"),

    // --- Primary expressions ---

    _primary_expression: ($) =>
      choice(
        $.everything,
        $.this,
        $.parent,
        $.parameter,
        $.string,
        $.number,
        $.true,
        $.false,
        $.null,
        $.namespaced_call,
        $.function_call,
        $.identifier,
        $.array_literal,
        $.object_literal,
        $.paren_expression,
      ),

    everything: (_) => "*",

    this: (_) => "@",

    parent: (_) => /\^+/,

    parameter: (_) => /\$[a-zA-Z_][a-zA-Z0-9_]*/,

    true: (_) => "true",

    false: (_) => "false",

    null: (_) => "null",

    function_call: ($) =>
      seq(
        field("function", $.identifier),
        "(",
        optional($.argument_list),
        ")",
      ),

    namespaced_call: ($) =>
      seq(
        field("namespace", $.identifier),
        "::",
        field("function", $.identifier),
        "(",
        optional($.argument_list),
        ")",
      ),

    argument_list: ($) =>
      seq(
        $._expression,
        repeat(seq(",", $._expression)),
        optional(","),
      ),

    array_literal: ($) =>
      seq("[", optional($.argument_list), "]"),

    object_literal: ($) =>
      seq("{", $.object_body, "}"),

    object_body: ($) =>
      seq(
        $.object_entry,
        repeat(seq(",", $.object_entry)),
        optional(","),
      ),

    object_entry: ($) =>
      choice(
        $.spread,
        seq(
          field("key", choice($.identifier, $.string)),
          ":",
          field("value", $._expression),
        ),
        $._expression,
      ),

    paren_expression: ($) =>
      seq("(", $._expression, ")"),

    // --- Terminals ---

    string: ($) =>
      choice($.double_string, $.single_string),

    double_string: ($) =>
      seq(
        '"',
        repeat(choice($.string_content, $.escape_sequence)),
        '"',
      ),

    single_string: ($) =>
      seq(
        "'",
        repeat(choice($.string_content, $.escape_sequence)),
        "'",
      ),

    string_content: (_) =>
      token.immediate(prec(1, /[^"'\\]+/)),

    escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice(
            /['"\\\/bfnrt]/,
            /u[0-9a-fA-F]{4}/,
            /u\{[0-9a-fA-F]+\}/,
          ),
        ),
      ),

    number: (_) =>
      /\d+(\.\d+)?([eE][+\-]?\d+)?/,

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    comment: (_) => token(seq("//", /.*/)),
  },
});
