'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn 
        redirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}