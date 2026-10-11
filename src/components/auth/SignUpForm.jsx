"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AnimatePresence, motion } from "motion/react";
import { FiAlertCircle, FiChevronDown, FiEye, FiEyeOff } from "react-icons/fi";
import LottieAnimation from "./LottieAnimation";
import { AuthShell, Field, inputClass } from "./AuthShell";
import { graphBuildAnimation, successCheckAnimation } from "@/lib/lottie/animations";
import { authClient } from "@/lib/auth-client";

const ROLES = [
  { value: "developer", label: "Developer", text: "Track skills and follow a roadmap" },
  { value: "mentor", label: "Mentor", text: "Guide other developers" },
];

const CAREERS = [
  { value: "frontend", label: "Frontend Engineer" },
  { value: "backend", label: "Backend Engineer" },
  { value: "fullstack", label: "Full Stack Engineer" },
  { value: "software", label: "Software Engineer" },
];

const PERKS = [
  "A readiness score for the role you want",
  "A roadmap ordered by prerequisites",
  "Assessments that confirm your levels",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- Password strength ---------- */

const STRENGTH = [
  null,
  { label: "Too short", color: "#ef4444" },
  { label: "Fair", color: "#f2a516" },
  { label: "Good", color: "#2f5bff" },
  { label: "Strong", color: "#0e9f8a" },
];

function strengthOf(pw) {
  if (!pw) return 0;
  if (pw.length < 8) return 1;
  const points = [
    pw.length >= 12,
    /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
  return 2 + Math.min(points, 2);
}

function StrengthMeter({ password }) {
  const score = strengthOf(password);
  const info = STRENGTH[score];

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            initial={false}
            animate={{ backgroundColor: i <= score ? info.color : "#dde3ee" }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
      <p className="mt-1.5 h-4 text-xs text-muted">
        {info ? `Password strength: ${info.label}` : ""}
      </p>
    </div>
  );
}

/* ---------- The page ---------- */

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      role: "developer",
      targetCareer: "",
      password: "",
      confirmPassword: "",
    },
  });

  const role = useWatch({ control, name: "role" });
  const password = useWatch({ control, name: "password" });

  // Auto-redirect to /dashboard/${role} after animation
  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => {
        router.push(`/dashboard/${done.role}`);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [done, router]);

  async function onSubmit(values) {
    clearErrors("root");
    try {
      const selectedRole = values.role || "developer";

      const payload = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: selectedRole,
        callbackURL: `/dashboard/${selectedRole}`,
      };

      if (selectedRole === "developer" && values.targetCareer) {
        payload.targetCareer = values.targetCareer;
      }

      const { data, error } = await authClient.signUp.email(payload);

      if (error) {
        if (error.field) {
          setError(error.field, { type: "server", message: error.message });
        } else {
          setError("root.server", {
            type: "server",
            message: error.message || "We couldn't create your account. Try again in a moment.",
          });
        }
        return;
      }

      // Save name, email, and dynamic role into done state
      const userRole = data?.user?.role || selectedRole;
      setDone({
        name: values.name.trim(),
        email: values.email.trim(),
        role: userRole,
      });
    } catch (err) {
      setError("root.server", {
        type: "server",
        message: err?.message || "We couldn't create your account. Try again in a moment.",
      });
    }
  }

  const serverError = errors.root?.server?.message;

  return (
    <AuthShell
      animation={graphBuildAnimation}
      staticFrame={100}
      animationLabel="A skill graph building itself, one skill at a time"
      heading="Your skill graph starts here."
      perks={PERKS}
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <LottieAnimation
              data={successCheckAnimation}
              loop={false}
              staticFrame={71}
              label="Account created"
              className="mx-auto h-40 w-40"
            />
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
              You&rsquo;re in, {done.name.split(" ")[0]}.
            </h1>
            <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted">
              Your account for <span className="font-semibold text-ink">{done.email}</span> is
              ready. Taking you to your dashboard...
            </p>

            {/* Dynamic Link to /dashboard/developer or /dashboard/mentor */}
            <Link
              href={`/dashboard/${done.role}`}
              className="mt-8 inline-block rounded-xl bg-cobalt px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-cobalt-dark"
            >
              Go to Dashboard
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Create your account
            </h1>
            <p className="mt-2 text-muted">
              Already have one?{" "}
              <Link href="/signIn" className="font-semibold text-cobalt hover:underline">
                Log in
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

              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">I&rsquo;m joining as</legend>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <label key={r.value} className="cursor-pointer">
                      <input
                        type="radio"
                        value={r.value}
                        className="peer sr-only"
                        {...register("role")}
                      />
                      <span className="block h-full rounded-xl border border-line bg-white p-3.5 transition-colors peer-checked:border-cobalt peer-checked:bg-cobalt/5 peer-focus-visible:ring-4 peer-focus-visible:ring-cobalt/20">
                        <span className="block font-semibold">{r.label}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-muted">
                          {r.text}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field id="name" label="Full name" error={errors.name}>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={inputClass(!!errors.name)}
                  {...register("name", {
                    required: "Enter your name.",
                    validate: (v) => v.trim().length >= 2 || "Your name needs at least 2 characters.",
                  })}
                />
              </Field>

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

              <AnimatePresence initial={false}>
                {role === "developer" && (
                  <motion.div
                    key="career"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="-mx-1 overflow-hidden px-1"
                  >
                    <Field id="targetCareer" label="Target career" error={errors.targetCareer}>
                      <div className="relative">
                        <select
                          id="targetCareer"
                          aria-invalid={!!errors.targetCareer}
                          aria-describedby={errors.targetCareer ? "targetCareer-error" : undefined}
                          className={`${inputClass(!!errors.targetCareer)} appearance-none pr-10`}
                          {...register("targetCareer", {
                            validate: (v) =>
                              getValues("role") !== "developer" || !!v || "Choose the role you are aiming for.",
                          })}
                        >
                          <option value="">Select a role</option>
                          {CAREERS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
                          aria-hidden="true"
                        />
                      </div>
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>

              <Field id="password" label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={`${inputClass(!!errors.password)} pr-12`}
                    {...register("password", {
                      required: "Create a password.",
                      minLength: { value: 8, message: "Use at least 8 characters." },
                      validate: (v) =>
                        (/[A-Za-z]/.test(v) && /\d/.test(v)) || "Include at least one letter and one number.",
                      deps: ["confirmPassword"],
                    })}
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
                <StrengthMeter password={password} />
              </Field>

              <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Type it again"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  className={inputClass(!!errors.confirmPassword)}
                  {...register("confirmPassword", {
                    required: "Type your password again.",
                    validate: (v) => v === getValues("password") || "The passwords don't match.",
                  })}
                />
              </Field>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={isSubmitting ? undefined : { y: -2 }}
                whileTap={isSubmitting ? undefined : { scale: 0.98 }}
                className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl bg-cobalt px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSubmitting && (
                  <motion.span
                    aria-hidden="true"
                    className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
                  />
                )}
                {isSubmitting ? "Creating account..." : "Create account"}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}