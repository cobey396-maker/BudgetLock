import type { Metadata } from "next";
import DeviceShell from "@/components/ui/DeviceShell";
import VerifyEmail from "@/components/screens/VerifyEmail";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  return (
    <DeviceShell>
      <VerifyEmail token={value ?? ""} />
    </DeviceShell>
  );
}
