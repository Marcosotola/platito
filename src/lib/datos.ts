"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { firebaseConfigurado, obtenerDb } from "./firebase";
import { cartaInicial } from "./cartaInicial";
import {
  CONFIG_INICIAL,
  type Categoria,
  type Config,
  type Menu,
  type Producto,
} from "./tipos";

export type Carta = {
  menus: Menu[];
  categorias: Categoria[];
  productos: Producto[];
  config: Config;
};

export type Coleccion = "menus" | "categorias" | "productos";

export type Op =
  | { tipo: "set"; col: Coleccion; id: string; datos: Record<string, unknown> }
  | { tipo: "update"; col: Coleccion; id: string; datos: Record<string, unknown> }
  | { tipo: "delete"; col: Coleccion; id: string }
  | { tipo: "config"; datos: Partial<Config> };

export const modoDemo = !firebaseConfigurado;

const porOrden = <T extends { orden: number }>(a: T, b: T) =>
  (a.orden ?? 0) - (b.orden ?? 0);

function ordenar(c: Carta): Carta {
  return {
    menus: [...c.menus].sort(porOrden),
    categorias: [...c.categorias].sort(porOrden),
    productos: [...c.productos].sort(porOrden),
    config: { ...CONFIG_INICIAL, ...c.config },
  };
}

function limpiar(datos: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(datos)) {
    if (k !== "id" && v !== undefined) out[k] = v;
  }
  return out;
}

export function nuevoId(): string {
  const abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  const r = crypto.getRandomValues(new Uint8Array(20));
  for (const b of r) s += abc[b % abc.length];
  return s;
}

/* ------------------------------------------------------------------ */
/* Modo demostración: todo vive en el navegador (localStorage).        */
/* ------------------------------------------------------------------ */

const CLAVE_DEMO = "platito-demo-v1";
let demo: Carta | null = null;
const oyentesDemo = new Set<(c: Carta) => void>();

function leerDemo(): Carta {
  if (demo) return demo;
  try {
    const guardado = localStorage.getItem(CLAVE_DEMO);
    if (guardado) {
      demo = ordenar(JSON.parse(guardado) as Carta);
      return demo;
    }
  } catch {
    /* sin almacenamiento: se usa la carta inicial */
  }
  demo = ordenar({ ...cartaInicial(), config: CONFIG_INICIAL });
  return demo;
}

function aplicarDemo(ops: Op[]) {
  const c = leerDemo();
  const sig: Carta = {
    menus: [...c.menus],
    categorias: [...c.categorias],
    productos: [...c.productos],
    config: { ...c.config },
  };
  for (const op of ops) {
    if (op.tipo === "config") {
      sig.config = { ...sig.config, ...op.datos };
      continue;
    }
    const lista = sig[op.col] as { id: string }[];
    const i = lista.findIndex((x) => x.id === op.id);
    if (op.tipo === "delete") {
      if (i >= 0) lista.splice(i, 1);
    } else if (op.tipo === "set") {
      const nuevo = { ...limpiar(op.datos), id: op.id };
      if (i >= 0) lista[i] = nuevo;
      else lista.push(nuevo);
    } else if (i >= 0) {
      lista[i] = { ...lista[i], ...limpiar(op.datos) };
    }
  }
  demo = ordenar(sig);
  try {
    localStorage.setItem(CLAVE_DEMO, JSON.stringify(demo));
  } catch {
    /* sin almacenamiento: los cambios duran hasta recargar */
  }
  oyentesDemo.forEach((f) => f(demo!));
}

export function reiniciarDemo() {
  try {
    localStorage.removeItem(CLAVE_DEMO);
  } catch {}
  demo = null;
  const c = leerDemo();
  oyentesDemo.forEach((f) => f(c));
}

/* ------------------------------------------------------------------ */
/* Lectura en tiempo real                                              */
/* ------------------------------------------------------------------ */

function suscribirFirestore(cb: (c: Carta) => void): () => void {
  const db = obtenerDb();
  const estado: Partial<Carta> = {};
  const listos = new Set<string>();
  const emitir = () => {
    if (listos.size < 4) return;
    cb(
      ordenar({
        menus: estado.menus ?? [],
        categorias: estado.categorias ?? [],
        productos: estado.productos ?? [],
        config: estado.config ?? CONFIG_INICIAL,
      }),
    );
  };
  const mapear = <T,>(d: { id: string; data(): DocumentData }) =>
    ({ id: d.id, ...d.data() }) as T;

  const subs = (["menus", "categorias", "productos"] as const).map((col) =>
    onSnapshot(
      collection(db, col),
      (snap) => {
        (estado as Record<string, unknown>)[col] = snap.docs.map((d) => mapear(d));
        listos.add(col);
        emitir();
      },
      (err) => {
        console.error(`Error leyendo ${col}`, err);
        listos.add(col);
        emitir();
      },
    ),
  );
  subs.push(
    onSnapshot(
      doc(db, "configuracion", "restaurante"),
      (snap) => {
        estado.config = { ...CONFIG_INICIAL, ...(snap.data() as Partial<Config>) };
        listos.add("config");
        emitir();
      },
      () => {
        listos.add("config");
        emitir();
      },
    ),
  );
  return () => subs.forEach((u) => u());
}

function suscribirDemo(cb: () => void) {
  oyentesDemo.add(cb);
  return () => {
    oyentesDemo.delete(cb);
  };
}

export function useCarta(): Carta | null {
  const [carta, setCarta] = useState<Carta | null>(null);
  const cartaDemo = useSyncExternalStore(
    suscribirDemo,
    () => (modoDemo ? leerDemo() : null),
    () => null,
  );
  useEffect(() => {
    if (modoDemo) return;
    return suscribirFirestore(setCarta);
  }, []);
  return modoDemo ? cartaDemo : carta;
}

/* ------------------------------------------------------------------ */
/* Escritura                                                           */
/* ------------------------------------------------------------------ */

export async function ejecutar(ops: Op[]): Promise<void> {
  if (!ops.length) return;
  if (modoDemo) {
    aplicarDemo(ops);
    return;
  }
  const db = obtenerDb();
  // Firestore admite hasta 500 escrituras por lote.
  for (let i = 0; i < ops.length; i += 450) {
    const lote = writeBatch(db);
    for (const op of ops.slice(i, i + 450)) {
      if (op.tipo === "config") {
        lote.set(doc(db, "configuracion", "restaurante"), limpiar(op.datos), {
          merge: true,
        });
      } else if (op.tipo === "delete") {
        lote.delete(doc(db, op.col, op.id));
      } else if (op.tipo === "set") {
        lote.set(doc(db, op.col, op.id), limpiar(op.datos));
      } else {
        lote.update(doc(db, op.col, op.id), limpiar(op.datos));
      }
    }
    await lote.commit();
  }
}

export function opsCartaInicial(): Op[] {
  const c = cartaInicial();
  return [
    ...c.menus.map((m) => ({ tipo: "set", col: "menus", id: m.id, datos: m }) as Op),
    ...c.categorias.map(
      (x) => ({ tipo: "set", col: "categorias", id: x.id, datos: x }) as Op,
    ),
    ...c.productos.map(
      (x) => ({ tipo: "set", col: "productos", id: x.id, datos: x }) as Op,
    ),
  ];
}
