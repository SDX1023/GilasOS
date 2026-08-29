'use client';

import { PomodoroProvider } from "@/components/pomodoro/pomodoro-context";
import { PomodoroTimer } from "@/components/pomodoro/timer";
import { Timer } from "lucide-react";

export default function PomodoroPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3">
            <Timer className="h-7 w-7" /> Pomodoro Timer
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Stay focused with timed study sessions</p>
        </div>

        <PomodoroProvider>
          <PomodoroTimer />
        </PomodoroProvider>
      </div>
    </div>
  );
}
