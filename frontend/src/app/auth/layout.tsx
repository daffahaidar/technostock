import { FieldDescription } from "@/components/ui/field";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-dvh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        {children}
        <FieldDescription className="px-6 text-center">
          By clicking continue, you agree to our{" "}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </FieldDescription>
      </div>
    </main>
  );
}
