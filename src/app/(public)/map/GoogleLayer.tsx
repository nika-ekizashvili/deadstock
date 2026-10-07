"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import s from "./map.module.css";

/**
 * Real 3D map of Tbilisi (Google Maps JS API, vector map + Advanced Markers).
 * Only used when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set; otherwise ShopMap draws the illustrated canvas.
 *
 * Tilt/heading and Advanced Markers need a vector Map ID (NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID). The dark
 * "night market" look comes from that Map ID's cloud-based style in the Google Cloud console — there is
 * no styles array here. Without a Map ID we fall back to Google's DEMO_MAP_ID (markers work, default style).
 */

// Inlined at build time (must be read as literal process.env.NEXT_PUBLIC_* expressions).
export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

const TBILISI = { lat: 41.715, lng: 44.79 };

// ---- Minimal typings for the parts of the Maps JS API we use (no @types/google.maps dependency) ----
type LatLng = { lat: number; lng: number };
interface GMap {
  panTo(p: LatLng): void;
}
interface GMarker {
  map: GMap | null;
  zIndex: number | null | undefined;
}
interface MapsLibrary {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
}
interface MarkerLibrary {
  AdvancedMarkerElement: new (opts: {
    map: GMap;
    position: LatLng;
    content: HTMLElement;
    title?: string;
    zIndex?: number;
  }) => GMarker;
}
interface GoogleMaps {
  importLibrary(name: "maps"): Promise<MapsLibrary>;
  importLibrary(name: "marker"): Promise<MarkerLibrary>;
}
declare global {
  interface Window {
    google?: { maps?: Partial<GoogleMaps> };
    gm_authFailure?: () => void;
    __dsMapsReady?: () => void;
  }
}

let loading: Promise<GoogleMaps> | null = null;

/** Injects the Maps JS bootstrap once (async loading + callback). */
function loadMaps(): Promise<GoogleMaps> {
  const ready = () => window.google?.maps?.importLibrary ? (window.google.maps as GoogleMaps) : null;
  const now = ready();
  if (now) return Promise.resolve(now);
  loading ??= new Promise<GoogleMaps>((resolve, reject) => {
    window.__dsMapsReady = () => {
      const g = ready();
      if (g) resolve(g);
      else reject(new Error("Google Maps loaded without importLibrary"));
    };
    const script = document.createElement("script");
    const q = new URLSearchParams({
      key: MAPS_KEY,
      v: "weekly",
      loading: "async",
      language: "ka",
      region: "GE",
      callback: "__dsMapsReady",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${q}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Google Maps script failed to load"));
    };
    document.head.append(script);
  });
  return loading;
}

type Point = { id: string; name: string; lat: number; lng: number };

export function GoogleLayer({
  points,
  sel,
  renderPin,
  onFail,
}: {
  points: Point[];
  sel: number;
  renderPin: (i: number) => ReactNode;
  onFail: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const markers = useRef<GMarker[]>([]);
  const [hosts, setHosts] = useState<HTMLElement[]>([]);
  const failRef = useRef(onFail);
  useEffect(() => {
    failRef.current = onFail;
  });

  // Create the map + one Advanced Marker per shop; React renders the pin into each marker's content node.
  useEffect(() => {
    let cancelled = false;
    // Called by the Maps API on an invalid/restricted key: switch to the illustrated map.
    window.gm_authFailure = () => failRef.current();

    loadMaps()
      .then(async (g) => {
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
          g.importLibrary("maps"),
          g.importLibrary("marker"),
        ]);
        if (cancelled || !box.current) return;
        const desktop = window.matchMedia("(min-width: 900px)").matches;
        const map = new Map(box.current, {
          mapId: MAP_ID,
          center: TBILISI,
          zoom: 13.5,
          tilt: 55,
          heading: -20,
          colorScheme: "DARK",
          backgroundColor: "#121211",
          disableDefaultUI: true,
          cameraControl: desktop,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        const els = points.map((p) => {
          const el = document.createElement("div");
          el.className = s.marker;
          markers.current.push(
            new AdvancedMarkerElement({ map, position: { lat: p.lat, lng: p.lng }, content: el, title: p.name }),
          );
          return el;
        });
        mapRef.current = map;
        setHosts(els);
      })
      .catch(() => {
        if (!cancelled) failRef.current();
      });

    return () => {
      cancelled = true;
      for (const m of markers.current) m.map = null;
      markers.current = [];
      mapRef.current = null;
      setHosts([]);
      if (window.gm_authFailure) window.gm_authFailure = undefined;
    };
  }, [points]);

  // Selected pin on top, camera follows the selection.
  useEffect(() => {
    markers.current.forEach((m, i) => (m.zIndex = i === sel ? 10 : 1));
    const p = points[sel];
    if (p && mapRef.current) mapRef.current.panTo({ lat: p.lat, lng: p.lng });
  }, [sel, points, hosts]);

  return (
    <>
      <div ref={box} className={s.gmap} />
      {hosts.map((el, i) => createPortal(renderPin(i), el, points[i]?.id ?? i))}
    </>
  );
}
