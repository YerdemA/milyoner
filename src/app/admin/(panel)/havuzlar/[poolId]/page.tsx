import { Suspense } from "react";
import QuestionManager from "@/components/admin/QuestionManager";
import { LoadingState } from "@/components/ui/Spinner";

export const instant = false; // see (panel)/layout.tsx

type Params =PageProps<"/admin/havuzlar/[poolId]">["params"];

// poolId is runtime data, so it is read inside <Suspense> to keep the rest of the page prerenderable.
export default function PoolQuestionsPage({ params }: PageProps<"/admin/havuzlar/[poolId]">) {
  return (
    <Suspense fallback={<LoadingState />}>
      <PoolQuestions params={params} />
    </Suspense>
  );
}

async function PoolQuestions({ params }: { params: Params }) {
  const { poolId } = await params;
  return <QuestionManager poolId={poolId} />;
}
