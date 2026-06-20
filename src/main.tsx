import { createRoot } from "preact/compat/client";

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
