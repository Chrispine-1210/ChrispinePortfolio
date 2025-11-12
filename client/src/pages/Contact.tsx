import { useEffect } from "react";
import { ContactForm } from "@/components/ContactForm";

export default function Contact() {
  useEffect(() => {
    document.title = "Contact | Chrispine Mndala";
  }, []);

  return (
    <div className="min-h-screen pt-16">
      <ContactForm />
    </div>
  );
}
