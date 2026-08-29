'use client';

import { PomodoroTimer } from "@/components/pomodoro/timer";
import { Timer } from "lucide-react";

export default function PomodoroPage() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ textAlign: "center" }}>
        <h1 className="page-title" style={{ justifyContent: "center" }}><Timer size={28} /> Pomodoro Timer</h1>
        <p className="page-subtitle">Stay focused with timed study sessions</p>
      </div>
      <PomodoroTimer />
    </div>
  );
}
