module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  runInBand: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/index.js'
  ],
  setupFilesAfterEnv: ['./tests/setup.js']
};
