import { Suspense } from "react";
import PagePlaceholder from "@/components/ui/PagePlaceholder";

type Params = PageProps<"/admin/havuzlar/[poolId]">["params"];

// poolId is runtime data, so it is read inside <Suspense> to keep the rest of the page prerenderable.
export default function PoolQuestionsPage({ params }: PageProps<"/admin/havuzlar/[poolId]">) {
  return (
    <Suspense fallback={<PagePlaceholder title="Havuzdaki Sorular" description="Yükleniyor…" />}>
      <PoolQuestions params={params} />
    </Suspense>
  );
}

async function PoolQuestions({ params }: { params: Params }) {
  const { poolId } = await params;

  return (
    <PagePlaceholder
      title="Havuzdaki Sorular"
      description={`"${poolId}" havuzunun soruları burada listelenecek ve düzenlenecek.`}
    />
  );
}
