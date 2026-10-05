import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "link";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "h-9 px-4 border border-accent bg-accent text-white hover:bg-accent-hover hover:border-accent-hover",
  secondary: "h-9 px-4 border border-line bg-transparent text-ink hover:bg-surface",
  link: "h-auto p-0 text-accent underline underline-offset-2 hover:text-accent-hover",
};

/** Class string for elements (like Next <Link>) that should look like a button. */
export function buttonClass(variant: ButtonVariant = "primary", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return <button type={type} className={buttonClass(variant, className)} {...rest} />;
}
