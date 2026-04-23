"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { Actions } from "viem/tempo";
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
  limits?: Array<{
    token: `0x${string}`;
    limit: bigint;
    period?: number;
  }>;
}

interface ProviderStore {
  getState: () => { accessKeys: readonly StoredAccessKey[] };
  setState: (
    updater: (state: { accessKeys: readonly StoredAccessKey[] }) => Partial<{
      accessKeys: readonly StoredAccessKey[];
    }>,
  ) => void;
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
  const { address: rootAddress, connector } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createKey = useCallback(
    async (params: {
      expiry: number;
      limits?: Array<{
        token: `0x${string}`;
        limit: bigint;
        period?: number;
      }>;
      /** External access key address (caller holds the private key). */
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

        // The SDK's dialog adapter only adds the access key to its local
        // store when it generated the keypair itself (see saveAccessKey
        // call guarded by `if (accessKey)`). For externally-provided keys
        // we have to append the entry ourselves so the UI, which reads
        // from this store, can display the newly-authorized key.
        if (params.externalAddress && rootAddress) {
          const keyType = params.keyType ?? "secp256k1";
          const limits = (params.limits ?? []).map((l) => ({
            token: l.token,
            limit: l.limit,
            ...(l.period !== undefined ? { period: l.period } : {}),
          }));
          provider.store.setState((state) => {
            // Avoid duplicates if the user re-authorizes the same key.
            const filtered = state.accessKeys.filter(
              (k) =>
                k.address.toLowerCase() !==
                params.externalAddress!.toLowerCase(),
            );
            return {
              accessKeys: [
                ...filtered,
                {
                  address: params.externalAddress!,
                  access: rootAddress,
                  expiry: params.expiry,
                  keyType,
                  limits,
                },
              ],
            };
          });
        }

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
    [connector, rootAddress],
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

        // The SDK's dialog adapter doesn't prune the revoked key from its
        // local store after the on-chain revocation succeeds, so the UI would
        // keep showing it. Remove it manually so the subscribed list updates.
        provider.store.setState((state) => ({
          accessKeys: state.accessKeys.filter(
            (k) =>
              k.address.toLowerCase() !== accessKeyAddress.toLowerCase(),
          ),
        }));
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

/**
 * Reads the remaining spending limit for a (key, token) pair from the chain.
 * Returns undefined while loading, null if the read fails.
 */
export function useRemainingLimit(
  accessKey: `0x${string}` | undefined,
  token: `0x${string}` | undefined,
) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [fetched, setFetched] = useState<bigint | null | undefined>(undefined);

  const enabled = Boolean(address && accessKey && token && publicClient);

  useEffect(() => {
    if (!enabled || !address || !accessKey || !token || !publicClient) return;

    let cancelled = false;

    (async () => {
      try {
        // `usePublicClient()` returns a Client typed to whichever chain
        // variant wagmi was configured with; the viem tempo action expects
        // a narrower Tempo client. The runtime works across both variants,
        // so narrow the type locally.
        const result = await Actions.accessKey.getRemainingLimit(
          publicClient as Parameters<
            typeof Actions.accessKey.getRemainingLimit
          >[0],
          {
            account: address,
            accessKey,
            token,
          },
        );
        if (!cancelled) setFetched(result.remaining);
      } catch {
        if (!cancelled) setFetched(null);
      }
    })();

    return () => {
      cancelled = true;
      setFetched(undefined);
    };
  }, [enabled, address, accessKey, token, publicClient]);

  return enabled ? fetched : undefined;
}

export type { AccountsProvider };
