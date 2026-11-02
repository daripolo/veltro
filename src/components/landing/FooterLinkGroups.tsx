import { JSX } from "react"
import { FooterLinkGroup, FooterLinkGroupProps } from "@/src/components/landing/FooterLinkGroup"

export type FooterLinkGroupsProps = {
  groups: FooterLinkGroupProps[]
}

export function FooterLinkGroups({ groups }: FooterLinkGroupsProps): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {groups.map((group) => (
        <FooterLinkGroup key={group.title} title={group.title} links={group.links} />
      ))}
    </div>
  )
}
