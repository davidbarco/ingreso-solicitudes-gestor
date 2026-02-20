/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CLIENT_ID: string;
  readonly VITE_STORAGE_KEY: string;
  readonly VITE_TIPOLOGY_CODE: string;
  readonly VITE_APP_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
