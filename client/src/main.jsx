import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* HashRouter dipakai supaya routing tetap jalan saat di-load dari file:// di Electron */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
