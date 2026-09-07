import type { ServerConfig } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { resolveEnvironmentNameLock } from "./EnvironmentRenameDialog";

const config = (environmentName: boolean | undefined) =>
  ({
    environment: { capabilities: environmentName === undefined ? {} : { environmentName } },
  }) as unknown as ServerConfig;

describe("resolveEnvironmentNameLock", () => {
  it("locks until the environment is connected", () => {
    expect(resolveEnvironmentNameLock({ serverConfig: null, operateAccess: "granted" })).toMatch(
      /Connect/,
    );
  });

  it("locks on servers that predate the setting", () => {
    expect(
      resolveEnvironmentNameLock({
        serverConfig: config(undefined),
        operateAccess: "granted",
      }),
    ).toMatch(/too old/);
  });

  it("locks until permissions resolve and when they are denied", () => {
    expect(
      resolveEnvironmentNameLock({ serverConfig: config(true), operateAccess: "pending" }),
    ).toMatch(/Checking/);
    expect(
      resolveEnvironmentNameLock({ serverConfig: config(true), operateAccess: "denied" }),
    ).toMatch(/cannot change/);
  });

  it("stays editable with the capability and permission", () => {
    expect(
      resolveEnvironmentNameLock({ serverConfig: config(true), operateAccess: "granted" }),
    ).toBeNull();
  });
});
