/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin for split-host deploys (e.g. https://api.example.com). Omit for same-origin / dev proxy. */
  readonly VITE_API_BASE_URL?: string;
}