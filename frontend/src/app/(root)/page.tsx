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
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/configs/tanstack-query";
import { queryPublicPricing } from "@/app/[panel]/subscriptions/plans/_queries/public-pricing";
import { queryActiveSubscription } from "@/app/[panel]/subscriptions/plans/_queries/active-subscription";

async function ServerSideData() {
  const session = await getSession();
  const token = session?.session?.token || "";

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(queryPublicPricing());
  
  if (token) {
    await queryClient.prefetchQuery(queryActiveSubscription(token));
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <PricingSection compact={false} />
    </HydrationBoundary>
  );
}

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
      <ServerSideData />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
