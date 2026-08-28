export const dynamic = "force-dynamic";

import ReviewerStudyClient from "./reviewer-study-client";

export default function ReviewerStudyPage({
  params,
}: {
  params: Promise<{ course: string; module: string; reviewer: string }>;
}) {
  return <ReviewerStudyClient params={params} />;
}
