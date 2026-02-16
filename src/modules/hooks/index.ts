import { EventEmitter } from 'events';

export type HookEvent =
  | 'beforeRoleAssign'
  | 'afterRoleAssign'
  | 'beforeRoleSync'
  | 'afterRoleSync'
  | 'beforePermissionSync'
  | 'afterPermissionSync';

class RbacHooks extends EventEmitter {
  emitHook(event: HookEvent, payload: Record<string, any>): void {
    this.emit(event, payload);
  }

  onHook(event: HookEvent, listener: (payload: Record<string, any>) => void): void {
    this.on(event, listener);
  }
}

const hooks = new RbacHooks();

export default hooks;
