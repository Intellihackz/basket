"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useMockSession } from "@/lib/mock-session";
import { AVATAR_STYLES } from "@/lib/avatar-styles";
import Avatar from "@/components/Avatar";

type Step = "choose" | "verify" | "customize";

const emptySubscribe = () => () => {};

export default function SignInModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!open || !isClient) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1a14]/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <SignInDialogContent onClose={onClose} />
    </div>,
    document.body
  );
}

function SignInDialogContent({ onClose }: { onClose: () => void }) {
  const { signIn, setAvatar } = useMockSession();
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [avatarChoice, setAvatarChoice] = useState(0);

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setUsername(email.split("@")[0]);
    setStep("verify");
  }

  function continueWithGoogle() {
    setUsername("you");
    setStep("customize");
  }

  function finish() {
    signIn(username.trim() || "you", email.trim() || "Google account");
    setAvatar(avatarChoice);
    onClose();
  }

  return (
    <div
      className="elevated w-full max-w-sm rounded-3xl border border-border-subtle bg-surface p-7 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {step === "choose" && (
        <ChooseStep
          email={email}
          setEmail={setEmail}
          onGoogle={continueWithGoogle}
          onSubmitEmail={submitEmail}
        />
      )}
      {step === "verify" && (
        <VerifyStep email={email} onBack={() => setStep("choose")} onVerified={() => setStep("customize")} />
      )}
      {step === "customize" && (
        <CustomizeStep
          username={username}
          setUsername={setUsername}
          avatarChoice={avatarChoice}
          setAvatarChoice={setAvatarChoice}
          onFinish={finish}
        />
      )}
    </div>
  );
}


function ChooseStep({
  email,
  setEmail,
  onGoogle,
  onSubmitEmail,
}: {
  email: string;
  setEmail: (v: string) => void;
  onGoogle: () => void;
  onSubmitEmail: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <h2 className="text-lg font-semibold tracking-tight">Sign in to Basket</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Create an account to publish indexes and build a portfolio. Connect a wallet later —
        whenever you&apos;re ready to actually invest.
      </p>

      <button
        onClick={onGoogle}
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg border border-border-subtle bg-surface py-2.5 text-sm font-medium transition-all duration-150 hover:bg-surface-hover active:scale-[0.98]"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-border-subtle" />
        or
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      <form onSubmit={onSubmitEmail} className="flex flex-col gap-2.5">
        <input
          type="email"
          required
          autoFocus
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border-subtle bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
        />
        <button
          type="submit"
          className="mt-1.5 rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground transition-all duration-150 hover:bg-accent-strong active:scale-[0.98]"
        >
          Continue with email
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        We&apos;ll email you a verification code — no password needed.
      </p>
    </>
  );
}

function VerifyStep({
  email,
  onBack,
  onVerified,
}: {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function updateDigit(i: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);

    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) {
      setTimeout(onVerified, 200);
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  return (
    <div className="text-center">
      <button
        onClick={onBack}
        className="mb-2 inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
      >
        <span aria-hidden>←</span> Back
      </button>

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-xl">
        ✉️
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">Check your email</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Enter the 6-digit code we sent to{" "}
        <span className="font-medium text-foreground">{email || "your email"}</span>.
      </p>

      <div className="mt-6 flex justify-center gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            onChange={(e) => updateDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            className="h-12 w-10 rounded-lg border border-border-subtle bg-background text-center text-lg font-medium outline-none transition-colors focus:border-accent"
          />
        ))}
      </div>

      <p className="mt-5 text-xs text-muted">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={() => setDigits(Array(6).fill(""))}
          className="font-medium text-accent-strong hover:underline"
        >
          Resend
        </button>
      </p>
    </div>
  );
}

function CustomizeStep({
  username,
  setUsername,
  avatarChoice,
  setAvatarChoice,
  onFinish,
}: {
  username: string;
  setUsername: (v: string) => void;
  avatarChoice: number;
  setAvatarChoice: (i: number) => void;
  onFinish: () => void;
}) {
  return (
    <div className="text-center">
      <h2 className="text-lg font-semibold tracking-tight">Customize your account</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">Give your account a face and a name.</p>

      <div className="mt-6 flex flex-col items-center">
        <Avatar username={username || "you"} size={72} styleIndex={avatarChoice} />
        <p className="mt-2 text-xs font-medium tracking-wide text-muted uppercase">
          {AVATAR_STYLES[avatarChoice].ticker}
        </p>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {AVATAR_STYLES.map((style, i) => (
          <button
            key={style.src}
            onClick={() => setAvatarChoice(i)}
            aria-label={`Use ${style.ticker} avatar`}
            className={`rounded-xl p-0.5 transition-all duration-150 active:scale-90 ${
              avatarChoice === i ? "ring-2 ring-accent" : "ring-1 ring-transparent hover:ring-border-subtle"
            }`}
          >
            <Avatar username={username || "you"} size={32} styleIndex={i} />
          </button>
        ))}
      </div>

      <label className="mt-6 block text-left text-xs font-medium text-muted">Username</label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
        placeholder="Choose a username"
        className="mt-1.5 w-full rounded-lg border border-border-subtle bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
      />

      <button
        onClick={onFinish}
        disabled={!username.trim()}
        className="mt-5 w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground transition-all duration-150 hover:bg-accent-strong active:scale-[0.98] disabled:opacity-40"
      >
        Continue
      </button>
      <button
        onClick={onFinish}
        className="mt-3 text-xs text-muted transition-colors hover:text-foreground"
      >
        Skip for now
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.1c.95-2.85 3.6-4.97 6.73-4.97Z"
      />
    </svg>
  );
}
