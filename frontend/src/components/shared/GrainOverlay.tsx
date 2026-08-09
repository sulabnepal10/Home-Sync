const grainSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.07'/%3E%3C/svg%3E")`;

/**
 * The subtle full-page grain texture repeated at the top of ~10 pages.
 * Consolidated here as the single source of truth.
 */
export function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[999] opacity-40 mix-blend-overlay"
      style={{ backgroundImage: grainSvg }}
      aria-hidden="true"
    />
  );
}
