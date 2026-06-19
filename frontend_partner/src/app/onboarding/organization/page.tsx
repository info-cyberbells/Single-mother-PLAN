import type { Metadata } from "next";
import { OnboardingClient } from "./OnboardingClient";

export const metadata: Metadata = {
  title: "Setup Your Organization — MomPlan Partner Portal",
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
