import code from "@assets/portfolio-editorial/photo-code.webp";
import collaboration from "@assets/portfolio-editorial/photo-collaboration.webp";
import contact from "@assets/portfolio-editorial/photo-contact.webp";
import library from "@assets/portfolio-editorial/photo-library.webp";
import planning from "@assets/portfolio-editorial/photo-planning.webp";
import reading from "@assets/portfolio-editorial/photo-reading.webp";
import workspace from "@assets/portfolio-editorial/photo-workspace.webp";
import writing from "@assets/portfolio-editorial/photo-writing.webp";
import { cn } from "@/lib/utils";

const photos = {
  code: { src: code, alt: "Close-up of a computer display showing code", author: "Bernd Dittrich", slug: "computer-screen-displaying-code-and-text-XIpm0bnYOQE" },
  collaboration: { src: collaboration, alt: "A person using a smartphone beside an open laptop", author: "Christina @ wocintechchat.com", slug: "person-using-smartphone-and-macbook-UTw3j_aoIKM" },
  contact: { src: contact, alt: "A smartphone resting on a patterned notebook on a wooden table", author: "Swello", slug: "smartphone-on-notebook-and-laptop-on-table-CGvC8yWgC-g" },
  library: { src: library, alt: "Rows of books on wooden library shelves", author: "Susan Q Yin", slug: "books-on-brown-wooden-shelf-2JIvboGLeho" },
  planning: { src: planning, alt: "Colleagues discussing work around a table with a laptop", author: "Headway", slug: "person-gesturing-during-meeting-with-laptop-5QgIuuBxKwM" },
  reading: { src: reading, alt: "A pen resting on the pages of an open book", author: "Aaron Burden", slug: "an-open-book-with-a-pen-on-top-of-it-lmRtD8vciXM" },
  workspace: { src: workspace, alt: "A desktop monitor and accessories on a workspace desk", author: "Slava Keyzman", slug: "turned-on-flat-screen-monitor-white-wooden-desk-ZG4Y6lLPARw" },
  writing: { src: writing, alt: "A hand writing notes with a pen", author: "Alexander Mass", slug: "a-person-writing-in-a-notebook-with-a-pen-5Nqc_YugFao" },
};

export function articlePhoto(category: string): keyof typeof photos {
  switch (category.toLowerCase()) {
    case "programming":
    case "ai & data":
    case "networking":
    case "hardware engineering":
    case "infrastructure":
      return "code";
    case "leadership":
    case "career":
      return "planning";
    case "mel":
      return "library";
    default:
      return "writing";
  }
}

export function editorialPhotoSource(photo: keyof typeof photos) {
  return photos[photo].src;
}

export function PhotoCredit({ photo }: { photo: keyof typeof photos }) {
  const { author, slug } = photos[photo];

  return <>Editorial photo by <a href={"https://unsplash.com/photos/" + slug} className="underline underline-offset-2">{author}</a> on Unsplash</>;
}

export function EditorialPhoto({ photo, className, eager = false }: {
  photo: keyof typeof photos;
  className?: string;
  eager?: boolean;
}) {
  const { src, alt } = photos[photo];

  return (
    <figure className={cn("overflow-hidden rounded-2xl border border-white/10 bg-card", className)}>
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className="aspect-[16/9] w-full object-cover" />
      <figcaption className="px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <PhotoCredit photo={photo} />
      </figcaption>
    </figure>
  );
}
