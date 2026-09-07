import type { EnvironmentId, ServerConfig } from "@t3tools/contracts";
import * as Option from "effect/Option";
import { AsyncResult, Atom } from "effect/unstable/reactivity";

import { AVAILABLE_CONNECTION_STATE, type SupervisorConnectionState } from "../connection/model.ts";
import {
  presentEnvironmentConnection,
  type EnvironmentPresentation,
} from "../connection/presentation.ts";
import type { ConnectionCatalogEntry } from "../connection/catalog.ts";
import type { EnvironmentCatalogState } from "./connections.ts";

function mapsEqual<K, V>(left: ReadonlyMap<K, V>, right: ReadonlyMap<K, V>): boolean {
  if (left.size !== right.size) {
    return false;
  }
  for (const [key, value] of left) {
    if (right.get(key) !== value) {
      return false;
    }
  }
  return true;
}

/**
 * The name an environment wears on this device. A rename made on this device
 * wins, then the name chosen on the server. Primary and T3 Connect targets
 * also follow the server's automatic label; other targets keep the label they
 * were saved with, such as a desktop backend's "WSL: Ubuntu".
 */
export function resolveEnvironmentPresentationLabel(
  entry: ConnectionCatalogEntry,
  serverConfig: ServerConfig | null,
): string {
  const target = entry.target;
  switch (target._tag) {
    case "PrimaryConnectionTarget":
    case "RelayConnectionTarget":
      return serverConfig?.environment.label ?? target.label;
    case "BearerConnectionTarget":
      if (target.customLabel === true) return target.label;
      return serverConfig?.settings.environmentName ?? target.label;
    case "SshConnectionTarget":
      return serverConfig?.settings.environmentName ?? target.label;
  }
}

export function createEnvironmentPresentationAtoms<E>(input: {
  readonly catalogValueAtom: Atom.Atom<EnvironmentCatalogState>;
  readonly stateAtom: (
    environmentId: EnvironmentId,
  ) => Atom.Atom<AsyncResult.AsyncResult<SupervisorConnectionState, E>>;
  /** Authoritative live server config, including streamed provider/settings updates. */
  readonly serverConfigValueAtom: (environmentId: EnvironmentId) => Atom.Atom<ServerConfig | null>;
}) {
  const presentationAtom = Atom.family((environmentId: EnvironmentId) =>
    Atom.make((get) => {
      const entry = get(input.catalogValueAtom).entries.get(environmentId);
      if (entry === undefined) {
        return null;
      }
      const state = Option.getOrElse(
        AsyncResult.value(get(input.stateAtom(environmentId))),
        () => AVAILABLE_CONNECTION_STATE,
      );
      const serverConfig = get(input.serverConfigValueAtom(environmentId));
      return {
        entry,
        label: resolveEnvironmentPresentationLabel(entry, serverConfig),
        connection:
          entry.unsupportedReason === undefined
            ? presentEnvironmentConnection(state)
            : { phase: "unsupported", error: entry.unsupportedReason, traceId: null },
        serverConfig,
      } satisfies EnvironmentPresentation;
    }).pipe(Atom.withLabel(`environment-presentation:${environmentId}`)),
  );

  let previous: ReadonlyMap<EnvironmentId, EnvironmentPresentation> = new Map();
  const presentationsAtom = Atom.make((get) => {
    const next = new Map<EnvironmentId, EnvironmentPresentation>();
    for (const environmentId of get(input.catalogValueAtom).entries.keys()) {
      const presentation = get(presentationAtom(environmentId));
      if (presentation !== null) {
        next.set(environmentId, presentation);
      }
    }
    if (mapsEqual(previous, next)) {
      return previous;
    }
    previous = next;
    return previous;
  }).pipe(Atom.withLabel("environment-presentations"));

  return {
    presentationAtom,
    presentationsAtom,
  };
}
