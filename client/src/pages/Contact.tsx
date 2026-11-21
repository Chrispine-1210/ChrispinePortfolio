import { useEffect } from "react";
import { ContactForm } from "@/components/ContactForm";
import { EditorialPage } from "@/components/editorial/EditorialPage";
import { setSEO } from "@/lib/seoHelper";
export default function Contact() {
  useEffect(() => {
    setSEO(
      "Contact | Chrispine Mndala",
      "Discuss a software, network, data or operating problem with Chrispine Mndala in Malawi.",
      "/contact",
    );
  }, []);
  return (
    <EditorialPage>
      <header style={{ padding: "25px 0 40px" }}>
        <span className="editorial-kicker">
          Contact / A conversation with a purpose
        </span>
        <h1>
          What are you
          <br />
          trying to <em>solve?</em>
        </h1>
        <p className="editorial-lead">
          Tell me about the people, the problem and the constraints. A useful
          conversation starts with the work that needs to change.
        </p>
      </header>
      <ContactForm embedded />
    </EditorialPage>
  );
}
