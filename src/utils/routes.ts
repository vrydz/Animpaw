export type LegalTabType = "privacy" | "terms" | "refund" | "about" | "contact" | "disclaimer";

export type AppRoute =
  | "/"
  | "/privacy-policy"
  | "/terms-of-service"
  | "/refund-policy"
  | "/about"
  | "/contact"
  | "/guide"
  | "/disclaimer";

export interface RouteResolution {
  route: AppRoute;
  legalTab?: LegalTabType;
  isGuide?: boolean;
}

export function getRouteFromPath(pathname: string): RouteResolution {
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  switch (cleanPath) {
    case "/privacy":
    case "/privacy-policy":
      return { route: "/privacy-policy", legalTab: "privacy" };
    case "/terms":
    case "/terms-of-service":
      return { route: "/terms-of-service", legalTab: "terms" };
    case "/refund":
    case "/refund-policy":
      return { route: "/refund-policy", legalTab: "refund" };
    case "/about":
    case "/about-us":
      return { route: "/about", legalTab: "about" };
    case "/contact":
    case "/contact-us":
      return { route: "/contact", legalTab: "contact" };
    case "/disclaimer":
      return { route: "/disclaimer", legalTab: "disclaimer" };
    case "/guide":
    case "/game-guide":
    case "/panduan":
      return { route: "/guide", isGuide: true };
    default:
      return { route: "/" };
  }
}

export function navigateToRoute(path: string, replace: boolean = false) {
  if (typeof window === "undefined") return;

  const current = window.location.pathname;
  if (current === path) return;

  if (replace) {
    window.history.replaceState({ path }, "", path);
  } else {
    window.history.pushState({ path }, "", path);
  }

  // Dispatch popstate event so listeners can update state reactively
  window.dispatchEvent(new Event("popstate"));
}
