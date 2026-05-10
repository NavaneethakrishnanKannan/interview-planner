const tiles = [
  { title: "Interview Readiness", value: "64%" },
  { title: "Completed Interviews", value: "6" },
  { title: "Weak Areas", value: "System Design, Security" },
  { title: "Next Suggested Topic", value: "Scalable API design" },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4" key={tile.title}>
            <p className="text-sm text-zinc-400">{tile.title}</p>
            <p className="mt-2 text-lg font-semibold">{tile.value}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
