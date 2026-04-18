import { getClientFingerprint } from '@alikhalilll/nuxt-crypto/server';

export default defineEventHandler(async (event) => {
  const { text } = await readBody<{ text: string }>(event);
  const { $crypto } = useNuxtApp();

  const fingerprint = await getClientFingerprint(event, {
    salt: useRuntimeConfig().cryptoFingerprintSalt,
  });

  return { token: await $crypto.encrypt(text, { fingerprint }) };
});
