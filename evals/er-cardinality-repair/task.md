Repair this Mermaid ER diagram while preserving the intended data model. Return the fixed diagram
first and then one brief explanation.

```mermaid
erDiagram
  USER {
    string id
    string email
  }
  DIAGRAM {
    string id
    string title
  }
  REVIEW {
    string id
    int rating
  }

  USER one to many DIAGRAM : owns
  DIAGRAM zero to many REVIEW : receives
  REVIEW many to one USER : written_by
```

Intended semantics: one User owns many Diagrams; a Diagram can have zero or more Reviews; each
Review is written by exactly one User.
