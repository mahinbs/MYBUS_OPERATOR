"use client";

import { useState } from "react";
import { useAuth } from "../../components/AuthProvider";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onClearStored: () => void;
  onBookOnline?: () => void;
}

function isValidEmail(value: string) {
  const v = value.trim();
  if (!v.includes("@")) return false;
  const [local, domain] = v.split("@");
  return Boolean(local && domain && domain.includes("."));
}

export default function LoginScreen({ onLoginSuccess, onClearStored, onBookOnline }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [accountKind, setAccountKind] = useState<"owner" | "counter">("owner");
  const { login, register, enterOwnerDemo, enterOperatorDemo } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const em = email.trim();
    const pw = password;

    if (!em) {
      setError("Enter your email address.");
      return;
    }
    if (!isValidEmail(em)) {
      setError("Enter a valid email (e.g. you@company.com).");
      return;
    }
    if (pw.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isSignup) {
      const nm = name.trim();
      if (!nm) {
        setError("Enter your full name.");
        return;
      }
      const result = register(nm, em, pw, accountKind);
      if (result === "ok") {
        onLoginSuccess();
        return;
      }
      if (result === "duplicate") {
        setError("An account with this email already exists. Sign in instead.");
        return;
      }
      setError("Could not create account. Check your details and try again.");
      return;
    }

    try {
      const success = login(em, pw);
      if (success) {
        onLoginSuccess();
      } else {
        setError(
          "Wrong email or password. Try demo@mybus.in or counter@mybus.in (6+ char password), open a demo card above, or reset saved accounts."
        );
      }
    } catch {
      setError("Could not sign in. Open a demo card above or reset saved accounts.");
    }
  };

  return (
    <div className="relative flex min-h-app w-full min-w-0 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#7C3AED]">
      <div className="pointer-events-none absolute right-[-60px] top-[-60px] h-[200px] w-[200px] rounded-full bg-white/5" />
      <div className="pointer-events-none absolute bottom-[100px] left-[-80px] h-[240px] w-[240px] rounded-full bg-white/5" />

      <div className="relative z-20 flex w-full min-w-0 flex-col px-6 pb-safe pt-safe sm:pt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/95 shadow-lg flex items-center justify-center overflow-hidden">
            <img
              src="https://static.readdy.ai/image/19a52a0e7cd11d182286c46a940c9855/bf3e342b4b7d5b4195ad3d9bedaae5aa.png"
              alt="MY BUS Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h1 className="font-['Pacifico'] text-white text-xl">MY BUS</h1>
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-medium">Operator</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-[32px] font-bold text-white leading-tight mb-2">
            {isSignup ? "Join" : "Welcome back"}
          </h2>
          <p className="text-white/70 text-sm">
            {isSignup ? "Create your operator account to get started" : "Sign in to manage your fleet"}
          </p>
          {isSignup && (
            <p className="mt-3 text-[11px] leading-snug text-white/55">
              Instant <strong className="text-white/80">owner</strong> and <strong className="text-white/80">operator</strong> demos are on the{" "}
              <button
                type="button"
                className="font-semibold text-white underline underline-offset-2"
                onClick={() => {
                  setIsSignup(false);
                  setError("");
                }}
              >
                Sign in
              </button>{" "}
              screen.
            </p>
          )}
        </div>

        {!isSignup && (
          <div className="relative z-[110] mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href="?demo=owner"
              onClick={(e) => {
                setError("");
                try {
                  enterOwnerDemo();
                  onLoginSuccess();
                  e.preventDefault();
                } catch {
                  /* browser navigates to ?demo=owner — bootstrap script restores session */
                }
              }}
              className="relative flex min-h-[48px] flex-col rounded-2xl border border-white/35 bg-white/12 p-4 text-left backdrop-blur-sm transition-all hover:bg-white/18 active:scale-[0.99] no-underline text-inherit"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Demo · Fleet owner</span>
              <span className="mt-2 text-sm font-bold text-white">Full operator panel</span>
              <span className="mt-1 text-[11px] leading-snug text-white/70">
                Home, fleet, routes, trips, bookings, earnings &amp; account.
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white">
                Open owner demo <i className="ri-arrow-right-line" aria-hidden />
              </span>
            </a>
            <a
              href="?demo=operator"
              onClick={(e) => {
                setError("");
                try {
                  enterOperatorDemo();
                  onLoginSuccess();
                  e.preventDefault();
                } catch {
                  /* browser navigates to ?demo=operator */
                }
              }}
              className="relative flex min-h-[48px] flex-col rounded-2xl border border-emerald-300/45 bg-emerald-500/15 p-4 text-left backdrop-blur-sm transition-all hover:bg-emerald-500/22 active:scale-[0.99] no-underline text-inherit"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/90">Demo · Operator</span>
              <span className="mt-2 text-sm font-bold text-white">Booking desk panel</span>
              <span className="mt-1 text-[11px] leading-snug text-emerald-50/90">
                Desk (walk-in), bookings list, and account — no fleet or earnings tabs.
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-50">
                Open operator demo <i className="ri-arrow-right-line" aria-hidden />
              </span>
            </a>
          </div>
        )}

        <form
          method="post"
          action="#"
          onSubmit={handleSubmit}
          className="flex min-h-0 min-w-0 shrink-0 flex-col gap-4"
          noValidate
        >
          <div className="space-y-5 shrink-0">
            {isSignup && (
              <div className="rounded-xl border border-white/20 bg-white/5 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/60">Account type</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountKind("owner")}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                      accountKind === "owner" ? "bg-white text-[#1a0b2e]" : "bg-white/10 text-white/80"
                    }`}
                  >
                    Fleet owner
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountKind("counter")}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                      accountKind === "counter" ? "bg-white text-[#1a0b2e]" : "bg-white/10 text-white/80"
                    }`}
                  >
                    Counter / operator
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-white/50">Counter staff use the Desk tab for walk-in bookings and daily bus checks.</p>
              </div>
            )}
            {isSignup && (
              <div className="relative">
                <i className="ri-user-line absolute left-0 bottom-3 text-white/50 text-lg pointer-events-none" aria-hidden />
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-b border-white/30 text-white placeholder:text-white/50 py-3.5 pl-8 text-sm outline-none focus:border-white/90 focus-visible:ring-0 rounded-none transition-colors"
                />
              </div>
            )}
            <div className="relative">
              <i className="ri-mail-line absolute left-0 bottom-3 text-white/50 text-lg pointer-events-none" aria-hidden />
              <input
                type="text"
                name="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                className="w-full bg-transparent border-b border-white/30 text-white placeholder:text-white/50 py-3.5 pl-8 text-sm outline-none focus:border-white/90 focus-visible:ring-0 rounded-none transition-colors"
              />
            </div>
            <div className="relative">
              <i className="ri-lock-line absolute left-0 bottom-3 text-white/50 text-lg pointer-events-none" aria-hidden />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? "Password (min 6 characters)" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                className="w-full bg-transparent border-b border-white/30 text-white placeholder:text-white/50 py-3.5 pl-8 pr-11 text-sm outline-none focus:border-white/90 focus-visible:ring-0 rounded-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-2 touch-target flex items-center justify-center text-white/60 hover:text-white rounded-lg"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`${showPassword ? "ri-eye-off-line" : "ri-eye-line"} text-lg`} aria-hidden />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-200 text-xs shrink-0" role="alert">
              {error}
            </p>
          )}

          <div className="flex-1 min-h-4" />

          <div className="shrink-0 space-y-4 pb-2">
            <button
              type="submit"
              className="w-full bg-white text-[#1a0b2e] font-semibold text-sm py-4 rounded-2xl shadow-xl hover:bg-white/95 active:scale-[0.99] transition-all"
            >
              {isSignup ? "Create account" : "Sign in"}
            </button>

            <p className="text-center text-white/60 text-xs">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                }}
                className="text-white underline font-medium rounded px-1 py-0.5 hover:bg-white/10"
              >
                {isSignup ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </form>

        {!isSignup && (
          <div className="relative z-20 mt-2 w-full shrink-0 space-y-3">
            <p className="text-center text-[11px] text-white/55">
              Demo cards log you in instantly (no page reload). Optional: add{" "}
              <span className="font-mono text-white/75">?demo=owner</span> or <span className="font-mono text-white/75">?demo=operator</span> if your host keeps the query string.
            </p>
            <p className="text-center text-[11px] text-white/55">
              Sign in: <span className="font-medium text-white/80">demo@mybus.in</span> (owner) or{" "}
              <span className="font-medium text-white/80">counter@mybus.in</span> (operator) — any password with 6+ characters.
            </p>
            {onBookOnline && (
              <button
                type="button"
                onClick={onBookOnline}
                className="w-full rounded-2xl border border-white/30 py-3 text-sm font-semibold text-white"
              >
                Book a ticket (customer)
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClearStored();
                setPassword("");
                setError("Saved accounts cleared. Sign in again or choose a demo panel above.");
              }}
              className="w-full py-2 text-center text-[11px] font-medium text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
            >
              Reset saved accounts on this device
            </button>
          </div>
        )}

        <div className="mt-4 flex shrink-0 items-center justify-center opacity-15">
          <svg className="h-auto w-full max-w-[200px]" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M20 45H180V25C180 15 170 10 160 10H40C30 10 20 15 20 25V45Z" stroke="white" strokeWidth="2" fill="white" fillOpacity="0.1" />
            <circle cx="45" cy="48" r="8" stroke="white" strokeWidth="2" fill="white" fillOpacity="0.3" />
            <circle cx="155" cy="48" r="8" stroke="white" strokeWidth="2" fill="white" fillOpacity="0.3" />
            <rect x="30" y="18" width="25" height="15" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.2" />
            <rect x="60" y="18" width="25" height="15" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.2" />
            <rect x="90" y="18" width="25" height="15" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.2" />
            <rect x="120" y="18" width="25" height="15" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.2" />
            <rect x="150" y="18" width="25" height="15" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
