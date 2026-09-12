export type AvatarStyle = { src: string; ticker: string };

export const AVATAR_STYLES: AvatarStyle[] = [
  { src: "/avatar-1.png", ticker: "NVDA" },
  { src: "/avatar-2.png", ticker: "AAPL" },
  { src: "/avatar-3.png", ticker: "TSLA" },
  { src: "/avatar-4.png", ticker: "MSFT" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function indexForUsername(username: string): number {
  return hashString(username) % AVATAR_STYLES.length;
}
