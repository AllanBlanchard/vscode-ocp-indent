# OCP Indent

## Features

Provides OCP indent formatting for OCaml.

- full file formatting
- selected text formatting

Note that the behavior of the full file formatting can be configured. If:

- OcpIndent: Global Format Takes Selection

is activated, if some text is selected, the behavior is the same as "selected text formatting".
Basically: the same key binding can be used for both actions.

If `ocp-indent` is not in the environment, the path to the executable can be configured via
the option:

- OcpIndent: Path

## Requirements

- `ocp-indent` (`opam install ocp-indent`)

## Build package

- npm install
- vsce package
