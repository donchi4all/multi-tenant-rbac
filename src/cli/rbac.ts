#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { DEFAULT_KEYS, DEFAULT_MODELS, RbacKeysConfig, RbacModelsConfig } from '../core/types';

type CliOptions = {
  orm: 'sequelize' | 'mongoose';
  outDir: string;
  models: RbacModelsConfig;
  keys: RbacKeysConfig;
};

type DoctorReport = {
  cwd: string;
  packageJsonExists: boolean;
  hasTsConfig: boolean;
  hasSequelizeCli: boolean;
  hasRbacCli: boolean;
  hasRbacPackage: boolean;
  hasRbacManifest: boolean;
  defaultManifestPath: string;
  recommendations: string[];
};

const RBAC_MODEL_KEYS = [
  'users',
  'tenants',
  'roles',
  'permissions',
  'userRoles',
  'rolePermissions',
] as const;
const RBAC_FK_KEYS = ['userId', 'tenantId', 'roleId', 'permissionId'] as const;

function parseKvFlag(input: string | undefined): Record<string, string> {
  if (!input) return {};
  return input.split(',').reduce((acc, pair) => {
    const [rawKey, rawValue] = pair.split('=');
    const key = (rawKey || '').trim();
    const value = (rawValue || '').trim();
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
}

function extractKeyMapBlock(
  source: string,
  blockName: 'models' | 'keys',
  expectedKeys: readonly string[]
): Record<string, string> {
  const blockMatch = source.match(
    new RegExp(`${blockName}\\s*:\\s*\\{([\\s\\S]*?)\\}`, 'm')
  );
  if (!blockMatch) return {};

  const blockBody = blockMatch[1];
  const result: Record<string, string> = {};

  expectedKeys.forEach((key) => {
    const keyMatch = blockBody.match(
      new RegExp(`\\b${key}\\b\\s*:\\s*['"\`]([^'"\`]+)['"\`]`, 'm')
    );
    if (keyMatch?.[1]) {
      result[key] = keyMatch[1];
    }
  });

  return result;
}

function extractConfigOverridesFromSource(source: string): Record<string, any> {
  const models = extractKeyMapBlock(source, 'models', RBAC_MODEL_KEYS);
  const keys = extractKeyMapBlock(source, 'keys', RBAC_FK_KEYS);

  return {
    ...(Object.keys(models).length > 0 ? { models } : {}),
    ...(Object.keys(keys).length > 0 ? { keys } : {}),
    ...(source.includes('sequelizeConfig:') ? { sequelizeConfig: { dialect: 'mysql' } } : {}),
    ...(source.includes('mongodbConfig:') ? { mongodbConfig: { url: '' } } : {}),
  };
}

function loadConfigOverrides(configPath: string): Record<string, any> {
  const absolutePath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Config file not found: ${absolutePath}`);
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const rawSource = fs.readFileSync(absolutePath, 'utf8');

  if (ext === '.json') {
    const parsed = JSON.parse(rawSource) as Record<string, any>;
    const extracted = extractConfigOverridesFromSource(rawSource);
    return {
      ...parsed,
      ...extracted,
      models: { ...(parsed.models || {}), ...(extracted.models || {}) },
      keys: { ...(parsed.keys || {}), ...(extracted.keys || {}) },
    };
  }

  const extracted = extractConfigOverridesFromSource(rawSource);
  if (Object.keys(extracted.models || {}).length > 0 || Object.keys(extracted.keys || {}).length > 0) {
    return extracted;
  }

  const loadModule = (): any => {
    delete require.cache[require.resolve(absolutePath)];
    return require(absolutePath);
  };

  try {
    const mod = loadModule();
    return (mod?.default ||
      mod?.typedRbacConfig ||
      mod?.config ||
      mod?.rbacConfig ||
      mod) as Record<string, any>;
  } catch (error) {
    if (ext === '.ts' || ext === '.mts' || ext === '.cts') {
      try {
        require('ts-node/register/transpile-only');
        const mod = loadModule();
        return (mod?.default ||
          mod?.typedRbacConfig ||
          mod?.config ||
          mod?.rbacConfig ||
          mod) as Record<string, any>;
      } catch (_tsError) {
        // fall through to unified error below
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load config file "${absolutePath}": ${message}`);
  }
}

function collectSourceFiles(
  rootDir: string,
  maxFiles: number = 400
): string[] {
  if (!fs.existsSync(rootDir)) return [];

  const files: string[] = [];
  const queue: string[] = [rootDir];
  const allowedExt = new Set(['.ts', '.js', '.mts', '.cts', '.mjs', '.cjs', '.json']);
  const skipDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    'donsoft',
    'rbac-generated',
  ]);

  while (queue.length > 0 && files.length < maxFiles) {
    const current = queue.shift() as string;
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name)) {
          queue.push(fullPath);
        }
        continue;
      }

      if (allowedExt.has(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function autoDetectConfigOverrides(cwd: string): { source: string; config: Record<string, any> } | null {
  const candidateFiles = [
    'rbac.config.json',
    'rbac.config.js',
    'rbac.config.ts',
    'rbac.typed-config.json',
    'rbac.typed-config.js',
    'rbac.typed-config.ts',
    path.join('src', 'rbac.config.json'),
    path.join('src', 'rbac.config.js'),
    path.join('src', 'rbac.config.ts'),
    path.join('src', 'rbac.typed-config.json'),
    path.join('src', 'rbac.typed-config.js'),
    path.join('src', 'rbac.typed-config.ts'),
  ];

  for (const relativePath of candidateFiles) {
    const absolutePath = path.resolve(cwd, relativePath);
    if (!fs.existsSync(absolutePath)) continue;
    const config = loadConfigOverrides(absolutePath);
    if (Object.keys(config.models || {}).length > 0 || Object.keys(config.keys || {}).length > 0) {
      return { source: absolutePath, config };
    }
  }

  const sourceFiles = [
    ...collectSourceFiles(path.join(cwd, 'src')),
    ...collectSourceFiles(cwd),
  ];
  const dedupedFiles = [...new Set(sourceFiles)];

  for (const filePath of dedupedFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasRbacSignal =
      content.includes('createTypedRBAC(') ||
      content.includes('new MultiTenantRBAC(') ||
      content.includes('rbacConfig');

    if (!hasRbacSignal) continue;

    const config = extractConfigOverridesFromSource(content);
    if (Object.keys(config.models || {}).length > 0 || Object.keys(config.keys || {}).length > 0) {
      return { source: filePath, config };
    }
  }

  return null;
}

function parseArgs(argv: string[]): { command?: string; flags: Record<string, string> } {
  const args = [...argv];
  const command = args[0] && !args[0].startsWith('--') ? args.shift() : undefined;
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) continue;

    const [key, inlineValue] = arg.slice(2).split('=');
    if (inlineValue !== undefined) {
      flags[key] = inlineValue;
      continue;
    }

    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      i += 1;
    } else {
      flags[key] = 'true';
    }
  }

  return { command, flags };
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFileSafely(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function toPascalCase(value: string): string {
  return value
    .replace(/[-_\s]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function createSequelizeModelTemplate(modelName: string, fields: string[]): string {
  const className = toPascalCase(modelName);
  return `import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: '${modelName}' })
export class ${className} extends Model {
${fields
  .map(
    (field) => `  @Column({ type: DataType.STRING, allowNull: false })
  ${field}!: string;`
  )
  .join('\n\n')}
}
`;
}

function createMongooseModelTemplate(modelName: string, fields: string[]): string {
  const className = toPascalCase(modelName);
  return `import { Schema, model } from 'mongoose';

const ${className}Schema = new Schema(
  {
${fields
  .map((field) => `    ${field}: { type: String, required: true },`)
  .join('\n')}
  },
  { timestamps: true }
);

export default model('${className}', ${className}Schema, '${modelName}');
`;
}

function createMigrationTemplate(
  tableName: string,
  columns: Array<{ name: string; allowNull?: boolean }>
): string {
  const body = columns
    .map(
      (column) => `      ${column.name}: {
        type: Sequelize.STRING,
        allowNull: ${column.allowNull === false ? 'false' : 'true'}
      },`
    )
    .join('\n');

  const addMissingColumns = columns
    .map(
      (column) => `    if (!existingColumns['${column.name}']) {
      await queryInterface.addColumn('${tableName}', '${column.name}', {
        type: Sequelize.STRING,
        allowNull: ${column.allowNull === false ? 'false' : 'true'},
      });
    }`
    )
    .join('\n');

  return `'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const allTables = await queryInterface.showAllTables();
    const normalizedTables = allTables
      .map((item) => {
        if (typeof item === 'string') return item;
        return item?.tableName || item?.name || '';
      })
      .map((item) => String(item).toLowerCase());

    const tableExists = normalizedTables.includes('${tableName.toLowerCase()}');

    if (!tableExists) {
      await queryInterface.createTable('${tableName}', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
${body}
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      });
      return;
    }

    const existingColumns = await queryInterface.describeTable('${tableName}');
${addMissingColumns}
  },

  async down(queryInterface) {
    const allTables = await queryInterface.showAllTables();
    const normalizedTables = allTables
      .map((item) => {
        if (typeof item === 'string') return item;
        return item?.tableName || item?.name || '';
      })
      .map((item) => String(item).toLowerCase());

    if (!normalizedTables.includes('${tableName.toLowerCase()}')) return;

    await queryInterface.dropTable('${tableName}');
  },
};
`;
}

function createSqlModelDefs(options: CliOptions): Array<{
  name: string;
  fields: string[];
  migrationCols: Array<{ name: string; allowNull?: boolean }>;
}> {
  return [
    {
      name: options.models.users,
      fields: ['name', 'email'],
      migrationCols: [
        { name: 'name', allowNull: false },
        { name: 'email', allowNull: false },
      ],
    },
    {
      name: options.models.tenants,
      fields: ['name', 'slug', 'description', 'isActive'],
      migrationCols: [
        { name: 'name', allowNull: false },
        { name: 'slug', allowNull: false },
        { name: 'description', allowNull: true },
        { name: 'isActive', allowNull: false },
      ],
    },
    {
      name: options.models.roles,
      fields: [options.keys.tenantId, 'title', 'slug', 'description', 'isActive'],
      migrationCols: [
        { name: options.keys.tenantId, allowNull: false },
        { name: 'title', allowNull: false },
        { name: 'slug', allowNull: false },
        { name: 'description', allowNull: true },
        { name: 'isActive', allowNull: false },
      ],
    },
    {
      name: options.models.permissions,
      fields: ['title', 'slug', 'description', 'isActive'],
      migrationCols: [
        { name: 'title', allowNull: false },
        { name: 'slug', allowNull: false },
        { name: 'description', allowNull: true },
        { name: 'isActive', allowNull: false },
      ],
    },
    {
      name: options.models.userRoles,
      fields: [options.keys.userId, options.keys.roleId, options.keys.tenantId, 'status'],
      migrationCols: [
        { name: options.keys.userId, allowNull: false },
        { name: options.keys.roleId, allowNull: false },
        { name: options.keys.tenantId, allowNull: false },
        { name: 'status', allowNull: false },
      ],
    },
    {
      name: options.models.rolePermissions,
      fields: [options.keys.roleId, options.keys.permissionId],
      migrationCols: [
        { name: options.keys.roleId, allowNull: false },
        { name: options.keys.permissionId, allowNull: false },
      ],
    },
  ];
}

function generateSequelize(options: CliOptions): void {
  const modelsDir = path.join(options.outDir, 'sequelize', 'models');
  const migrationsDir = path.join(options.outDir, 'sequelize', 'migrations');

  const modelDefs = createSqlModelDefs(options);

  modelDefs.forEach((def, index) => {
    writeFileSafely(
      path.join(modelsDir, `${def.name}.ts`),
      createSequelizeModelTemplate(def.name, def.fields)
    );

    const migrationPrefix = String(Date.now() + index);
    writeFileSafely(
      path.join(migrationsDir, `${migrationPrefix}-create-${def.name}.js`),
      createMigrationTemplate(def.name, def.migrationCols)
    );
  });
}

function generateMongoose(options: CliOptions): void {
  const modelsDir = path.join(options.outDir, 'mongoose', 'models');

  const modelDefs: Array<{ name: string; fields: string[] }> = [
    { name: options.models.users, fields: ['name', 'email'] },
    { name: options.models.tenants, fields: ['name', 'slug', 'description', 'isActive'] },
    {
      name: options.models.roles,
      fields: [options.keys.tenantId, 'title', 'slug', 'description', 'isActive'],
    },
    { name: options.models.permissions, fields: ['title', 'slug', 'description', 'isActive'] },
    {
      name: options.models.userRoles,
      fields: [options.keys.userId, options.keys.roleId, options.keys.tenantId, 'status'],
    },
    {
      name: options.models.rolePermissions,
      fields: [options.keys.roleId, options.keys.permissionId],
    },
  ];

  modelDefs.forEach((def) => {
    writeFileSafely(
      path.join(modelsDir, `${def.name}.ts`),
      createMongooseModelTemplate(def.name, def.fields)
    );
  });
}

function runInit(flags: Record<string, string>): void {
  const cwd = process.cwd();
  const hasExplicitOverrides = Boolean(flags.config || flags.models || flags.keys);
  let configSource: string | undefined;
  let fileConfig: Record<string, any> = {};

  if (flags.config) {
    fileConfig = loadConfigOverrides(flags.config);
    configSource = path.resolve(cwd, flags.config);
  } else if (!hasExplicitOverrides) {
    const detected = autoDetectConfigOverrides(cwd);
    if (detected) {
      fileConfig = detected.config;
      configSource = detected.source;
    }
  }

  const inferredOrm = fileConfig.sequelizeConfig
    ? 'sequelize'
    : fileConfig.mongodbConfig
      ? 'mongoose'
      : undefined;
  const orm = (flags.orm || inferredOrm || 'sequelize') as 'sequelize' | 'mongoose';
  if (orm !== 'sequelize' && orm !== 'mongoose') {
    throw new Error(`Unsupported --orm: ${flags.orm}. Use sequelize|mongoose.`);
  }

  const modelOverrides = parseKvFlag(flags.models);
  const keyOverrides = parseKvFlag(flags.keys);

  const options: CliOptions = {
    orm,
    outDir: path.resolve(process.cwd(), flags.out || './rbac-generated'),
    models: {
      ...DEFAULT_MODELS,
      ...(fileConfig.models || {}),
      ...modelOverrides,
    },
    keys: {
      ...DEFAULT_KEYS,
      ...(fileConfig.keys || {}),
      ...keyOverrides,
    },
  };

  if (options.orm === 'sequelize') {
    generateSequelize(options);
  } else {
    generateMongoose(options);
  }

  const summaryPath = path.join(options.outDir, 'rbac.init.json');
  writeFileSafely(
    summaryPath,
    JSON.stringify(
      {
        orm: options.orm,
        models: options.models,
        keys: options.keys,
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  if (configSource) {
    process.stdout.write(`Resolved RBAC mappings from ${configSource}\n`);
  }
  process.stdout.write(`Generated RBAC ${options.orm} files in ${options.outDir}\n`);
}

function runMigrationCommand(flags: Record<string, string>): void {
  const packageName = flags.package || 'multi-tenant-rbac';
  const urlArg = flags.url ? ` --url ${flags.url}` : '';
  const migrationsPath =
    flags.migrationsPath || `./node_modules/${packageName}/src/migrations`;

  // This keeps old users on the same migration flow by default.
  const command = `node ./node_modules/.bin/sequelize-cli db:migrate${urlArg} --migrations-path ${migrationsPath}`;
  process.stdout.write(`${command}\n`);
}

function runDoctor(flags: Record<string, string>): void {
  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');
  const tsConfigPath = path.join(cwd, 'tsconfig.json');
  const sequelizeCliPath = path.join(cwd, 'node_modules', '.bin', 'sequelize-cli');
  const rbacCliPath = path.join(cwd, 'node_modules', '.bin', 'rbac');
  const rbacPackagePath = path.join(cwd, 'node_modules', 'multi-tenant-rbac', 'package.json');
  const defaultManifestPath = path.join(cwd, 'rbac-generated', 'rbac.init.json');

  const report: DoctorReport = {
    cwd,
    packageJsonExists: fs.existsSync(packageJsonPath),
    hasTsConfig: fs.existsSync(tsConfigPath),
    hasSequelizeCli: fs.existsSync(sequelizeCliPath),
    hasRbacCli: fs.existsSync(rbacCliPath),
    hasRbacPackage: fs.existsSync(rbacPackagePath),
    hasRbacManifest: fs.existsSync(defaultManifestPath),
    defaultManifestPath,
    recommendations: [],
  };

  if (!report.packageJsonExists) {
    report.recommendations.push('Add package.json to root project.');
  }
  if (!report.hasTsConfig) {
    report.recommendations.push('Add tsconfig.json for TypeScript-based RBAC integration.');
  }
  if (!report.hasSequelizeCli) {
    report.recommendations.push('Install sequelize-cli in parent project if you use SQL migrations.');
  }
  if (!report.hasRbacPackage || !report.hasRbacCli) {
    report.recommendations.push(
      'Install multi-tenant-rbac in the parent project (npm install multi-tenant-rbac) so `rbac` CLI is available.'
    );
  }
  if (!report.hasRbacManifest) {
    report.recommendations.push(
      `Run "rbac init --orm sequelize --out ./rbac-generated" or pass --manifest to validate.`
    );
  }

  const output = JSON.stringify(report, null, 2);
  if (flags.out) {
    writeFileSafely(path.resolve(cwd, flags.out), output);
    process.stdout.write(`Doctor report written to ${path.resolve(cwd, flags.out)}\n`);
    return;
  }
  process.stdout.write(`${output}\n`);
}

function runValidate(flags: Record<string, string>): void {
  const cwd = process.cwd();
  const manifestPath = path.resolve(cwd, flags.manifest || './rbac-generated/rbac.init.json');
  if (!fs.existsSync(manifestPath)) {
    process.stdout.write(
      `${JSON.stringify(
        {
          manifestPath,
          valid: false,
          missingModels: [],
          missingKeys: [],
          errors: [
            `Manifest not found: ${manifestPath}. Run "rbac init --orm sequelize --out ./rbac-generated" first or pass --manifest.`,
          ],
        },
        null,
        2
      )}\n`
    );
    process.exitCode = 1;
    return;
  }

  let parsed: Record<string, any>;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    parsed = JSON.parse(raw) as Record<string, any>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(
      `${JSON.stringify(
        {
          manifestPath,
          valid: false,
          missingModels: [],
          missingKeys: [],
          errors: [`Failed to read/parse manifest: ${message}`],
        },
        null,
        2
      )}\n`
    );
    process.exitCode = 1;
    return;
  }

  const requiredModelKeys = ['users', 'roles', 'permissions', 'userRoles', 'rolePermissions'];
  const requiredFkKeys = ['userId', 'roleId', 'permissionId', 'tenantId'];
  const missingModels = requiredModelKeys.filter((key) => !parsed.models?.[key]);
  const missingKeys = requiredFkKeys.filter((key) => !parsed.keys?.[key]);

  const result = {
    manifestPath,
    valid: missingModels.length === 0 && missingKeys.length === 0,
    missingModels,
    missingKeys,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.valid) {
    process.exitCode = 1;
  }
}

function runSeed(flags: Record<string, string>): void {
  const outFile = path.resolve(process.cwd(), flags.out || './rbac.seed.json');
  const seed = {
    roles: [
      { title: 'owner', description: 'Tenant owner', isActive: true },
      { title: 'admin', description: 'Tenant admin', isActive: true },
      { title: 'viewer', description: 'Read-only user', isActive: true },
    ],
    permissions: [
      { title: 'read:*', description: 'Read access to resources', isActive: true },
      { title: 'write:*', description: 'Write access to resources', isActive: true },
      { title: 'manage:users', description: 'Manage tenant users', isActive: true },
    ],
  };

  writeFileSafely(outFile, JSON.stringify(seed, null, 2));
  process.stdout.write(`Seed template generated at ${outFile}\n`);
}

function printUsage(): void {
  process.stdout.write(
    [
      'rbac init [--orm sequelize|mongoose] [--out ./path] [--config ./rbac.config.(json|js|ts)] [--models users=users,roles=roles,...] [--keys userId=userId,roleId=roleId,...]',
      'rbac migration:command [--url mysql://user:pass@host:3306/db] [--migrationsPath ./path] [--package multi-tenant-rbac]',
      'rbac doctor [--out ./rbac.doctor.json]',
      'rbac validate [--manifest ./rbac-generated/rbac.init.json]',
      'rbac seed [--out ./rbac.seed.json]',
      '',
      'Examples:',
      'rbac init --out ./rbac-generated',
      'rbac init --orm sequelize --out ./rbac-generated',
      'rbac init --config ./src/rbac.typed-config.ts --out ./rbac-generated',
      'rbac migration:command --url mysql://root:password@localhost:3306/lib_rbac',
      'rbac doctor --out ./rbac.doctor.json',
      'rbac seed --out ./rbac.seed.json',
    ].join('\n')
  );
}

function main(): void {
  const { command, flags } = parseArgs(process.argv.slice(2));

  if (flags.help || command === 'help' || !command) {
    printUsage();
    return;
  }

  if (command === 'init' || command === 'scaffold') {
    runInit(flags);
    return;
  }

  if (command === 'migration:command' || command === 'migrate:cmd') {
    runMigrationCommand(flags);
    return;
  }

  if (command === 'doctor') {
    runDoctor(flags);
    return;
  }

  if (command === 'validate') {
    runValidate(flags);
    return;
  }

  if (command === 'seed') {
    runSeed(flags);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main();
