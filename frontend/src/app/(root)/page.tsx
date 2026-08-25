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

  let activeSub = null;
  if (session?.user) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    try {
      const mySubRes = await fetch(`${API_URL}/api/v1/main/subscriptions/my-active`, {
        headers: {
          "Authorization": `Bearer ${session.session.token}`,
          "Content-Type": "application/json"
        },
        cache: "no-store"
      });
      if (mySubRes.ok) {
        const subData = await mySubRes.json();
        if (subData?.data) {
          activeSub = subData.data;
        }
      }
    } catch (e) {
      console.error("Failed to fetch active subscription for pricing section", e);
    }
  }

  return (
    <main className="relative">
      <LandingNavbar user={session?.user || null} />
      <HeroSection />
      <ServicesSection />
      <FeaturesSection />
      <ProductShowcase />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection pricingData={pricingData} user={session?.user || null} activeSub={activeSub} />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
