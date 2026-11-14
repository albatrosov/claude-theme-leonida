# Claude themes

Themes for the Claude Code desktop and mobile apps.

## Neon Coast

A light, pink-first look: big palm silhouettes frame a violet-to-peach sunset sky behind the chat, their fronds swaying slowly. Panels and sidebars are frosted in a milky pink, and hot pink `#FF3C78` is the accent color.

- The palms are drawn in code (`neon-coast/hooks/palms.js`), seeded, so every session shows the same scene.
- The animation stops when the system asks for reduced motion.
- The terminal and editors draw no theme; the backdrop shows in the desktop and mobile apps once a session starts.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install neon-coast --marketplace albatrosov/claude-theme-leonida
```

Answer `y` to add the marketplace, then pick the user scope so the theme loads in every session.

From a shell:

```bash
claude plugin install neon-coast --marketplace albatrosov/claude-theme-leonida
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `albatrosov/claude-theme-leonida`, then **Add plugin**.

To turn it off: `claude plugin disable neon-coast@claude-themes`.

## Customize

- Colors and the frosted glass: `neon-coast/hooks/register.tsx`.
- The palm scene (sky, palms, sway): `neon-coast/hooks/palms.js`. Preview it as a file:

  ```bash
  cd neon-coast && node -e "import('./hooks/palms.js').then(m => process.stdout.write(m.SCENE))" > scene.svg
  ```

- Check a change: `claude plugin validate neon-coast` and `claude plugin test neon-coast`.

## License

MIT
