import type { Producto } from "./tipos";

const ars = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

export function precioTexto(precio: number | null | undefined): string {
  if (precio === null || precio === undefined || Number.isNaN(precio)) {
    return "Consultar";
  }
  return `$${ars.format(precio)}`;
}

/** Precio a mostrar en el renglón principal ("desde $X" si sólo hay variantes). */
export function precioPrincipal(p: Producto): string {
  if (p.precio !== null && p.precio !== undefined) return precioTexto(p.precio);
  const conPrecio = (p.variantes ?? [])
    .map((v) => v.precio)
    .filter((x): x is number => typeof x === "number");
  if (conPrecio.length) return `desde ${precioTexto(Math.min(...conPrecio))}`;
  return "Consultar";
}

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** "35 1234-5678" -> "https://wa.me/5493512345678" (asume Argentina si no hay código). */
export function linkWhatsapp(numero: string, mensaje?: string): string {
  let n = numero.replace(/\D/g, "");
  if (!n) return "";
  if (!n.startsWith("54")) n = `549${n.replace(/^0/, "")}`;
  const q = mensaje ? `?text=${encodeURIComponent(mensaje)}` : "";
  return `https://wa.me/${n}${q}`;
}

export function linkInstagram(usuario: string): string {
  const u = usuario.trim();
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `https://instagram.com/${u.replace(/^@/, "")}`;
}

export function linkMaps(direccion: string, mapsUrl: string): string {
  if (mapsUrl.trim()) return mapsUrl.trim();
  if (!direccion.trim()) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}
