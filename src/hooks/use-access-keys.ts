"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import type { AccessKeyEntry } from "@/lib/access-keys";

/**
 * Minimal shape of the accounts provider we need — avoids depending on
 * the package's internal Provider type paths that aren't reliably re-exported.
 */
interface StoredAccessKey {
  address: `0x${string}`;
  access: `0x${string}`;
  expiry?: number;
  keyType: AccessKeyEntry["keyType"];
  limits?: Array<{ token: `0x${string}`; limit: bigint }>;
}

interface ProviderStore {
  getState: () => { accessKeys: readonly StoredAccessKey[] };
  subscribe: (
    selector: (state: { accessKeys: readonly StoredAccessKey[] }) => unknown,
    listener: () => void,
  ) => () => void;
}

interface AccountsProvider {
  store: ProviderStore;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

async function getAccountsProvider(
  connector: { getProvider?: () => Promise<unknown> } | undefined,
): Promise<AccountsProvider | null> {
  if (!connector?.getProvider) return null;
  const provider = (await connector.getProvider()) as AccountsProvider | null;
  return provider ?? null;
}

export function useAccessKeys() {
  const { address, connector } = useAccount();
  const [fetchedKeys, setFetchedKeys] = useState<AccessKeyEntry[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isReady = Boolean(connector && address);

  useEffect(() => {
    if (!isReady || !connector || !address) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const provider = await getAccountsProvider(connector);
      if (!provider || cancelled) return;

      const read = () => {
        const state = provider.store.getState();
        const mapped: AccessKeyEntry[] = (state.accessKeys ?? [])
          .filter((k) => k.access?.toLowerCase() === address.toLowerCase())
          .map((k) => ({
            address: k.address,
            ownerAddress: k.access,
            expiry: k.expiry,
            limits: k.limits,
            keyType: k.keyType,
          }));
        if (!cancelled) setFetchedKeys(mapped);
      };

      read();
      // Subscribe to store changes so the list updates live
      unsubscribe = provider.store.subscribe((s) => s.accessKeys, read);
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
      setFetchedKeys(null);
    };
  }, [isReady, connector, address, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return {
    keys: isReady ? (fetchedKeys ?? []) : [],
    loading: isReady && fetchedKeys === null,
    refresh,
  };
}

export function useCreateAccessKey() {
  const { connector } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createKey = useCallback(
    async (params: {
      expiry: number;
      limits?: Array<{ token: `0x${string}`; limit: bigint }>;
      /** External access key address (derived from a keypair the agent holds). When set, the SDK skips keygen. */
      externalAddress?: `0x${string}`;
      keyType?: "secp256k1" | "p256" | "webAuthn";
    }) => {
      setIsPending(true);
      setError(null);
      try {
        const provider = await getAccountsProvider(connector);
        if (!provider) throw new Error("wallet not connected");

        const result = await provider.request({
          method: "wallet_authorizeAccessKey",
          params: [
            {
              expiry: params.expiry,
              ...(params.limits && params.limits.length > 0
                ? { limits: params.limits }
                : {}),
              ...(params.externalAddress
                ? {
                    address: params.externalAddress,
                    keyType: params.keyType ?? "secp256k1",
                  }
                : {}),
            },
          ],
        });
        return result;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "failed to create access key";
        setError(message);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [connector],
  );

  return { createKey, isPending, error };
}

export function useRevokeAccessKey() {
  const { address, connector } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokeKey = useCallback(
    async (accessKeyAddress: `0x${string}`) => {
      if (!address) throw new Error("wallet not connected");
      setIsPending(true);
      setError(null);
      try {
        const provider = await getAccountsProvider(connector);
        if (!provider) throw new Error("wallet not connected");

        await provider.request({
          method: "wallet_revokeAccessKey",
          params: [{ address, accessKeyAddress }],
        });
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "failed to revoke access key";
        setError(message);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [address, connector],
  );

  return { revokeKey, isPending, error };
}

export type { AccountsProvider };
