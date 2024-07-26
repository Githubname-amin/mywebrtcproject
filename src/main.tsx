// @ts-ignore
import React from "react";
// @ts-ignore
import ReactDOM from "react-dom/client";
// 配置了allowImportingTsExtensions，因此需要省略.tsx后缀，否则报错
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
