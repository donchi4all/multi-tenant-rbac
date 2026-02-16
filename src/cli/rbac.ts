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
  recommendations: string[];
};

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

  return `'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('${tableName}');
  },
};
`;
}

function generateSequelize(options: CliOptions): void {
  const modelsDir = path.join(options.outDir, 'sequelize', 'models');
  const migrationsDir = path.join(options.outDir, 'sequelize', 'migrations');

  const modelDefs: Array<{ name: string; fields: string[]; migrationCols: Array<{ name: string; allowNull?: boolean }> }> = [
    {
      name: options.models.users,
      fields: ['name', 'email'],
      migrationCols: [
        { name: 'name', allowNull: false },
        { name: 'email', allowNull: false },
      ],
    },
    {
      name: options.models.roles,
      fields: [options.keys.tenantId, 'title', 'slug'],
      migrationCols: [
        { name: options.keys.tenantId, allowNull: false },
        { name: 'title', allowNull: false },
        { name: 'slug', allowNull: false },
      ],
    },
    {
      name: options.models.permissions,
      fields: ['title', 'slug'],
      migrationCols: [
        { name: 'title', allowNull: false },
        { name: 'slug', allowNull: false },
      ],
    },
    {
      name: options.models.userRoles,
      fields: [options.keys.userId, options.keys.roleId, options.keys.tenantId],
      migrationCols: [
        { name: options.keys.userId, allowNull: false },
        { name: options.keys.roleId, allowNull: false },
        { name: options.keys.tenantId, allowNull: false },
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
    { name: options.models.roles, fields: [options.keys.tenantId, 'title', 'slug'] },
    { name: options.models.permissions, fields: ['title', 'slug'] },
    {
      name: options.models.userRoles,
      fields: [options.keys.userId, options.keys.roleId, options.keys.tenantId],
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
  const orm = (flags.orm || 'sequelize') as 'sequelize' | 'mongoose';
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
      ...modelOverrides,
    },
    keys: {
      ...DEFAULT_KEYS,
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

  const report: DoctorReport = {
    cwd,
    packageJsonExists: fs.existsSync(packageJsonPath),
    hasTsConfig: fs.existsSync(tsConfigPath),
    hasSequelizeCli: fs.existsSync(sequelizeCliPath),
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
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const raw = fs.readFileSync(manifestPath, 'utf8');
  const parsed = JSON.parse(raw) as Record<string, any>;

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
      'rbac init [--orm sequelize|mongoose] [--out ./path] [--models users=users,roles=roles,...] [--keys userId=userId,roleId=roleId,...]',
      'rbac migration:command [--url mysql://user:pass@host:3306/db] [--migrationsPath ./path] [--package multi-tenant-rbac]',
      'rbac doctor [--out ./rbac.doctor.json]',
      'rbac validate [--manifest ./rbac-generated/rbac.init.json]',
      'rbac seed [--out ./rbac.seed.json]',
      '',
      'Examples:',
      'rbac init --orm sequelize --out ./rbac-generated',
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
