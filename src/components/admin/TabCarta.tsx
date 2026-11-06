"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Star,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  ejecutar,
  nuevoId,
  opsCartaInicial,
  type Carta,
  type Coleccion,
  type Op,
} from "@/lib/datos";
import type { Categoria, Menu, Producto } from "@/lib/tipos";
import EditorProducto from "./EditorProducto";
import {
  Boton,
  BotonIcono,
  Campo,
  Interruptor,
  Modal,
  claseEntrada,
  conAviso,
  confirmar,
  leerPrecio,
  precioEditable,
} from "./ui";

/** Intercambia un elemento con su vecino y renumera el orden. */
function opsMover<T extends { id: string; orden: number }>(
  col: Coleccion,
  lista: T[],
  i: number,
  dir: -1 | 1,
): Op[] {
  const j = i + dir;
  if (j < 0 || j >= lista.length) return [];
  const nueva = [...lista];
  [nueva[i], nueva[j]] = [nueva[j], nueva[i]];
  return nueva
    .map((x, k) => ({ x, k }))
    .filter(({ x, k }) => x.orden !== k)
    .map(({ x, k }) => ({ tipo: "update", col, id: x.id, datos: { orden: k } }) as Op);
}

const siguienteOrden = (l: { orden: number }[]) =>
  l.length ? Math.max(...l.map((x) => x.orden)) + 1 : 0;

export default function TabCarta({ carta }: { carta: Carta }) {
  const [menuElegido, setMenuId] = useState(carta.menus[0]?.id ?? "");
  const menuId = carta.menus.some((m) => m.id === menuElegido)
    ? menuElegido
    : (carta.menus[0]?.id ?? "");
  const [editandoMenu, setEditandoMenu] = useState<Menu | "nuevo" | null>(null);
  const [editandoCat, setEditandoCat] = useState<Categoria | "nueva" | null>(null);
  const [editandoProd, setEditandoProd] = useState<{
    producto: Producto | null;
    categoriaId: string;
  } | null>(null);

  if (carta.menus.length === 0) {
    return (
      <div className="rounded-3xl bg-papel p-8 text-center ring-1 ring-linea">
        <h2 className="font-display text-2xl font-semibold">La carta está vacía</h2>
        <p className="mx-auto mt-2 max-w-md text-apagado">
          Podés cargar de un clic la carta actual de Platito (los platos y precios
          de las cartas impresas) y después modificarla, o empezar de cero.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Boton
            onClick={() =>
              conAviso(() => ejecutar(opsCartaInicial()), "¡Carta cargada!")
            }
          >
            <Wand2 size={18} /> Cargar la carta actual
          </Boton>
          <Boton variante="secundario" onClick={() => setEditandoMenu("nuevo")}>
            <Plus size={18} /> Empezar de cero
          </Boton>
        </div>
        {editandoMenu && (
          <EditorMenu carta={carta} menu={null} onCerrar={() => setEditandoMenu(null)} onCreado={setMenuId} />
        )}
      </div>
    );
  }

  const menuIndex = carta.menus.findIndex((m) => m.id === menuId);
  const menu = carta.menus[menuIndex];
  const categorias = carta.categorias.filter((c) => c.menuId === menuId);

  async function borrarMenu() {
    if (!menu) return;
    const cats = carta.categorias.filter((c) => c.menuId === menu.id);
    const prods = carta.productos.filter((p) => cats.some((c) => c.id === p.categoriaId));
    if (
      !(await confirmar(
        `Se va a borrar la carta "${menu.nombre}" con sus ${cats.length} categorías y ${prods.length} productos.\nNo se puede deshacer.`,
        "Borrar todo",
      ))
    )
      return;
    await conAviso(
      () =>
        ejecutar([
          ...prods.map((p) => ({ tipo: "delete", col: "productos", id: p.id }) as Op),
          ...cats.map((c) => ({ tipo: "delete", col: "categorias", id: c.id }) as Op),
          { tipo: "delete", col: "menus", id: menu.id },
        ]),
      "Carta borrada",
    );
  }

  return (
    <div className="space-y-5">
      {/* Selector de cartas */}
      <div className="flex flex-wrap items-center gap-2">
        {carta.menus.map((m) => (
          <button
            key={m.id}
            onClick={() => setMenuId(m.id)}
            className={`rounded-full px-4 py-2 font-display text-[15px] font-medium transition ${
              m.id === menuId ? "bg-tinta text-white" : "bg-papel ring-1 ring-linea"
            } ${m.activo ? "" : "opacity-60"}`}
          >
            {m.nombre}
            {!m.activo && " (oculta)"}
          </button>
        ))}
        <Boton chico variante="fantasma" onClick={() => setEditandoMenu("nuevo")}>
          <Plus size={16} /> Nueva carta
        </Boton>
      </div>

      {menu && (
        <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-papel px-3 py-2 ring-1 ring-linea">
          <span className="mr-auto text-sm text-apagado">
            Carta <b className="text-tinta">{menu.nombre}</b> · {categorias.length} categorías
          </span>
          <BotonIcono title="Mover a la izquierda" aria-label="Mover a la izquierda" disabled={menuIndex === 0} onClick={() => conAviso(() => ejecutar(opsMover("menus", carta.menus, menuIndex, -1)))}>
            <ArrowLeft size={17} />
          </BotonIcono>
          <BotonIcono title="Mover a la derecha" aria-label="Mover a la derecha" disabled={menuIndex === carta.menus.length - 1} onClick={() => conAviso(() => ejecutar(opsMover("menus", carta.menus, menuIndex, 1)))}>
            <ArrowRight size={17} />
          </BotonIcono>
          <BotonIcono
            title={menu.activo ? "Ocultar carta" : "Mostrar carta"}
            aria-label={menu.activo ? "Ocultar carta" : "Mostrar carta"}
            onClick={() =>
              conAviso(
                () => ejecutar([{ tipo: "update", col: "menus", id: menu.id, datos: { activo: !menu.activo } }]),
                menu.activo ? "Carta oculta al público" : "Carta visible",
              )
            }
          >
            {menu.activo ? <Eye size={17} /> : <EyeOff size={17} />}
          </BotonIcono>
          <BotonIcono title="Renombrar" aria-label="Renombrar carta" onClick={() => setEditandoMenu(menu)}>
            <Pencil size={17} />
          </BotonIcono>
          <BotonIcono title="Borrar carta" aria-label="Borrar carta" onClick={borrarMenu} className="hover:text-terracota">
            <Trash2 size={17} />
          </BotonIcono>
        </div>
      )}

      {categorias.map((c, i) => (
        <BloqueCategoria
          key={c.id}
          carta={carta}
          categoria={c}
          indice={i}
          categorias={categorias}
          onEditar={() => setEditandoCat(c)}
          onEditarProducto={(p) => setEditandoProd({ producto: p, categoriaId: c.id })}
          onNuevoProducto={() => setEditandoProd({ producto: null, categoriaId: c.id })}
        />
      ))}

      <button
        onClick={() => setEditandoCat("nueva")}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-linea py-5 font-medium text-apagado transition hover:border-azul hover:text-azul"
      >
        <Plus size={18} /> Nueva categoría
      </button>

      {editandoMenu && (
        <EditorMenu
          carta={carta}
          menu={editandoMenu === "nuevo" ? null : editandoMenu}
          onCerrar={() => setEditandoMenu(null)}
          onCreado={setMenuId}
        />
      )}
      {editandoCat && (
        <EditorCategoria
          carta={carta}
          menuId={menuId}
          categoria={editandoCat === "nueva" ? null : editandoCat}
          onCerrar={() => setEditandoCat(null)}
        />
      )}
      {editandoProd && (
        <EditorProducto
          carta={carta}
          producto={editandoProd.producto}
          categoriaId={editandoProd.categoriaId}
          onCerrar={() => setEditandoProd(null)}
        />
      )}
    </div>
  );
}

function BloqueCategoria({
  carta,
  categoria: c,
  indice,
  categorias,
  onEditar,
  onEditarProducto,
  onNuevoProducto,
}: {
  carta: Carta;
  categoria: Categoria;
  indice: number;
  categorias: Categoria[];
  onEditar: () => void;
  onEditarProducto: (p: Producto) => void;
  onNuevoProducto: () => void;
}) {
  const productos = carta.productos.filter((p) => p.categoriaId === c.id);

  async function borrar() {
    if (
      !(await confirmar(
        productos.length
          ? `Se va a borrar la categoría "${c.nombre}" y sus ${productos.length} productos.`
          : `Se va a borrar la categoría "${c.nombre}".`,
        "Borrar",
      ))
    )
      return;
    await conAviso(
      () =>
        ejecutar([
          ...productos.map((p) => ({ tipo: "delete", col: "productos", id: p.id }) as Op),
          { tipo: "delete", col: "categorias", id: c.id },
        ]),
      "Categoría borrada",
    );
  }

  return (
    <section className={`rounded-3xl bg-papel ring-1 ring-linea ${c.activo ? "" : "opacity-70"}`}>
      <header className="flex items-center gap-1 border-b border-linea px-4 py-3">
        <div className="mr-auto min-w-0">
          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-tight text-azul sm:text-xl">
            {c.nombre}
            {!c.activo && <span className="ml-2 text-sm font-normal text-apagado">(oculta)</span>}
          </h3>
          {c.nota && <p className="truncate text-xs italic text-apagado">{c.nota}</p>}
        </div>
        <BotonIcono aria-label="Subir categoría" disabled={indice === 0} onClick={() => conAviso(() => ejecutar(opsMover("categorias", categorias, indice, -1)))}>
          <ArrowUp size={17} />
        </BotonIcono>
        <BotonIcono aria-label="Bajar categoría" disabled={indice === categorias.length - 1} onClick={() => conAviso(() => ejecutar(opsMover("categorias", categorias, indice, 1)))}>
          <ArrowDown size={17} />
        </BotonIcono>
        <BotonIcono
          aria-label={c.activo ? "Ocultar categoría" : "Mostrar categoría"}
          title={c.activo ? "Ocultar" : "Mostrar"}
          onClick={() => conAviso(() => ejecutar([{ tipo: "update", col: "categorias", id: c.id, datos: { activo: !c.activo } }]))}
        >
          {c.activo ? <Eye size={17} /> : <EyeOff size={17} />}
        </BotonIcono>
        <BotonIcono aria-label="Editar categoría" onClick={onEditar}>
          <Pencil size={17} />
        </BotonIcono>
        <BotonIcono aria-label="Borrar categoría" onClick={borrar} className="hover:text-terracota">
          <Trash2 size={17} />
        </BotonIcono>
      </header>

      <ul>
        {productos.map((p, i) => (
          <FilaAdmin
            key={p.id}
            p={p}
            primero={i === 0}
            ultimo={i === productos.length - 1}
            onMover={(dir) => conAviso(() => ejecutar(opsMover("productos", productos, i, dir)))}
            onEditar={() => onEditarProducto(p)}
          />
        ))}
      </ul>
      <div className="px-3 py-2">
        <Boton chico variante="fantasma" onClick={onNuevoProducto} className="text-azul">
          <Plus size={16} /> Agregar producto
        </Boton>
      </div>
    </section>
  );
}

function FilaAdmin({
  p,
  primero,
  ultimo,
  onMover,
  onEditar,
}: {
  p: Producto;
  primero: boolean;
  ultimo: boolean;
  onMover: (dir: -1 | 1) => void;
  onEditar: () => void;
}) {
  // Mientras se escribe se usa el texto local; si no, el precio guardado.
  const [editando, setPrecio] = useState<string | null>(null);
  const precio = editando ?? precioEditable(p.precio);
  const conVariantes = (p.variantes ?? []).length > 0;

  function guardarPrecio() {
    const nuevo = leerPrecio(precio);
    setPrecio(null);
    if (nuevo === p.precio) return;
    conAviso(
      () => ejecutar([{ tipo: "update", col: "productos", id: p.id, datos: { precio: nuevo } }]),
      `Precio de ${p.nombre} actualizado`,
    );
  }

  return (
    <li className="flex items-center gap-2 border-b border-dashed border-linea px-3 py-2.5 last:border-b-0 sm:px-4">
      <div className="flex flex-col">
        <button aria-label="Subir" disabled={primero} onClick={() => onMover(-1)} className="text-tinta/40 hover:text-tinta disabled:opacity-20">
          <ArrowUp size={14} />
        </button>
        <button aria-label="Bajar" disabled={ultimo} onClick={() => onMover(1)} className="text-tinta/40 hover:text-tinta disabled:opacity-20">
          <ArrowDown size={14} />
        </button>
      </div>
      {p.imagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imagen} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
      ) : null}
      <button onClick={onEditar} className="min-w-0 flex-1 text-left">
        <span className={`line-clamp-2 block font-medium leading-snug ${p.disponible ? "" : "text-apagado line-through"}`}>
          {p.nombre}
        </span>
        {conVariantes && (
          <span className="block truncate text-xs text-apagado">
            {p.variantes!.length} variantes · tocá para editar
          </span>
        )}
      </button>
      <button
        aria-label={p.destacado ? "Quitar de recomendados" : "Marcar como recomendado"}
        title="Recomendado"
        onClick={() => conAviso(() => ejecutar([{ tipo: "update", col: "productos", id: p.id, datos: { destacado: !p.destacado } }]))}
        className={p.destacado ? "text-ambar" : "text-tinta/20 hover:text-ambar"}
      >
        <Star size={19} fill={p.destacado ? "currentColor" : "none"} />
      </button>
      <div className="relative w-[5.5rem] shrink-0 sm:w-28">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-apagado">$</span>
        <input
          aria-label={`Precio de ${p.nombre}`}
          inputMode="numeric"
          value={precio}
          placeholder={conVariantes ? "—" : "Consultar"}
          onChange={(e) => setPrecio(precioEditable(leerPrecio(e.target.value)))}
          onBlur={guardarPrecio}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="w-full rounded-lg border border-linea bg-white py-1.5 pl-5 pr-2 text-right text-[15px] tabular-nums outline-none focus:border-azul focus:ring-2 focus:ring-azul/20"
        />
      </div>
      <Interruptor
        activo={p.disponible}
        etiqueta={`${p.nombre} disponible`}
        onChange={(v) =>
          conAviso(
            () => ejecutar([{ tipo: "update", col: "productos", id: p.id, datos: { disponible: v } }]),
            v ? `${p.nombre} disponible` : `${p.nombre} marcado como agotado`,
          )
        }
      />
    </li>
  );
}

function EditorMenu({
  carta,
  menu,
  onCerrar,
  onCreado,
}: {
  carta: Carta;
  menu: Menu | null;
  onCerrar: () => void;
  onCreado: (id: string) => void;
}) {
  const [nombre, setNombre] = useState(menu?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(menu?.descripcion ?? "");
  async function guardar() {
    if (!nombre.trim()) return;
    const id = menu?.id ?? nuevoId();
    const ok = await conAviso(
      () =>
        ejecutar([
          menu
            ? { tipo: "update", col: "menus", id, datos: { nombre: nombre.trim(), descripcion: descripcion.trim() } }
            : {
                tipo: "set",
                col: "menus",
                id,
                datos: { nombre: nombre.trim(), descripcion: descripcion.trim(), activo: true, orden: siguienteOrden(carta.menus) },
              },
        ]),
      menu ? "Carta actualizada" : "Carta creada",
    );
    if (ok) {
      if (!menu) onCreado(id);
      onCerrar();
    }
  }
  return (
    <Modal
      titulo={menu ? "Editar carta" : "Nueva carta"}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton onClick={guardar} disabled={!nombre.trim()}>Guardar</Boton>
        </>
      }
    >
      <div className="space-y-4">
        <Campo etiqueta="Nombre" ayuda="Ej: Almuerzo y cena, Cafetería y merienda, Menú del día">
          <input className={claseEntrada} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
        </Campo>
        <Campo etiqueta="Descripción (opcional)">
          <input className={claseEntrada} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Campo>
      </div>
    </Modal>
  );
}

function EditorCategoria({
  carta,
  menuId,
  categoria,
  onCerrar,
}: {
  carta: Carta;
  menuId: string;
  categoria: Categoria | null;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [nota, setNota] = useState(categoria?.nota ?? "");
  async function guardar() {
    if (!nombre.trim()) return;
    const ok = await conAviso(
      () =>
        ejecutar([
          categoria
            ? { tipo: "update", col: "categorias", id: categoria.id, datos: { nombre: nombre.trim(), nota: nota.trim() } }
            : {
                tipo: "set",
                col: "categorias",
                id: nuevoId(),
                datos: {
                  menuId,
                  nombre: nombre.trim(),
                  nota: nota.trim(),
                  activo: true,
                  orden: siguienteOrden(carta.categorias.filter((c) => c.menuId === menuId)),
                },
              },
        ]),
      categoria ? "Categoría actualizada" : "Categoría creada",
    );
    if (ok) onCerrar();
  }
  return (
    <Modal
      titulo={categoria ? "Editar categoría" : "Nueva categoría"}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton onClick={guardar} disabled={!nombre.trim()}>Guardar</Boton>
        </>
      }
    >
      <div className="space-y-4">
        <Campo etiqueta="Nombre" ayuda="Ej: Pastas, Pizzas, Postres">
          <input className={claseEntrada} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
        </Campo>
        <Campo etiqueta="Nota (opcional)" ayuda="Se muestra debajo del título. Ej: 8 porciones · Solo consumo en el local">
          <input className={claseEntrada} value={nota} onChange={(e) => setNota(e.target.value)} />
        </Campo>
      </div>
    </Modal>
  );
}
