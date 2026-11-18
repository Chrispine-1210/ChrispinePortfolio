import { useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ExternalPosts as ExternalPostsComponent } from "@/components/ExternalPosts";
export default function ExternalPosts() {
  useEffect(() => {
    document.title = "External references | Chrispine Mndala";
  }, []);
  return (
    <AdminShell
      title="External references"
      description="Manage linked material and external reading"
    >
      <ExternalPostsComponent />
    </AdminShell>
  );
}
