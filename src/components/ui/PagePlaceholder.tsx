type PagePlaceholderProps = {
  title: string;
  description: string;
};

// Temporary stand-in for pages that will be built in later steps.
export default function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-lg opacity-70">{description}</p>
      <p className="text-sm opacity-50">Bu sayfa yapım aşamasında.</p>
    </main>
  );
}
