/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      lines: 90,
      functions: 90,
    },
  },
  collectCoverageFrom: [
    'src/index.ts',
    'src/core/types.ts',
    'src/modules/database/index.ts',
    'src/modules/audit/index.ts',
    'src/modules/cache/index.ts',
    'src/modules/hooks/index.ts',
    'src/modules/validation/index.ts',
    'src/services/tenant/index.ts',
    'src/services/role/index.ts',
    'src/services/permission/index.ts',
  ],
};
