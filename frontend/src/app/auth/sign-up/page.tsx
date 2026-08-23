import { Suspense } from "react";
import SignUpForm from "./_components/sign-up";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Technostock",
  description: "Create an account on Technostock",
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
