import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Panel · Platito",
  robots: { index: false, follow: false },
};

export default function Admin() {
  return <AdminApp />;
}
