import type { KeyboardEvent, WheelEvent } from "react";

/** Blocks characters a number input otherwise accepts but that make no sense here: exponent notation and signs. */
export function blockInvalidNumberKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
}

/** Prevents the page-scroll-over-a-focused-number-input browser default from silently changing the value. */
export function blurOnWheel(e: WheelEvent<HTMLInputElement>) {
  e.currentTarget.blur();
}
