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
import PricingSection from "./_components/pricing-section";
import { getPublicPricingData } from "@/modules/subscription-plan/actions/get-public-pricing";

export default async function Home() {
  const session = await getSession();
  const pricingData = await getPublicPricingData();

  return (
    <main className="relative">
      <LandingNavbar user={session?.user || null} />
      <HeroSection />
      <ServicesSection />
      <FeaturesSection />
      <ProductShowcase />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection pricingData={pricingData} />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
