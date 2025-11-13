/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // más variables de entorno pueden agregarse aquí
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
