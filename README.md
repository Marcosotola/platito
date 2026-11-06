# Platito · Carta digital

Carta online de **Platito – Comedor casero**, con panel para que el local
administre sus cartas, platos, precios y fotos, y genere el QR para las mesas.

- **Carta pública** (`/`): pensada para el celular. Cartas separadas
  (Almuerzo y cena / Cafetería y merienda), categorías con barra fija,
  buscador, recomendados de la casa, fotos, variantes de precio,
  etiquetas (Veggie, Sin TACC…), productos agotados, aviso de promos,
  horarios, dirección, Instagram y botón de WhatsApp.
- **Panel** (`/admin`):
  - **Carta**: crear/ordenar/ocultar cartas, categorías y productos; editar
    precios directo en la lista; marcar agotado o recomendado; subir fotos
    desde el celular (se comprimen solas).
  - **Precios**: aumento (o baja) en bloque por porcentaje para toda la
    carta, una carta o una categoría, con redondeo, vista previa y “deshacer”.
  - **QR**: descarga en PNG (2048 px) o SVG para imprenta, y un **cartel
    para mesa** A6 listo para imprimir. Puede abrir directo en una carta
    puntual (por ejemplo `https://…/#cafeteria`).
  - **Ajustes**: nombre, aviso destacado, horarios, dirección, WhatsApp,
    Instagram, nota al pie y la URL pública usada en el QR.
- Los cambios se ven **al instante** en los celulares de los clientes
  (Firestore en tiempo real) y la carta abre aunque haya mala señal (caché local).

Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Firebase
(Firestore + Auth) · `qrcode`.

## Modo demostración

Sin variables de entorno el sitio funciona igual con la carta actual del
local cargada, y el panel guarda los cambios sólo en el navegador. Sirve
para mostrarlo antes de conectar Firebase.

```bash
npm install
npm run dev
# http://localhost:3000  y  http://localhost:3000/admin
```

## Puesta en marcha con Firebase (plan gratuito)

1. Creá un proyecto en <https://console.firebase.google.com>.
2. **Firestore Database** → Crear base de datos (modo producción).
3. **Authentication** → Comenzar → habilitá **Correo electrónico/contraseña**.
   En *Usuarios* → *Agregar usuario*, creá el usuario del dueño del local.
   (Recomendado: en *Configuración → Acciones del usuario* desactivá
   “Habilitar creación (registro)” para que nadie más pueda registrarse.)
4. **Firestore** → creá la colección `admins` con un documento cuyo **ID sea
   el UID** del usuario (está en Authentication → Usuarios). No hace falta
   ningún campo. Si te olvidás, al entrar al panel te muestra el UID.
5. **Reglas**: pegá el contenido de `firestore.rules` en Firestore → Reglas
   y publicá (o `npx firebase-tools deploy --only firestore:rules`).
6. **Configuración del proyecto** → *Tus apps* → agregá una app web y copiá
   los valores a `.env.local` (ver `.env.example`).
7. Entrá a `/admin`, iniciá sesión y tocá **“Cargar la carta actual”**:
   carga todos los platos y precios de las cartas impresas.
8. En **Ajustes** completá horarios, dirección, WhatsApp, Instagram y la
   **dirección pública** (la URL de Vercel). Después descargá el QR.

Las fotos se guardan comprimidas (~50–150 KB) dentro de cada producto, así
que **no hace falta Firebase Storage** (que exige plan pago).

## Deploy en Vercel

1. Importá el repositorio en <https://vercel.com/new>.
2. En *Environment Variables* cargá las mismas variables `NEXT_PUBLIC_FIREBASE_*`.
3. Deploy. La URL (por ejemplo `https://platito.vercel.app`) es la que va
   en Ajustes → Dirección pública y en el QR.

> El QR apunta siempre a la misma dirección: cuando cambian los precios no
> hay que reimprimirlo.

## Estructura

```
src/app/page.tsx                 carta pública
src/app/admin/page.tsx           panel
src/components/carta/            componentes de la carta
src/components/admin/            pestañas del panel (Carta, Precios, QR, Ajustes)
src/lib/datos.ts                 lectura en tiempo real y escrituras (Firestore o demo)
src/lib/cartaInicial.ts          la carta original del local
firestore.rules                  reglas de seguridad
```
