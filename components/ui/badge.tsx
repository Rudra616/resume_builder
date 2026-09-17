import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        error:
          "border-[color-mix(in_srgb,var(--severity-error)_25%,transparent)] bg-[var(--severity-error-bg)] text-[var(--severity-error)]",
        warning:
          "border-[color-mix(in_srgb,var(--severity-warning)_25%,transparent)] bg-[var(--severity-warning-bg)] text-[var(--severity-warning)]",
        info: "border-[color-mix(in_srgb,var(--severity-suggestion)_25%,transparent)] bg-[var(--severity-suggestion-bg)] text-[var(--severity-suggestion)]",
        success:
          "border-[color-mix(in_srgb,var(--severity-success)_25%,transparent)] bg-[var(--severity-success-bg)] text-[var(--severity-success)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
