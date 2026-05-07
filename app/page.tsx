import { readSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { upsertUser } from "@/lib/firebase-admin/queries/users";

export default async function RootPage() {
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  redirect("/dashboard");
}
