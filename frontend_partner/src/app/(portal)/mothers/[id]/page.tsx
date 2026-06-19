import type { Metadata } from "next";
import { MotherDetailClient } from "./MotherDetailClient";

export const metadata: Metadata = {
  title: "Mother Details — MomPlan Partner",
};

export default function MotherDetailPage() {
  return <MotherDetailClient />;
}
