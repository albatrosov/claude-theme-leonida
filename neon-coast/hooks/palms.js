// The Neon Coast backdrop: big palm silhouettes framing a violet-to-peach sunset sky, fronds
// swaying slowly. Drawn in code, since the desktop app paints no photo
// behind the chat; seeded, so every load draws the same scene. Preview it as a file:
//   node -e "import('./hooks/palms.js').then(m => process.stdout.write(m.SCENE))" > scene.svg

let seed = 61
function rnd() {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const jit = a => (rnd() * 2 - 1) * a
const DEG = Math.PI / 180
const n = Math.round
const tidy = d => d.replace(/ -/g, '-')

// Twice the signed area of a polygon: every shape in one path is wound the same way, so the
// default fill rule paints overlapping leaflets solid instead of punching holes where they cross.
const area = pts => pts.reduce((s, [x, y], i) => {
  const [x2, y2] = pts[(i + 1) % pts.length]
  return s + x * y2 - x2 * y
}, 0)

// One frond from the crown outward. `angle`: where it points, 0 right and positive down.
// `side` -1 mirrors it to the left, which keeps its leaflets hanging down.
function frond(angle, len, side, perSide) {
  const a0 = (angle - 30) * DEG
  const a1 = Math.min(angle + 50 + Math.max(0, -angle) * 0.3, 115) * DEG
  // The stem bends more toward the tip, like a loaded beam: integrate the heading to find the tip,
  // then draw the spine as one cubic so the stem and the leaflets' roots agree.
  let ex = 0
  let ey = 0
  for (let i = 0; i < 20; i++) {
    const phi = a0 + (a1 - a0) * ((i + 0.5) / 20) ** 1.6
    ex += (len / 20) * Math.cos(phi)
    ey += (len / 20) * Math.sin(phi)
  }
  const k = len / 3
  const P = [[0, 0], [k * Math.cos(a0), k * Math.sin(a0)], [ex - k * Math.cos(a1), ey - k * Math.sin(a1)], [ex, ey]]
  const at = t => {
    const u = 1 - t
    const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
    const dw = [-3 * u * u, 3 * u * u - 6 * u * t, 6 * u * t - 3 * t * t, 3 * t * t]
    let x = 0, y = 0, dx = 0, dy = 0
    P.forEach(([px, py], i) => {
      x += w[i] * px
      y += w[i] * py
      dx += dw[i] * px
      dy += dw[i] * py
    })
    return [x, y, Math.atan2(dy, dx)]
  }

  // The stem, tapering from the crown to the tip.
  const edge = sign =>
    [0, 0.2, 0.4, 0.6, 0.8, 1].map(t => {
      const [x, y, phi] = at(t)
      const hw = 9 * (1 - t) + 1
      return [n(side * (x - sign * Math.sin(phi) * hw)), n(y + sign * Math.cos(phi) * hw)]
    })
  let stem = [...edge(1), ...edge(-1).reverse()]
  if (area(stem) < 0) stem = stem.reverse()
  let d = `M${stem.map(p => p.join(' ')).join('L')}Z`
  let [px, py] = stem[0]

  // Leaflets: long blades, wide at the root and pointed, angled toward the tip and hanging under
  // their own weight; the near row arches over the stem. Each starts with a move from the last.
  const most = len * 0.38
  for (let i = 0; i < perSide; i++) {
    for (const up of [false, true]) {
      if (rnd() < 0.05) continue
      const s = Math.min(0.05 + (0.93 * (i + 0.5 + jit(0.3))) / perSide, 1)
      const [bx, by, phi] = at(s)
      let l = most * Math.sin(Math.PI * s ** 0.8) ** 0.5 * (1 - 0.3 * s) * (1 + jit(0.12))
      if (up) l *= 0.85
      if (rnd() < 0.07) l *= 0.5
      const spread = up ? -(30 + 12 * Math.sin(Math.PI * s)) : 50 + 14 * Math.sin(Math.PI * s)
      const dir = phi + (spread + jit(6)) * DEG
      const ux = Math.cos(dir)
      const uy = Math.sin(dir)
      const g = up ? 0.85 : 0.45
      // Width across the blade's own heading, so a blade bent hard by its weight never twists.
      const tx = bx + l * ux
      const ty = by + l * uy + g * l
      const cx = bx + 0.55 * l * ux
      const cy = by + 0.55 * l * uy
      const hw = 2.2 + 0.04 * l
      const rx = -uy * hw
      const ry = ux * hw
      const mx = -(ty - cy) / Math.hypot(tx - cx, ty - cy) * hw * 0.5
      const my = (tx - cx) / Math.hypot(tx - cx, ty - cy) * hw * 0.5
      const pt = (x, y) => [n(side * x), n(y)]
      let a = pt(bx + rx, by + ry)
      let c1 = pt(cx + (rx + mx) * 0.5, cy + (ry + my) * 0.5)
      const t = pt(tx, ty)
      let c2 = pt(cx - (rx + mx) * 0.5, cy - (ry + my) * 0.5)
      let b = pt(bx - rx, by - ry)
      if (area([a, t, b]) < 0) [a, b, c1, c2] = [b, a, c2, c1]
      d += `m${a[0] - px} ${a[1] - py}q${c1[0] - a[0]} ${c1[1] - a[1]} ${t[0] - a[0]} ${t[1] - a[1]}q${c2[0] - t[0]} ${c2[1] - t[1]} ${b[0] - t[0]} ${b[1] - t[1]}z`
      px = a[0]
      py = a[1]
    }
  }
  return tidy(d)
}

let palms = 0
let fronds = 0
const rules = []

// A palm: its crown, the fronds as [side, angle, length], and a trunk when it shows.
function palm({ crown: [cx, cy], trunk, leaves, perSide, fill }) {
  const id = palms++
  let out = `<g class="p${trunk ? ` s s${id}` : ''}" fill="${fill}">`
  if (trunk) {
    const { base: [bx, by], bend: [qx, qy], w0, w1 } = trunk
    rules.push(`.s${id}{transform-origin:${bx}px ${by}px;animation-delay:-${(rnd() * 12).toFixed(1)}s}`)
    const left = []
    const right = []
    for (let i = 0; i <= 16; i++) {
      const t = i / 16
      const u = 1 - t
      const x = u * u * bx + 2 * u * t * qx + t * t * cx
      const y = u * u * by + 2 * u * t * qy + t * t * cy
      const dx = 2 * u * (qx - bx) + 2 * t * (cx - qx)
      const dy = 2 * u * (qy - by) + 2 * t * (cy - qy)
      const dl = Math.hypot(dx, dy)
      const hw = (w0 + (w1 - w0) * t ** 0.8) / 2 + jit(0.6)
      left.push(`${n(x - (dy / dl) * hw)} ${n(y + (dx / dl) * hw)}`)
      right.push(`${n(x + (dy / dl) * hw)} ${n(y - (dx / dl) * hw)}`)
    }
    out += `<path d="${tidy(`M${left.join('L')}L${right.reverse().join('L')}Z`)}"/>`
  }
  out += `<g transform="translate(${cx} ${cy})">`
  if (trunk) {
    out += `<ellipse rx="${n(trunk.w1 * 1.1)}" ry="${n(trunk.w1 * 0.7)}"/>`
    for (let i = 0; i < 3; i++) out += `<circle cx="${n(jit(10))}" cy="${n(10 + jit(5))}" r="7"/>`
  }
  for (const [side, angle, len] of leaves) {
    out += `<g class="f d${fronds++ % 7}"><path d="${frond(angle + jit(3), len * (1 + jit(0.05)), side, perSide)}"/></g>`
  }
  return `${out}</g></g>`
}

const NEAR = '#7c3a68'
const FAR = '#a27bad'

// Far palm, bottom left: a whole crown on its own trunk, paler in the haze.
const far = palm({
  crown: [262, 842],
  trunk: { base: [300, 1070], bend: [270, 960], w0: 30, w1: 20 },
  perSide: 20,
  fill: FAR,
  leaves: [
    [1, -88, 230], [1, -62, 270], [1, -36, 300], [1, -12, 310], [1, 14, 290], [1, 40, 250],
    [-1, -70, 250], [-1, -44, 290], [-1, -18, 300], [-1, 10, 280], [-1, 38, 240],
  ],
})

// Near palms, left: two crowns just off the edge, their fronds reaching in.
const left =
  palm({
    crown: [-70, 110],
    perSide: 26,
    fill: NEAR,
    leaves: [[1, -42, 300], [1, -14, 420], [1, 14, 450], [1, 40, 400], [1, 64, 320]],
  }) +
  palm({
    crown: [-40, 560],
    perSide: 30,
    fill: NEAR,
    leaves: [[1, -70, 330], [1, -42, 450], [1, -16, 520], [1, 10, 500], [1, 34, 440], [1, 58, 360], [1, 80, 300]],
  })

// Near palm, right: a tall trunk up the edge and a crown that hangs over the sky.
const right = palm({
  crown: [1545, 300],
  trunk: { base: [1610, 1070], bend: [1592, 640], w0: 54, w1: 30 },
  perSide: 28,
  fill: NEAR,
  leaves: [
    [-1, -58, 380], [-1, -26, 470], [-1, 4, 520], [-1, 34, 500], [-1, 66, 430],
    [1, -70, 320], [1, -36, 300], [1, 8, 280],
  ],
})

const delays = Array.from({ length: 7 }, (_, i) => `.d${i}{animation-delay:-${(i * 1.37).toFixed(2)}s}`).join('')

export const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f93c9"/><stop offset=".3" stop-color="#ab95c8"/><stop offset=".55" stop-color="#d39ec6"/><stop offset=".75" stop-color="#efa9b7"/><stop offset=".9" stop-color="#fab69f"/><stop offset="1" stop-color="#ffbf94"/></linearGradient>
<radialGradient id="blue"><stop offset="0" stop-color="#7fa3d9" stop-opacity=".55"/><stop offset="1" stop-color="#7fa3d9" stop-opacity="0"/></radialGradient>
<radialGradient id="violet"><stop offset="0" stop-color="#9474bb" stop-opacity=".45"/><stop offset="1" stop-color="#9474bb" stop-opacity="0"/></radialGradient>
<radialGradient id="haze"><stop offset="0" stop-color="#ffd0a8" stop-opacity=".7"/><stop offset="1" stop-color="#ffd0a8" stop-opacity="0"/></radialGradient>
</defs>
<style>
.f{animation:f 8s ease-in-out infinite alternate}
.f:nth-child(3n){animation-duration:9.7s}.f:nth-child(3n+1){animation-duration:6.8s}
.s{animation:s 12s ease-in-out infinite alternate}
${delays}${rules.join('')}
.h{animation:h 70s ease-in-out infinite alternate}.h2{animation-duration:95s;animation-delay:-30s}
@keyframes f{from{transform:rotate(-1.2deg)}to{transform:rotate(1.6deg)}}
@keyframes s{from{transform:rotate(-.4deg)}to{transform:rotate(.5deg)}}
@keyframes h{from{transform:translateX(-70px)}to{transform:translateX(80px)}}
@media (prefers-reduced-motion:reduce){.f,.s,.h{animation:none}}
</style>
<rect width="1600" height="1000" fill="url(#sky)"/>
<circle cx="1480" cy="-80" r="760" fill="url(#blue)"/>
<circle cx="120" cy="-60" r="700" fill="url(#violet)"/>
<g class="h"><ellipse cx="760" cy="830" rx="560" ry="46" fill="url(#haze)"/><ellipse cx="1050" cy="900" rx="460" ry="34" fill="url(#haze)"/></g>
<g class="h h2"><ellipse cx="560" cy="905" rx="420" ry="30" fill="url(#haze)"/></g>
${far}${left}${right}
</svg>`
