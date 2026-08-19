type ApiActivitySnapshot = {
  reads: number;
  writes: number;
  tenantSwitches: number;
};

let snapshot: ApiActivitySnapshot = { reads: 0, writes: 0, tenantSwitches: 0 };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(listener => listener());

export function beginApiActivity(method = "GET") {
  const key = method.toUpperCase() === "GET" ? "reads" : "writes";
  snapshot = { ...snapshot, [key]: snapshot[key] + 1 };
  emit();

  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    snapshot = { ...snapshot, [key]: Math.max(0, snapshot[key] - 1) };
    emit();
  };
}

export function beginTenantSwitch() {
  snapshot = { ...snapshot, tenantSwitches: snapshot.tenantSwitches + 1 };
  emit();

  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    snapshot = { ...snapshot, tenantSwitches: Math.max(0, snapshot.tenantSwitches - 1) };
    emit();
  };
}

export const apiActivity = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return snapshot;
  },
};
