export const dynamic = "force-dynamic";

import FlashcardStudyClient from "./flashcard-study-client";

export default function FlashcardStudyPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  return <FlashcardStudyClient params={params} />;
}
