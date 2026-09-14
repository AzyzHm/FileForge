import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-sm hover:brightness-105 disabled:opacity-50 disabled:hover:brightness-100",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-40 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-950/70",
  ghost:
    "text-slate-400 hover:text-slate-600 disabled:opacity-40 dark:hover:text-slate-200",
  link: "text-brand-700 hover:underline disabled:opacity-40 dark:text-brand-300",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    variant === "link"
      ? "text-xs font-medium transition-colors"
      : "rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-[0.97]";

  return (
    <button
      type={type}
      className={`${base} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
