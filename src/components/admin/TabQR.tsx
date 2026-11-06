"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink, FileImage, Printer } from "lucide-react";
import type { Carta } from "@/lib/datos";
import { Boton, Campo, avisar, claseEntrada } from "./ui";

const COLORES = {
  azul: { nombre: "Azul Platito", oscuro: "#0a2363" },
  negro: { nombre: "Negro", oscuro: "#000000" },
} as const;

function descargar(href: string, nombre: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });
}

function fuente(variable: string) {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(variable).trim() ||
    "sans-serif"
  );
}

/** Cartel para mesa tamaño A6 (1240 × 1748 px, 300 dpi). */
async function dibujarCartel(url: string, nombre: string, subtitulo: string) {
  const W = 1240;
  const H = 1748;
  const titulo = fuente("--font-titulo");
  const cuerpo = fuente("--font-cuerpo");
  await Promise.all([
    document.fonts.load(`600 100px ${titulo}`),
    document.fonts.load(`500 40px ${cuerpo}`),
  ]).catch(() => undefined);

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const espaciado = (v: string) => {
    if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = v;
  };

  // Fondo crema y banda de azulejos
  ctx.fillStyle = "#f8f4ec";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1450d2";
  ctx.fillRect(0, 0, W, 600);
  const tile = await cargarImagen(
    "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 40 40'><g fill='none' stroke='#fff' stroke-opacity='.22' stroke-width='1.4'><path d='M20 4c4 6 4 10 0 16-4-6-4-10 0-16zM20 36c4-6 4-10 0-16-4 6-4 10 0 16zM4 20c6-4 10-4 16 0-6 4-10 4-16 0zM36 20c-6-4-10-4-16 0 6 4 10 4 16 0z'/><circle cx='20' cy='20' r='2.2'/></g></svg>`,
      ),
  );
  ctx.fillStyle = ctx.createPattern(tile, "repeat")!;
  ctx.fillRect(0, 0, W, 600);
  ctx.fillStyle = "#f8f4ec";
  ctx.beginPath();
  ctx.ellipse(W / 2, 600, W * 0.75, 90, 0, Math.PI, 0, true);
  ctx.fill();

  // Óvalo con el nombre (como el cartel de la fachada)
  ctx.save();
  ctx.shadowColor = "rgba(10,35,99,.45)";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#1450d2";
  ctx.beginPath();
  ctx.ellipse(W / 2, 300, 430, 175, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(W / 2, 300, 430, 175, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([6, 12]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(W / 2, 300, 400, 150, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  espaciado("4px");
  ctx.font = `600 140px ${titulo}`;
  ctx.fillText(nombre.toUpperCase(), W / 2, 315, 700);
  if (subtitulo) {
    espaciado("10px");
    ctx.font = `600 40px ${cuerpo}`;
    ctx.fillText(subtitulo.toUpperCase(), W / 2, 395, 620);
    ctx.fillRect(W / 2 - 260, 345, 520, 3);
    ctx.fillRect(W / 2 - 260, 415, 520, 3);
  }

  // Llamado a la acción
  espaciado("0px");
  ctx.fillStyle = "#13204a";
  ctx.font = `600 78px ${titulo}`;
  ctx.fillText("Escaneá y mirá", W / 2, 770);
  ctx.fillText("nuestra carta", W / 2, 858);

  // QR en tarjeta blanca
  const lado = 640;
  const x = (W - lado) / 2;
  const y = 975;
  ctx.fillStyle = "#ffffff";
  ctx.save();
  ctx.shadowColor = "rgba(19,32,74,.15)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.roundRect(x - 40, y - 40, lado + 80, lado + 80, 48);
  ctx.fill();
  ctx.restore();
  const qr = await cargarImagen(
    await QRCode.toDataURL(url, {
      width: lado,
      margin: 0,
      errorCorrectionLevel: "H",
      color: { dark: "#0a2363", light: "#ffffff" },
    }),
  );
  ctx.drawImage(qr, x, y, lado, lado);

  // Pie
  ctx.fillStyle = "#6b7184";
  ctx.font = `500 34px ${cuerpo}`;
  ctx.fillText("Apuntá la cámara de tu celular al código", W / 2, 1712);

  return c.toDataURL("image/png");
}

export default function TabQR({ carta }: { carta: Carta }) {
  const origen = (
    carta.config.urlPublica || (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/+$/, "");
  const [destino, setDestino] = useState("");
  const [color, setColor] = useState<keyof typeof COLORES>("azul");
  const [vista, setVista] = useState("");
  const [cartel, setCartel] = useState("");

  const url = origen ? `${origen}/${destino ? `#${destino}` : ""}` : "";
  const oscuro = COLORES[color].oscuro;

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: oscuro, light: "#ffffff" },
    }).then(setVista);
    dibujarCartel(url, carta.config.nombre || "Platito", carta.config.subtitulo).then(setCartel);
  }, [url, oscuro, carta.config.nombre, carta.config.subtitulo]);

  const sufijo = destino ? `-${destino}` : "";
  const esLocal = /localhost|127\.0\.0\.1/.test(origen);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-5 rounded-3xl bg-papel p-5 ring-1 ring-linea">
        <div>
          <h2 className="font-display text-xl font-semibold">Código QR de la carta</h2>
          <p className="mt-1 text-sm text-apagado">
            Imprimilo y ponelo en las mesas, la vidriera o el mostrador. Como la carta se edita
            desde acá, <b>el QR nunca cambia</b> aunque cambien los precios.
          </p>
        </div>

        <Campo
          etiqueta="Dirección de la carta"
          ayuda="Se toma de Ajustes → Dirección pública (tu dominio de Vercel)."
        >
          <div className="flex gap-2">
            <input className={`${claseEntrada} font-mono text-sm`} value={url} readOnly />
            <Boton
              variante="secundario"
              aria-label="Copiar link"
              onClick={() => navigator.clipboard.writeText(url).then(() => avisar("Link copiado"))}
            >
              <Copy size={17} />
            </Boton>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl px-3 ring-1 ring-linea hover:bg-crema" aria-label="Abrir carta">
              <ExternalLink size={17} />
            </a>
          </div>
        </Campo>
        {esLocal && (
          <p className="rounded-xl bg-ambar/20 px-3 py-2 text-sm">
            Estás en tu compu (localhost). Cargá la dirección de Vercel en <b>Ajustes</b> antes de
            imprimir el QR.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Abre en">
            <select className={claseEntrada} value={destino} onChange={(e) => setDestino(e.target.value)}>
              <option value="">La primera carta</option>
              {carta.menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Color">
            <select className={claseEntrada} value={color} onChange={(e) => setColor(e.target.value as keyof typeof COLORES)}>
              {Object.entries(COLORES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-linea">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {vista && <img src={vista} alt="Código QR de la carta" className="h-56 w-56" />}
          <div className="flex flex-wrap justify-center gap-2">
            <Boton
              onClick={async () =>
                descargar(
                  await QRCode.toDataURL(url, {
                    width: 2048,
                    margin: 2,
                    errorCorrectionLevel: "H",
                    color: { dark: oscuro, light: "#ffffff" },
                  }),
                  `qr-platito${sufijo}.png`,
                )
              }
            >
              <Download size={17} /> PNG
            </Boton>
            <Boton
              variante="secundario"
              onClick={async () => {
                const svg = await QRCode.toString(url, {
                  type: "svg",
                  margin: 2,
                  errorCorrectionLevel: "H",
                  color: { dark: oscuro, light: "#ffffff" },
                });
                const blob = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
                descargar(blob, `qr-platito${sufijo}.svg`);
                setTimeout(() => URL.revokeObjectURL(blob), 2000);
              }}
            >
              <FileImage size={17} /> SVG (para imprenta)
            </Boton>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-papel p-5 ring-1 ring-linea">
        <h2 className="font-display text-xl font-semibold">Cartel para mesa</h2>
        <p className="mt-1 text-sm text-apagado">
          Listo para imprimir en tamaño A6 (media hoja A5) y poner en un portacartel.
        </p>
        <div className="mt-4 grid place-items-center rounded-2xl bg-crema p-4">
          {cartel ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cartel} alt="Vista previa del cartel" className="w-full max-w-xs rounded-lg shadow-lg" />
          ) : (
            <div className="aspect-[1240/1748] w-full max-w-xs animate-pulse rounded-lg bg-linea" />
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Boton disabled={!cartel} onClick={() => descargar(cartel, `cartel-platito${sufijo}.png`)}>
            <Download size={17} /> Descargar cartel
          </Boton>
          <Boton
            variante="secundario"
            disabled={!cartel}
            onClick={() => {
              const w = window.open("", "_blank");
              if (!w) return;
              w.document.write(
                `<title>Cartel Platito</title><style>@page{size:A6;margin:0}body{margin:0}img{width:100%;display:block}</style><img src="${cartel}" onload="setTimeout(()=>print(),200)">`,
              );
              w.document.close();
            }}
          >
            <Printer size={17} /> Imprimir
          </Boton>
        </div>
      </div>
    </div>
  );
}
