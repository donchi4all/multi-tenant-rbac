import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const cliPath = path.resolve(__dirname, '../src/cli/rbac.ts');

describe('RBAC CLI', () => {
  it('prints help', () => {
    const output = execSync(`npx ts-node ${cliPath} --help`, { encoding: 'utf8' });
    expect(output).toContain('rbac init');
    expect(output).toContain('rbac doctor');
  });

  it('generates seed and validates manifest', () => {
    const outSeed = '/tmp/rbac.seed.test.json';
    execSync(`npx ts-node ${cliPath} seed --out ${outSeed}`, { encoding: 'utf8' });
    expect(fs.existsSync(outSeed)).toBe(true);

    const generatedDir = '/tmp/rbac-generated-cli-test';
    execSync(`npx ts-node ${cliPath} init --orm sequelize --out ${generatedDir}`, {
      encoding: 'utf8',
    });

    const manifest = path.join(generatedDir, 'rbac.init.json');
    const output = execSync(`npx ts-node ${cliPath} validate --manifest ${manifest}`, {
      encoding: 'utf8',
    });

    expect(output).toContain('"valid": true');
  });
});
