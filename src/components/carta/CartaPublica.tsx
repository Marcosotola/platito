"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import { Instagram } from "@/components/iconos";
import { useCarta } from "@/lib/datos";
import {
  linkInstagram,
  linkMaps,
  linkWhatsapp,
  normalizar,
  precioPrincipal,
  precioTexto,
} from "@/lib/formato";
import type { Categoria, Producto } from "@/lib/tipos";

export default function CartaPublica() {
  const carta = useCarta();
  const [menuElegido, setMenuId] = useState<string>("");
  // El QR puede apuntar a una carta puntual: https://.../#cafeteria
  const [hashInicial] = useState(() =>
    typeof window === "undefined" ? "" : decodeURIComponent(window.location.hash.slice(1)),
  );
  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [activaVista, setActiva] = useState<string>("");
  const [foto, setFoto] = useState<Producto | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const menus = useMemo(
    () => (carta?.menus ?? []).filter((m) => m.activo),
    [carta],
  );

  const menuId = menus.some((m) => m.id === menuElegido)
    ? menuElegido
    : (menus.find((m) => m.id === hashInicial)?.id ?? menus[0]?.id ?? "");

  const categorias = useMemo(() => {
    if (!carta) return [];
    return carta.categorias.filter((c) => c.activo && c.menuId === menuId);
  }, [carta, menuId]);

  const productosPorCategoria = useMemo(() => {
    const mapa = new Map<string, Producto[]>();
    for (const p of carta?.productos ?? []) {
      const lista = mapa.get(p.categoriaId) ?? [];
      lista.push(p);
      mapa.set(p.categoriaId, lista);
    }
    return mapa;
  }, [carta]);

  const activa = categorias.some((c) => c.id === activaVista)
    ? activaVista
    : (categorias[0]?.id ?? "");

  const destacados = useMemo(
    () =>
      categorias
        .flatMap((c) => productosPorCategoria.get(c.id) ?? [])
        .filter((p) => p.destacado && p.disponible),
    [categorias, productosPorCategoria],
  );

  const resultados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q || !carta) return null;
    const catsActivas = new Map(
      carta.categorias
        .filter((c) => c.activo && menus.some((m) => m.id === c.menuId))
        .map((c) => [c.id, c]),
    );
    return carta.productos
      .filter((p) => catsActivas.has(p.categoriaId))
      .filter((p) =>
        normalizar(`${p.nombre} ${p.descripcion ?? ""} ${p.detalle ?? ""} ${(p.etiquetas ?? []).join(" ")}`).includes(q),
      )
      .map((p) => ({ p, cat: catsActivas.get(p.categoriaId)! }));
  }, [busqueda, carta, menus]);

  // Resalta la categoría visible mientras se recorre la carta.
  useEffect(() => {
    if (resultados) return;
    const secciones = categorias
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter(Boolean) as HTMLElement[];
    if (!secciones.length) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiva(visible.target.id.replace("cat-", ""));
      },
      { rootMargin: "-150px 0px -55% 0px" },
    );
    secciones.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [categorias, resultados]);

  useEffect(() => {
    const chip = chipsRef.current?.querySelector<HTMLElement>(
      `[data-cat="${activa}"]`,
    );
    chip?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activa]);

  function cambiarMenu(id: string) {
    setMenuId(id);
    history.replaceState(null, "", `#${id}`);
    const ancla = document.getElementById("carta");
    if (ancla && window.scrollY > ancla.offsetTop) {
      window.scrollTo({ top: ancla.offsetTop, behavior: "smooth" });
    }
  }

  const config = carta?.config;
  const wa = config?.whatsapp ? linkWhatsapp(config.whatsapp, "¡Hola Platito! ") : "";
  const ig = config?.instagram ? linkInstagram(config.instagram) : "";
  const mapa = config ? linkMaps(config.direccion, config.mapsUrl) : "";

  return (
    <main className="min-h-dvh pb-24">
      {/* Portada */}
      <header className="relative isolate overflow-hidden bg-azul-noche text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/fotos/portada.jpg"
          alt="Fachada de Platito de noche"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-azul-noche/40 via-azul-noche/30 to-crema" />
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-10 pt-14 text-center sm:pt-20">
          <Logo
            nombre={config?.nombre || "Platito"}
            subtitulo={config?.subtitulo ?? "Comedor casero"}
            className="aparecer"
          />
          <p className="mt-8 font-display text-[13px] font-medium uppercase tracking-[0.3em] text-white drop-shadow">
            Nuestra carta
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {mapa && (
              <a href={mapa} target="_blank" rel="noreferrer" className="boton-portada">
                <MapPin size={16} /> Cómo llegar
              </a>
            )}
            {ig && (
              <a href={ig} target="_blank" rel="noreferrer" className="boton-portada">
                <Instagram size={16} /> Instagram
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="boton-portada">
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {config?.aviso ? (
        <div className="mx-auto -mt-2 max-w-3xl px-4">
          <div className="flex items-start gap-3 rounded-2xl border border-ambar/60 bg-ambar/15 px-4 py-3 text-sm text-tinta">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-terracota" />
            <p className="whitespace-pre-line">{config.aviso}</p>
          </div>
        </div>
      ) : null}

      {/* Barra fija: cartas, categorías y buscador */}
      <div
        id="carta"
        className="sticky top-0 z-30 mt-4 border-b border-linea bg-crema/90 backdrop-blur-md"
      >
        <div className="mx-auto max-w-3xl px-4 pt-3">
          {menus.length > 1 && !buscando && (
            <div className="mb-2 grid grid-flow-col auto-cols-fr gap-1 rounded-full bg-papel p-1 shadow-sm ring-1 ring-linea">
              {menus.map((m) => (
                <button
                  key={m.id}
                  onClick={() => cambiarMenu(m.id)}
                  className={`rounded-full px-3 py-2 font-display text-[15px] font-medium transition ${
                    m.id === menuId
                      ? "bg-azul text-white shadow"
                      : "text-tinta/70 hover:text-tinta"
                  }`}
                >
                  {m.nombre}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 pb-3">
            {buscando ? (
              <div className="flex flex-1 items-center gap-2 rounded-full bg-papel px-4 py-2 ring-1 ring-linea focus-within:ring-2 focus-within:ring-azul">
                <Search size={18} className="text-apagado" />
                <input
                  autoFocus
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscá un plato o bebida…"
                  className="w-full bg-transparent text-[16px] outline-none placeholder:text-apagado"
                />
                <button
                  aria-label="Cerrar búsqueda"
                  onClick={() => {
                    setBuscando(false);
                    setBusqueda("");
                  }}
                  className="text-apagado"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <div
                  ref={chipsRef}
                  className="sin-scroll -mx-1 flex flex-1 gap-2 overflow-x-auto px-1 [mask-image:linear-gradient(to_right,transparent,black_10px,black_calc(100%-20px),transparent)]"
                >
                  {categorias.map((c) => (
                    <a
                      key={c.id}
                      data-cat={c.id}
                      href={`#cat-${c.id}`}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                        activa === c.id
                          ? "bg-tinta text-white"
                          : "bg-papel text-tinta/80 ring-1 ring-linea"
                      }`}
                    >
                      {c.nombre}
                    </a>
                  ))}
                </div>
                <button
                  aria-label="Buscar en la carta"
                  onClick={() => setBuscando(true)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-azul text-white shadow"
                >
                  <Search size={17} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4">
        {!carta ? (
          <Esqueleto />
        ) : resultados ? (
          <section className="pt-6">
            <p className="mb-2 text-sm text-apagado">
              {resultados.length
                ? `${resultados.length} resultado${resultados.length === 1 ? "" : "s"}`
                : "No encontramos nada con esa búsqueda."}
            </p>
            <div className="rounded-3xl bg-papel px-4 ring-1 ring-linea sm:px-6">
              {resultados.map(({ p, cat }) => (
                <FilaProducto key={p.id} p={p} contexto={cat.nombre} onFoto={setFoto} />
              ))}
            </div>
          </section>
        ) : (
          <>
            {destacados.length > 0 && (
              <section className="pt-7">
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-azul">
                  <Sparkles size={18} /> Recomendados de la casa
                </h2>
                <div className="sin-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
                  {destacados.map((p) => (
                    <TarjetaDestacada key={p.id} p={p} onFoto={setFoto} />
                  ))}
                </div>
              </section>
            )}

            {categorias.map((c) => (
              <SeccionCategoria
                key={c.id}
                c={c}
                productos={productosPorCategoria.get(c.id) ?? []}
                onFoto={setFoto}
              />
            ))}

            {categorias.length === 0 && (
              <p className="py-16 text-center text-apagado">
                Estamos actualizando la carta. ¡Volvé en un ratito!
              </p>
            )}
          </>
        )}
      </div>

      {/* Pie */}
      {config && (
        <footer className="mx-auto mt-14 max-w-3xl px-4">
          <div className="azulejos h-3 rounded-full opacity-90" />
          <div className="grid gap-6 py-8 text-sm sm:grid-cols-2">
            <div>
              <p className="font-display text-xl font-semibold text-azul">
                {config.nombre}
              </p>
              <p className="text-apagado">{config.subtitulo}</p>
              {config.notaPie && (
                <p className="mt-3 max-w-sm text-apagado">{config.notaPie}</p>
              )}
            </div>
            <div className="space-y-2.5">
              {config.horarios && (
                <p className="flex gap-2">
                  <Clock size={17} className="mt-0.5 shrink-0 text-azul" />
                  <span className="whitespace-pre-line">{config.horarios}</span>
                </p>
              )}
              {config.direccion && (
                <a href={mapa} target="_blank" rel="noreferrer" className="flex gap-2 hover:underline">
                  <MapPin size={17} className="mt-0.5 shrink-0 text-azul" />
                  {config.direccion}
                </a>
              )}
              {ig && (
                <a href={ig} target="_blank" rel="noreferrer" className="flex gap-2 hover:underline">
                  <Instagram size={17} className="mt-0.5 shrink-0 text-azul" />
                  {config.instagram.startsWith("@") ? config.instagram : `@${config.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "")}`}
                </a>
              )}
            </div>
          </div>
          <p className="pb-4 text-center">
            <a href="/admin" className="text-xs text-apagado/60 hover:text-azul">
              Acceso del local
            </a>
          </p>
        </footer>
      )}

      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          aria-label="Escribinos por WhatsApp"
          className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/20 transition hover:scale-105"
        >
          <MessageCircle size={26} />
        </a>
      )}

      {foto && <FichaProducto p={foto} onCerrar={() => setFoto(null)} />}
    </main>
  );
}

function SeccionCategoria({
  c,
  productos,
  onFoto,
}: {
  c: Categoria;
  productos: Producto[];
  onFoto: (p: Producto) => void;
}) {
  if (!productos.length) return null;
  return (
    <section id={`cat-${c.id}`} className="scroll-mt-[150px] pt-10">
      <div className="mb-2 flex items-end gap-3">
        <h2 className="font-display text-[26px] font-semibold leading-none text-azul">
          {c.nombre}
        </h2>
        <span className="mb-1.5 h-px flex-1 bg-gradient-to-r from-azul/40 to-transparent" />
      </div>
      {c.nota && <p className="mb-1 text-sm italic text-apagado">{c.nota}</p>}
      <div className="rounded-3xl bg-papel px-4 shadow-[0_1px_0_rgba(0,0,0,.03)] ring-1 ring-linea sm:px-6">
        {productos.map((p) => (
          <FilaProducto key={p.id} p={p} onFoto={onFoto} />
        ))}
      </div>
    </section>
  );
}

function FilaProducto({
  p,
  contexto,
  onFoto,
}: {
  p: Producto;
  contexto?: string;
  onFoto: (p: Producto) => void;
}) {
  const variantes = (p.variantes ?? []).filter((v) => v.nombre.trim());
  const mostrarPrecio = !(p.precio === null && variantes.length > 0);
  const tieneFicha = Boolean(p.imagen || p.detalle?.trim());
  return (
    <article
      {...(tieneFicha
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": `Ver detalle de ${p.nombre}`,
            onClick: () => onFoto(p),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onFoto(p);
              }
            },
          }
        : {})}
      className={`flex gap-4 border-b border-dashed border-linea py-4 last:border-b-0 ${
        p.disponible ? "" : "opacity-55"
      } ${tieneFicha ? "-mx-2 cursor-pointer rounded-2xl px-2 transition active:bg-crema sm:hover:bg-crema/70" : ""}`}
    >
      {p.imagen ? (
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-linea ring-1 ring-linea sm:h-24 sm:w-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.imagen} alt={p.nombre} loading="lazy" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        {contexto && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-apagado">
            {contexto}
          </p>
        )}
        <div className="flex items-baseline gap-3">
          <h3 className="flex-1 font-display text-[17px] font-medium leading-snug text-tinta">
            {p.nombre}
          </h3>
          {mostrarPrecio && (
            <span
              className={`shrink-0 font-display text-[17px] font-semibold tabular-nums ${
                p.precio === null ? "text-sm font-medium text-apagado" : "text-azul"
              }`}
            >
              {precioPrincipal(p)}
            </span>
          )}
        </div>
        {p.descripcion && (
          <p className="mt-0.5 text-[14px] leading-snug text-apagado">{p.descripcion}</p>
        )}
        {p.detalle?.trim() && (
          <p className="mt-1 text-[13px] font-semibold text-azul">Ver más ›</p>
        )}
        {variantes.length > 0 && (
          <ul className="mt-2 space-y-1">
            {variantes.map((v, i) => (
              <li key={i} className="flex items-baseline gap-2 text-[15px]">
                <span>{v.nombre}</span>
                <span className="mb-1 flex-1 border-b border-dotted border-tinta/25" />
                <span className="font-semibold tabular-nums text-azul">
                  {precioTexto(v.precio)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {(!p.disponible || p.destacado || (p.etiquetas ?? []).length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {!p.disponible && <Etiqueta tono="gris">Agotado</Etiqueta>}
            {p.destacado && <Etiqueta tono="ambar">★ Recomendado</Etiqueta>}
            {(p.etiquetas ?? []).map((e) => (
              <Etiqueta key={e} tono={e === "Sin TACC" || e === "Veggie" ? "verde" : "azul"}>
                {e}
              </Etiqueta>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Etiqueta({
  children,
  tono,
}: {
  children: React.ReactNode;
  tono: "gris" | "ambar" | "verde" | "azul";
}) {
  const estilos = {
    gris: "bg-tinta/10 text-tinta",
    ambar: "bg-ambar/25 text-[#8a5a00]",
    verde: "bg-verde/12 text-verde",
    azul: "bg-azul/10 text-azul",
  }[tono];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${estilos}`}>
      {children}
    </span>
  );
}

function TarjetaDestacada({ p, onFoto }: { p: Producto; onFoto: (p: Producto) => void }) {
  return (
    <button
      onClick={() => onFoto(p)}
      className="group relative flex h-44 w-40 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-3xl bg-azul p-3 text-left text-white shadow-md sm:w-48"
    >
      {p.imagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.imagen}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="azulejos absolute inset-0" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-azul-noche/90 via-azul-noche/30 to-transparent" />
      <span className="relative font-display text-[16px] font-medium leading-tight">
        {p.nombre}
      </span>
      <span className="relative mt-1 font-display text-[15px] font-semibold text-ambar">
        {precioPrincipal(p)}
      </span>
    </button>
  );
}

function FichaProducto({ p, onCerrar }: { p: Producto; onCerrar: () => void }) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", f);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", f);
      document.body.style.overflow = anterior;
    };
  }, [onCerrar]);
  const variantes = (p.variantes ?? []).filter((v) => v.nombre.trim());
  const mostrarPrecio = !(p.precio === null && variantes.length > 0);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-azul-noche/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={p.nombre}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="aparecer relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-papel shadow-2xl sm:rounded-[28px]"
      >
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-tinta shadow-md"
        >
          <X size={18} />
        </button>
        <div className="overflow-y-auto">
          {p.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imagen} alt={p.nombre} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="azulejos h-16 w-full" />
          )}
          <div className="space-y-4 p-5 pb-8">
            <div>
              <div className="flex items-baseline gap-3">
                <h2 className="flex-1 font-display text-2xl font-semibold leading-tight">
                  {p.nombre}
                </h2>
                {mostrarPrecio && (
                  <span className="shrink-0 font-display text-xl font-semibold tabular-nums text-azul">
                    {precioPrincipal(p)}
                  </span>
                )}
              </div>
              {p.descripcion && <p className="mt-1 text-[15px] text-apagado">{p.descripcion}</p>}
            </div>

            {(!p.disponible || p.destacado || (p.etiquetas ?? []).length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {!p.disponible && <Etiqueta tono="gris">Agotado</Etiqueta>}
                {p.destacado && <Etiqueta tono="ambar">★ Recomendado</Etiqueta>}
                {(p.etiquetas ?? []).map((e) => (
                  <Etiqueta key={e} tono={e === "Sin TACC" || e === "Veggie" ? "verde" : "azul"}>
                    {e}
                  </Etiqueta>
                ))}
              </div>
            )}

            {variantes.length > 0 && (
              <ul className="space-y-1.5 rounded-2xl bg-crema p-4">
                {variantes.map((v, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-[15px]">
                    <span>{v.nombre}</span>
                    <span className="mb-1 flex-1 border-b border-dotted border-tinta/25" />
                    <span className="font-semibold tabular-nums text-azul">{precioTexto(v.precio)}</span>
                  </li>
                ))}
              </ul>
            )}

            {p.detalle?.trim() && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-azul">
                  El plato
                </p>
                <p className="whitespace-pre-line text-[15.5px] leading-relaxed text-tinta/90">
                  {p.detalle}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="animate-pulse space-y-4 pt-10">
      <div className="h-7 w-40 rounded-full bg-linea" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 rounded-3xl bg-papel ring-1 ring-linea" />
      ))}
    </div>
  );
}
