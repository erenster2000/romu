/**
 * Industry timing rules, kept apart from the flow so they're testable with
 * fake timers and optional by design (decision B: the linter enforces
 * network requirements; this layer just makes them easy to satisfy).
 */
export interface Rules {
  /** Seconds without interaction before the "idle" event fires. */
  idleCta?: number;
  /** Seconds after start before the flow is forced to the end scene. */
  maxDuration?: number;
}

export interface RuleHooks {
  onIdle(): void;
  onTimeout(): void;
}

export interface RuleTimers {
  /** Call on any user interaction — resets the idle countdown. */
  activity(): void;
  /** Stop all timers (game over / teardown). */
  stop(): void;
}

export function startRules(rules: Rules, hooks: RuleHooks): RuleTimers {
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let maxTimer: ReturnType<typeof setTimeout> | undefined;

  const armIdle = (): void => {
    if (rules.idleCta === undefined) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(hooks.onIdle, rules.idleCta * 1000);
  };

  armIdle();
  if (rules.maxDuration !== undefined) {
    maxTimer = setTimeout(hooks.onTimeout, rules.maxDuration * 1000);
  }

  return {
    activity: armIdle,
    stop() {
      clearTimeout(idleTimer);
      clearTimeout(maxTimer);
    },
  };
}
