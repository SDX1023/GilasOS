import Link from "next/link";
import { BookOpen, Brain, Timer, FileText, Trophy, CheckSquare } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: BookOpen,
      title: "Subjects",
      description: "Browse through the different subjects and topics here!",
      href: "/courses",
    },
    {
      icon: Brain,
      title: "Flashcards",
      description: "Study the various topics with flashcards!",
      href: "/reviewers",
    },
    {
      icon: Timer,
      title: "Pomodoro Timer",
      description: "Stay focused with a timer to keep you on track!",
      href: "/tools/pomodoro",
    },
    {
      icon: FileText,
      title: "PDF to Flashcards",
      description: "Generate flashcards from your PDFs and study materials",
      href: "/tools/pdf-to-flashcards",
    },
    {
      icon: CheckSquare,
      title: "To-Do List",
      description: "Organize your tasks with decks, priorities, and due dates",
      href: "/tools/todo",
    },
    {
      icon: Trophy,
      title: "Archive",
      description: "Competition history and records",
      href: "/archive",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">GilasOS</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The Ultimate GILAS Reviewer
        </p>
        <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mt-2">
          Guts. Instincts. Luck. Attitude. Skill.
        </p>
        <p className="text-xl text-muted-foreground mx-auto mt-2"> Hi! This is a website created by Sofia Isabelle David. If you're here then it's probably between 2 things. 1. You're in GILAS 2. This was sent to you, eitherway it's fine. This website will consist of most reviewers compiled and created throughout my years in GILAS, which is divided per subject. Consider this your jumpstart in your journey in this organization, explore, learn, and hasten your intellect. If you're ever here, I hope this website will be able to aid you in your learnings, and you know possibly might help you bag a few competitions here and there. Regardless, I hope you enjoy this little website created by me! See you guys soonest:) </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group p-6 rounded-lg border bg-card hover:shadow-lg transition-all"
          >
            <feature.icon className="h-12 w-12 mb-4 text-primary group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
            <p className="text-muted-foreground">{feature.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
