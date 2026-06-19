import type { Metadata } from "next";
import { ChangePasswordClient } from "./ChangePasswordClient";

export const metadata: Metadata = {
  title: "Change Password — MomPlan Partner",
};

export default function ChangePasswordPage() {
  return <ChangePasswordClient />;
}
