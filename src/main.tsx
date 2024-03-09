import React from "react";
import ReactDOM from "react-dom/client";
import { MyRouter } from "./App.tsx";
import "./index.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "leaflet.photon/leaflet.photon.css";
import "leaflet.photon/leaflet.photon.js";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MyRouter />
    </BrowserRouter>
  </React.StrictMode>,
);
