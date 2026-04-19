
  import { createRoot } from "react-dom/client";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import iconUrl from "leaflet/dist/images/marker-icon.png";
  import shadowUrl from "leaflet/dist/images/marker-shadow.png";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Fix Leaflet's default marker icons (broken by bundlers) once at app boot.
  L.Marker.prototype.options.icon = L.icon({
    iconUrl,
    shadowUrl,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  createRoot(document.getElementById("root")!).render(<App />);
  