import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        new: "bg-brand/12 text-brand",
        prog: "bg-warning/18 text-[#9a7400]",
        done: "bg-success/14 text-[#15803d]",
        imp: "bg-destructive/12 text-destructive",
        lvl: "bg-foreground/6 text-foreground",
      },
    },
    defaultVariants: {
      variant: "lvl",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
