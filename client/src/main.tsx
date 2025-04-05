import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 导入i18n配置
import "./i18n";

createRoot(document.getElementById("root")!).render(<App />);
