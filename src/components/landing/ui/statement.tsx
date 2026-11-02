import type { StatementPart } from "@/src/components/landing/landing-config"
import { IconChip } from "@/src/components/landing/ui/icon-chip"

/**
 * Renders display copy that mixes plain text with inline icon chips, mirroring
 * the reference's headline treatment. Chips are decorative, so assistive tech
 * reads the sentence as ordinary prose.
 */
export function Statement({ parts }: { parts: StatementPart[] }) {
  return parts.map((part, index) =>
    part.type === "text" ? (
      <span key={index}>{part.value}</span>
    ) : (
      <IconChip
        key={index}
        icon={part.icon}
        size="sm"
        className="sm:size-9 sm:rounded-[11px] sm:[&_svg]:size-5"
      />
    ),
  )
}
