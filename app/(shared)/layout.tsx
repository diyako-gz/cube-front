import { Shell } from "@/components/Shell";

// Pages both teachers and students can open (settings).
export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return <Shell role="any">{children}</Shell>;
}
