import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "dark" | "link";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[12px] text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "h-10 px-4 border border-lime bg-lime text-on-lime hover:bg-lime-hover hover:border-lime-hover",
  secondary: "h-10 px-4 border border-line bg-card-2 text-text hover:border-text-3",
  /** Dark button for use on lime surfaces (the welcome screen). */
  dark: "h-11 px-5 border border-on-lime bg-on-lime text-lime hover:bg-card",
  link: "h-auto p-0 text-lime underline underline-offset-2 hover:text-lime-hover",
};

/** Class string for elements (like Next <Link>) that should look like a button. */
export function buttonClass(variant: ButtonVariant = "primary", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return <button type={type} className={buttonClass(variant, className)} {...rest} />;
}
