"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

/* ---------------- Avisos (toasts) ---------------- */

type Aviso = { id: number; texto: string; tipo: "ok" | "error" };

export function avisar(texto: string, tipo: Aviso["tipo"] = "ok") {
  window.dispatchEvent(new CustomEvent("platito-aviso", { detail: { texto, tipo } }));
}

/** Ejecuta una acción mostrando un aviso de éxito o de error. */
export async function conAviso(accion: () => Promise<unknown>, ok?: string) {
  try {
    await accion();
    if (ok) avisar(ok);
    return true;
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    avisar(
      msg.includes("permission")
        ? "No tenés permiso para hacer cambios. ¿Tu usuario está dado de alta como admin?"
        : `No se pudo guardar: ${msg}`,
      "error",
    );
    return false;
  }
}

export function Avisos() {
  const [lista, setLista] = useState<Aviso[]>([]);
  useEffect(() => {
    let n = 0;
    const f = (e: Event) => {
      const { texto, tipo } = (e as CustomEvent).detail;
      const id = ++n;
      setLista((l) => [...l, { id, texto, tipo }]);
      setTimeout(() => setLista((l) => l.filter((a) => a.id !== id)), 3500);
    };
    window.addEventListener("platito-aviso", f);
    return () => window.removeEventListener("platito-aviso", f);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 sm:bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      {lista.map((a) => (
        <div
          key={a.id}
          className={`aparecer pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            a.tipo === "ok" ? "bg-tinta" : "bg-terracota"
          }`}
        >
          {a.tipo === "ok" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {a.texto}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Botones y campos ---------------- */

type BotonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "peligro" | "fantasma";
  chico?: boolean;
};

export function Boton({
  variante = "primario",
  chico,
  className = "",
  ...props
}: BotonProps) {
  const estilos = {
    primario: "bg-azul text-white hover:bg-azul/90 shadow-sm",
    secundario: "bg-white text-tinta ring-1 ring-linea hover:bg-crema",
    peligro: "bg-terracota text-white hover:bg-terracota/90",
    fantasma: "text-tinta/70 hover:bg-tinta/5 hover:text-tinta",
  }[variante];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        chico ? "px-2.5 py-1.5 text-sm" : "px-4 py-2.5 text-[15px]"
      } ${estilos} ${className}`}
    />
  );
}

export function BotonIcono({
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-tinta/60 transition hover:bg-tinta/5 hover:text-tinta disabled:opacity-30 ${className}`}
    />
  );
}

export const claseEntrada =
  "w-full rounded-xl border border-linea bg-white px-3 py-2.5 text-[16px] outline-none transition placeholder:text-apagado/70 focus:border-azul focus:ring-2 focus:ring-azul/20";

export function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-tinta">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-apagado">{ayuda}</span>}
    </label>
  );
}

export function Interruptor({
  activo,
  onChange,
  etiqueta,
}: {
  activo: boolean;
  onChange: (v: boolean) => void;
  etiqueta?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={() => onChange(!activo)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        activo ? "bg-verde" : "bg-tinta/20"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          activo ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  titulo,
  onCerrar,
  children,
  pie,
}: {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
}) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", f);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", f);
      document.body.style.overflow = "";
    };
  }, [onCerrar]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="aparecer flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-papel shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-linea px-5 py-4">
          <h2 className="font-display text-xl font-semibold">{titulo}</h2>
          <BotonIcono onClick={onCerrar} aria-label="Cerrar">
            <X size={20} />
          </BotonIcono>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {pie && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-linea px-5 py-3">
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}

/** Diálogo de confirmación con promesa: `if (await confirmar(...))`. */
let resolverConfirmacion: ((v: boolean) => void) | null = null;

export function confirmar(texto: string, accion = "Confirmar"): Promise<boolean> {
  return new Promise((resolve) => {
    resolverConfirmacion = resolve;
    window.dispatchEvent(
      new CustomEvent("platito-confirmar", { detail: { texto, accion } }),
    );
  });
}

export function Confirmaciones() {
  const [pregunta, setPregunta] = useState<{ texto: string; accion: string } | null>(
    null,
  );
  useEffect(() => {
    const f = (e: Event) => setPregunta((e as CustomEvent).detail);
    window.addEventListener("platito-confirmar", f);
    return () => window.removeEventListener("platito-confirmar", f);
  }, []);
  if (!pregunta) return null;
  const responder = (v: boolean) => {
    resolverConfirmacion?.(v);
    resolverConfirmacion = null;
    setPregunta(null);
  };
  return (
    <Modal
      titulo="¿Seguro?"
      onCerrar={() => responder(false)}
      pie={
        <>
          <Boton variante="secundario" onClick={() => responder(false)}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={() => responder(true)}>
            {pregunta.accion}
          </Boton>
        </>
      }
    >
      <p className="whitespace-pre-line text-[15px]">{pregunta.texto}</p>
    </Modal>
  );
}

/** "20.500" o "$ 20500" -> 20500. Vacío -> null ("Consultar"). */
export function leerPrecio(texto: string): number | null {
  const limpio = texto.replace(/[^\d]/g, "");
  return limpio ? Number(limpio) : null;
}

export function precioEditable(precio: number | null | undefined): string {
  return typeof precio === "number" ? new Intl.NumberFormat("es-AR").format(precio) : "";
}
