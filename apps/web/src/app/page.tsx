export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-20">
      <h1 className="text-5xl font-bold tracking-tight">AI Interview Simulator for Senior to Principal Engineers</h1>
      <p className="mt-6 max-w-3xl text-zinc-300">
        Practice deep technical interviews in JavaScript, TypeScript, React, Next.js, Node.js, NestJS, system design,
        scalability, and architecture with an adaptive AI interviewer.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <a className="rounded-lg bg-indigo-500 px-4 py-2 font-medium hover:bg-indigo-400" href="/dashboard">
          Go to Dashboard
        </a>
        <a className="rounded-lg border border-zinc-700 px-4 py-2 font-medium hover:bg-zinc-900" href="/mock-interview">
          Start Mock Interview
        </a>
      </div>
    </main>
  );
}
