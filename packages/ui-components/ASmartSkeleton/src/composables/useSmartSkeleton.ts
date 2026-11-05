import { inject, type InjectionKey } from 'vue';
import type { SmartSkeletonConfig } from '../types';

export const SMART_SKELETON_CONFIG_KEY: InjectionKey<SmartSkeletonConfig> =
  Symbol('a-smart-skeleton');

/** Per server render: whether the full inline script has gone out yet, so the skeletons after it send a stub. */
export const SMART_SKELETON_BOOT_KEY: InjectionKey<{ sent: boolean }> =
  Symbol('a-smart-skeleton.boot');

/** The provider settings in scope for this component. Empty outside a provider. */
export const useSmartSkeleton = (): SmartSkeletonConfig => inject(SMART_SKELETON_CONFIG_KEY, {});

/** Whether this skeleton should send the stub — claiming the full script if it's the first. */
export function claimStub(): boolean {
  const boot = inject(SMART_SKELETON_BOOT_KEY, null);
  const stub = !!boot?.sent;
  if (boot) boot.sent = true;
  return stub;
}
