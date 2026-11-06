"use client";

import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { ejecutar, modoDemo, reiniciarDemo, type Carta } from "@/lib/datos";
import type { Config } from "@/lib/tipos";
import { Boton, Campo, claseEntrada, conAviso, confirmar } from "./ui";

const CAMPOS: {
  clave: keyof Config;
  etiqueta: string;
  ayuda?: string;
  placeholder?: string;
  largo?: boolean;
}[] = [
  { clave: "nombre", etiqueta: "Nombre del local", placeholder: "Platito" },
  { clave: "subtitulo", etiqueta: "Subtítulo", placeholder: "Comedor casero" },
  {
    clave: "aviso",
    etiqueta: "Aviso destacado",
    ayuda: "Aparece arriba de la carta. Ideal para promos o novedades. Dejalo vacío para ocultarlo.",
    placeholder: "Ej: ¡Los martes 2x1 en pintas!",
    largo: true,
  },
  {
    clave: "horarios",
    etiqueta: "Horarios",
    placeholder: "Lunes a sábado de 12 a 16 y de 20 a 00 h",
    largo: true,
  },
  { clave: "direccion", etiqueta: "Dirección", placeholder: "Calle 123, Ciudad" },
  {
    clave: "mapsUrl",
    etiqueta: "Link de Google Maps (opcional)",
    ayuda: "Si lo dejás vacío se busca la dirección en Google Maps.",
  },
  {
    clave: "whatsapp",
    etiqueta: "WhatsApp",
    ayuda: "Con característica, sin 0 ni 15. Ej: 351 1234567. Muestra un botón flotante.",
  },
  { clave: "instagram", etiqueta: "Instagram", placeholder: "@platito" },
  { clave: "notaPie", etiqueta: "Nota al pie de la carta", largo: true },
  {
    clave: "urlPublica",
    etiqueta: "Dirección pública de la carta",
    ayuda: "La URL de Vercel o tu dominio (ej: https://platito.vercel.app). Se usa para el QR.",
    placeholder: "https://platito.vercel.app",
  },
];

export default function TabAjustes({ carta }: { carta: Carta }) {
  const [datos, setDatos] = useState<Config>(carta.config);
  const [guardando, setGuardando] = useState(false);
  const cambiado = CAMPOS.some((c) => datos[c.clave] !== carta.config[c.clave]);

  async function guardar() {
    setGuardando(true);
    const limpio = Object.fromEntries(
      Object.entries(datos).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]),
    ) as Config;
    await conAviso(() => ejecutar([{ tipo: "config", datos: limpio }]), "Ajustes guardados");
    setGuardando(false);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-papel p-5 ring-1 ring-linea">
        <h2 className="font-display text-xl font-semibold">Datos del local</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CAMPOS.map((c) => (
            <div key={c.clave} className={c.largo ? "sm:col-span-2" : ""}>
              <Campo etiqueta={c.etiqueta} ayuda={c.ayuda}>
                {c.largo ? (
                  <textarea
                    className={`${claseEntrada} min-h-20`}
                    value={datos[c.clave]}
                    placeholder={c.placeholder}
                    onChange={(e) => setDatos({ ...datos, [c.clave]: e.target.value })}
                  />
                ) : (
                  <input
                    className={claseEntrada}
                    value={datos[c.clave]}
                    placeholder={c.placeholder}
                    onChange={(e) => setDatos({ ...datos, [c.clave]: e.target.value })}
                  />
                )}
              </Campo>
            </div>
          ))}
        </div>
        <div className="sticky bottom-3 mt-5 flex justify-end">
          <Boton onClick={guardar} disabled={!cambiado || guardando} className="shadow-lg">
            <Save size={17} /> {guardando ? "Guardando…" : "Guardar cambios"}
          </Boton>
        </div>
      </div>

      {modoDemo && (
        <div className="rounded-3xl bg-papel p-5 ring-1 ring-linea">
          <h2 className="font-display text-lg font-semibold">Modo demostración</h2>
          <p className="mt-1 text-sm text-apagado">
            Volvé la carta de prueba a como estaba al principio.
          </p>
          <Boton
            variante="secundario"
            className="mt-3"
            onClick={async () => {
              if (await confirmar("Se pierden los cambios hechos en esta demo.", "Restablecer")) {
                reiniciarDemo();
              }
            }}
          >
            <RotateCcw size={17} /> Restablecer demo
          </Boton>
        </div>
      )}
    </div>
  );
}
