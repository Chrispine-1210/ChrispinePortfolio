import { useEffect } from "react";
import { ExternalPosts as ExternalPostsComponent } from "@/components/ExternalPosts";

export default function ExternalPosts() {
  useEffect(() => {
    document.title = "EXTERNAL_INSIGHTS | Chrispine Mndala";
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0a0c14] relative">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ExternalPostsComponent />
      </div>
    </div>
  );
}
