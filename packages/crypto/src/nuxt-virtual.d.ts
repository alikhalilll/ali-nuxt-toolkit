declare module '#app' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function defineNuxtPlugin(plugin: any): any;
}

declare module '#build/crypto-config.mjs' {
  const config: {
    passphrase: string;
    iterations: number;
    keyCacheSize: number;
    provideName: string;
  };
  export default config;
}
