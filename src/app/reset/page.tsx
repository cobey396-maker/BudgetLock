import type { Metadata } from "next";
import DeviceShell from "@/components/ui/DeviceShell";
import ResetPassword from "@/components/screens/ResetPassword";

export const metadata: Metadata = {
  title: "Reset your password",
  // A reset link must never reach an index.
  robots: { index: false, follow: false },
};

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  return (
    <DeviceShell>
      <ResetPassword token={value ?? ""} />
    </DeviceShell>
  );
}
