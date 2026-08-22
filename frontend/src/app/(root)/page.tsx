import LandingNavbar from "./_components/landing-navbar";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import HeroSection from "./_components/hero-section";
import ServicesSection from "./_components/services-section";
import FeaturesSection from "./_components/features-section";
import ProductShowcase from "./_components/product-showcase";
import HowItWorksSection from "./_components/how-it-works-section";
import TestimonialsSection from "./_components/testimonials-section";
import CtaSection from "./_components/cta-section";
import LandingFooter from "./_components/landing-footer";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="relative">
      <LandingNavbar user={session?.user || null} />
      <HeroSection />
      <ServicesSection />
      <FeaturesSection />
      <ProductShowcase />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
