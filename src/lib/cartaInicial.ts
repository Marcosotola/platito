import type { Categoria, Menu, Producto, Variante } from "./tipos";

/**
 * La carta tal como estaba en los PDF/imagenes originales del local.
 * Se usa para la vista de demostración (sin Firebase) y para cargarla en la
 * base de datos con un clic desde el panel.
 */

type ItemSemilla = {
  nombre: string;
  descripcion?: string;
  precio?: number | null;
  variantes?: Variante[];
  imagen?: string;
  destacado?: boolean;
  etiquetas?: string[];
};

type CategoriaSemilla = { nombre: string; nota?: string; items: ItemSemilla[] };
type MenuSemilla = {
  id: string;
  nombre: string;
  descripcion?: string;
  categorias: CategoriaSemilla[];
};

const SEMILLA: MenuSemilla[] = [
  {
    id: "almuerzo",
    nombre: "Almuerzo y cena",
    descripcion: "Cocina casera, pastas, carnes y pizzas",
    categorias: [
      {
        nombre: "Sugerencias del chef",
        nota: "Solo consumo en el local.",
        items: [
          {
            nombre: "Canelones de acelga",
            descripcion: "Con salsa roja, crema o mixta",
            precio: 20000,
            destacado: true,
            etiquetas: ["Solo en el local"],
          },
          {
            nombre: "Pollo al champiñón",
            descripcion: "Con puré de papas",
            precio: 23000,
            destacado: true,
            etiquetas: ["Solo en el local"],
          },
        ],
      },
      {
        nombre: "Pastas",
        items: [
          { nombre: "Tallarines", precio: 18000 },
          {
            nombre: "Sorrentinos",
            descripcion: "Queso azul y mozzarella · Jamón y mozzarella",
            precio: 19000,
          },
        ],
      },
      {
        nombre: "Salsas",
        nota: "Para acompañar tus pastas.",
        items: [
          { nombre: "Bolognesa", precio: 6000 },
          { nombre: "Verdeo", precio: 4000 },
          { nombre: "Champiñones", precio: 7000 },
          { nombre: "Fileto", precio: null },
          { nombre: "Crema", precio: null },
          { nombre: "Mixta", precio: null },
        ],
      },
      {
        nombre: "Carnes",
        nota: "Acompañadas con papas fritas o ensalada.",
        items: [
          {
            nombre: "Corte de cerdo",
            descripcion:
              "A la cerveza · a la mostaza y miel · a la reducción de Malbec · con champiñones",
            precio: 23000,
          },
          {
            nombre: "Milanesa o suprema",
            precio: null,
            variantes: [
              { nombre: "Clásica", precio: 20500 },
              { nombre: "A caballo", precio: 22500 },
              { nombre: "Napolitana", precio: 22500 },
            ],
          },
        ],
      },
      {
        nombre: "Pizzas",
        nota: "8 porciones.",
        items: [
          { nombre: "Mozzarella", precio: 20500 },
          { nombre: "Fugazza", precio: 22000 },
          { nombre: "Pizza especial", precio: 22000 },
          { nombre: "Pizza de rúcula", precio: 23500 },
          { nombre: "Pizza de queso azul", precio: 23500 },
        ],
      },
      {
        nombre: "Empanadas",
        nota: "Fritas.",
        items: [
          { nombre: "Jamón y queso", precio: 3000 },
          { nombre: "Carne", precio: 3000 },
        ],
      },
      {
        nombre: "Papas",
        items: [
          { nombre: "Papas clásicas", precio: 6000, imagen: "/fotos/papas.jpg" },
          { nombre: "Papas con huevo", precio: 8000 },
          { nombre: "Papas con cheddar y verdeo", precio: 9000 },
        ],
      },
      {
        nombre: "Postres",
        items: [
          { nombre: "Helado", precio: 4500 },
          {
            nombre: "Duraznos al natural",
            descripcion: "Con crema o dulce de leche",
            precio: 4500,
          },
          {
            nombre: "Frutillas con crema",
            precio: 6000,
            imagen: "/fotos/frutillas.jpg",
          },
          {
            nombre: "Flan",
            descripcion: "Con crema o dulce de leche",
            precio: 5500,
          },
          {
            nombre: "Budín de pan",
            descripcion: "Con crema o dulce de leche",
            precio: 5500,
          },
          { nombre: "Porción de pastafrola", precio: 5000 },
        ],
      },
      {
        nombre: "Combos cumpleaños",
        nota: "Consultá opciones personalizadas, sin TACC, veggie y postres.",
        items: [
          {
            nombre: "Pizza libre + bebida libre",
            descripcion: "Durante la comida",
            precio: 35000,
            etiquetas: ["Para compartir"],
          },
          {
            nombre: "Sándwich de bondiola + salsas + bebida libre",
            descripcion: "Vino, cerveza, limonada o gaseosa",
            precio: 40000,
            etiquetas: ["Para compartir"],
          },
          {
            nombre: "Asado completo + bebida libre",
            descripcion: "Asado, papas fritas, ensalada y empanadas",
            precio: 51000,
            etiquetas: ["Para compartir"],
          },
        ],
      },
      {
        nombre: "Bebidas",
        items: [
          { nombre: "Gaseosa 500 cc", precio: 4000 },
          { nombre: "Lata de Coca-Cola Zero", precio: 3800 },
          { nombre: "Gaseosa o agua saborizada 1,5 L", precio: 8000 },
          { nombre: "Gaseosa 1 L (vidrio)", precio: 7500 },
          { nombre: "Agua con o sin gas, o saborizada", precio: 3800 },
          { nombre: "Agua 2 L", precio: 6000 },
          { nombre: "Soda 1.000 cc", precio: 3800 },
          { nombre: "Soda 600 cc", precio: 2800 },
          {
            nombre: "Cerveza en lata",
            descripcion: "Heineken, Stella Artois, Imperial Golden, Budweiser",
            precio: 5500,
          },
          { nombre: "Lata de cerveza Brahma", precio: 5000 },
          { nombre: "Cerveza de litro", precio: 12000 },
          { nombre: "Pinta", descripcion: "Roja, rubia o IPA", precio: 5000 },
          { nombre: "Copa de vino", precio: 6000 },
          { nombre: "Copa de Carpano", precio: 7000 },
          { nombre: "Gancia", precio: 6500 },
          { nombre: "Vino en botella", precio: 12000 },
          { nombre: "Limonada en jarra", precio: 10000 },
          { nombre: "Fernet (trago largo)", precio: 6500 },
          {
            nombre: "Fernet + 4 Coca-Colas de 500 cc",
            precio: 52000,
            etiquetas: ["Para compartir"],
          },
        ],
      },
    ],
  },
  {
    id: "cafeteria",
    nombre: "Cafetería y merienda",
    descripcion: "Desayunos, meriendas y algo rico al paso",
    categorias: [
      {
        nombre: "Desayunos y meriendas",
        items: [
          { nombre: "Yogur con granola + infusión", precio: 12000, destacado: true },
          {
            nombre: "Tostadas con mermelada y queso crema + infusión",
            precio: 8000,
          },
          { nombre: "Medialunas", precio: 4000 },
          { nombre: "Porción de pastafrola", precio: 5000 },
        ],
      },
      {
        nombre: "Al paso",
        items: [
          {
            nombre: "Cono de papas",
            precio: 3500,
            imagen: "/fotos/papas.jpg",
            destacado: true,
          },
          { nombre: "Cono de pollo frito", precio: 5000 },
          { nombre: "Sándwich de jamón y queso", precio: 5000 },
          { nombre: "Empanada de carne (frita)", precio: 3000 },
        ],
      },
      {
        nombre: "Postres",
        items: [
          {
            nombre: "Frutillas con crema",
            precio: 6000,
            imagen: "/fotos/frutillas.jpg",
            destacado: true,
          },
          { nombre: "Flan mixto", precio: 5500 },
          { nombre: "Budín de pan mixto", precio: 5500 },
          { nombre: "Helado", precio: 4500 },
        ],
      },
      {
        nombre: "Bebidas",
        items: [
          { nombre: "Café para llevar", precio: 4000 },
          { nombre: "Licuado de banana o frutilla", precio: 6000 },
          { nombre: "Gaseosa o agua saborizada 500 cc", precio: 4000 },
          { nombre: "Gaseosa o agua saborizada 1,5 L", precio: 8000 },
          { nombre: "Agua con o sin gas", precio: 3800 },
          { nombre: "Jarra de limonada", precio: 10000 },
          { nombre: "Lata de cerveza", precio: 6100 },
          { nombre: "Lata de Brahma o 0% alcohol", precio: 5000 },
          { nombre: "Botella de cerveza", precio: 12000 },
          { nombre: "Pinta", precio: 5000 },
          { nombre: "Dos pintas", precio: 8000 },
        ],
      },
    ],
  },
];

export type CartaPlana = {
  menus: Menu[];
  categorias: Categoria[];
  productos: Producto[];
};

/** Convierte la semilla en documentos con ids estables, listos para guardar. */
export function cartaInicial(): CartaPlana {
  const menus: Menu[] = [];
  const categorias: Categoria[] = [];
  const productos: Producto[] = [];

  SEMILLA.forEach((m, mi) => {
    menus.push({
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion ?? "",
      orden: mi,
      activo: true,
    });
    m.categorias.forEach((c, ci) => {
      const catId = `${m.id}-c${ci + 1}`;
      categorias.push({
        id: catId,
        menuId: m.id,
        nombre: c.nombre,
        nota: c.nota ?? "",
        orden: ci,
        activo: true,
      });
      c.items.forEach((it, ii) => {
        productos.push({
          id: `${catId}-p${ii + 1}`,
          categoriaId: catId,
          nombre: it.nombre,
          descripcion: it.descripcion ?? "",
          precio: it.precio ?? null,
          variantes: it.variantes ?? [],
          imagen: it.imagen ?? "",
          disponible: true,
          destacado: it.destacado ?? false,
          etiquetas: it.etiquetas ?? [],
          orden: ii,
        });
      });
    });
  });

  return { menus, categorias, productos };
}
