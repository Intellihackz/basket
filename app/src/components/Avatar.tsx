import Image from "next/image";
import { AVATAR_STYLES, indexForUsername } from "@/lib/avatar-styles";

export default function Avatar({
  username,
  size = 24,
  styleIndex,
}: {
  username: string;
  size?: number;
  /** Overrides the username-derived default — used for the signed-in user's chosen avatar. */
  styleIndex?: number | null;
}) {
  const index =
    styleIndex != null && styleIndex >= 0 && styleIndex < AVATAR_STYLES.length
      ? styleIndex
      : indexForUsername(username);

  return (
    <Image
      src={AVATAR_STYLES[index].src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded-lg object-cover"
      style={{ width: size, height: size }}
    />
  );
}
