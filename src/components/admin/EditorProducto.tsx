"use client";

import { useRef, useState } from "react";
import { Camera, ImageOff, Plus, Trash2 } from "lucide-react";
import { ejecutar, nuevoId, type Carta } from "@/lib/datos";
import { comprimirImagen } from "@/lib/imagen";
import { ETIQUETAS, type Producto } from "@/lib/tipos";
import {
  Boton,
  BotonIcono,
  Campo,
  Interruptor,
  Modal,
  avisar,
  claseEntrada,
  conAviso,
  confirmar,
  leerPrecio,
  precioEditable,
} from "./ui";

type VarianteEdit = { nombre: string; precio: string };

export default function EditorProducto({
  carta,
  producto,
  categoriaId,
  onCerrar,
}: {
  carta: Carta;
  /** null = producto nuevo */
  producto: Producto | null;
  categoriaId: string;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precio, setPrecio] = useState(precioEditable(producto?.precio));
  const [variantes, setVariantes] = useState<VarianteEdit[]>(
    (producto?.variantes ?? []).map((v) => ({
      nombre: v.nombre,
      precio: precioEditable(v.precio),
    })),
  );
  const [imagen, setImagen] = useState(producto?.imagen ?? "");
  const [etiquetas, setEtiquetas] = useState<string[]>(producto?.etiquetas ?? []);
  const [disponible, setDisponible] = useState(producto?.disponible ?? true);
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);
  const [catId, setCatId] = useState(producto?.categoriaId ?? categoriaId);
  const [procesando, setProcesando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const archivoRef = useRef<HTMLInputElement>(null);

  async function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setProcesando(true);
    try {
      setImagen(await comprimirImagen(archivo));
    } catch (err) {
      avisar(err instanceof Error ? err.message : "No se pudo leer la foto", "error");
    } finally {
      setProcesando(false);
    }
  }

  async function guardar() {
    if (!nombre.trim()) {
      avisar("Poné un nombre al producto", "error");
      return;
    }
    setGuardando(true);
    const datos = {
      categoriaId: catId,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: leerPrecio(precio),
      variantes: variantes
        .filter((v) => v.nombre.trim())
        .map((v) => ({ nombre: v.nombre.trim(), precio: leerPrecio(v.precio) })),
      imagen,
      etiquetas,
      disponible,
      destacado,
    };
    let orden = producto?.orden ?? 0;
    if (!producto || producto.categoriaId !== catId) {
      const hermanos = carta.productos.filter((p) => p.categoriaId === catId);
      orden = hermanos.length ? Math.max(...hermanos.map((p) => p.orden)) + 1 : 0;
    }
    const ok = await conAviso(
      () =>
        ejecutar([
          {
            tipo: "set",
            col: "productos",
            id: producto?.id ?? nuevoId(),
            datos: { ...datos, orden },
          },
        ]),
      producto ? "Producto actualizado" : "Producto agregado",
    );
    setGuardando(false);
    if (ok) onCerrar();
  }

  async function borrar() {
    if (!producto) return;
    if (!(await confirmar(`Se va a borrar "${producto.nombre}" de la carta.`, "Borrar"))) return;
    const ok = await conAviso(
      () => ejecutar([{ tipo: "delete", col: "productos", id: producto.id }]),
      "Producto borrado",
    );
    if (ok) onCerrar();
  }

  return (
    <Modal
      titulo={producto ? "Editar producto" : "Nuevo producto"}
      onCerrar={onCerrar}
      pie={
        <>
          {producto && (
            <Boton variante="fantasma" className="mr-auto text-terracota" onClick={borrar}>
              <Trash2 size={17} /> Borrar
            </Boton>
          )}
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton onClick={guardar} disabled={guardando || procesando}>
            {guardando ? "Guardando…" : "Guardar"}
          </Boton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => archivoRef.current?.click()}
            className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-linea bg-crema text-apagado transition hover:border-azul hover:text-azul"
          >
            {imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagen} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-xs font-medium">
                <Camera size={24} />
                {procesando ? "Procesando…" : "Agregar foto"}
              </span>
            )}
          </button>
          <input
            ref={archivoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={elegirFoto}
          />
          <div className="flex-1 space-y-3">
            <Campo etiqueta="Nombre">
              <input
                className={claseEntrada}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Milanesa napolitana"
                autoFocus={!producto}
              />
            </Campo>
            {imagen && (
              <div className="flex gap-2">
                <Boton chico variante="secundario" onClick={() => archivoRef.current?.click()}>
                  <Camera size={15} /> Cambiar
                </Boton>
                <Boton chico variante="fantasma" onClick={() => setImagen("")}>
                  <ImageOff size={15} /> Quitar
                </Boton>
              </div>
            )}
          </div>
        </div>

        <Campo etiqueta="Descripción" ayuda="Opcional. Ingredientes, acompañamiento, tamaño…">
          <textarea
            className={`${claseEntrada} min-h-20`}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Con papas fritas o ensalada"
          />
        </Campo>

        <Campo
          etiqueta="Precio"
          ayuda={
            variantes.length
              ? "Si dejás el precio vacío se muestran sólo los precios de las variantes."
              : "Si lo dejás vacío se muestra “Consultar”."
          }
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-apagado">$</span>
            <input
              className={`${claseEntrada} pl-7`}
              inputMode="numeric"
              value={precio}
              onChange={(e) => setPrecio(precioEditable(leerPrecio(e.target.value)))}
              placeholder="0"
            />
          </div>
        </Campo>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">Variantes</span>
            <Boton
              chico
              variante="fantasma"
              onClick={() => setVariantes([...variantes, { nombre: "", precio: "" }])}
            >
              <Plus size={15} /> Agregar variante
            </Boton>
          </div>
          {variantes.length === 0 ? (
            <p className="text-xs text-apagado">
              Para platos con opciones de distinto precio (ej: Clásica, A caballo, Napolitana).
            </p>
          ) : (
            <div className="space-y-2">
              {variantes.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={claseEntrada}
                    value={v.nombre}
                    placeholder="Nombre"
                    onChange={(e) =>
                      setVariantes(variantes.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))
                    }
                  />
                  <input
                    className={`${claseEntrada} w-32`}
                    inputMode="numeric"
                    value={v.precio}
                    placeholder="$"
                    onChange={(e) =>
                      setVariantes(
                        variantes.map((x, j) =>
                          j === i ? { ...x, precio: precioEditable(leerPrecio(e.target.value)) } : x,
                        ),
                      )
                    }
                  />
                  <BotonIcono
                    aria-label="Quitar variante"
                    onClick={() => setVariantes(variantes.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={16} />
                  </BotonIcono>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Etiquetas</span>
          <div className="flex flex-wrap gap-2">
            {ETIQUETAS.map((e) => {
              const on = etiquetas.includes(e);
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() =>
                    setEtiquetas(on ? etiquetas.filter((x) => x !== e) : [...etiquetas, e])
                  }
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    on ? "bg-azul text-white" : "bg-white ring-1 ring-linea"
                  }`}
                >
                  {e}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-crema p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Disponible</p>
              <p className="text-xs text-apagado">Si lo apagás, aparece como “Agotado”.</p>
            </div>
            <Interruptor activo={disponible} onChange={setDisponible} etiqueta="Disponible" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Recomendado</p>
              <p className="text-xs text-apagado">Se muestra arriba, en “Recomendados de la casa”.</p>
            </div>
            <Interruptor activo={destacado} onChange={setDestacado} etiqueta="Recomendado" />
          </div>
        </div>

        <Campo etiqueta="Categoría">
          <select className={claseEntrada} value={catId} onChange={(e) => setCatId(e.target.value)}>
            {carta.menus.map((m) => (
              <optgroup key={m.id} label={m.nombre}>
                {carta.categorias
                  .filter((c) => c.menuId === m.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Campo>
      </div>
    </Modal>
  );
}
