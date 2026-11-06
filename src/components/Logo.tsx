type Props = {
  nombre?: string;
  subtitulo?: string;
  className?: string;
  tamano?: "md" | "lg";
};

function Tenedor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 40" className={className} aria-hidden fill="none">
      <path
        d="M3 3v9a5 5 0 0 0 10 0V3M8 3v9M8 17v20"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Cuchillo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 40" className={className} aria-hidden fill="none">
      <path
        d="M10 37V3C4 7 3 15 5 22h5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Marca del local, inspirada en el cartel ovalado de la fachada. */
export default function Logo({
  nombre = "Platito",
  subtitulo = "Comedor casero",
  className = "",
  tamano = "lg",
}: Props) {
  const grande = tamano === "lg";
  return (
    <div
      className={`inline-flex flex-col items-center rounded-[999px] bg-azul text-white shadow-[0_0_0_3px_rgba(255,255,255,.9),0_0_0_5px_var(--azul),0_12px_40px_-8px_rgba(20,80,210,.8)] ${
        grande ? "px-10 py-4" : "px-6 py-2"
      } ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <Tenedor className={grande ? "h-9 w-4" : "h-6 w-3"} />
        <span
          className={`font-display font-semibold uppercase leading-none tracking-wide ${
            grande ? "text-5xl" : "text-2xl"
          }`}
        >
          {nombre}
        </span>
        <Cuchillo className={grande ? "h-9 w-4" : "h-6 w-3"} />
      </div>
      {subtitulo ? (
        <span
          className={`mt-1.5 border-y border-white/60 px-2 font-semibold uppercase tracking-[0.18em] ${
            grande ? "py-0.5 text-[13px]" : "text-[9px]"
          }`}
        >
          {subtitulo}
        </span>
      ) : null}
    </div>
  );
}
