"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";

// จุดกึ่งกลางประเทศไทย — ใช้เป็นมุมมองเริ่มต้นตอนยังไม่มีพิกัดเท่านั้น
const THAILAND_CENTER: [number, number] = [13.7563, 100.5018];
const DEFAULT_ZOOM = 6;
// ซูมเข้าจนสุดที่ความละเอียดจริงของภาพถ่ายดาวเทียม ณ จุดนั้น ๆ (ดู probeMaxNativeZoom ด้านล่าง)
const PIN_ZOOM = 19;
// เกินจากนี้ Leaflet จะขยายภาพจากซูมที่ดีที่สุดที่หาได้ให้เอง (เบลอลงแต่ยังเห็นภาพ ไม่ใช่จอว่าง)
const ABSOLUTE_MAX_ZOOM = 22;

type Basemap = "satellite" | "street";

const ESRI_IMAGERY_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTRIBUTION =
  "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, GIS User Community";

/**
 * ค่าเริ่มต้นก่อนตรวจสอบจริง — Esri เอกสารไว้ว่าความละเอียดระดับนี้มีในพื้นที่ส่วนใหญ่ของโลก
 * (ซูม 19 มีเฉพาะ "บางเมือง" เท่านั้น) probeMaxNativeZoom() จะตรวจพิกัดจริงแล้วปรับให้เหมาะสมอีกที
 */
const DEFAULT_SATELLITE_MAX_NATIVE_ZOOM = 17;

// ขนาดไฟล์ตายตัวของ tile "Map data not yet available" ที่ Esri ส่งมาแทนภาพจริงเมื่อพื้นที่นั้น
// ไม่มีข้อมูลในซูมระดับนั้น (ทดสอบแล้วว่าคงที่ทุกครั้งที่ 2521 ไบต์ ไม่ว่าพิกัดไหน) ส่วนภาพจริง
// มีขนาดหลักหมื่นไบต์เสมอ ช่องว่างมากพอที่จะใช้แยกได้โดยไม่เสี่ยงเข้าใจภาพจริงผิดเป็นตัวว่าง
const PLACEHOLDER_TILE_BYTES_MAX = 4000;
const PROBE_ZOOMS = [19, 18, 17, 16, 15, 14] as const;
const PROBE_FLOOR_ZOOM = 13;

function tileXY(lat: number, lng: number, z: number): [number, number] {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return [x, y];
}

/**
 * เช็คว่าภาพถ่ายดาวเทียมของ Esri ที่พิกัดนี้มีความละเอียดจริงถึงซูมระดับไหน โดยยิง HEAD ไปที่
 * ไทล์จริงแล้วดู Content-Length — แทนที่จะเดาค่าเดียวสำหรับทั้งประเทศ (พื้นที่เมืองกับชนบทของไทย
 * มีความละเอียดภาพต่างกันมาก ค่าตายตัวค่าเดียวจึงมักโชว์ข้อความ "Map data not yet available"
 * แทนภาพในพื้นที่ที่ไม่มีการถ่ายละเอียดสูง) ยิงพร้อมกันทุกระดับซูมที่จะลอง (ไม่ทีละระดับ) เพื่อให้เร็ว
 */
async function probeMaxNativeZoom(lat: number, lng: number): Promise<number> {
  const checks = await Promise.all(
    PROBE_ZOOMS.map(async (z) => {
      const [x, y] = tileXY(lat, lng, z);
      try {
        const res = await fetch(ESRI_IMAGERY_URL.replace("{z}", String(z)).replace("{y}", String(y)).replace("{x}", String(x)), {
          method: "HEAD",
        });
        const size = Number(res.headers.get("content-length") ?? "0");
        return { z, hasImagery: size > PLACEHOLDER_TILE_BYTES_MAX };
      } catch {
        return { z, hasImagery: false };
      }
    }),
  );
  const best = checks.filter((c) => c.hasImagery).sort((a, b) => b.z - a.z)[0];
  return best?.z ?? PROBE_FLOOR_ZOOM;
}

function tileSourceFor(basemap: Basemap, satelliteMaxNativeZoom: number) {
  if (basemap === "street") {
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: ABSOLUTE_MAX_ZOOM,
      maxNativeZoom: 19,
    };
  }
  return {
    url: ESRI_IMAGERY_URL,
    attribution: ESRI_ATTRIBUTION,
    maxZoom: ABSOLUTE_MAX_ZOOM,
    maxNativeZoom: satelliteMaxNativeZoom,
  };
}

export function ShopMap({
  lat,
  lng,
  onPick,
}: {
  lat: string;
  lng: string;
  /** เรียกทุกครั้งที่ผู้ใช้แตะบนแผนที่หรือลากหมุดเอง */
  onPick: (lat: string, lng: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  // ให้ event handler ในแผนที่เรียก callback ล่าสุดเสมอ โดยไม่ต้องสร้างแผนที่ใหม่ทุกครั้งที่ onPick เปลี่ยน
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  // การ import "leaflet" เป็น dynamic ใช้เวลาสักครู่ ถ้าที่อยู่หาพิกัดเจอระหว่างที่รอโหลดอยู่พอดี
  // ค่า lat/lng ที่ closure ของ effect ตอน mount จับไว้จะเป็นค่าเก่า (ว่างเปล่า) ต้องอ่านจาก ref
  // ที่อัปเดตทุก render แทน ไม่งั้นแผนที่จะสร้างเสร็จแล้วค้างอยู่ที่มุมมองกว้างทั้งประเทศ
  const latLngRef = useRef({ lat, lng });
  latLngRef.current = { lat, lng };

  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const basemapRef = useRef(basemap);
  basemapRef.current = basemap;

  const [satelliteMaxNativeZoom, setSatelliteMaxNativeZoom] = useState(
    DEFAULT_SATELLITE_MAX_NATIVE_ZOOM,
  );
  const satelliteMaxNativeZoomRef = useRef(satelliteMaxNativeZoom);
  satelliteMaxNativeZoomRef.current = satelliteMaxNativeZoom;
  const lastProbedKeyRef = useRef<string>("");

  // สร้างแผนที่ครั้งเดียวตอน mount — import "leaflet" แบบ dynamic เพราะตัวไลบรารีแตะ window/document
  // ตั้งแต่ตอนโหลดโมดูล ถ้า import ตรง ๆ แบบ static จะพังตอนเรนเดอร์ฝั่งเซิร์ฟเวอร์
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [{ default: L }, iconUrl, iconRetinaUrl, shadowUrl] = await Promise.all([
        import("leaflet"),
        import("leaflet/dist/images/marker-icon.png"),
        import("leaflet/dist/images/marker-icon-2x.png"),
        import("leaflet/dist/images/marker-shadow.png"),
      ]);
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      // ไอคอนหมุดเริ่มต้นของ Leaflet หาไฟล์รูปด้วย URL สัมพัทธ์ที่บันเดิลเลอร์แก้ให้ไม่ได้
      // ต้อง import รูปตรง ๆ แล้วชี้ URL เองแทน ไม่งั้นหมุดจะไม่มีไอคอนให้เห็น
      // Turbopack คืนค่า default เป็น URL string ตรง ๆ ส่วน webpack (next/image loader) คืนเป็น
      // { src, width, height } — ต้องรองรับทั้งสองแบบ ไม่งั้น build ด้วยตัวไหนอีกตัวจะพัง
      const assetUrl = (mod: { default: string | { src: string } }): string =>
        typeof mod.default === "string" ? mod.default : mod.default.src;

      const icon = L.icon({
        iconUrl: assetUrl(iconUrl),
        iconRetinaUrl: assetUrl(iconRetinaUrl),
        shadowUrl: assetUrl(shadowUrl),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const current = latLngRef.current;
      const hasPin = Boolean(current.lat && current.lng);
      const initial: [number, number] = hasPin
        ? [Number(current.lat), Number(current.lng)]
        : THAILAND_CENTER;

      const map = L.map(containerRef.current, { maxZoom: ABSOLUTE_MAX_ZOOM }).setView(
        initial,
        hasPin ? PIN_ZOOM : DEFAULT_ZOOM,
      );
      const source = tileSourceFor(basemapRef.current, satelliteMaxNativeZoomRef.current);
      tileLayerRef.current = L.tileLayer(source.url, {
        attribution: source.attribution,
        maxZoom: source.maxZoom,
        maxNativeZoom: source.maxNativeZoom,
      }).addTo(map);

      const marker = L.marker(initial, { icon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onPickRef.current(pos.lat.toFixed(6), pos.lng.toFixed(6));
      });
      map.on("click", (event) => {
        marker.setLatLng(event.latlng);
        onPickRef.current(event.latlng.lat.toFixed(6), event.latlng.lng.toFixed(6));
      });

      mapRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
      leafletRef.current = null;
    };
    // สร้างแผนที่ครั้งเดียวโดยตั้งใจ — อ่านพิกัดเริ่มต้นผ่าน latLngRef ไม่ใช่ dependency
    // การอัปเดตตำแหน่งหลังจากนั้นทำผ่าน effect ถัดไปข้างล่าง ไม่สร้างแผนที่ใหม่
  }, []);

  // สลับพื้นแผนที่ (ดาวเทียม/ถนน) หรือปรับความละเอียดดาวเทียมที่ probe เจอใหม่ — สร้างเลเยอร์ใหม่
  // ทับของเดิม โดยไม่แตะตัวแผนที่หรือหมุด ผลตอนโหลดครั้งแรกอยู่ใน effect ด้านบนแล้ว ตัวนี้ทำงาน
  // เฉพาะตอนมีการเปลี่ยนแปลงหลังจากนั้น
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    tileLayerRef.current?.remove();
    const source = tileSourceFor(basemap, satelliteMaxNativeZoom);
    tileLayerRef.current = L.tileLayer(source.url, {
      attribution: source.attribution,
      maxZoom: source.maxZoom,
      maxNativeZoom: source.maxNativeZoom,
    }).addTo(map);
  }, [basemap, satelliteMaxNativeZoom]);

  // lat/lng เปลี่ยนจากภายนอก (หาเจอจากที่อยู่อัตโนมัติ หรือกดใช้ตำแหน่งเครื่อง) — ขยับหมุดตาม
  // ไม่แตะการสร้างแผนที่ซ้ำ เพราะจะรีเซ็ตมุมมอง/ซูมที่ผู้ใช้อาจปรับเองไว้
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !lat || !lng) return;
    const next: [number, number] = [Number(lat), Number(lng)];
    marker.setLatLng(next);
    map.setView(next, Math.max(map.getZoom(), PIN_ZOOM));
  }, [lat, lng]);

  // ทุกครั้งที่หมุดขยับไปจุดใหม่จริง ๆ ตรวจสอบว่าดาวเทียมมีภาพละเอียดถึงซูมระดับไหนของจุดนั้น
  // แล้วปรับ maxNativeZoom ให้ตรง — กันไม่ให้ซูมเข้าไปแล้วเจอข้อความ "Map data not yet available"
  useEffect(() => {
    if (!lat || !lng) return;
    const key = `${lat}|${lng}`;
    if (key === lastProbedKeyRef.current) return;
    lastProbedKeyRef.current = key;

    let cancelled = false;
    void (async () => {
      const zoom = await probeMaxNativeZoom(Number(lat), Number(lng));
      if (!cancelled) setSatelliteMaxNativeZoom(zoom);
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const tabClass = (active: boolean) =>
    `flex min-h-[40px] items-center px-3 text-fine font-semibold transition-colors ${
      active ? "bg-accent text-on-accent" : "bg-canvas text-ink-80 hover:bg-pearl"
    }`;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-80 w-full overflow-hidden rounded-lg ring-1 ring-hairline ring-inset sm:h-[26rem]"
        role="application"
        aria-label="แผนที่เลือกตำแหน่งร้าน แตะบนแผนที่หรือลากหมุดเพื่อปักตำแหน่งเอง"
      />
      {/* สลับดาวเทียม/แผนที่ถนน — วางลอยมุมขวาบน ไม่ใช้ shadow ตามกฎระบบ ใช้ ring แทน */}
      <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-full ring-1 ring-hairline">
        <button type="button" onClick={() => setBasemap("satellite")} className={tabClass(basemap === "satellite")}>
          ภาพถ่ายดาวเทียม
        </button>
        <button type="button" onClick={() => setBasemap("street")} className={tabClass(basemap === "street")}>
          แผนที่ถนน
        </button>
      </div>
    </div>
  );
}
