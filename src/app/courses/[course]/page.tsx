import { redirect } from "next/navigation";

export default function OldCoursePage({ params }: { params: Promise<{ course: string }> }) {
  redirect("/subjects");
}
