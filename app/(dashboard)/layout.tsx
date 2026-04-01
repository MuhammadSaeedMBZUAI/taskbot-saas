import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/tasks", label: "Tasks" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <aside className="fixed top-0 left-0 h-full w-56 border-r border-zinc-800 bg-zinc-950 flex flex-col py-6 px-4 gap-2">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight px-2 mb-4"
        >
          TaskBot
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition text-sm"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 px-2">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm text-zinc-400">Account</span>
        </div>
      </aside>

      <main className="ml-56 p-8">{children}</main>
    </div>
  );
}
