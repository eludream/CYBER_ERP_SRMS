import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import LoadingIndicator from "@/components/LoadingIndicator";
import { apiActivity } from "@/lib/apiActivity";

const REVEAL_DELAY_MS = 400;
const MINIMUM_VISIBLE_MS = 600;

export default function GlobalRequestLoader() {
  const activity = useSyncExternalStore(apiActivity.subscribe, apiActivity.getSnapshot);
  const switchingTenant = activity.tenantSwitches > 0;
  // Reads frequently run in parallel after a page has already rendered. Treating
  // them as blocking leaves a full-screen veil over usable content when one of
  // those background requests is slow or retrying.
  const active = activity.writes + activity.tenantSwitches > 0;
  const [visible, setVisible] = useState(false);
  const visibleSince = useRef(0);
  const lastWasSaving = useRef(false);
  const tenantSwitchSequence = useRef(false);

  if (active) lastWasSaving.current = activity.writes > 0;
  if (switchingTenant) tenantSwitchSequence.current = true;

  useEffect(() => {
    let timer: number | undefined;

    if (active) {
      if (!visible) {
        timer = window.setTimeout(() => {
          visibleSince.current = Date.now();
          setVisible(true);
        }, switchingTenant ? 0 : REVEAL_DELAY_MS);
      }
    } else if (visible) {
      const elapsed = Date.now() - visibleSince.current;
      timer = window.setTimeout(() => {
        setVisible(false);
        tenantSwitchSequence.current = false;
      }, Math.max(0, MINIMUM_VISIBLE_MS - elapsed));
    } else {
      tenantSwitchSequence.current = false;
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [active, switchingTenant, visible]);

  if (!visible) return null;

  const saving = active ? activity.writes > 0 : lastWasSaving.current;
  const tenantSequenceActive = tenantSwitchSequence.current;
  return createPortal(
    <div className="fixed inset-0 z-[2147483647] h-[100dvh] w-[100dvw]" aria-modal="true">
      <div className="absolute inset-0 bg-background/65 backdrop-blur-[3px]" />
      <div className="absolute left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2">
        <LoadingIndicator
          title={tenantSequenceActive ? "Switching tenant" : saving ? "Saving changes" : "Loading records"}
          description={tenantSequenceActive ? "Refreshing modules and operations for the selected tenant..." : saving ? "Please wait while your record is updated..." : "Retrieving the latest records..."}
          className="p-0"
        />
      </div>
    </div>,
    document.body,
  );
}
