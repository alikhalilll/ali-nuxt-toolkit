import { getClientFingerprint } from '@alikhalilll/nuxt-crypto/server';

export default defineEventHandler(async (event) => {
  const { token } = await readBody<{ token: string }>(event);
  const crypto = await useServerCrypto();

  const fingerprint = await getClientFingerprint(event, {
    salt: useRuntimeConfig().cryptoFingerprintSalt,
  });

  try {
    return { text: await crypto.decrypt(token, { fingerprint }) };
  } catch (e) {
    throw createError({
      statusCode: 400,
      statusMessage: `Decrypt failed — fingerprint mismatch or tampered payload (${(e as Error).message}).`,
    });
  }
});
