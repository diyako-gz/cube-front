import { Shell } from "@/components/Shell";


export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return <Shell role="any">{children}</Shell>;
}
