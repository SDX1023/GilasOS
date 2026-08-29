"use client";

import Link from "next/link";
import { NoteMeta } from "@/lib/content";
import { ArrowLeft } from "lucide-react";

interface BacklinksPanelProps {
  backlinks: NoteMeta[];
}

export function BacklinksPanel({ backlinks }: BacklinksPanelProps) {
  if (backlinks.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
        Backlinks ({backlinks.length})
      </h3>
      <div className="space-y-2">
        {backlinks.map((note) => (
          <Link
            key={note.id}
            href={`/subjects/${note.courseId}/${note.moduleId}/${note.slug}`}
            className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <div>
              <p className="font-medium text-sm">{note.title}</p>
              <p className="text-xs text-muted-foreground">
                {note.courseId} / {note.moduleId}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
