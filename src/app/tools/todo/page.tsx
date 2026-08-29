import { redirect } from "next/navigation";

export default function OldTodoPage() {
  redirect("/tasks");
}
