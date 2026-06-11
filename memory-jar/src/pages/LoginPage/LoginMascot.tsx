import clsx from 'clsx'
import classes from './LoginPage.module.css'

export type MascotMode = 'idle' | 'username' | 'password' | 'peek'

interface LoginMascotProps {
  mode: MascotMode
}

export function LoginMascot({ mode }: LoginMascotProps) {
  return (
    <div
      className={clsx(classes.mascot, classes[`mascotMode${capitalize(mode)}`])}
      aria-hidden
    >
      <svg
        viewBox="0 0 200 180"
        className={classes.mascotSvg}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* shadow */}
        <ellipse cx="100" cy="168" rx="52" ry="8" className={classes.mascotShadow} />

        {/* jar body */}
        <defs>
          <linearGradient id="jarBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c6cf0" />
            <stop offset="50%" stopColor="#5b8def" />
            <stop offset="100%" stopColor="#4ecdc4" />
          </linearGradient>
          <linearGradient id="jarShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f093fb" />
            <stop offset="100%" stopColor="#f5576c" />
          </linearGradient>
        </defs>

        {/* lid */}
        <rect x="62" y="18" width="76" height="14" rx="6" fill="#5a4fcf" />
        <rect x="66" y="20" width="68" height="4" rx="2" fill="rgba(255,255,255,0.25)" />

        {/* brain peeking from jar */}
        <g className={classes.mascotBrain}>
          <path
            d="M88 32 C82 22, 118 22, 112 32 C120 30, 122 42, 112 44 C115 52, 85 52, 88 44 C78 42, 80 30, 88 32Z"
            fill="url(#brainGrad)"
          />
          <path
            d="M92 36 C90 34, 96 34, 94 38 M104 36 C106 34, 100 34, 102 38"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* main jar */}
        <path
          d="M55 32 L55 130 C55 148, 145 148, 145 130 L145 32 Z"
          fill="url(#jarBody)"
        />
        <path
          d="M62 40 L62 125 C62 138, 88 142, 100 142 C112 142, 138 138, 138 125 L138 40 Z"
          fill="url(#jarShine)"
          opacity="0.6"
        />

        {/* face */}
        <g className={classes.mascotFace}>
          {/* blush */}
          <ellipse cx="72" cy="88" rx="10" ry="6" fill="rgba(255,150,180,0.35)" />
          <ellipse cx="128" cy="88" rx="10" ry="6" fill="rgba(255,150,180,0.35)" />

          {/* eyes white */}
          <g className={classes.mascotEyeWhites}>
            <ellipse cx="78" cy="78" rx="14" ry="16" fill="white" />
            <ellipse cx="122" cy="78" rx="14" ry="16" fill="white" />
          </g>

          {/* pupils */}
          <g className={classes.mascotPupils}>
            <circle cx="78" cy="80" r="7" fill="#2d2a4a" />
            <circle cx="122" cy="80" r="7" fill="#2d2a4a" />
            <circle cx="81" cy="77" r="2.5" fill="white" />
            <circle cx="125" cy="77" r="2.5" fill="white" />
          </g>

          {/* closed eyes — simple horizontal lines */}
          <g className={classes.mascotEyesClosed}>
            <line
              x1="66"
              y1="78"
              x2="90"
              y2="78"
              stroke="#2d2a4a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="110"
              y1="78"
              x2="134"
              y2="78"
              stroke="#2d2a4a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* eyelids — idle blink only */}
          <g className={classes.mascotEyelids}>
            <ellipse
              cx="78"
              cy="78"
              rx="15"
              ry="16"
              fill="#6b7de8"
              className={classes.mascotEyelidLeft}
            />
            <ellipse
              cx="122"
              cy="78"
              rx="15"
              ry="16"
              fill="#6b7de8"
              className={classes.mascotEyelidRight}
            />
          </g>

          {/* mouth — smile vs flat line */}
          <g className={classes.mascotMouthOpen}>
            <path
              d="M88 102 Q100 112, 112 102"
              stroke="#2d2a4a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <g className={classes.mascotMouthClosed}>
            <line
              x1="88"
              y1="106"
              x2="112"
              y2="106"
              stroke="#2d2a4a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* arms — slide up to cover eyes in password mode */}
        <g className={classes.mascotArms}>
          <path
            d="M48 95 C32 88, 28 72, 38 62 C42 58, 50 64, 52 72"
            fill="#6b7de8"
            stroke="#5a6fd6"
            strokeWidth="1"
          />
          <path
            d="M152 95 C168 88, 172 72, 162 62 C158 58, 150 64, 148 72"
            fill="#6b7de8"
            stroke="#5a6fd6"
            strokeWidth="1"
          />
          {/* hands */}
          <circle cx="40" cy="66" r="10" fill="#8b9cf0" />
          <circle cx="160" cy="66" r="10" fill="#8b9cf0" />
        </g>

        {/* peek fingers gap in peek mode */}
        <g className={classes.mascotPeekGap}>
          <rect x="70" y="58" width="60" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
        </g>
      </svg>
    </div>
  )
}

function capitalize(mode: MascotMode): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}
