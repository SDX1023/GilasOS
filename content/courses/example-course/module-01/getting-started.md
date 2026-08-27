---
title: Getting Started
description: How to set up and use StudyOS
---

# Getting Started with StudyOS

Welcome to the getting started guide!

## Adding Content

To add courses and notes, create markdown files in the `content/courses/` directory.

### File Structure

```
content/
├── courses/
│   └── your-course/
│       ├── meta.yaml
│       └── module-01/
│           ├── _index.md
│           ├── note-1.md
│           └── reviewers/
│               └── reviewer-1.yaml
```

### Course Metadata

Create a `meta.yaml` file for each course:

```yaml
title: My Course
description: Course description here
```

## Using Wiki-Links

Link between notes using double brackets: `[[note-name]]`.

For cross-module links, use the full path: `[[module/note-name]]`.

## Flashcards

Create flashcard decks by adding YAML files in the `reviewers/` folder:

```yaml
title: My Reviewer
cards:
  - front: "What is X?"
    back: "X is..."
  - front: "Define Y"
    back: "Y means..."
```

## Next Steps

Check out the [[tips-and-tricks]] note for advanced usage!
