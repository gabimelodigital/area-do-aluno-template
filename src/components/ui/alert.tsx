import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva("rounded-xl border px-3 py-2 text-sm", {
  variants: {
    variant: {
      ok: "border-success/35 bg-success/8 text-[#166534]",
      err: "border-destructive/35 bg-destructive/7 text-[#991b1b]",
      warn: "border-warning/50 bg-warning/10 text-[#854d0e]",
      info: "border-brand/30 bg-brand/7 text-[#1e40af]",
    },
  },
  defaultVariants: {
    variant: "info",
  },
})

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role={variant === "err" ? "alert" : "status"}
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Alert, alertVariants }
