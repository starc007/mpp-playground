"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { getConnectorClient } from "wagmi/actions";
import { parseUnits } from "viem";
import { prepareTransactionRequest, signTransaction } from "viem/actions";
import { Actions } from "viem/tempo";
import { Mppx, tempo } from "mppx/client";
import { useNetwork } from "@/components/providers";
import { TEMPO_CURRENCIES } from "./currencies";
import {
  SCHEDULER_API,
  toLocalDatetime,
  type ScheduleResult,
  type ScheduleStatus,
} from "./scheduler-types";

export function useScheduler() {
  const { address, isConnected } = useAccount();
  const { config } = useNetwork();

  // Transfer details
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(TEMPO_CURRENCIES[0].address);
  const [memo, setMemo] = useState("");

  // Schedule timing
  const defaultAfter = new Date(Date.now() + 5 * 60 * 1000);
  const [validAfterDate, setValidAfterDate] = useState(
    toLocalDatetime(defaultAfter),
  );
  const [validBeforeDate, setValidBeforeDate] = useState("");

  // Flow state
  const [step, setStep] = useState<"form" | "signing" | "paying" | "done">(
    "form",
  );
  const [signedTxBytes, setSignedTxBytes] = useState("");
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Status lookup
  const [lookupId, setLookupId] = useState("");
  const [statusResult, setStatusResult] = useState<ScheduleStatus | null>(null);
  const [myTxs, setMyTxs] = useState<ScheduleStatus[]>([]);

  const isFormValid =
    isConnected &&
    /^0x[a-fA-F0-9]{40}$/.test(recipient) &&
    Number(amount) > 0 &&
    validAfterDate;

  async function handleSign() {
    if (!address || !isFormValid) return;

    setError(null);
    setStep("signing");

    try {
      const walletClient = await getConnectorClient(config);

      const validAfter = Math.floor(
        new Date(validAfterDate).getTime() / 1000,
      );
      const validBefore = validBeforeDate
        ? Math.floor(new Date(validBeforeDate).getTime() / 1000)
        : undefined;

      const transferCall = Actions.token.transfer.call({
        to: recipient as `0x${string}`,
        amount: parseUnits(amount, 6),
        token: currency as `0x${string}`,
      });

      const prepared = await prepareTransactionRequest(walletClient, {
        account: walletClient.account,
        ...transferCall,
      } as never);

      const resolvedValidBefore = validBefore ?? validAfter + 3600;
      const scheduled = {
        ...prepared,
        gas: 350_000n,
        validAfter,
        validBefore: resolvedValidBefore,
      };

      const signed = await signTransaction(walletClient, scheduled as never);

      setSignedTxBytes(signed);
      setStep("paying");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signing failed";
      setError(msg.split("Request Arguments:")[0]?.trim() || msg);
      setStep("form");
    }
  }

  async function handleSchedule() {
    if (!signedTxBytes || !address) return;

    try {
      const validAfter = Math.floor(
        new Date(validAfterDate).getTime() / 1000,
      );
      const validBefore = validBeforeDate
        ? Math.floor(new Date(validBeforeDate).getTime() / 1000)
        : undefined;

      const body = JSON.stringify({
        txBytes: signedTxBytes,
        validAfter,
        validBefore,
        owner: address,
        memo: memo || undefined,
      });

      const probeRes = await fetch(`${SCHEDULER_API}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
      });

      if (probeRes.status !== 402) {
        const data = await probeRes.json();
        if (probeRes.ok) {
          setResult(data as ScheduleResult);
          setStep("done");
          setError(null);
          return;
        }
        throw new Error(
          (data as { error?: string }).error ?? "Schedule failed",
        );
      }

      const wwwAuth = probeRes.headers.get("www-authenticate");
      if (!wwwAuth) throw new Error("No WWW-Authenticate header in 402");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getClient = async (params: any) => {
        return getConnectorClient(config, params);
      };

      const mppx = Mppx.create({
        methods: [tempo({ getClient })],
        polyfill: false,
      });

      const fakeResponse = new Response(null, {
        status: 402,
        headers: { "WWW-Authenticate": wwwAuth },
      });

      const credential = await mppx.createCredential(fakeResponse);

      const payRes = await fetch(`${SCHEDULER_API}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: credential.startsWith("Payment ")
            ? credential
            : `Payment ${credential}`,
        },
        body,
      });

      if (!payRes.ok) {
        const payData = await payRes.json().catch(() => null);
        throw new Error(
          (payData as { error?: string } | null)?.error ??
            `Schedule failed: ${payRes.status} ${payRes.statusText}`,
        );
      }

      const payData = await payRes.json();
      setResult(payData as ScheduleResult);
      setStep("done");
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Schedule failed";
      setError(msg.split("Request Arguments:")[0]?.trim() || msg);
      setStep("form");
    }
  }

  async function handleLoadMyTxs() {
    if (!address) return;
    try {
      const res = await fetch(
        `${SCHEDULER_API}/schedule?owner=${address.toLowerCase()}`,
      );
      const data = await res.json();
      setMyTxs(data as ScheduleStatus[]);
    } catch {
      // silent
    }
  }

  async function handleCancel(id: string) {
    if (!address) return;
    try {
      await fetch(`${SCHEDULER_API}/schedule/${id}`, {
        method: "DELETE",
        headers: { "x-owner": address.toLowerCase() },
      });
      handleLoadMyTxs();
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    if (!address) return;
    try {
      await fetch(`${SCHEDULER_API}/schedule/${id}?action=delete`, {
        method: "DELETE",
        headers: { "x-owner": address.toLowerCase() },
      });
      handleLoadMyTxs();
    } catch {
      // silent
    }
  }

  async function handleLookup() {
    if (!lookupId) return;
    try {
      const res = await fetch(`${SCHEDULER_API}/schedule/${lookupId}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error((data as { error?: string }).error ?? "Not found");
      setStatusResult(data as ScheduleStatus);
    } catch {
      setStatusResult(null);
    }
  }

  function resetForm() {
    setStep("form");
    setSignedTxBytes("");
    setResult(null);
    setError(null);
  }

  return {
    // State
    address,
    isConnected,
    recipient,
    setRecipient,
    amount,
    setAmount,
    currency,
    setCurrency,
    memo,
    setMemo,
    validAfterDate,
    setValidAfterDate,
    validBeforeDate,
    setValidBeforeDate,
    step,
    result,
    error,
    isFormValid,
    lookupId,
    setLookupId,
    statusResult,
    myTxs,

    // Actions
    handleSign,
    handleSchedule,
    handleLoadMyTxs,
    handleCancel,
    handleDelete,
    handleLookup,
    resetForm,
  };
}
