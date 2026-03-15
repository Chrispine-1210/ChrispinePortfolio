export function setSEO(title: string, description: string, path: string = "/") {
  // Set page title
  document.title = title;

  // Update or create meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', description);

  // Update Open Graph tags
  const updateOGTag = (property: string, content: string) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  updateOGTag('og:title', title);
  updateOGTag('og:description', description);
  updateOGTag('og:url', `https://chrispine-portfolio.replit.dev${path}`);
  updateOGTag('og:type', 'website');
}
