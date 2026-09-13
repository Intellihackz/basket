"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import { useSession } from "@/lib/session";
import { AVATAR_STYLES } from "@/lib/avatar-styles";

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 10" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProfilePage() {
  const session = useSession();

  const [usernameDraft, setUsernameDraft] = useState(session.username ?? "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyWallet() {
    if (!session.walletShort) return;
    navigator.clipboard?.writeText(session.walletShort);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveUsername() {
    const next = usernameDraft.trim().toLowerCase();
    if (next === session.username) return;
    if (!/^[a-z0-9]{3,20}$/.test(next)) {
      setUsernameError("3-20 characters, lowercase letters and numbers only");
      return;
    }
    setSavingUsername(true);
    setUsernameError(null);
    const result = await session.setUsername(next);
    setSavingUsername(false);
    if (!result.ok) {
      setUsernameError(result.error ?? "Failed to update username");
    }
  }

  if (!session.signedIn || !session.username) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="animate-fade-up flex flex-col items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-8">
          <h1 className="font-display text-2xl font-medium text-foreground">Sign in to view your profile</h1>
          <p className="text-sm leading-relaxed text-muted">Your account, avatar, and wallet live here.</p>
          <button
            onClick={() => session.signIn()}
            className="mt-2 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95 cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const username = session.username;
  const usernameDirty = usernameDraft.trim().toLowerCase() !== username && usernameDraft.trim().length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="animate-fade-up font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Your profile
      </h1>

      <div
        className="animate-fade-up mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]"
        style={{ animationDelay: "150ms" }}
      >
        {/* Identity card */}
        <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-surface p-8 text-center">
          <Avatar username={username} size={140} styleIndex={session.avatarIndex} />
          <p className="mt-4 font-display text-xl font-medium text-foreground">@{username}</p>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {AVATAR_STYLES.map((style, i) => (
              <button
                key={style.src}
                onClick={() => session.setAvatar(i)}
                aria-label={`Use ${style.ticker} avatar`}
                className={`rounded-xl p-1 transition-all duration-150 active:scale-95 cursor-pointer ${
                  session.avatarIndex === i ? "ring-2 ring-accent" : "hover:bg-surface-hover"
                }`}
                title={style.ticker}
              >
                <Avatar username={username} size={36} styleIndex={i} />
              </button>
            ))}
          </div>
        </div>

        {/* Account card */}
        <div className="rounded-2xl border border-border-subtle bg-surface p-8">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted">Username</label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-border-subtle bg-background px-4 py-2.5">
                <span className="font-display text-sm text-muted">@</span>
                <input
                  value={usernameDraft}
                  onChange={(e) => {
                    setUsernameDraft(e.target.value);
                    setUsernameError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && saveUsername()}
                  className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
                />
              </div>
              {usernameDirty && (
                <button
                  onClick={saveUsername}
                  disabled={savingUsername}
                  aria-label="Save username"
                  className="flex shrink-0 items-center justify-center rounded-xl bg-accent p-2.5 text-accent-foreground transition-colors hover:bg-accent-strong disabled:opacity-40 cursor-pointer"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            {usernameError && <p className="mt-1.5 text-xs text-negative">{usernameError}</p>}
          </div>

          <div className="mt-7 flex flex-col gap-2 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-medium text-foreground">Account</h3>
              <p className="mt-0.5 text-sm text-muted">Signed in as @{username}</p>
            </div>
            <button
              onClick={session.signOut}
              className="self-start rounded-xl border border-border-subtle px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:border-negative hover:text-negative cursor-pointer sm:self-auto"
            >
              Sign out
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${session.walletLinked ? "bg-positive" : "bg-muted/50"}`}
              />
              <div>
                <h3 className="font-display text-base font-medium text-foreground">Solana wallet</h3>
                <p className="mt-0.5 text-sm text-muted">
                  {session.walletLinked ? (
                    <>
                      Connected · <span className="font-mono text-foreground">{session.walletShort}</span>
                    </>
                  ) : (
                    "Connect a wallet to buy into baskets."
                  )}
                </p>
              </div>
            </div>
            {session.walletLinked ? (
              <button
                onClick={copyWallet}
                className="self-start text-sm font-medium text-accent hover:underline cursor-pointer sm:self-auto"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            ) : (
              <button
                onClick={session.linkWallet}
                className="self-start rounded-xl bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95 cursor-pointer sm:self-auto"
              >
                Connect wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
