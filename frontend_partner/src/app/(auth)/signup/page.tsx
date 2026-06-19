import type { Metadata } from "next";
import { SignupClient } from "./SignupClient";

export const metadata: Metadata = {
  title: "Register Your Organization — MomPlan Partner Portal",
};

export default function SignupPage() {
  return <SignupClient />;
}
