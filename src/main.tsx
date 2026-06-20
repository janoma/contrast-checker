import { createRoot } from "preact/compat/client";

import "./index.css";
import { applyLocaleToDocument, detectAppLocale } from "./lib/locale";
import Root from "./Root.tsx";

// Apply lang/dir synchronously at module load (after HTML parse, before the
// first paint) so the document direction is correct from the very first frame
// and never subject to React's render/commit timing.
applyLocaleToDocument(detectAppLocale());

createRoot(document.getElementById("root") as HTMLElement).render(<Root />);
