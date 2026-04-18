import { createApiClient, isApiError } from '@alikhalilll/nuxt-api-provider/core';

let client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
  if (client) return client;
  client = createApiClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    headers: { 'User-Agent': 'ali-nuxt-toolkit-playground/core' },
    retry: { attempts: 1, delayMs: 200 },
  });
  return client;
}

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export default defineEventHandler(async (event) => {
  const { id = '1' } = getQuery(event) as { id?: string };
  try {
    const post = await getClient()<Post>(`/posts/${id}`);
    return { ok: true as const, post };
  } catch (e) {
    if (isApiError(e)) {
      return { ok: false as const, status: e.status, message: e.message };
    }
    throw e;
  }
});
