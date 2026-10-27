import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
            fontFamily: "var(--font-sans)",
          },
        }}
      />
      <AppShell
        user={{
          id: session.userId,
          email: session.email,
          username: session.username,
          storageQuota: session.storageQuota,
          storageUsed: session.storageUsed,
        }}
      >
        {children}
      </AppShell>
    </>
  );
}
