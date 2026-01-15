"use client";

import { useSyncExternalStore } from "react";

import type { UsageStatusResponse } from "@/features/account/api/usage";

type QuotaConfirmDialogStore = {
  estimatedCost: number | null;
  isOpen: boolean;
  listeners: Set<() => void>;
  onConfirm: (() => void) | null;
  usage: UsageStatusResponse | null;
};

const store: QuotaConfirmDialogStore = {
  estimatedCost: null,
  isOpen: false,
  listeners: new Set(),
  onConfirm: null,
  usage: null,
};

const notifyListeners = () => {
  store.listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
};

const getSnapshot = () => store.isOpen;

const getServerSnapshot = () => false;

const getUsageSnapshot = () => store.usage;

const getOnConfirmSnapshot = () => store.onConfirm;

const getEstimatedCostSnapshot = () => store.estimatedCost;

const open = (usage: UsageStatusResponse | null, onConfirm: () => void, estimatedCost?: number) => {
  if (!store.isOpen) {
    store.isOpen = true;
    store.usage = usage;
    store.onConfirm = onConfirm;
    store.estimatedCost = estimatedCost ?? null;
    notifyListeners();
  }
};

const close = () => {
  if (store.isOpen) {
    store.isOpen = false;
    store.usage = null;
    store.onConfirm = null;
    store.estimatedCost = null;
    notifyListeners();
  }
};

const confirm = () => {
  if (store.onConfirm) {
    store.onConfirm();
  }
  close();
};

export const useQuotaConfirmDialog = () => {
  const isOpen = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const usage = useSyncExternalStore(subscribe, getUsageSnapshot, () => null);
  const onConfirm = useSyncExternalStore(subscribe, getOnConfirmSnapshot, () => null);
  const estimatedCost = useSyncExternalStore(subscribe, getEstimatedCostSnapshot, () => null);

  const onOpenChange = (open: boolean) => {
    if (!open) {
      close();
    }
  };

  return {
    close,
    confirm,
    estimatedCost,
    isOpen,
    onConfirm,
    onOpenChange,
    open,
    usage,
  };
};
