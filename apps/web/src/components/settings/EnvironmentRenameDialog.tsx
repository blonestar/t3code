import type { EnvironmentId, ServerConfig } from "@t3tools/contracts";
import { PencilIcon } from "lucide-react";
import { useId, useState } from "react";

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
import { Label } from "../ui/label";
import { MenuItem } from "../ui/menu";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { useEnvironmentSettingsLock } from "./EnvironmentIconPicker";

type RenameServerConfig = Pick<ServerConfig, "environment" | "settings">;

export function EnvironmentRenameMenuItem({
  environmentId,
  serverConfig,
  onSelect,
}: {
  readonly environmentId: EnvironmentId;
  readonly serverConfig: RenameServerConfig | null;
  readonly onSelect: () => void;
}) {
  const lock = useEnvironmentSettingsLock(environmentId, serverConfig, "name");

  const item = (
    <MenuItem className="w-full" disabled={lock !== null} onClick={onSelect}>
      <PencilIcon />
      Rename…
    </MenuItem>
  );
  if (lock === null) return item;
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        nativeButton={false}
        render={<span className="block w-full cursor-not-allowed" />}
      >
        {item}
      </PopoverTrigger>
      <PopoverPopup tooltipStyle side="left" align="center">
        {lock}
      </PopoverPopup>
    </Popover>
  );
}

export function EnvironmentRenameDialog({
  environmentId,
  serverConfig,
  open,
  onOpenChange,
}: {
  readonly environmentId: EnvironmentId;
  readonly serverConfig: RenameServerConfig | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <EnvironmentRenameForm
          environmentId={environmentId}
          serverConfig={serverConfig}
          onClose={() => onOpenChange(false)}
        />
      </DialogPopup>
    </Dialog>
  );
}

function EnvironmentRenameForm({
  environmentId,
  serverConfig,
  onClose,
}: {
  readonly environmentId: EnvironmentId;
  readonly serverConfig: RenameServerConfig | null;
  readonly onClose: () => void;
}) {
  const updateSettings = useUpdateEnvironmentSettings(environmentId);
  const customLabel = serverConfig?.settings?.environmentLabel ?? null;
  const [name, setName] = useState(customLabel ?? "");
  const inputId = useId();

  const save = (environmentLabel: string | null) => {
    if (environmentLabel !== customLabel) {
      updateSettings({ environmentLabel });
    }
    onClose();
  };

  return (
    <form
      className="flex min-h-0 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        save(name.trim() === "" ? null : name.trim());
      }}
    >
      <DialogHeader>
        <DialogTitle>Rename environment</DialogTitle>
        <DialogDescription>
          Every device connected to this environment shows this name.
        </DialogDescription>
      </DialogHeader>
      <DialogPanel>
        <div className="grid gap-1.5">
          <Label htmlFor={inputId}>Name</Label>
          <Input
            id={inputId}
            autoFocus
            maxLength={64}
            placeholder={serverConfig?.environment.label}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
      </DialogPanel>
      <DialogFooter>
        {customLabel !== null ? (
          <Button type="button" variant="ghost" className="sm:mr-auto" onClick={() => save(null)}>
            Use automatic name
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
}
