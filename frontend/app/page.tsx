import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { StatsSection } from "@/components/stats-section"
import { CTASection } from "@/components/cta-section"
import { Header } from "@/components/header"
import { AnimatedBackground } from "@/components/animated-background"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <AnimatedBackground />
      <Header />
      <main>
        <HeroSection />
        <HowItWorks />
        <StatsSection />
        <CTASection />
      </main>
    </div>
  )
}
