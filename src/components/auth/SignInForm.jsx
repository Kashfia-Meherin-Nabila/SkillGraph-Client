"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "motion/react";
import { FiAlertCircle, FiCheck, FiEye, FiEyeOff } from "react-icons/fi";
import { AuthShell, Field, inputClass } from "./AuthShell";
import { readinessRingAnimation } from "@/lib/lottie/animations";
import { authClient } from "@/lib/auth-client";

const ROLE_HOME = {
  developer: "/dashboard",
  mentor: "/mentor",
};

const PERKS = [
  "Your latest readiness score",
  "The next skill on your roadmap",
  "Progress since your last visit",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values) {
    clearErrors("root");
    try {
      // Better Auth: creates session and sets auth cookie
      const { data, error } = await authClient.signIn.email({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        rememberMe: values.remember,
        callbackURL: "/dashboard",
      });

      if (error) {
        setRedirecting(false);
        setError("root.server", {
          type: "server",
          message: error.message || "Invalid email or password. Please try again.",
        });
        setFocus("password");
        return;
      }

      setRedirecting(true);

      const role = data?.user?.role;
      const destination = role && ROLE_HOME[role] ? ROLE_HOME[role] : "/dashboard";

      router.push(destination);
      router.refresh();
    } catch (err) {
      setRedirecting(false);
      setError("root.server", {
        type: "server",
        message: err?.message || "We couldn't log you in. Try again in a moment.",
      });
      setFocus("password");
    }
  }

  const serverError = errors.root?.server?.message;
  const busy = isSubmitting || redirecting;

  return (
    <AuthShell
      animation={readinessRingAnimation}
      staticFrame={100}
      animationLabel="A readiness ring filling up beside three growing skill bars"
      heading="Pick up where you left off."
      perks={PERKS}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Welcome back
        </h1>
        <p className="mt-2 text-muted">
          New to SkillGraph?{" "}
          <Link href="/signUp" className="font-semibold text-cobalt hover:underline">
            Create an account
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
          <AnimatePresence initial={false}>
            {serverError && (
              <motion.div
                key="server-error"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
                  {serverError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Field id="email" label="Email" error={errors.email}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={inputClass(!!errors.email)}
              {...register("email", {
                required: "Enter your email address.",
                pattern: { value: EMAIL_PATTERN, message: "Enter a valid email, like you@example.com." },
              })}
            />
          </Field>

          <Field id="password" label="Password" error={errors.password}>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`${inputClass(!!errors.password)} pr-12`}
                {...register("password", { required: "Enter your password." })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted transition-colors hover:text-ink"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </Field>

          <label className="flex w-fit cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" className="peer sr-only" {...register("remember")} />
            <span className="grid h-5 w-5 place-items-center rounded-md border border-line bg-white text-white transition-colors peer-checked:border-cobalt peer-checked:bg-cobalt peer-focus-visible:ring-4 peer-focus-visible:ring-cobalt/20">
              <FiCheck size={14} aria-hidden="true" />
            </span>
            Keep me logged in on this device
          </label>

          <motion.button
            type="submit"
            disabled={busy}
            whileHover={busy ? undefined : { y: -2 }}
            whileTap={busy ? undefined : { scale: 0.98 }}
            className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl bg-cobalt px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:opacity-80"
          >
            {busy && (
              <motion.span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
              />
            )}
            {busy ? "Logging in..." : "Log in"}
          </motion.button>
        </form>
      </motion.div>
    </AuthShell>
  );
}