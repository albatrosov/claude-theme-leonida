import { expect, test } from 'claude-code/testing'

import { SCENE } from '../hooks/palms.js'

// The engine refuses an Svg source over 131,072 characters, and the backdrop would then draw nothing.
test('the palm scene fits the Svg size cap', async () => {
  expect(SCENE.length).toBeLessThan(131072)
  expect(SCENE.startsWith('<svg')).toBe(true)
})
