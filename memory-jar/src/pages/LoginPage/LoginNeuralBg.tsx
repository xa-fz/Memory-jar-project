import classes from './LoginPage.module.css'

type NeuralNode = {
  id: number
  x: number
  y: number
  r: number
  tier: 'hub' | 'node'
  delay: number
}

type NeuralEdge = {
  id: number
  from: number
  to: number
  signal: boolean
  delay: number
}

function buildNetwork(): { nodes: NeuralNode[]; edges: NeuralEdge[] } {
  const nodes: NeuralNode[] = []
  let id = 0

  // memory core — dense hub cluster
  const hubAngles = [0, 52, 103, 155, 206, 258, 309]
  for (const deg of hubAngles) {
    const rad = (deg * Math.PI) / 180
    nodes.push({
      id: id++,
      x: 50 + Math.cos(rad) * 8,
      y: 46 + Math.sin(rad) * 7,
      r: 1.05,
      tier: 'hub',
      delay: id * 0.37,
    })
  }
  nodes.push({ id: id++, x: 50, y: 46, r: 1.35, tier: 'hub', delay: 0 })

  // mid ring synapses
  for (let i = 0; i < 16; i++) {
    const rad = (i / 16) * Math.PI * 2
    const wobble = ((i * 13) % 7) - 3
    nodes.push({
      id: id++,
      x: 50 + Math.cos(rad) * (22 + wobble * 0.4),
      y: 46 + Math.sin(rad) * (18 + wobble * 0.35),
      r: 0.72,
      tier: 'node',
      delay: i * 0.29,
    })
  }

  // outer scatter — whole viewport
  for (let i = 0; i < 28; i++) {
    const rad = (i / 28) * Math.PI * 2 + 0.4
    const ring = 28 + (i % 4) * 9
    nodes.push({
      id: id++,
      x: 50 + Math.cos(rad) * ring + (((i * 17) % 11) - 5),
      y: 46 + Math.sin(rad) * (ring * 0.82) + (((i * 23) % 9) - 4),
      r: 0.55 + (i % 3) * 0.08,
      tier: 'node',
      delay: i * 0.21,
    })
  }

  const edges: NeuralEdge[] = []
  let edgeId = 0
  const maxDist = 22

  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const dx = nodes[a].x - nodes[b].x
      const dy = nodes[a].y - nodes[b].y
      const dist = Math.hypot(dx, dy)
      if (dist > maxDist) continue

      const priority = (nodes[a].tier === 'hub' ? 1 : 0) + (nodes[b].tier === 'hub' ? 1 : 0)
      const keep = priority > 0 || dist < 14 || (a + b) % 5 === 0
      if (!keep) continue

      edges.push({
        id: edgeId++,
        from: a,
        to: b,
        signal: priority > 0 || edgeId % 4 === 0,
        delay: (a + b) * 0.18,
      })
    }
  }

  return { nodes, edges }
}

const NETWORK = buildNetwork()

export function LoginNeuralBg() {
  const { nodes, edges } = NETWORK

  return (
    <svg
      className={classes.neuralSvg}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="neuralCoreGlow" cx="50%" cy="46%" r="45%">
          <stop offset="0%" stopColor="rgba(103, 232, 249, 0.14)" />
          <stop offset="45%" stopColor="rgba(139, 92, 246, 0.08)" />
          <stop offset="100%" stopColor="rgba(10, 14, 28, 0)" />
        </radialGradient>
        <filter id="neuralNodeGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="0.35" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="100" height="100" fill="url(#neuralCoreGlow)" />

      <g className={classes.neuralSynapses}>
        {edges.map((edge) => {
          const from = nodes[edge.from]
          const to = nodes[edge.to]
          return (
            <line
              key={edge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={edge.signal ? classes.neuralSynapseSignal : classes.neuralSynapse}
              style={{ ['--delay' as string]: `${edge.delay}s` }}
            />
          )
        })}
      </g>

      <g className={classes.neuralNodes} filter="url(#neuralNodeGlow)">
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r * 1.8}
              className={classes.neuralNodeHalo}
              style={{ ['--delay' as string]: `${node.delay}s` }}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              className={
                node.tier === 'hub' ? classes.neuralNodeHub : classes.neuralNode
              }
              style={{ ['--delay' as string]: `${node.delay}s` }}
            />
          </g>
        ))}
      </g>
    </svg>
  )
}
