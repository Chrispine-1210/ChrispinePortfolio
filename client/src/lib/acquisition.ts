export interface AcquisitionTouch {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  referrer: string;
  landingPage: string;
  capturedAt: string;
}

export interface AcquisitionAttribution {
  firstTouch?: AcquisitionTouch;
  lastTouch?: AcquisitionTouch;
}

const FIRST_KEY = "portfolio:first-touch";
const LAST_KEY = "portfolio:last-touch";

function read(key: string): AcquisitionTouch | undefined {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return undefined;
    const touch = JSON.parse(value) as AcquisitionTouch;
    const capturedAt = new Date(touch.capturedAt).getTime();
    const oldest = Date.now() - 180 * 24 * 60 * 60 * 1000;
    if (!Number.isFinite(capturedAt) || capturedAt < oldest) {
      window.localStorage.removeItem(key);
      return undefined;
    }
    return touch;
  } catch {
    return undefined;
  }
}

function write(key: string, value: AcquisitionTouch) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Attribution must never block the public experience.
  }
}

function externalReferrer() {
  try {
    if (!document.referrer) return "";
    const url = new URL(document.referrer);
    return url.host === window.location.host ? "" : `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

export function captureAcquisitionTouch(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const referrer = externalReferrer();
  const safeParams = new URLSearchParams();
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "service"]) {
    const value = params.get(key);
    if (value) safeParams.set(key, value.slice(0, 240));
  }
  const safeSearch = safeParams.toString();

  const touch: AcquisitionTouch = {
    source: params.get("utm_source")?.slice(0, 160) ?? "",
    medium: params.get("utm_medium")?.slice(0, 120) ?? "",
    campaign: params.get("utm_campaign")?.slice(0, 180) ?? "",
    term: params.get("utm_term")?.slice(0, 240) ?? "",
    content: params.get("utm_content")?.slice(0, 240) ?? "",
    referrer: referrer.slice(0, 2048),
    landingPage: `${window.location.pathname}${safeSearch ? `?${safeSearch}` : ""}`.slice(0, 2048),
    capturedAt: new Date().toISOString(),
  };

  const attributable = Boolean(
    touch.source || touch.medium || touch.campaign || touch.referrer,
  );

  if (!read(FIRST_KEY)) write(FIRST_KEY, touch);
  if (!read(LAST_KEY) || attributable) write(LAST_KEY, touch);
}

export function getAcquisitionAttribution(): AcquisitionAttribution {
  if (typeof window === "undefined") return {};
  return {
    firstTouch: read(FIRST_KEY),
    lastTouch: read(LAST_KEY),
  };
}
