export const dynamic = "force-dynamic";

import ReviewerStudyClient from "./reviewer-study-client";

export default function ReviewerStudyPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  return <ReviewerStudyClient params={params} />;
}
