import { FieldDescription } from "@/components/ui/field";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex h-dvh flex-col items-center justify-center p-6 md:p-10 bg-luxury-black overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(212,175,55,0.08),transparent)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm space-y-6">
        {children}
        <FieldDescription className="px-6 text-center text-white/50">
          By clicking continue, you agree to our{" "}
          <a href="#" className="text-[#D4AF37] hover:text-[#F3CA52] transition-colors">Terms of Service</a> and <a href="#" className="text-[#D4AF37] hover:text-[#F3CA52] transition-colors">Privacy Policy</a>.
        </FieldDescription>
      </div>
    </main>
  );
}
