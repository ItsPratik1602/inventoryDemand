import { useEffect, useState } from "react";
import { subscribeToGlobalLoading } from "../lib/loading-store.js";

function GlobalLoader() {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => subscribeToGlobalLoading(setActiveRequests), []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 transition-opacity duration-200 ${
        activeRequests > 0 ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={activeRequests > 0 ? "false" : "true"}
    >
      <div className="global-loader-bar h-full w-full origin-left bg-[color:var(--accent)]" />
    </div>
  );
}

export default GlobalLoader;
