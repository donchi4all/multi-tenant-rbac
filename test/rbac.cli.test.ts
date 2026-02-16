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

  it('generates idempotent custom migrations for overridden models/keys', () => {
    const generatedDir = '/tmp/rbac-generated-cli-custom-test';
    execSync(
      `npx ts-node ${cliPath} init --orm sequelize --out ${generatedDir} --models tenants=workspaces,roles=acl_roles,permissions=acl_permissions,userRoles=admin_roles,rolePermissions=role_permissions_map,users=admins --keys tenantId=workspaceId,roleId=roleRefId,permissionId=permissionRefId,userId=adminId`,
      { encoding: 'utf8' }
    );

    const migrationsDir = path.join(generatedDir, 'sequelize', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.js'));
    expect(migrationFiles.length).toBeGreaterThan(0);

    const tenantMigration = migrationFiles.find((file) => file.includes('create-workspaces'));
    expect(tenantMigration).toBeDefined();

    const tenantMigrationContent = fs.readFileSync(
      path.join(migrationsDir, tenantMigration as string),
      'utf8'
    );

    expect(tenantMigrationContent).toContain('showAllTables');
    expect(tenantMigrationContent).toContain("createTable('workspaces'");
    expect(tenantMigrationContent).toContain('describeTable');
    expect(tenantMigrationContent).toContain("addColumn('workspaces'");

    const roleMigration = migrationFiles.find((file) => file.includes('create-acl_roles'));
    expect(roleMigration).toBeDefined();
    const roleMigrationContent = fs.readFileSync(path.join(migrationsDir, roleMigration as string), 'utf8');
    expect(roleMigrationContent).toContain('workspaceId');
  });
});
