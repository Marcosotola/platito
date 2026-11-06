"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  ExternalLink,
  LogOut,
  QrCode,
  Settings,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import Logo from "@/components/Logo";
import { modoDemo, useCarta } from "@/lib/datos";
import { obtenerAuth, obtenerDb } from "@/lib/firebase";
import TabAjustes from "./TabAjustes";
import TabCarta from "./TabCarta";
import TabPrecios from "./TabPrecios";
import TabQR from "./TabQR";
import { Avisos, Boton, Campo, Confirmaciones, avisar, claseEntrada } from "./ui";

const PESTANAS = [
  { id: "carta", nombre: "Carta", icono: UtensilsCrossed },
  { id: "precios", nombre: "Precios", icono: Tag },
  { id: "qr", nombre: "QR", icono: QrCode },
  { id: "ajustes", nombre: "Ajustes", icono: Settings },
] as const;

type Pestana = (typeof PESTANAS)[number]["id"];

export default function AdminApp() {
  if (modoDemo) return <Panel usuario={null} />;
  return <ConLogin />;
}

function ConLogin() {
  const [usuario, setUsuario] = useState<User | null | undefined>(undefined);
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(obtenerAuth(), async (u) => {
        setUsuario(u);
        setEsAdmin(null);
        if (!u) return;
        try {
          const snap = await getDoc(doc(obtenerDb(), "admins", u.uid));
          setEsAdmin(snap.exists());
        } catch {
          setEsAdmin(false);
        }
      }),
    [],
  );

  if (usuario === undefined || (usuario && esAdmin === null)) {
    return <div className="grid min-h-dvh place-items-center text-apagado">Cargando…</div>;
  }
  if (!usuario) return <Login />;
  if (!esAdmin) return <SinPermiso usuario={usuario} />;
  return <Panel usuario={usuario} />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEntrando(true);
    try {
      await signInWithEmailAndPassword(obtenerAuth(), email.trim(), clave);
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setEntrando(false);
    }
  }

  async function recuperar() {
    if (!email.trim()) {
      setError("Escribí tu email y volvé a tocar “Olvidé mi contraseña”.");
      return;
    }
    try {
      await sendPasswordResetEmail(obtenerAuth(), email.trim());
      avisar("Te mandamos un email para cambiar la contraseña");
    } catch {
      setError("No pudimos mandar el email. Revisá la dirección.");
    }
  }

  return (
    <main className="azulejos grid min-h-dvh place-items-center p-4">
      <form
        onSubmit={entrar}
        className="aparecer w-full max-w-sm space-y-4 rounded-3xl bg-papel p-7 shadow-2xl"
      >
        <div className="flex justify-center pb-2">
          <Logo tamano="md" subtitulo="Panel" />
        </div>
        <Campo etiqueta="Email">
          <input
            type="email"
            autoComplete="email"
            className={claseEntrada}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Campo>
        <Campo etiqueta="Contraseña">
          <input
            type="password"
            autoComplete="current-password"
            className={claseEntrada}
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
        </Campo>
        {error && <p className="text-sm text-terracota">{error}</p>}
        <Boton type="submit" className="w-full" disabled={entrando}>
          {entrando ? "Entrando…" : "Entrar"}
        </Boton>
        <button type="button" onClick={recuperar} className="w-full text-center text-sm text-apagado hover:text-azul">
          Olvidé mi contraseña
        </button>
      </form>
      <Avisos />
    </main>
  );
}

function SinPermiso({ usuario }: { usuario: User }) {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="max-w-md space-y-4 rounded-3xl bg-papel p-7 ring-1 ring-linea">
        <h1 className="font-display text-2xl font-semibold">Falta un paso</h1>
        <p className="text-[15px]">
          Entraste como <b>{usuario.email}</b>, pero este usuario todavía no está habilitado
          como administrador.
        </p>
        <p className="text-sm text-apagado">
          En la consola de Firebase → Firestore, creá la colección <code>admins</code> con un
          documento cuyo ID sea:
        </p>
        <code className="block select-all break-all rounded-xl bg-crema p-3 text-sm">{usuario.uid}</code>
        <p className="text-sm text-apagado">Después recargá esta página.</p>
        <Boton variante="secundario" onClick={() => signOut(obtenerAuth())}>
          <LogOut size={17} /> Salir
        </Boton>
      </div>
    </main>
  );
}

function Panel({ usuario }: { usuario: User | null }) {
  const carta = useCarta();
  const [pestana, setPestana] = useState<Pestana>("carta");

  useEffect(() => {
    const h = window.location.hash.slice(1) as Pestana;
    // Recordar la pestaña al recargar (#precios, #qr…).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (PESTANAS.some((p) => p.id === h)) setPestana(h);
  }, []);

  function ir(p: Pestana) {
    setPestana(p);
    history.replaceState(null, "", `#${p}`);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="min-h-dvh pb-24 sm:pb-10">
      <header className="azulejos text-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <div className="mr-auto">
            <p className="font-display text-xl font-semibold leading-none">
              {carta?.config.nombre || "Platito"}
            </p>
            <p className="text-xs text-white/80">Panel de administración</p>
          </div>
          <a
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium ring-1 ring-white/30 hover:bg-white/25"
          >
            <ExternalLink size={16} /> <span className="hidden sm:inline">Ver carta</span>
          </a>
          {usuario && (
            <button
              onClick={() => signOut(obtenerAuth())}
              aria-label="Cerrar sesión"
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/30 hover:bg-white/25"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
        <nav className="mx-auto hidden max-w-4xl gap-1 px-4 sm:flex">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              onClick={() => ir(p.id)}
              className={`flex items-center gap-2 rounded-t-2xl px-4 py-2.5 font-medium transition ${
                pestana === p.id ? "bg-crema text-tinta" : "text-white/85 hover:bg-white/10"
              }`}
            >
              <p.icono size={17} /> {p.nombre}
            </button>
          ))}
        </nav>
      </header>

      {modoDemo && (
        <div className="bg-ambar/25 px-4 py-2.5 text-center text-sm">
          <b>Modo demostración:</b> los cambios se guardan sólo en este navegador. Conectá
          Firebase (ver README) para publicarlos de verdad.
        </div>
      )}

      <main className="mx-auto max-w-4xl px-4 py-5">
        {!carta ? (
          <p className="py-20 text-center text-apagado">Cargando la carta…</p>
        ) : pestana === "carta" ? (
          <TabCarta carta={carta} />
        ) : pestana === "precios" ? (
          <TabPrecios carta={carta} />
        ) : pestana === "qr" ? (
          <TabQR carta={carta} />
        ) : (
          <TabAjustes carta={carta} />
        )}
      </main>

      {/* Navegación inferior en el celular */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-linea bg-papel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            onClick={() => ir(p.id)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
              pestana === p.id ? "text-azul" : "text-apagado"
            }`}
          >
            <p.icono size={21} />
            {p.nombre}
          </button>
        ))}
      </nav>

      <Avisos />
      <Confirmaciones />
    </div>
  );
}
