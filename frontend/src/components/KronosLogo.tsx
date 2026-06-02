/* Componente SVG inline del logo oficial KRONOS+
 * NUNCA usar <img src> — siempre este componente.
 * Colores: K = #7B1A2C (burdeos), R = #1A2E60 (marino), estrella = blanco
 */

interface IconProps {
  size?: number;
  className?: string;
}

interface FullLogoProps {
  width?: number;
  className?: string;
}

/** Solo el monograma KR con estrella (para headers compactos) */
export function KronosIcon({ size = 48, className = "" }: IconProps) {
  const h = Math.round((size * 170) / 188);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 188 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <clipPath id="ki-clip">
          <rect x="0" y="0" width="188" height="170" />
        </clipPath>
      </defs>

      <g clipPath="url(#ki-clip)">
        {/* ── K — Burdeos ── */}
        <rect x="8" y="8" width="26" height="154" rx="2" fill="#7B1A2C" />
        {/* brazo superior: desde (34,85) hasta (120,10), 22px de grosor */}
        <polygon points="34,93 34,77 113,2 127,18" fill="#7B1A2C" />
        {/* brazo inferior: simétrico */}
        <polygon points="34,77 34,93 113,168 127,152" fill="#7B1A2C" />

        {/* ── R — Azul marino ── */}
        <rect x="92" y="8" width="24" height="154" rx="2" fill="#1A2E60" />
        {/* cuenco de la R: semielipse exterior-interior (forma D) */}
        <path
          d="M116,8 A46,42 0 0,1 116,92 L116,72 A24,22 0 0,0 116,28 Z"
          fill="#1A2E60"
        />
        {/* pata de la R: diagonal hacia abajo-derecha */}
        <polygon points="116,92 138,92 164,162 142,162" fill="#1A2E60" />
      </g>

      {/* ── Estrella blanca en la unión superior ── */}
      {/* Centro (108,38), radio ext=16, radio int=7 */}
      <path
        d="M108,22 L112,32 L123,33 L115,40 L117,51 L108,45 L99,51 L101,40 L93,33 L104,32 Z"
        fill="white"
      />
    </svg>
  );
}

/** Logo completo: monograma + texto KRONOS+ */
export function KronosLogoFull({ width = 200, className = "" }: FullLogoProps) {
  const h = Math.round((width * 240) / 200);
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <clipPath id="kf-clip">
          <rect x="0" y="0" width="200" height="172" />
        </clipPath>
      </defs>

      <g clipPath="url(#kf-clip)">
        {/* ── K — Burdeos ── */}
        <rect x="8" y="8" width="26" height="154" rx="2" fill="#7B1A2C" />
        <polygon points="34,93 34,77 113,2 127,18" fill="#7B1A2C" />
        <polygon points="34,77 34,93 113,168 127,152" fill="#7B1A2C" />

        {/* ── R — Azul marino ── */}
        <rect x="92" y="8" width="24" height="154" rx="2" fill="#1A2E60" />
        <path
          d="M116,8 A46,42 0 0,1 116,92 L116,72 A24,22 0 0,0 116,28 Z"
          fill="#1A2E60"
        />
        <polygon points="116,92 138,92 164,162 142,162" fill="#1A2E60" />
      </g>

      {/* ── Estrella blanca ── */}
      <path
        d="M108,22 L112,32 L123,33 L115,40 L117,51 L108,45 L99,51 L101,40 L93,33 L104,32 Z"
        fill="white"
      />

      {/* ── Texto KRONOS+ ── */}
      <text
        x="100"
        y="213"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Arial Bold', Arial, sans-serif"
        fontSize="27"
        fontWeight="900"
        letterSpacing="4"
        fill="#1A0810"
      >
        <tspan>KRONOS</tspan>
        <tspan fill="#7B1A2C" letterSpacing="0">+</tspan>
      </text>
    </svg>
  );
}

/** Versión horizontal: icono + texto en línea (para headers de escritorio) */
export function KronosLogoHorizontal({ height = 40, className = "" }: { height?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <KronosIcon size={height} />
      <span
        style={{
          fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
          fontWeight: 900,
          fontSize: height * 0.6,
          letterSpacing: "0.12em",
          color: "#1A0810",
        }}
      >
        KRONOS<span style={{ color: "#7B1A2C" }}>+</span>
      </span>
    </div>
  );
}

export default KronosLogoFull;
