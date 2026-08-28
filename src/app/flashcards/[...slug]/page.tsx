export const dynamic = "force-dynamic";

import FlashcardStudyClient from "./flashcard-study-client";

export default async function FlashcardStudyPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  return <FlashcardStudyClient slug={slug} />;
}
