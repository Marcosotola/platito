export type Variante = {
  nombre: string;
  precio: number | null;
};

/** Una carta completa (por ejemplo "Almuerzo y cena" o "Cafetería y merienda"). */
export type Menu = {
  id: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
};

export type Categoria = {
  id: string;
  menuId: string;
  nombre: string;
  nota?: string;
  orden: number;
  activo: boolean;
};

export type Producto = {
  id: string;
  categoriaId: string;
  nombre: string;
  descripcion?: string;
  /** null = "Consultar". Si hay variantes con precio, se muestran esas. */
  precio: number | null;
  variantes?: Variante[];
  /** URL pública o data URL (imagen comprimida guardada en el documento). */
  imagen?: string;
  disponible: boolean;
  destacado: boolean;
  etiquetas?: string[];
  orden: number;
};

export type Config = {
  nombre: string;
  subtitulo: string;
  aviso: string;
  direccion: string;
  mapsUrl: string;
  horarios: string;
  whatsapp: string;
  instagram: string;
  notaPie: string;
  urlPublica: string;
};

export const ETIQUETAS = [
  "Nuevo",
  "Veggie",
  "Sin TACC",
  "Picante",
  "Para compartir",
  "Solo en el local",
] as const;

export const CONFIG_INICIAL: Config = {
  nombre: "Platito",
  subtitulo: "Comedor casero",
  aviso: "",
  direccion: "",
  mapsUrl: "",
  horarios: "",
  whatsapp: "",
  instagram: "",
  notaPie:
    "Consultá opciones personalizadas, sin TACC, veggie y postres. Precios en pesos argentinos.",
  urlPublica: "",
};
