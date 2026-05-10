import { Suspense } from "react";
import SignInForm from "./_components/sign-in";

export default function SignInPage() {
  return (
    <div className="flex flex-col">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
