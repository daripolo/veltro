import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/**
 * Shared horizontal shell for every landing section. Change the max width and
 * gutters here once — navbar, hero, sections and footer all inherit it.
 */
export function LandingContainer({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[112rem] px-5 sm:px-8 lg:px-12", className)}
      {...props}
    >
      {children}
    </div>
  )
}
