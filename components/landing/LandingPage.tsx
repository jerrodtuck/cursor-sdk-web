import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { BeforeAfterSection } from "@/components/landing/BeforeAfterSection";
import { CapabilitiesSection } from "@/components/landing/CapabilitiesSection";
import { CodeExampleSection } from "@/components/landing/CodeExampleSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LearnSection } from "@/components/landing/LearnSection";

export function LandingPage() {
  return (
    <main>
      <HeroSection />
      <ArchitectureSection />
      <CapabilitiesSection />
      <HowItWorksSection />
      <LearnSection />
      <CodeExampleSection />
      <BeforeAfterSection />
      <CtaSection />
    </main>
  );
}
