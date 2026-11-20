// KHOEM-AI own-made SVG: line icons for the 3D tabs and a drawn portrait for every character.
// No emoji and no image files, so nothing can be missing: the portrait is built from the same colours
// as the 3D figure in HumanViewer.

export type TabIconName =
  | "car"
  | "people"
  | "male"
  | "female"
  | "turn"
  | "motion"
  | "reset"
  | "play"
  | "stop"
  | "check"
  | "warn";

export function TabIcon({ name, size = 20 }: { name: TabIconName; size?: number }) {
  return (
    <svg
      className={`k-tab-icon k-tab-icon-${name}`}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "car" && (
        <>
          <path d="m8 27 4-11h24l4 11v10H8V27Z" />
          <path d="M12 27h24 M16 16l-3 11 M32 16l3 11" />
          <circle cx="15" cy="37" r="3" />
          <circle cx="33" cy="37" r="3" />
        </>
      )}
      {name === "people" && (
        <>
          <circle cx="24" cy="12" r="6" />
          <path d="M12 41v-5a12 12 0 0 1 24 0v5" />
          <path d="M8 20a5 5 0 1 0 0-10 M4 39v-4a8 8 0 0 1 6-7" />
          <path d="M40 20a5 5 0 1 1 0-10 M44 39v-4a8 8 0 0 0-6-7" />
        </>
      )}
      {name === "male" && (
        <>
          <circle cx="20" cy="28" r="11" />
          <path d="M28 20 40 8 M31 8h9v9" />
        </>
      )}
      {name === "female" && (
        <>
          <circle cx="24" cy="18" r="11" />
          <path d="M24 29v15 M16 37h16" />
        </>
      )}
      {name === "turn" && (
        <>
          <path d="M40 24a16 16 0 1 1-5-11.5" />
          <path d="M37 5v8h-8" />
        </>
      )}
      {name === "motion" && (
        <>
          <rect x="6" y="18" width="36" height="22" rx="3" />
          <path d="m6 18 6-10h8l-6 10 M20 18l6-10h8l-6 10 M34 18l6-10" />
        </>
      )}
      {name === "reset" && (
        <>
          <path d="M10 24a14 14 0 1 0 4.5-10.3" />
          <path d="M10 8v8h8" />
        </>
      )}
      {name === "play" && <path d="M16 10 38 24 16 38V10Z" />}
      {name === "stop" && <rect x="12" y="12" width="24" height="24" rx="3" />}
      {name === "check" && <path d="m10 25 9 9 19-20" />}
      {name === "warn" && (
        <>
          <path d="M24 6 44 40H4L24 6Z" />
          <path d="M24 19v10 M24 34v.5" />
        </>
      )}
    </svg>
  );
}

const hex = (n: number): string => "#" + n.toString(16).padStart(6, "0");

type PortraitProps = {
  role: string;
  skin: number;
  top: number;
  hair: number;
  shirt?: number;
  tie?: number;
  longHair?: boolean;
  bun?: boolean;
};

// A round bust of the character. The wrapper (.person-portrait-wrap) clips it to a circle.
export function PersonPortrait({ role, skin, top, hair, shirt, tie, longHair, bun }: PortraitProps) {
  const r = role.toLowerCase();
  const skinC = hex(skin);
  const topC = hex(top);
  const hairC = hex(hair);
  return (
    <svg className="person-portrait" viewBox="0 0 64 64" role="img" aria-label={role}>
      <rect className="person-portrait-bg" width="64" height="64" />
      {longHair && <path d="M18 30c0-11 6-18 14-18s14 7 14 18v24H18V30Z" fill={hairC} />}
      <path d="M6 68c0-13 9-21 26-21s26 8 26 21Z" fill={topC} />
      {shirt !== undefined && <path d="m25 48 7 12 7-12Z" fill={hex(shirt)} />}
      {tie !== undefined && <path d="M30.5 52h3l1.5 12h-6l1.5-12Z" fill={hex(tie)} />}
      <rect x="28" y="38" width="8" height="11" rx="3" fill={skinC} />
      <ellipse cx="32" cy="29" rx="11" ry="12.5" fill={skinC} />
      <path d="M20.5 28c-1-10 5-16 11.5-16s12.5 6 11.5 16c-2-5-6-8-11.5-8s-9.5 3-11.5 8Z" fill={hairC} />
      {bun && <circle cx="32" cy="12" r="4.5" fill={hairC} />}
      {r.includes("model") ? (
        <>
          <rect x="22" y="27" width="9" height="5" rx="2" fill="#0b0b0d" />
          <rect x="33" y="27" width="9" height="5" rx="2" fill="#0b0b0d" />
        </>
      ) : (
        <>
          <circle cx="28" cy="30" r="1.3" fill="#0b0b0d" />
          <circle cx="36" cy="30" r="1.3" fill="#0b0b0d" />
        </>
      )}
      <path d="M29 36q3 2 6 0" stroke="#7a3b2e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {r.includes("doctor") && (
        <>
          <path d="M24 49c0 8 4 10 8 10s8-2 8-10" stroke="#9fb2c5" strokeWidth="1.8" fill="none" />
          <circle cx="32" cy="60.5" r="2" fill="#9fb2c5" />
        </>
      )}
      {r.includes("nurse") && (
        <>
          <path d="M23 17h18l-2-6H25l-2 6Z" fill="#f4f6f8" />
          <path d="M32 12.5v3.5 M30.2 14.2h3.6" stroke="#e5484d" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
