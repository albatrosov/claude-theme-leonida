import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { SCENE } from './palms.js'

// Light, pink-first coast look. Hot pink #FF3C78 leads, coral #FF6B35 backs it.
const { theme, problems } = makeColors({
  label: 'Neon Coast',
  only: 'light',
  roles: { accent: '#ff3c78', danger: '#d7263d', success: '#1fa37a', warning: '#ff6b35', pro: '#8b5cf6' },
  light: {
    gray: {
      anchors: {
        // Pearl powder: the page ground, then lighter cards and menus.
        'surface-0': '#fbdde9',
        'surface-1': '#fde9f1',
        'surface-2': '#fff4f8',
        'surface-3': '#fff4f8',
        'text-primary': '#2b0f1d',
        'text-secondary': '#57263d',
        'text-muted': '#6a3550',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  // One glass for every frosted panel. The sidebars come out denser than the title bar under the
  // same setting, so it stays low: a milky pink, see-through enough there for the palms to show.
  backdrop: { scene: 'neon-coast-palms', glass: { blur: 26, tint: '#ffe0ec', opacity: 0.45 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOK)

    if (!set.isDrawn) {
      $.ui.toast(`Neon Coast: ${set.reason}`)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== 'neon-coast-palms') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={SCENE} alt="Palm trees swaying slowly against a violet and peach sunset, gulls gliding by" isInteractive />
  })
}
