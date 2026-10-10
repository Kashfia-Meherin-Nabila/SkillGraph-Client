import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg font-extrabold text-ink">SkillGraph</p>
          <p className="mt-1">Developer career intelligence and skill gap analysis.</p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a href="#how-it-works" className="hover:text-ink">
              How it works
            </a>
          </li>
          <li>
            <a href="#gap-analysis" className="hover:text-ink">
              Gap analysis
            </a>
          </li>
          <li>
            <Link href="/login" className="hover:text-ink">
              Log in
            </Link>
          </li>
          <li>
            <Link href="/register" className="hover:text-ink">
              Create account
            </Link>
          </li>
        </ul>
        <p>&copy; {new Date().getFullYear()} SkillGraph</p>
      </div>
    </footer>
  );
}