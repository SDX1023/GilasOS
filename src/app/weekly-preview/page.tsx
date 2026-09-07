"use client";

import WeeklySummary from "@/components/weekly-summary";

export default function WeeklySummaryPreview() {
  return (
    <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="os-background">
        <div className="os-orb os-orb--1" />
        <div className="os-orb os-orb--2" />
        <div className="os-orb os-orb--3" />
        <div className="os-grid" />
      </div>
      <WeeklySummary onClose={() => {}} />
    </div>
  );
}
