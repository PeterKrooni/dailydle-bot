/**
 * The project is native ESM ("type": "module" with NodeNext resolution), so jest needs the ts-jest
 * ESM preset and node's experimental VM modules flag - see the `test` script in package.json.
 */
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  // Source imports end in `.js` per NodeNext; point jest back at the `.ts` sources.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  testMatch: ['**/src/test/**/*.test.ts'],
};
