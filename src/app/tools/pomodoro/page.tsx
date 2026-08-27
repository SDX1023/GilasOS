import { PomodoroTimer } from "@/components/pomodoro/timer";

export default function PomodoroPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
        <p className="text-muted-foreground mt-2">Stay focused with timed study sessions</p>
      </div>

      <PomodoroTimer />
    </div>
  );
}
