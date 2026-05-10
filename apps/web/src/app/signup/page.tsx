"use client";

import { useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <h1 className="text-3xl font-semibold">Sign up</h1>
      <form className="mt-6 space-y-4">
        <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-medium hover:bg-indigo-400" type="button">Create account</button>
      </form>
    </main>
  );
}
