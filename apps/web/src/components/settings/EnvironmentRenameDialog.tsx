import {
  ENVIRONMENT_NAME_MAX_LENGTH,
  type EnvironmentId,
  type ServerConfig,
} from "@t3tools/contracts";
import { useState } from "react";

import { useUpdateEnvironmentSettings } from "../../hooks/useSettings";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { useEnvironmentOperateAccess } from "./useEnvironmentOperateAccess";

/** Why the name can't be changed. Null means it can be. */
export function resolveEnvironmentNameLock(input: {
  readonly serverConfig: ServerConfig | null;
  readonly operateAccess: "granted" | "denied" | "pending";
}): string | null {
  if (input.serverConfig === null) {
    return "Connect to this environment to change its name.";
  }
  if (input.serverConfig.environment.capabilities.environmentName !== true) {
    return "This environment's server is too old to keep a name. Update it to choose one.";
  }
  if (input.operateAccess === "pending") {
    return "Checking whether this session can change the environment's settings.";
  }
  if (input.operateAccess === "denied") {
    return "Your session on this environment cannot change its settings.";
  }
  return null;
}

/**
 * Renames an environment for every device that connects to it. Opened from
 * the environment's row menu; a blank name returns to the automatic label.
 */
export function EnvironmentRenameDialog({
  environmentId,
  serverConfig,
  open,
  onOpenChange,
}: {
  readonly environmentId: EnvironmentId;
  readonly serverConfig: ServerConfig | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        {/* Mounted per opening so the draft starts from the current name. */}
        {open ? (
          <EnvironmentRenameForm
            environmentId={environmentId}
            serverConfig={serverConfig}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogPopup>
    </Dialog>
  );
}

function EnvironmentRenameForm({
  environmentId,
  serverConfig,
  onDone,
}: {
  readonly environmentId: EnvironmentId;
  readonly serverConfig: ServerConfig | null;
  readonly onDone: () => void;
}) {
  const updateSettings = useUpdateEnvironmentSettings(environmentId);
  const operateAccess = useEnvironmentOperateAccess(environmentId);
  const lock = resolveEnvironmentNameLock({ serverConfig, operateAccess });
  const current = serverConfig?.settings.environmentName ?? null;
  const [draft, setDraft] = useState(current ?? "");

  const save = () => {
    if (lock !== null) return;
    const next = draft.trim() || null;
    if (next !== current) {
      updateSettings({ environmentName: next });
    }
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Rename environment</DialogTitle>
        <DialogDescription>
          {lock ??
            "The name other devices see this environment as. Leave it blank to use the automatic name."}
        </DialogDescription>
      </DialogHeader>
      <DialogPanel>
        <Input
          aria-label="Environment name"
          placeholder="Automatic"
          autoFocus
          value={draft}
          disabled={lock !== null}
          maxLength={ENVIRONMENT_NAME_MAX_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              save();
            }
          }}
        />
      </DialogPanel>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={lock !== null} onClick={save}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
