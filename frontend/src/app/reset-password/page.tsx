import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
  title: "Reset Password - MomPlan",
  description: "Create a new password for your MomPlan account",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex justify-center items-center">Loading...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
