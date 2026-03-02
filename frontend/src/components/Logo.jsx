/* ────────────────────────────────────────────────────────────────
   Logo.jsx — Rezlo brand mark
   The wordmark uses a <span> with display:inline-block so that
   -webkit-background-clip:text renders correctly in any container.
   ──────────────────────────────────────────────────────────────── */

const RezloMark = ({ size = 28 }) => (
    <span
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.26),
            background: 'linear-gradient(135deg,#6366f1,#ec4899)',
            flexShrink: 0,
            boxShadow: '0 0 16px rgba(99,102,241,0.45)',
        }}
    >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <rect x="2" y="1" width="4" height="24" rx="2" fill="white" />
            <path d="M6 1 H15 C19.4 1 23 4.6 23 9 C23 13.4 19.4 17 15 17 H6"
                stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <line x1="14" y1="17" x2="23" y2="25" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>
    </span>
);

const Logo = ({ className = '', size = 'medium' }) => {
    const isSmall = size === 'small';
    const markSize = isSmall ? 30 : 38;
    const fontSize = isSmall ? '1.05rem' : '1.4rem';

    return (
        <div
            className={`rezlo-logo ${className}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}
        >
            <RezloMark size={markSize} />
            {/* inline-block is REQUIRED for gradient text clip to work */}
            <span style={{
                display: 'inline-block',
                fontSize,
                fontWeight: 800,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg,#ffffff 0%,#c7d2fe 55%,#f9a8d4 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                lineHeight: 1.2,
            }}>
                Rezlo
            </span>
        </div>
    );
};

export default Logo;
