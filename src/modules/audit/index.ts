export type AuditAction =
  | 'tenant.create'
  | 'tenant.update'
  | 'tenant.delete'
  | 'role.create'
  | 'role.update'
  | 'role.delete'
  | 'role.permissions.sync'
  | 'user.role.assign'
  | 'user.role.sync'
  | 'user.role.revoke'
  | 'permission.create'
  | 'permission.update'
  | 'permission.delete';

export type AuditEvent = {
  action: AuditAction;
  tenantId?: string;
  actorId?: string;
  model?: string;
  recordId?: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  metadata?: Record<string, any>;
  timestamp: string;
};

export type AuditHandler = (event: AuditEvent) => void | Promise<void>;

export class AuditTrail {
  private static handlers: AuditHandler[] = [];

  static register(handler: AuditHandler): void {
    this.handlers.push(handler);
  }

  static clearHandlers(): void {
    this.handlers = [];
  }

  static async emit(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    const payload: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    await Promise.all(this.handlers.map((handler) => Promise.resolve(handler(payload))));
  }
}

export default AuditTrail;
