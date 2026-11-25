import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { capturePublicPageview } from "./client";

export function AnalyticsPageviews() {
  const { pathname } = useLocation();
  const previousPath = useRef<string | null>(null);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    capturePublicPageview(pathname);
  }, [pathname]);
  return null;
}
