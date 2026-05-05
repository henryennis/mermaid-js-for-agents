# Diagram quality rules

These rules are loaded as Tessl steering guidance and complement the Mermaid skill.

## Required behavior

- Choose the diagram type from the user's communication goal, not from habit.
- Prefer the smallest diagram that carries the needed information.
- Preserve user intent when repairing diagrams.
- Use stable, readable IDs and labels so future diffs are meaningful.
- State renderer assumptions when using beta Mermaid syntax.

## Do not

- Add raw HTML, remote links, or secrets to a diagram unless explicitly requested and safe.
- Hide uncertainty about renderer compatibility.
- Rewrite a user's entire diagram when a local repair is enough.
- Add styling that does not encode meaning.

## Review checklist

- Does the first line select the intended Mermaid diagram type?
- Would this render in a common Markdown host?
- Can a future contributor edit one relationship without understanding generated layout noise?
- Are any beta features called out?
