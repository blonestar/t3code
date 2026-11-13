import type { ServerConfig } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { resolveEnvironmentSettingsLock } from "./EnvironmentIconPicker";

const config = { environment: { capabilities: {} } } as unknown as ServerConfig;

describe("resolveEnvironmentSettingsLock", () => {
  it("waits for a settings grant before allowing changes", () => {
    expect(
      resolveEnvironmentSettingsLock({
        serverConfig: config,
        operateAccess: "pending",
        change: "icon",
      }),
    ).toMatch(/cannot change/);
    expect(
      resolveEnvironmentSettingsLock({
        serverConfig: config,
        operateAccess: "granted",
        change: "icon",
      }),
    ).toBeNull();
  });

  it("keeps rename off on a server that cannot store a name", () => {
    expect(
      resolveEnvironmentSettingsLock({
        serverConfig: config,
        operateAccess: "granted",
        change: "name",
      }),
    ).toMatch(/Update this environment/);
    const current = {
      environment: { capabilities: { environmentLabel: true } },
    } as unknown as ServerConfig;
    expect(
      resolveEnvironmentSettingsLock({
        serverConfig: current,
        operateAccess: "granted",
        change: "name",
      }),
    ).toBeNull();
  });
});
