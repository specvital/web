"use client";

import { useSyncExternalStore } from "react";

import type { SpecGenerationStatusEnum } from "../types";

type GenerationProgressStore = {
  analysisId: string | null;
  isInBackground: boolean;
  isOpen: boolean;
  listeners: Set<() => void>;
  onViewDocument: (() => void) | null;
  pollingStartTime: number | null;
  status: SpecGenerationStatusEnum | null;
};

const store: GenerationProgressStore = {
  analysisId: null,
  isInBackground: false,
  isOpen: false,
  listeners: new Set(),
  onViewDocument: null,
  pollingStartTime: null,
  status: null,
};

const notifyListeners = () => {
  store.listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
};

const getIsOpenSnapshot = () => store.isOpen;
const getStatusSnapshot = () => store.status;
const getIsInBackgroundSnapshot = () => store.isInBackground;
const getPollingStartTimeSnapshot = () => store.pollingStartTime;
const getAnalysisIdSnapshot = () => store.analysisId;
const getServerSnapshot = () => false;

type OpenOptions = {
  analysisId: string;
  onViewDocument?: () => void;
  status: SpecGenerationStatusEnum;
};

const open = ({ analysisId, onViewDocument, status }: OpenOptions) => {
  store.isOpen = true;
  store.analysisId = analysisId;
  store.status = status;
  store.isInBackground = false;
  store.pollingStartTime = Date.now();
  store.onViewDocument = onViewDocument ?? null;
  notifyListeners();
};

const close = () => {
  store.isOpen = false;
  store.analysisId = null;
  store.status = null;
  store.isInBackground = false;
  store.pollingStartTime = null;
  store.onViewDocument = null;
  notifyListeners();
};

const updateStatus = (status: SpecGenerationStatusEnum) => {
  if (store.status !== status) {
    store.status = status;
    notifyListeners();
  }
};

const switchToBackground = () => {
  store.isInBackground = true;
  store.isOpen = false;
  notifyListeners();
};

const bringToForeground = () => {
  if (store.isInBackground) {
    store.isInBackground = false;
    store.isOpen = true;
    notifyListeners();
  }
};

export const useGenerationProgress = () => {
  const isOpen = useSyncExternalStore(subscribe, getIsOpenSnapshot, getServerSnapshot);
  const status = useSyncExternalStore(subscribe, getStatusSnapshot, () => null);
  const isInBackground = useSyncExternalStore(
    subscribe,
    getIsInBackgroundSnapshot,
    getServerSnapshot
  );
  const pollingStartTime = useSyncExternalStore(subscribe, getPollingStartTimeSnapshot, () => null);
  const analysisId = useSyncExternalStore(subscribe, getAnalysisIdSnapshot, () => null);

  return {
    analysisId,
    bringToForeground,
    close,
    isInBackground,
    isOpen,
    open,
    pollingStartTime,
    status,
    switchToBackground,
    updateStatus,
  };
};
