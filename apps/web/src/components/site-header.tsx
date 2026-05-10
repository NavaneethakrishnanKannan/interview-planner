"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/mock-interview", label: "Mock interview" },
  { href: "/question-bank", label: "Question bank" },
  { href: "/system-design", label: "System design" },
  { href: "/coding-playground", label: "Playground" },
  { href: "/notes", label: "Notes" },
  { href: "/analytics", label: "Analytics" },
] as const;

const secondaryNav = [
  { href: "/settings", label: "Settings" },
  { href: "/admin", label: "Admin" },
] as const;

function routeActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function primaryNavClass(active: boolean): string {
  return active
    ? "rounded-md bg-indigo-600 px-2 py-1.5 font-medium text-white shadow-sm ring-1 ring-indigo-400/70"
    : "rounded-md px-2 py-1.5 text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-100";
}

function secondaryNavClass(active: boolean): string {
  return active
    ? "rounded-md bg-indigo-600/90 px-2 py-1.5 font-medium text-white shadow-sm ring-1 ring-indigo-400/60"
    : "rounded-md px-2 py-1.5 text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-300";
}

export function SiteHeader() {
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-semibold tracking-tight transition hover:text-white ${
              pathname === "/" ? "text-white ring-1 ring-indigo-400/50 rounded-md px-1 py-0.5" : "text-zinc-100"
            }`}
          >
            Engineer Interview AI
          </Link>
          <nav
            className="hidden flex-wrap items-center gap-x-1 gap-y-1 text-sm md:flex"
            aria-label="Main"
          >
            {primaryNav.map((item) => {
              const active = routeActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={primaryNavClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav
            className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm"
            aria-label="Account"
          >
            {secondaryNav.map((item) => {
              const active = routeActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={secondaryNavClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/login"
              className={secondaryNavClass(routeActive(pathname, "/login"))}
              aria-current={routeActive(pathname, "/login") ? "page" : undefined}
            >
              Log in
            </Link>
          </nav>
        </div>
      </div>
      <nav
        className="mx-auto flex max-w-6xl flex-wrap gap-x-1 gap-y-1 border-t border-zinc-800/60 px-4 py-2 text-sm md:hidden"
        aria-label="Main mobile"
      >
        {primaryNav.map((item) => {
          const active = routeActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={primaryNavClass(active)}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
