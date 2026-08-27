import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content/courses");

export interface CourseMeta {
  id: string;
  title: string;
  description: string;
  modules: ModuleMeta[];
}

export interface ModuleMeta {
  id: string;
  courseId: string;
  title: string;
  description: string;
  notes: NoteMeta[];
  reviewers: ReviewerMeta[];
}

export interface NoteMeta {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  slug: string;
}

export interface ReviewerMeta {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  cardCount: number;
}

export interface NoteContent {
  meta: NoteMeta;
  content: string;
  links: string[];
}

export interface Flashcard {
  id?: string;
  front: string;
  back: string;
  hint?: string;
}

export interface Reviewer {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  cards: Flashcard[];
}

export interface AllLinksMap {
  [slug: string]: NoteMeta;
}

function getAllFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

export function getAllCourses(): CourseMeta[] {
  if (!fs.existsSync(contentDir)) return [];

  const courses: CourseMeta[] = [];
  const courseDirs = fs.readdirSync(contentDir, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const courseDir of courseDirs) {
    const coursePath = path.join(contentDir, courseDir.name);
    const metaPath = path.join(coursePath, "meta.yaml");
    let title = courseDir.name;
    let description = "";

    if (fs.existsSync(metaPath)) {
      const raw = fs.readFileSync(metaPath, "utf-8");
      const parsed = matter(raw, { engines: { yaml: (s) => require("js-yaml").load(s) } });
      title = parsed.data.title || title;
      description = parsed.data.description || description;
    }

    const modules = getModules(courseDir.name);
    courses.push({
      id: courseDir.name,
      title,
      description,
      modules,
    });
  }

  return courses;
}

export function getModules(courseId: string): ModuleMeta[] {
  const coursePath = path.join(contentDir, courseId);
  if (!fs.existsSync(coursePath)) return [];

  const modules: ModuleMeta[] = [];
  const moduleDirs = fs.readdirSync(coursePath, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const modDir of moduleDirs) {
    const modPath = path.join(coursePath, modDir.name);
    const indexFile = path.join(modPath, "_index.md");
    let title = modDir.name;
    let description = "";

    if (fs.existsSync(indexFile)) {
      const raw = fs.readFileSync(indexFile, "utf-8");
      const parsed = matter(raw);
      title = parsed.data.title || title;
      description = parsed.data.description || description;
    }

    const notes = getNotes(courseId, modDir.name);
    const reviewers = getReviewers(courseId, modDir.name);

    modules.push({
      id: modDir.name,
      courseId,
      title,
      description,
      notes,
      reviewers,
    });
  }

  return modules;
}

export function getNotes(courseId: string, moduleId: string): NoteMeta[] {
  const modPath = path.join(contentDir, courseId, moduleId);
  const noteFiles = getAllFiles(modPath, ".md").filter((f) => !f.endsWith("_index.md"));

  return noteFiles.map((file) => {
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = matter(raw);
    const slug = path.basename(file, ".md");

    return {
      id: `${courseId}/${moduleId}/${slug}`,
      moduleId,
      courseId,
      title: parsed.data.title || slug,
      slug,
    };
  });
}

export function getNoteContent(courseId: string, moduleId: string, slug: string): NoteContent | null {
  const filePath = path.join(contentDir, courseId, moduleId, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(raw);

  // Extract wiki-links [[...]]
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = wikiLinkRegex.exec(parsed.content)) !== null) {
    links.push(match[1]);
  }

  return {
    meta: {
      id: `${courseId}/${moduleId}/${slug}`,
      moduleId,
      courseId,
      title: parsed.data.title || slug,
      slug,
    },
    content: parsed.content,
    links,
  };
}

export function getReviewers(courseId: string, moduleId: string): ReviewerMeta[] {
  const reviewersPath = path.join(contentDir, courseId, moduleId, "reviewers");
  if (!fs.existsSync(reviewersPath)) return [];

  const yamlFiles = getAllFiles(reviewersPath, ".yaml");
  return yamlFiles.map((file) => {
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = matter(raw, { engines: { yaml: (s) => require("js-yaml").load(s) } });
    const id = path.basename(file, ".yaml");

    return {
      id: `${courseId}/${moduleId}/${id}`,
      moduleId,
      courseId,
      title: parsed.data.title || id,
      cardCount: parsed.data.cards?.length || 0,
    };
  });
}

export function getReviewer(courseId: string, moduleId: string, reviewerId: string): Reviewer | null {
  const filePath = path.join(contentDir, courseId, moduleId, "reviewers", `${reviewerId}.yaml`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(raw, { engines: { yaml: (s) => require("js-yaml").load(s) } });

  return {
    id: `${courseId}/${moduleId}/${reviewerId}`,
    moduleId,
    courseId,
    title: parsed.data.title || reviewerId,
    cards: parsed.data.cards || [],
  };
}

export function getAllNotesMeta(): NoteMeta[] {
  const notes: NoteMeta[] = [];
  const courses = getAllCourses();

  for (const course of courses) {
    for (const mod of course.modules) {
      notes.push(...mod.notes);
    }
  }

  return notes;
}

export function buildAllLinksMap(): AllLinksMap {
  const map: AllLinksMap = {};
  const allNotes = getAllNotesMeta();

  for (const note of allNotes) {
    map[note.slug] = note;
    map[note.id] = note;
  }

  return map;
}

export function getBacklinks(courseId: string, moduleId: string, slug: string): NoteMeta[] {
  const allNotes = getAllNotesMeta();
  const backlinks: NoteMeta[] = [];

  for (const note of allNotes) {
    const noteContent = getNoteContent(note.courseId, note.moduleId, note.slug);
    if (noteContent && noteContent.links.includes(slug)) {
      if (note.id !== `${courseId}/${moduleId}/${slug}`) {
        backlinks.push(note);
      }
    }
  }

  return backlinks;
}
