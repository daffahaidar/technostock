import { Suspense } from "react";
import SignUpForm from "./_components/sign-up";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - AngelTrade",
  description: "Create an account on AngelTrade",
};

export default function SignUpPage() {
  return (
    <div className="flex flex-col">
      <Suspense>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
