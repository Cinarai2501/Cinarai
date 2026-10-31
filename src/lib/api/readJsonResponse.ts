function isJsonContentType(contentType: string | null): boolean {
  const mediaType = contentType?.split(';', 1)[0]?.trim().toLowerCase();
  return mediaType === 'application/json' || Boolean(mediaType?.endsWith('+json'));
}

function responseDescription(response: Response): string {
  const contentType = response.headers.get('content-type');
  return `HTTP ${response.status}; Content-Type: ${contentType || 'tidak tersedia'}`;
}

export async function readJsonResponse<T>(response: Response, endpoint: string): Promise<T> {
  const description = responseDescription(response);
  const contentType = response.headers.get('content-type');
  const jsonContentType = isJsonContentType(contentType);
  if (!response.ok && !jsonContentType) {
    const body = await response.text();
    if (!body.trim()) {
      throw new Error(`Endpoint ${endpoint} mengembalikan body kosong (${description}).`);
    }
    throw new Error(`Endpoint ${endpoint} mengembalikan respons non-JSON (${description}).`);
  }

  const body = await response.text();

  if (!body.trim()) {
    throw new Error(`Endpoint ${endpoint} mengembalikan body kosong (${description}).`);
  }

  if (!jsonContentType) {
    throw new Error(`Endpoint ${endpoint} mengembalikan respons non-JSON (${description}).`);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`Endpoint ${endpoint} mengembalikan JSON tidak valid (${description}).`);
  }
}
