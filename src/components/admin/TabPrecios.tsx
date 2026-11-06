"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Undo2 } from "lucide-react";
import { ejecutar, type Carta, type Op } from "@/lib/datos";
import { precioTexto } from "@/lib/formato";
import type { Producto, Variante } from "@/lib/tipos";
import { Boton, Campo, claseEntrada, conAviso, confirmar } from "./ui";

type Cambio = {
  p: Producto;
  precio: number | null;
  variantes: Variante[];
};

function ajustar(valor: number | null, factor: number, redondeo: number) {
  if (valor === null) return null;
  const nuevo = valor * factor;
  return redondeo > 0 ? Math.round(nuevo / redondeo) * redondeo : Math.round(nuevo);
}

export default function TabPrecios({ carta }: { carta: Carta }) {
  const [alcance, setAlcance] = useState("todo");
  const [porcentaje, setPorcentaje] = useState("10");
  const [redondeo, setRedondeo] = useState(100);
  const [anterior, setAnterior] = useState<Op[] | null>(null);
  const [aplicando, setAplicando] = useState(false);

  const productos = useMemo(() => {
    if (alcance === "todo") return carta.productos;
    if (alcance.startsWith("menu:")) {
      const id = alcance.slice(5);
      const cats = new Set(carta.categorias.filter((c) => c.menuId === id).map((c) => c.id));
      return carta.productos.filter((p) => cats.has(p.categoriaId));
    }
    return carta.productos.filter((p) => p.categoriaId === alcance.slice(4));
  }, [alcance, carta]);

  const pct = Number(porcentaje.replace(",", "."));
  const valido = Number.isFinite(pct) && pct !== 0 && pct > -90;
  const factor = 1 + pct / 100;

  const cambios: Cambio[] = useMemo(() => {
    if (!valido) return [];
    return productos
      .map((p) => ({
        p,
        precio: ajustar(p.precio, factor, redondeo),
        variantes: (p.variantes ?? []).map((v) => ({
          ...v,
          precio: ajustar(v.precio, factor, redondeo),
        })),
      }))
      .filter(
        (c) =>
          c.precio !== c.p.precio ||
          c.variantes.some((v, i) => v.precio !== c.p.variantes![i].precio),
      );
  }, [productos, factor, redondeo, valido]);

  async function aplicar() {
    if (
      !(await confirmar(
        `Se van a ${pct > 0 ? "aumentar" : "bajar"} un ${Math.abs(pct)}% los precios de ${cambios.length} productos.`,
        "Aplicar",
      ))
    )
      return;
    setAplicando(true);
    const deshacer: Op[] = cambios.map((c) => ({
      tipo: "update",
      col: "productos",
      id: c.p.id,
      datos: { precio: c.p.precio, variantes: c.p.variantes ?? [] },
    }));
    const ok = await conAviso(
      () =>
        ejecutar(
          cambios.map((c) => ({
            tipo: "update",
            col: "productos",
            id: c.p.id,
            datos: { precio: c.precio, variantes: c.variantes },
          })),
        ),
      "¡Precios actualizados!",
    );
    if (ok) setAnterior(deshacer);
    setAplicando(false);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-papel p-5 ring-1 ring-linea">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <TrendingUp size={20} className="text-azul" /> Actualizar precios en bloque
        </h2>
        <p className="mt-1 text-sm text-apagado">
          Subí (o bajá) todos los precios de una vez por porcentaje. Revisá la vista previa antes de aplicar.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="¿Qué precios?">
            <select className={claseEntrada} value={alcance} onChange={(e) => setAlcance(e.target.value)}>
              <option value="todo">Toda la carta</option>
              {carta.menus.map((m) => (
                <optgroup key={m.id} label={m.nombre}>
                  <option value={`menu:${m.id}`}>Toda “{m.nombre}”</option>
                  {carta.categorias
                    .filter((c) => c.menuId === m.id)
                    .map((c) => (
                      <option key={c.id} value={`cat:${c.id}`}>
                        {c.nombre}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Porcentaje" ayuda="Negativo para bajar (ej: -10)">
            <div className="relative">
              <input
                className={`${claseEntrada} pr-8`}
                inputMode="decimal"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-apagado">%</span>
            </div>
          </Campo>
          <Campo etiqueta="Redondear a">
            <select className={claseEntrada} value={redondeo} onChange={(e) => setRedondeo(Number(e.target.value))}>
              <option value={0}>Sin redondeo</option>
              <option value={10}>$10</option>
              <option value={50}>$50</option>
              <option value={100}>$100</option>
              <option value={500}>$500</option>
              <option value={1000}>$1.000</option>
            </select>
          </Campo>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Boton onClick={aplicar} disabled={!valido || !cambios.length || aplicando}>
            {aplicando ? "Aplicando…" : `Aplicar a ${cambios.length} productos`}
          </Boton>
          {anterior && (
            <Boton
              variante="secundario"
              onClick={async () => {
                const ok = await conAviso(() => ejecutar(anterior), "Se restauraron los precios anteriores");
                if (ok) setAnterior(null);
              }}
            >
              <Undo2 size={17} /> Deshacer último cambio
            </Boton>
          )}
        </div>
      </div>

      {valido && cambios.length > 0 && (
        <div className="overflow-hidden rounded-3xl bg-papel ring-1 ring-linea">
          <div className="border-b border-linea px-5 py-3 text-sm font-medium text-apagado">
            Vista previa
          </div>
          <ul className="max-h-[55vh] overflow-y-auto">
            {cambios.map((c) => (
              <li key={c.p.id} className="border-b border-dashed border-linea px-5 py-2.5 text-sm last:border-b-0">
                <div className="flex items-baseline gap-3">
                  <span className="flex-1">{c.p.nombre}</span>
                  {c.p.precio !== null && (
                    <span className="tabular-nums">
                      <span className="text-apagado line-through">{precioTexto(c.p.precio)}</span>{" "}
                      <b className="text-azul">{precioTexto(c.precio)}</b>
                    </span>
                  )}
                </div>
                {c.variantes.map((v, i) =>
                  v.precio !== null ? (
                    <div key={i} className="flex gap-3 pl-3 text-xs text-apagado">
                      <span className="flex-1">↳ {v.nombre}</span>
                      <span className="tabular-nums">
                        <span className="line-through">{precioTexto(c.p.variantes![i].precio)}</span>{" "}
                        <b className="text-azul">{precioTexto(v.precio)}</b>
                      </span>
                    </div>
                  ) : null,
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
