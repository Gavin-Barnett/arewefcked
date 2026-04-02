type NextLikeRequestInit = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export async function fetchWithTimeout(input: string | URL, init: NextLikeRequestInit = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs} ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
