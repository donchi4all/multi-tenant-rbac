import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const cliPath = path.resolve(__dirname, '../src/cli/rbac.ts');
const tsNodeRegisterPath = path.resolve(__dirname, '../node_modules/ts-node/register');
const tsConfigPath = path.resolve(__dirname, '../tsconfig.json');
const cliEnv = { ...process.env, TS_NODE_PROJECT: tsConfigPath };

function runCli(command: string, options?: { cwd?: string }): string {
  const cwd = options?.cwd || process.cwd();
  return execSync(`node -r ${tsNodeRegisterPath} ${cliPath} ${command}`, {
    encoding: 'utf8',
    cwd,
    env: cliEnv,
  });
}

describe('RBAC CLI', () => {
  it('prints help', () => {
    const output = runCli('--help');
    expect(output).toContain('rbac init');
    expect(output).toContain('rbac doctor');
  });

  it('generates seed and validates manifest', () => {
    const outSeed = '/tmp/rbac.seed.test.json';
    runCli(`seed --out ${outSeed}`);
    expect(fs.existsSync(outSeed)).toBe(true);

    const generatedDir = '/tmp/rbac-generated-cli-test';
    runCli(`init --orm sequelize --out ${generatedDir}`);

    const manifest = path.join(generatedDir, 'rbac.init.json');
    const output = runCli(`validate --manifest ${manifest}`);

    expect(output).toContain('"valid": true');
  });

  it('fails validate gracefully when manifest is missing', () => {
    const result = spawnSync('node', ['-r', tsNodeRegisterPath, cliPath, 'validate'], {
      encoding: 'utf8',
      cwd: '/tmp',
      env: cliEnv,
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('"valid": false');
    expect(result.stdout).toContain('Manifest not found');
    expect(result.stderr).toBe('');
  });

  it('doctor reports missing RBAC manifest recommendation', () => {
    const doctorDir = '/tmp/rbac-cli-doctor-check';
    fs.rmSync(doctorDir, { recursive: true, force: true });
    fs.mkdirSync(doctorDir, { recursive: true });
    fs.writeFileSync(path.join(doctorDir, 'package.json'), '{"name":"tmp-rbac"}', 'utf8');
    fs.writeFileSync(path.join(doctorDir, 'tsconfig.json'), '{"compilerOptions":{}}', 'utf8');

    const output = runCli('doctor', { cwd: doctorDir });
    const report = JSON.parse(output) as {
      hasRbacManifest: boolean;
      hasRbacCli: boolean;
      hasRbacPackage: boolean;
      recommendations: string[];
    };

    expect(report.hasRbacManifest).toBe(false);
    expect(report.hasRbacCli).toBe(false);
    expect(report.hasRbacPackage).toBe(false);
    expect(report.recommendations.some((item) => item.includes('rbac init'))).toBe(true);
    expect(report.recommendations.some((item) => item.includes('multi-tenant-rbac'))).toBe(true);
  });

  it('generates idempotent custom migrations for overridden models/keys', () => {
    const generatedDir = '/tmp/rbac-generated-cli-custom-test';
    runCli(
      `init --orm sequelize --out ${generatedDir} --models tenants=workspaces,roles=acl_roles,permissions=acl_permissions,userRoles=admin_roles,rolePermissions=role_permissions_map,users=admins --keys tenantId=workspaceId,roleId=roleRefId,permissionId=permissionRefId,userId=adminId`
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

  it('generates manifest and migrations matching typed rbacConfig key/model mappings', () => {
    const generatedDir = '/tmp/rbac-generated-cli-typed-config-test';
    const cfgDir = '/tmp/rbac-cli-config-file-test';
    const cfgPath = path.join(cfgDir, 'rbac.config.js');
    fs.rmSync(cfgDir, { recursive: true, force: true });
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(
      cfgPath,
      `module.exports = {
  sequelizeConfig: { dialect: 'mysql' },
  models: {
    users: 'rbac_admins_v2',
    tenants: 'rbac_workspaces_v2',
    roles: 'rbac_acl_roles_v2',
    permissions: 'rbac_acl_permissions_v2',
    userRoles: 'rbac_admin_role_links_v2',
    rolePermissions: 'rbac_role_permission_links_v2',
  },
  keys: {
    userId: 'adminId',
    tenantId: 'workspaceId',
    roleId: 'roleRefId',
    permissionId: 'permissionRefId',
  },
};`,
      'utf8'
    );

    runCli(`init --config ${cfgPath} --out ${generatedDir}`);

    const manifestPath = path.join(generatedDir, 'rbac.init.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      models: Record<string, string>;
      keys: Record<string, string>;
    };

    expect(manifest.models).toEqual({
      users: 'rbac_admins_v2',
      tenants: 'rbac_workspaces_v2',
      roles: 'rbac_acl_roles_v2',
      permissions: 'rbac_acl_permissions_v2',
      userRoles: 'rbac_admin_role_links_v2',
      rolePermissions: 'rbac_role_permission_links_v2',
    });
    expect(manifest.keys).toEqual({
      userId: 'adminId',
      tenantId: 'workspaceId',
      roleId: 'roleRefId',
      permissionId: 'permissionRefId',
    });

    const migrationsDir = path.join(generatedDir, 'sequelize', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.js'));

    expect(migrationFiles.some((file) => file.includes('create-rbac_admins_v2'))).toBe(true);
    expect(migrationFiles.some((file) => file.includes('create-rbac_workspaces_v2'))).toBe(true);
    expect(migrationFiles.some((file) => file.includes('create-rbac_acl_roles_v2'))).toBe(true);
    expect(migrationFiles.some((file) => file.includes('create-rbac_acl_permissions_v2'))).toBe(true);
    expect(migrationFiles.some((file) => file.includes('create-rbac_admin_role_links_v2'))).toBe(true);
    expect(migrationFiles.some((file) => file.includes('create-rbac_role_permission_links_v2'))).toBe(true);

    const roleMigration = migrationFiles.find((file) => file.includes('create-rbac_acl_roles_v2'));
    expect(roleMigration).toBeDefined();
    const roleMigrationContent = fs.readFileSync(path.join(migrationsDir, roleMigration as string), 'utf8');
    expect(roleMigrationContent).toContain('workspaceId');
    expect(roleMigrationContent).toContain("createTable('rbac_acl_roles_v2'");

    const userRoleMigration = migrationFiles.find((file) =>
      file.includes('create-rbac_admin_role_links_v2')
    );
    expect(userRoleMigration).toBeDefined();
    const userRoleMigrationContent = fs.readFileSync(
      path.join(migrationsDir, userRoleMigration as string),
      'utf8'
    );
    expect(userRoleMigrationContent).toContain('adminId');
    expect(userRoleMigrationContent).toContain('roleRefId');
    expect(userRoleMigrationContent).toContain('workspaceId');
  });

  it('auto-detects mappings from parent project typed config with one init command', () => {
    const projectDir = '/tmp/rbac-cli-autodetect-parent-project';
    fs.rmSync(projectDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });

    fs.writeFileSync(
      path.join(projectDir, 'src', 'rbac.typed-config.ts'),
      `export const typedRbacConfig = {
  sequelizeConfig: { dialect: 'mysql' },
  models: {
    users: 'rbac_admins_v2',
    tenants: 'rbac_workspaces_v2',
    roles: 'rbac_acl_roles_v2',
    permissions: 'rbac_acl_permissions_v2',
    userRoles: 'rbac_admin_role_links_v2',
    rolePermissions: 'rbac_role_permission_links_v2',
  },
  keys: {
    userId: 'adminId',
    tenantId: 'workspaceId',
    roleId: 'roleRefId',
    permissionId: 'permissionRefId',
  },
} as const;`,
      'utf8'
    );

    fs.writeFileSync(
      path.join(projectDir, 'src', 'app.ts'),
      `import { createTypedRBAC } from 'multi-tenant-rbac';
import { typedRbacConfig } from './rbac.typed-config';
const rbac = createTypedRBAC(typedRbacConfig);
void rbac;`,
      'utf8'
    );

    const generatedDir = path.join(projectDir, 'rbac-generated');
    const output = runCli(`init --out ${generatedDir}`, { cwd: projectDir });
    expect(output).toContain('Resolved RBAC mappings from');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(generatedDir, 'rbac.init.json'), 'utf8')
    ) as { models: Record<string, string>; keys: Record<string, string> };

    expect(manifest.models.users).toBe('rbac_admins_v2');
    expect(manifest.models.userRoles).toBe('rbac_admin_role_links_v2');
    expect(manifest.keys.userId).toBe('adminId');
    expect(manifest.keys.tenantId).toBe('workspaceId');
  });
});
