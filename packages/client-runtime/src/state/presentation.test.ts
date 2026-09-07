import {
  BearerConnectionTarget,
  PrimaryConnectionTarget,
  RelayConnectionTarget,
  SshConnectionTarget,
} from "../connection/model.ts";
import type { ConnectionCatalogEntry } from "../connection/catalog.ts";
import { EnvironmentId, type ServerConfig } from "@t3tools/contracts";
import { describe, expect, it } from "@effect/vitest";
import * as Option from "effect/Option";

import { resolveEnvironmentPresentationLabel } from "./presentation.ts";

const environmentId = EnvironmentId.make("environment-1");

const config = (environmentName: string | null) =>
  ({
    environment: {
      environmentId,
      label: environmentName ?? "automatic-hostname",
      platform: { os: "linux", arch: "x64" },
      serverVersion: "0.0.0-test",
      capabilities: {},
    },
    settings: { environmentName },
  }) as unknown as ServerConfig;

function entry(target: ConnectionCatalogEntry["target"]): ConnectionCatalogEntry {
  return { target, profile: Option.none(), enabled: true };
}

const pairedBearer = (customLabel?: boolean) =>
  entry(
    new BearerConnectionTarget({
      environmentId,
      label: "Label at pairing",
      connectionId: "bearer:environment-1",
      ...(customLabel ? { customLabel } : {}),
    }),
  );

describe("resolveEnvironmentPresentationLabel", () => {
  it("follows the server's label for primary and relay connections", () => {
    expect(
      resolveEnvironmentPresentationLabel(
        entry(
          new PrimaryConnectionTarget({
            environmentId,
            label: "Old environment name",
            httpBaseUrl: "http://localhost:3774",
            wsBaseUrl: "ws://localhost:3774",
          }),
        ),
        config("Renamed environment"),
      ),
    ).toBe("Renamed environment");
    expect(
      resolveEnvironmentPresentationLabel(
        entry(new RelayConnectionTarget({ environmentId, label: "Old environment name" })),
        config(null),
      ),
    ).toBe("automatic-hostname");
  });

  it("shows a server-chosen name on bearer and SSH connections saved with an older label", () => {
    expect(resolveEnvironmentPresentationLabel(pairedBearer(), config("Studio server"))).toBe(
      "Studio server",
    );
    expect(
      resolveEnvironmentPresentationLabel(
        entry(
          new SshConnectionTarget({
            environmentId,
            label: "devbox",
            connectionId: "ssh:environment-1",
          }),
        ),
        config("Studio server"),
      ),
    ).toBe("Studio server");
  });

  it("keeps the saved label when the server has no chosen name or is not connected", () => {
    expect(resolveEnvironmentPresentationLabel(pairedBearer(), config(null))).toBe(
      "Label at pairing",
    );
    expect(resolveEnvironmentPresentationLabel(pairedBearer(), null)).toBe("Label at pairing");
  });

  it("keeps a name the user chose on this device", () => {
    expect(resolveEnvironmentPresentationLabel(pairedBearer(true), config("Studio server"))).toBe(
      "Label at pairing",
    );
  });
});
