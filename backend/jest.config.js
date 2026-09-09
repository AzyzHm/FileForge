/** @type {import('jest').Config} */
const transform = {
  "^.+\\.ts$": "ts-jest",
};

module.exports = {
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
      setupFiles: ["<rootDir>/tests/setup/env.setup.ts"],
      transform,
    },
    {
      displayName: "integration",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
      setupFiles: ["<rootDir>/tests/setup/env.setup.ts"],
      transform,
    },
  ],
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"],
  coverageDirectory: "coverage",
};
