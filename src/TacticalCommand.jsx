import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Edges, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { RotateCcw, Play, Pause, Eye } from "lucide-react";

/* ============================================================
   PHASE SWITCH  —  1: Dashboard shell
                    2: + Tactical 3D scene
                    3: + Animation / effects (kill, dissolve, spike, radar, bloom, scanline)
   ============================================================ */
const PHASE = 3;

/* ---------- THEME (không hardcode màu rải rác) ---------- */
export const theme = {
  bg: "#07080b",
  surface: "#0d0f14",
  primary: "#FF4655",
  primaryDim: "#6b1d25",
  text: "#ECE8E1",
  muted: "#8b909a",
  teamA: "#5eead4",
  teamB: "#FF4655",
};
const GFX = {
  HIGH: { dpr: 1.5, sparkles: 120, bloom: true },
  MEDIUM: { dpr: 1.25, sparkles: 40, bloom: false },
  LOW: { dpr: 1, sparkles: 0, bloom: false },
};

/* ============================================================
   PHASE 1 — DATA + SHELL
   ============================================================ */
const ROUND_LEN = 60,
  PLANT_T = 30,
  TRAIL = 24;
const SITES = { A: [-8, 0, -5], B: [9, 0, 6] };
const WALLS = [
  // x, z, w, d, h
  [0, 0, 3, 3, 1.6],
  [-4, -8, 10, 0.6, 2],
  [4, 8, 10, 0.6, 2],
  [-14, 0, 0.6, 18, 2],
  [14, 0, 0.6, 18, 2],
  [0, -12, 28, 0.6, 2],
  [0, 12, 28, 0.6, 2],
  [-2, -2, 0.6, 8, 1.4],
  [5, -3, 6, 0.6, 1.4],
  [-9, 4, 5, 0.6, 1.4],
  [9, -8, 0.6, 6, 1.4],
];
const KILLS = [
  { t: 12, a: "A1", b: "B2" },
  { t: 25, a: "B0", b: "A3" },
  { t: 38, a: "A0", b: "B4" },
  { t: 50, a: "A2", b: "B1" },
];
const DEATH = Object.fromEntries(KILLS.map((k) => [k.b, k.t]));
const EVENTS = [
  { t: 0.1, type: "start" },
  ...KILLS.map((k) => ({ ...k, type: "kill" })),
  { t: PLANT_T, type: "plant" },
];
const ROUNDS = [
  { r: 18, w: "A", dur: "01:42", kills: 8, spike: "PLANTED", eco: "8,400" },
  { r: 19, w: "B", dur: "01:15", kills: 7, spike: "DEFUSED", eco: "6,100" },
  { r: 20, w: "A", dur: "00:58", kills: 6, spike: "—", eco: "9,900" },
  { r: 21, w: "A", dur: "01:33", kills: 9, spike: "PLANTED", eco: "7,250" },
  { r: 22, w: "B", dur: "01:51", kills: 8, spike: "PLANTED", eco: "5,800" },
  { r: 23, w: "B", dur: "01:04", kills: 5, spike: "—", eco: "8,050" },
  { r: 24, w: "A", dur: "01:27", kills: 7, spike: "PLANTED", eco: "8,400" },
];
const CREDITS = [4700, 3900, 2100, 1850, 5950];
const fmt = (s) =>
  `${String((s / 60) | 0).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const panel = "border border-white/10 bg-[#0d0f14]/85";
const label = "text-[10px] tracking-[0.18em] text-zinc-500 uppercase";

const mk = (i, team, name) => ({
  id: `${team}${i}`,
  team,
  name,
  cx: (team === "A" ? -1 : 1) * (3 + i * 1.6),
  cz: (i - 2) * 3.6,
  rx: 2 + i * 0.4,
  rz: 2.5,
  sp: 0.35 + i * 0.05,
  ph: i * 1.3,
});
// Đặt vị trí theo thời gian, trả về heading (rad)
const place = (p, t, v) => {
  const a = t * p.sp + p.ph;
  v.set(p.cx + Math.cos(a) * p.rx, 0, p.cz + Math.sin(a) * p.rz);
  return Math.atan2(-Math.sin(a) * p.rx * p.sp, Math.cos(a) * p.rz * p.sp);
};

const Brackets = () =>
  [
    "top-0 left-0 border-t border-l",
    "top-0 right-0 border-t border-r",
    "bottom-0 left-0 border-b border-l",
    "bottom-0 right-0 border-b border-r",
  ].map((c) => (
    <span
      key={c}
      className={`absolute w-3 h-3 border-[color:var(--p)] pointer-events-none z-20 ${c}`}
    />
  ));

function MatchStrip({ t }) {
  return (
    <div
      className={`${panel} flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 font-mono text-xs`}
    >
      <span className="font-black tracking-[0.2em] text-white">
        VALORANT ANALYTICS
      </span>
      <span className="text-zinc-400">MATCH 24 · SECTOR-07 · COMPETITIVE</span>
      <span className="flex items-center gap-2 text-[color:var(--p)]">
        <span className="w-2 h-2 rounded-full bg-[color:var(--p)] animate-pulse" />
        LIVE
      </span>
      <span className="text-lg font-black text-white tracking-widest">
        <span className="text-[color:var(--a)]">12</span> :{" "}
        <span className="text-[color:var(--p)]">10</span>
      </span>
      <span className="text-zinc-400">R 23/24 · {fmt(t)} · 24ms</span>
    </div>
  );
}

function Radar({ players, pos, sim }) {
  const refs = useRef({});
  useEffect(() => {
    let id;
    const loop = () => {
      players.forEach((p) => {
        const el = refs.current[p.id],
          v = pos.current[p.id];
        if (!el || !v) return;
        const dead = DEATH[p.id] !== undefined && sim.current.t >= DEATH[p.id];
        el.setAttribute("cx", 60 + v.x * 3);
        el.setAttribute("cy", 60 + v.z * 3);
        el.style.opacity = dead ? 0.15 : 1;
      });
      id = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(id);
  }, [players, pos, sim]);
  return (
    <svg
      viewBox="0 0 120 120"
      className="w-full max-w-[150px] mx-auto"
      role="img"
      aria-label="Tactical radar"
    >
      <circle cx="60" cy="60" r="56" fill="#07080b" stroke={theme.primaryDim} />
      <circle
        cx="60"
        cy="60"
        r="28"
        fill="none"
        stroke="rgba(255,255,255,.08)"
      />
      <path d="M4 60H116M60 4V116" stroke="rgba(255,255,255,.08)" />
      {PHASE >= 3 && (
        <g
          style={{
            transformOrigin: "60px 60px",
            animation: "tc-sweep 4s linear infinite",
          }}
        >
          <path
            d="M60 60 L60 4 A56 56 0 0 1 99 20 Z"
            fill={theme.primary}
            opacity=".2"
          />
        </g>
      )}
      {players.map((p) => (
        <circle
          key={p.id}
          ref={(el) => (refs.current[p.id] = el)}
          r="2.6"
          cx="60"
          cy="60"
          fill={p.team === "A" ? theme.teamA : theme.teamB}
        />
      ))}
    </svg>
  );
}

/* ============================================================
   PHASE 2 — TACTICAL 3D SCENE
   ============================================================ */
function TacticalGrid() {
  const m = useRef();
  useFrame((s) => {
    m.current.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
      <planeGeometry args={[90, 90]} />
      <shaderMaterial
        ref={m}
        transparent
        depthWrite={false}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`}
        fragmentShader={`varying vec2 vP; uniform float uTime;
          void main(){
            vec2 g=abs(fract(vP/2.-.5)-.5)/fwidth(vP/2.);
            float l=1.-min(min(g.x,g.y),1.);
            float d=length(vP);
            float fade=smoothstep(45.,8.,d);
            float pulse=smoothstep(2.,0.,abs(d-mod(uTime*8.,50.)))*${PHASE >= 3 ? ".6" : "0."};
            gl_FragColor=vec4(1.,.27,.33,l*(.10+pulse*.5)*fade);
          }`}
      />
    </mesh>
  );
}

function TacticalMap({ onSite }) {
  const cur = (v) => () => {
    document.body.style.cursor = v;
  };
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[30, 26]} />
        <meshStandardMaterial color="#0b0d12" />
      </mesh>
      {WALLS.map(([x, z, w, d, h], i) => (
        <mesh key={i} position={[x, h / 2, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#151922" />
          <Edges color={theme.primaryDim} />
        </mesh>
      ))}
      {Object.entries(SITES).map(([k, p]) => (
        <group
          key={k}
          position={p}
          onClick={(e) => {
            e.stopPropagation();
            onSite(p);
          }}
          onPointerOver={cur("pointer")}
          onPointerOut={cur("")}
        >
          <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
            <ringGeometry args={[3.2, 3.35, 48]} />
            <meshBasicMaterial
              color={theme.primary}
              transparent
              opacity={0.7}
            />
          </mesh>
          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[3.2, 48]} />
            <meshBasicMaterial
              color={theme.primary}
              transparent
              opacity={0.07}
            />
          </mesh>
          <Html center position={[0, 0.1, 0]} style={{ pointerEvents: "none" }}>
            <span className="font-mono text-[10px] tracking-widest text-[color:var(--p)]">
              SITE {k}
            </span>
          </Html>
        </group>
      ))}
    </group>
  );
}

function HoloMat({ color, matRef }) {
  return (
    <shaderMaterial
      ref={matRef}
      transparent
      depthWrite={false}
      side={THREE.DoubleSide}
      uniforms={{
        uC: { value: new THREE.Color(color) },
        uA: { value: 1 },
        uTime: { value: 0 },
      }}
      vertexShader={`varying vec3 vN; varying vec3 vV; varying float vY;
        void main(){ vec4 w=modelMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal);
          vec4 mv=viewMatrix*w; vV=normalize(-mv.xyz); vY=w.y; gl_Position=projectionMatrix*mv; }`}
      fragmentShader={`varying vec3 vN; varying vec3 vV; varying float vY; uniform vec3 uC; uniform float uA; uniform float uTime;
        void main(){
          float fres=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);
          float scan=.65+.35*sin(vY*40.-uTime*4.);
          gl_FragColor=vec4(uC,uA*(.22+.6*fres)*scan);
        }`}
    />
  );
}

function PlayerMarker({ p, sim, pos, selected, vision, fx, onSelect }) {
  const g = useRef(),
    ring = useRef(),
    cone = useRef(),
    lab = useRef(),
    holo = useRef(),
    beam = useRef();
  const last = useRef(0),
    lastText = useRef(""),
    pts = useRef([]);
  const v = useMemo(() => new THREE.Vector3(), []);
  const col = p.team === "A" ? theme.teamA : theme.teamB;
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3),
    );
    geo.setDrawRange(0, 0);
    return new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.45,
      }),
    );
  }, [col]);

  useEffect(() => {
    pos.current[p.id] = v;
    return () => {
      delete pos.current[p.id];
    };
  }, [p.id, pos, v]);
  useEffect(
    () => () => {
      line.geometry.dispose();
      line.material.dispose();
    },
    [line],
  );

  useFrame(({ clock }) => {
    const t = sim.current.t,
      c = clock.elapsedTime;
    const dt = DEATH[p.id];
    const dead = dt !== undefined && t >= dt;
    const heading = place(p, dead ? dt : t, v);
    // dissolve: phase 3 mờ dần 1.5s, phase 2 ẩn ngay
    const a = dead ? (PHASE >= 3 ? Math.max(0, 1 - (t - dt) / 1.5) : 0) : 1;
    g.current.position.copy(v);
    g.current.rotation.y = heading;
    holo.current.uniforms.uA.value = a;
    holo.current.uniforms.uTime.value = c;
    // flicker khi đang chết (phase 3)
    if (dead && PHASE >= 3 && a > 0)
      holo.current.uniforms.uA.value = a * (Math.sin(c * 60) > 0 ? 1 : 0.3);
    const pulse = dead ? 0 : 1 + 0.08 * Math.sin(c * 3);
    ring.current.scale.setScalar((selected ? 1.5 : 1) * pulse);
    ring.current.material.opacity = 0.9 * a;
    beam.current.material.opacity = (selected ? 0.55 : 0.18) * a;
    cone.current.visible = vision && !dead;
    // trail
    if (t < last.current || t - last.current >= 0.12) {
      if (t < last.current) pts.current = [];
      last.current = t;
      if (!dead) {
        pts.current.push(v.x, 0.05, v.z);
        if (pts.current.length > TRAIL * 3) pts.current.splice(0, 3);
      }
      const arr = line.geometry.attributes.position.array;
      pts.current.forEach((n, i) => {
        arr[i] = n;
      });
      line.geometry.setDrawRange(0, pts.current.length / 3);
      line.geometry.attributes.position.needsUpdate = true;
    }
    line.material.opacity = 0.45 * a;
    // label
    const txt = `${dead ? "✕ " : ""}${p.name.toUpperCase().slice(0, 12)}${selected ? `  ${v.x.toFixed(1)}/${v.z.toFixed(1)}` : ""}`;
    if (txt !== lastText.current && lab.current) {
      lab.current.textContent = txt;
      lastText.current = txt;
    }
    if (lab.current) lab.current.style.opacity = dead ? 0.5 : 1;
  });

  return (
    <group>
      <primitive object={line} />
      <group
        ref={g}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(p);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.04}>
          <ringGeometry args={[0.7, 0.85, 32]} />
          <meshBasicMaterial color={col} transparent />
        </mesh>
        <mesh position-y={0.7}>
          <cylinderGeometry args={[0.28, 0.34, 1.4, 12, 1, true]} />
          <HoloMat color={col} matRef={holo} />
        </mesh>
        <mesh ref={beam} position-y={2.6}>
          <cylinderGeometry args={[0.02, 0.02, 3.6, 6]} />
          <meshBasicMaterial color={col} transparent />
        </mesh>
        <mesh ref={cone} rotation-x={-Math.PI / 2} position={[0, 0.06, 2.5]}>
          <coneGeometry args={[2.2, 5, 20, 1, true]} />
          <meshBasicMaterial
            color={col}
            transparent
            opacity={0.08}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Html center position={[0, 3, 0]} style={{ pointerEvents: "none" }}>
          <div
            ref={lab}
            className="font-mono text-[10px] whitespace-nowrap px-1 bg-black/60 border-l-2"
            style={{ borderColor: col, color: theme.text }}
          />
        </Html>
      </group>
    </group>
  );
}

function Spike({ sim, pos }) {
  const g = useRef(),
    core = useRef(),
    r1 = useRef(),
    r2 = useRef(),
    disc = useRef(),
    lab = useRef();
  const lastText = useRef("");
  useFrame(({ clock }) => {
    const t = sim.current.t,
      c = clock.elapsedTime,
      planted = t >= PLANT_T;
    if (planted) g.current.position.set(SITES.A[0], 0.5, SITES.A[2]);
    else if (pos.current.B0) {
      g.current.position.copy(pos.current.B0);
      g.current.position.y = 2.4;
    }
    core.current.rotation.y = c;
    core.current.rotation.x = c * 0.6;
    core.current.scale.setScalar(1 + 0.18 * Math.sin(c * (planted ? 8 : 2)));
    const on = planted && PHASE >= 3;
    [
      [r1, 0],
      [r2, 0.5],
    ].forEach(([r, o]) => {
      const f = (c * 0.8 + o) % 1;
      r.current.visible = on;
      r.current.scale.setScalar(1 + f * 6);
      r.current.material.opacity = (1 - f) * 0.8;
    });
    disc.current.visible = planted;
    const txt = planted
      ? `SPIKE PLANTED  ${fmt(Math.max(0, 45 - (t - PLANT_T)))}`
      : "SPIKE CARRIED";
    if (txt !== lastText.current && lab.current) {
      lab.current.textContent = txt;
      lastText.current = txt;
    }
  });
  return (
    <group ref={g}>
      <mesh ref={core}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshBasicMaterial color={theme.primary} wireframe />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.4}>
        <ringGeometry args={[0.9, 1, 40]} />
        <meshBasicMaterial color={theme.primary} transparent opacity={0.6} />
      </mesh>
      <mesh ref={r1} rotation-x={-Math.PI / 2} position-y={-0.4}>
        <ringGeometry args={[0.9, 1, 40]} />
        <meshBasicMaterial color={theme.primary} transparent />
      </mesh>
      <mesh ref={r2} rotation-x={-Math.PI / 2} position-y={-0.4}>
        <ringGeometry args={[0.9, 1, 40]} />
        <meshBasicMaterial color={theme.primary} transparent />
      </mesh>
      <mesh ref={disc} rotation-x={-Math.PI / 2} position-y={-0.45}>
        <circleGeometry args={[5, 48]} />
        <meshBasicMaterial
          color={theme.primary}
          transparent
          opacity={0.05}
          depthWrite={false}
        />
      </mesh>
      <Html center position={[0, 1.2, 0]} style={{ pointerEvents: "none" }}>
        <div
          ref={lab}
          className="font-mono text-[10px] whitespace-nowrap px-1 bg-black/70 text-[color:var(--p)]"
        />
      </Html>
    </group>
  );
}

function CameraRig({ focus, focusKey, pos }) {
  const controls = useRef(),
    active = useRef(true);
  const tgt = useMemo(() => new THREE.Vector3(), []),
    des = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    active.current = true;
  }, [focus, focusKey]);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c || !active.current) return;
    if (focus?.id) {
      const p = pos.current[focus.id];
      if (!p) return;
      tgt.copy(p);
    } else if (focus?.pos) tgt.set(...focus.pos);
    else tgt.set(0, 0, 0);
    des
      .copy(tgt)
      .add(focus ? new THREE.Vector3(0, 14, 11) : new THREE.Vector3(0, 26, 20));
    const k = 1 - Math.exp(-3 * dt); // nội suy mượt, không nhảy cảnh
    c.target.lerp(tgt, k);
    c.object.position.lerp(des, k);
    c.update();
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      maxPolarAngle={Math.PI / 2.4}
      minDistance={8}
      maxDistance={45}
      onStart={() => {
        active.current = false;
      }}
    />
  );
}

/* ============================================================
   PHASE 3 — EFFECTS
   ============================================================ */
function KillFx({ from, to, onDone }) {
  const age = useRef(0),
    ring = useRef(),
    tip = useMemo(() => new THREE.Vector3(), []);
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(6), 3),
    );
    return new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true }),
    );
  }, []);
  useEffect(
    () => () => {
      line.geometry.dispose();
      line.material.dispose();
    },
    [line],
  );
  useFrame((_, dt) => {
    age.current += dt;
    const a = age.current,
      k = Math.min(1, a / 0.25);
    tip.lerpVectors(from, to, k);
    const arr = line.geometry.attributes.position;
    arr.setXYZ(0, from.x, 1, from.z);
    arr.setXYZ(1, tip.x, 1, tip.z);
    arr.needsUpdate = true;
    line.material.opacity = Math.max(0, 1 - a / 0.6);
    const r = Math.max(0, a - 0.25);
    ring.current.scale.setScalar(1 + r * 10);
    ring.current.material.opacity = Math.max(0, 0.9 - r * 1.4);
    if (a > 1) onDone();
  });
  return (
    <>
      <primitive object={line} />
      <mesh ref={ring} position={[to.x, 0.06, to.z]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.5, 0.58, 40]} />
        <meshBasicMaterial color={theme.primary} transparent />
      </mesh>
    </>
  );
}

function Clock({ sim, onEvent, onTick }) {
  const prev = useRef(-1),
    acc = useRef(0);
  useFrame((_, dt) => {
    const s = sim.current;
    if (s.playing) s.t += Math.min(dt, 0.1) * s.speed;
    if (s.t >= ROUND_LEN) {
      s.t = 0;
      prev.current = -1;
    }
    if (s.t < prev.current || s.t - prev.current > 1.5) prev.current = s.t; // scrub: không bắn event dồn
    EVENTS.forEach((e) => {
      if (e.t > prev.current && e.t <= s.t) onEvent(e);
    });
    prev.current = s.t;
    acc.current += dt;
    if (acc.current > 0.2) {
      acc.current = 0;
      onTick(s.t);
    } // throttle cập nhật DOM
  });
  return null;
}

/* ============================================================
   MAIN
   ============================================================ */
export default function TacticalCommand({
  team = [],
  selectedName,
  onSelectName,
}) {
  const [gfx, setGfx] = useState("HIGH");
  const [vision, setVision] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [focus, setFocus] = useState(null);
  const [focusKey, setFocusKey] = useState(0);
  const [feed, setFeed] = useState([]);
  const [fxList, setFxList] = useState([]);
  const [clock, setClock] = useState(0);
  const [round, setRound] = useState(24);
  const [hoverRound, setHoverRound] = useState(null);
  const sim = useRef({ t: 0, playing: true, speed: 1 });
  const pos = useRef({});
  const cfg = GFX[gfx];

  const players = useMemo(
    () =>
      [...Array(5)].flatMap((_, i) => [
        mk(i, "A", team[i]?.name || `PLAYER ${i + 1}`),
        mk(i, "B", `OPP ${i + 1}`),
      ]),
    [team],
  );
  const nm = useCallback(
    (id) => players.find((p) => p.id === id)?.name.toUpperCase() || id,
    [players],
  );

  useEffect(() => {
    sim.current.playing = playing;
    sim.current.speed = speed;
  }, [playing, speed]);
  useEffect(() => {
    // đồng bộ với danh sách đội hình bên dưới
    const p = players.find((x) => x.team === "A" && x.name === selectedName);
    if (p) setFocus({ id: p.id });
  }, [selectedName, players]);

  const push = (text, k, t) =>
    setFeed((f) => [{ id: Math.random(), t, text, k }, ...f].slice(0, 8));
  const onEvent = useCallback(
    (e) => {
      if (e.type === "kill") {
        const a = pos.current[e.a],
          b = pos.current[e.b];
        if (PHASE >= 3 && a && b)
          setFxList((f) => [
            ...f,
            { id: Math.random(), from: a.clone(), to: b.clone() },
          ]);
        push(`${nm(e.a)} eliminated ${nm(e.b)}`, "kill", e.t);
      } else if (e.type === "plant")
        push("SPIKE PLANTED — SITE A", "spike", e.t);
      else push("ROUND STARTED", "sys", e.t);
    },
    [nm],
  );

  const selectPlayer = (p) => {
    setFocus({ id: p.id });
    if (p.team === "A") onSelectName?.(p.name);
  };
  const resetCam = () => {
    setFocus(null);
    setFocusKey((k) => k + 1);
  };
  const selId = focus?.id;

  return (
    <section
      className="mb-12 space-y-3"
      style={{ "--p": theme.primary, "--a": theme.teamA }}
    >
      <style>{`
        @keyframes tc-sweep{to{transform:rotate(360deg)}}
        @keyframes tc-scan{0%{top:-10%}100%{top:110%}}
        @media (prefers-reduced-motion:reduce){.tc-scan{display:none}}
      `}</style>

      {/* ---------- PHASE 1: shell ---------- */}
      <MatchStrip t={clock} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: match info + economy */}
        <aside
          className={`${panel} lg:col-span-3 p-4 relative max-h-[560px] overflow-y-auto`}
        >
          <Brackets />
          <p className={label}>Match info</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-black tracking-widest text-[color:var(--a)]">
              TEAM A
            </span>
            <span className="text-5xl font-black text-white">12</span>
          </div>
          <div className="my-1 text-center text-xs text-zinc-600">VS</div>
          <div className="flex items-baseline justify-between">
            <span className="font-black tracking-widest text-[color:var(--p)]">
              TEAM B
            </span>
            <span className="text-5xl font-black text-white">10</span>
          </div>
          <p className={`${label} mt-6 mb-2`}>
            Team economy · $
            {CREDITS.reduce((a, b) => a + b, 0).toLocaleString()}
          </p>
          {players
            .filter((p) => p.team === "A")
            .map((p, i) => (
              <button
                key={p.id}
                onClick={() => selectPlayer(p)}
                className={`w-full text-left mb-2 group ${selId === p.id ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
              >
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="truncate pr-2">{p.name.toUpperCase()}</span>
                  <span>${CREDITS[i].toLocaleString()}</span>
                </div>
                <div className="h-1 bg-white/10">
                  <div
                    className="h-full bg-[color:var(--a)]"
                    style={{ width: `${(CREDITS[i] / 6500) * 100}%` }}
                  />
                </div>
              </button>
            ))}
          <p className={`${label} mt-6 mb-2`}>Radar</p>
          <Radar players={players} pos={pos} sim={sim} />
        </aside>

        {/* Center: 3D scene */}
        <div
          className={`${panel} lg:col-span-6 relative h-[420px] sm:h-[560px] overflow-hidden`}
        >
          <Brackets />
          {PHASE >= 2 ? (
            <Canvas
              dpr={cfg.dpr}
              camera={{ position: [0, 26, 20], fov: 40 }}
              gl={{ antialias: !cfg.bloom }}
            >
              <color attach="background" args={[theme.bg]} />
              <fog attach="fog" args={[theme.bg, 32, 75]} />
              <ambientLight intensity={0.7} />
              <directionalLight position={[8, 20, 6]} intensity={0.8} />
              <TacticalGrid />
              <TacticalMap onSite={(p) => setFocus({ pos: p })} />
              {players.map((p) => (
                <PlayerMarker
                  key={p.id}
                  p={p}
                  sim={sim}
                  pos={pos}
                  selected={selId === p.id}
                  vision={vision}
                  fx={PHASE >= 3}
                  onSelect={selectPlayer}
                />
              ))}
              <Spike sim={sim} pos={pos} />
              {PHASE >= 3 &&
                fxList.map((f) => (
                  <KillFx
                    key={f.id}
                    from={f.from}
                    to={f.to}
                    onDone={() =>
                      setFxList((l) => l.filter((x) => x.id !== f.id))
                    }
                  />
                ))}
              {cfg.sparkles > 0 && (
                <Sparkles
                  count={cfg.sparkles}
                  scale={[30, 10, 26]}
                  size={2}
                  speed={0.2}
                  opacity={0.35}
                  color={theme.primary}
                />
              )}
              <Clock sim={sim} onEvent={onEvent} onTick={setClock} />
              <CameraRig focus={focus} focusKey={focusKey} pos={pos} />
              {PHASE >= 3 && cfg.bloom && (
                <EffectComposer>
                  <Bloom intensity={0.6} luminanceThreshold={0.4} mipmapBlur />
                </EffectComposer>
              )}
            </Canvas>
          ) : (
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,70,85,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,70,85,.12) 1px,transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
          )}

          {PHASE >= 3 && (
            <div
              className="tc-scan absolute left-0 right-0 h-16 pointer-events-none z-10"
              style={{
                background:
                  "linear-gradient(transparent,rgba(255,70,85,.05),transparent)",
                animation: "tc-scan 6s linear infinite",
              }}
            />
          )}

          {/* Controls */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1 font-mono text-[10px]">
            {Object.keys(GFX).map((k) => (
              <button
                key={k}
                onClick={() => setGfx(k)}
                aria-pressed={gfx === k}
                className={`px-2 py-1 border ${gfx === k ? "border-[color:var(--p)] text-white bg-[color:var(--p)]/20" : "border-white/15 text-zinc-400 hover:text-white"}`}
              >
                {k}
              </button>
            ))}
            <button
              onClick={() => setVision((v) => !v)}
              aria-pressed={vision}
              className={`px-2 py-1 border flex items-center gap-1 ${vision ? "border-[color:var(--a)] text-white" : "border-white/15 text-zinc-400"}`}
            >
              <Eye className="w-3 h-3" />
              VISION {vision ? "ON" : "OFF"}
            </button>
            <button
              onClick={resetCam}
              className="px-2 py-1 border border-white/15 text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              RESET
            </button>
          </div>
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-3 font-mono text-[10px] bg-black/60 border border-white/10 px-3 py-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause replay" : "Play replay"}
              className="text-white"
            >
              {playing ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                aria-pressed={speed === s}
                className={
                  speed === s
                    ? "text-[color:var(--p)] font-bold"
                    : "text-zinc-400"
                }
              >
                {s}x
              </button>
            ))}
            <input
              type="range"
              min="0"
              max={ROUND_LEN}
              step=".1"
              value={clock}
              aria-label="Replay timeline"
              onChange={(e) => {
                sim.current.t = +e.target.value;
                setClock(+e.target.value);
              }}
              className="flex-1 accent-[#FF4655]"
            />
            <span className="text-zinc-300">
              {fmt(clock)} / {fmt(ROUND_LEN)}
            </span>
          </div>
        </div>

        {/* Right: players + event feed */}
        <aside
          className={`${panel} lg:col-span-3 p-4 relative max-h-[560px] overflow-y-auto`}
        >
          <Brackets />
          <p className={label}>Players</p>
          <div className="mt-2 space-y-1">
            {players
              .filter((p) => p.team === "A")
              .map((p, i) => {
                const d = team[i];
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPlayer(p)}
                    aria-pressed={selId === p.id}
                    className={`w-full flex justify-between font-mono text-[11px] px-2 py-1.5 border-l-2 ${selId === p.id ? "border-[color:var(--a)] bg-white/10" : "border-white/10 hover:bg-white/5"}`}
                  >
                    <span className="truncate pr-2">
                      {p.name.toUpperCase()}
                    </span>
                    <span className="text-zinc-400 shrink-0">
                      K/D {d?.kd || "—"} · {d?.rank || "—"}
                    </span>
                  </button>
                );
              })}
          </div>
          <p className={`${label} mt-5 mb-2`}>Live events</p>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {feed.map((e) => (
                <motion.li
                  key={e.id}
                  layout
                  initial={{
                    opacity: 0,
                    x: 16,
                    backgroundColor: "rgba(255,70,85,.25)",
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    backgroundColor: "rgba(255,70,85,0)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-[11px] pl-2 border-l border-white/20"
                >
                  <span className="text-zinc-500">{fmt(e.t)}</span>
                  <p
                    className={
                      e.k === "kill"
                        ? "text-white"
                        : e.k === "spike"
                          ? "text-[color:var(--p)]"
                          : "text-zinc-400"
                    }
                  >
                    {e.text}
                  </p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </aside>
      </div>

      {/* Bottom: round timeline */}
      <div className={`${panel} p-3 relative`}>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {ROUNDS.map((r) => (
            <button
              key={r.r}
              onMouseEnter={() => setHoverRound(r)}
              onMouseLeave={() => setHoverRound(null)}
              onFocus={() => setHoverRound(r)}
              onBlur={() => setHoverRound(null)}
              onClick={() => {
                setRound(r.r);
                sim.current.t = 0;
                setClock(0);
                setFeed([]);
                setPlaying(true);
              }}
              aria-pressed={round === r.r}
              className={`min-w-[64px] px-2 py-1.5 font-mono text-[11px] border ${round === r.r ? "border-[color:var(--p)] bg-[color:var(--p)]/15 text-white" : "border-white/10 text-zinc-400 hover:border-white/30"}`}
            >
              <div>R{String(r.r).padStart(2, "0")}</div>
              <div
                className={
                  r.w === "A"
                    ? "text-[color:var(--a)]"
                    : "text-[color:var(--p)]"
                }
              >
                {r.w === "A" ? "● A" : "✕ B"}
              </div>
            </button>
          ))}
        </div>
        <p className="mt-2 h-4 font-mono text-[11px] text-zinc-400">
          {hoverRound
            ? `ROUND ${hoverRound.r} · Winner: TEAM ${hoverRound.w} · Duration ${hoverRound.dur} · Kills ${hoverRound.kills} · Spike ${hoverRound.spike} · Economy ${hoverRound.eco}`
            : "Chọn một round để phát lại"}
        </p>
      </div>
    </section>
  );
}
