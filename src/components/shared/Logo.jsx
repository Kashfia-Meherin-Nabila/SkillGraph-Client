
import Link from "next/link";

export default function Logo({ light = false }) {
  const stroke = light ? "#ffffff" : "#14213d";

  return (
    <Link
      href="/"
      className={`flex w-fit items-center gap-2 font-display text-xl font-extrabold ${
        light ? "text-white" : "text-ink"
      }`}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        aria-hidden="true"
      >
        <line
          x1="5"
          y1="20"
          x2="13"
          y2="6"
          stroke={stroke}
          strokeWidth="2"
        />
        <line
          x1="13"
          y1="6"
          x2="21"
          y2="20"
          stroke={stroke}
          strokeWidth="2"
        />
        <line
          x1="5"
          y1="20"
          x2="21"
          y2="20"
          stroke={stroke}
          strokeWidth="2"
        />
        <circle cx="5" cy="20" r="3.5" fill="#0e9f8a" />
        <circle cx="13" cy="6" r="3.5" fill="#2f5bff" />
        <circle cx="21" cy="20" r="3.5" fill="#f2a516" />
      </svg>

      SkillGraph
    </Link>
  );
}
