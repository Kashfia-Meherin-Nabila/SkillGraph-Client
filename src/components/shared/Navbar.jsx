"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@heroui/react";

import { authClient, useSession } from "@/lib/auth-client";
import Logo from "./Logo";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#gap-analysis", label: "Gap analysis" },
  { href: "#roles", label: "Who it's for" },
];

/* ---------------------------------
   User Avatar
--------------------------------- */
function UserAvatar({ userImage, userName, size = "md" }) {
  const initials =
    userName
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";

  return (
    <Avatar size={size} className="shrink-0">
      <AvatarImage src={userImage || undefined} alt={userName} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

/* ---------------------------------
   Authentication Actions
--------------------------------- */
function AuthActions({
  mobile = false,
  isPending,
  isLoggedIn,
  userName,
  userEmail,
  userImage,
  onLogout,
  onClose,
}) {
  if (isPending) {
    return (
      <div
        className={`animate-pulse rounded-lg bg-gray-100 ${
          mobile ? "h-10 w-full" : "h-9 w-28"
        }`}
      />
    );
  }

  if (!isLoggedIn) {
    if (mobile) {
      return (
        <div className="mt-4 flex gap-3">
          <Link
            href="/signIn"
            onClick={onClose}
            className="flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:border-cobalt hover:text-cobalt"
          >
            Log In
          </Link>

          <Link
            href="/signUp"
            onClick={onClose}
            className="flex-1 rounded-lg bg-ink px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-cobalt"
          >
            Create account
          </Link>
        </div>
      );
    }

    return (
      <div className="hidden items-center gap-3 md:flex">
        <Link
          href="/signIn"
          className="px-3 py-2 text-sm font-medium transition-colors hover:text-cobalt"
        >
          Log In
        </Link>

        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
          <Link
            href="/signUp"
            className="block rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
          >
            Create account
          </Link>
        </motion.div>
      </div>
    );
  }

  if (mobile) {
    return (
      <div className="mt-4 space-y-3 border-t border-line pt-4">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
          <UserAvatar userImage={userImage} userName={userName} size="lg" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{userName}</p>
            {userEmail && (
              <p className="truncate text-xs text-muted">{userEmail}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          <FiLogOut size={16} />
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      <div className="flex max-w-48 items-center gap-2">
        <UserAvatar userImage={userImage} userName={userName} />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{userName}</p>
          {userEmail && (
            <p className="truncate text-xs text-muted">{userEmail}</p>
          )}
        </div>
      </div>

      <motion.button
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={onLogout}
        className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <FiLogOut size={16} />
        Logout
      </motion.button>
    </div>
  );
}

/* ---------------------------------
   Navbar
--------------------------------- */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();
  const { scrollY } = useScroll();

  // Extract `refetch` to invalidate client-side session cache
  const { data: session, isPending, refetch } = useSession();

  const user = session?.user;
  const isLoggedIn = Boolean(user);

  const userName = user?.name || user?.email || "User";
  const userImage = user?.image || undefined;

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 8);
  });

  const closeMenu = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const result = await authClient.signOut();

      if (result?.error) {
        console.error("Logout failed:", result.error);
        setLoggingOut(false);
        return;
      }

      setOpen(false);

      // Invalidate Better Auth client cache
      await refetch();

      // Client-side Next.js navigation
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const authProps = {
    isPending,
    isLoggedIn,
    userName,
    userEmail: user?.email,
    userImage,
    onLogout: handleLogout,
    onClose: closeMenu,
  };

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      className={`sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur transition-shadow duration-300 ${
        scrolled
          ? "shadow-[0_10px_30px_-20px_rgba(20,33,61,0.45)]"
          : ""
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Logo />

        <ul className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          {links.map((link) => (
            <motion.li
              key={link.href}
              initial="rest"
              whileHover="hover"
              animate="rest"
            >
              <a
                href={link.href}
                className="relative block pb-1 transition-colors hover:text-ink"
              >
                {link.label}

                <motion.span
                  aria-hidden="true"
                  variants={{
                    rest: { scaleX: 0 },
                    hover: { scaleX: 1 },
                  }}
                  transition={{
                    duration: 0.25,
                    ease: "easeOut",
                  }}
                  style={{ originX: 0 }}
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-cobalt"
                />
              </a>
            </motion.li>
          ))}
        </ul>

        <AuthActions {...authProps} />

        <button
          type="button"
          className="rounded-lg p-2 transition-colors hover:bg-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
            className="overflow-hidden border-t border-line bg-paper md:hidden"
          >
            <div className="px-4 pb-5 pt-3">
              <ul className="flex flex-col gap-1 text-base font-medium">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="block rounded-lg px-2 py-2.5 transition-colors hover:bg-white"
                      onClick={closeMenu}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              <AuthActions {...authProps} mobile />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}