/**
 * CORS-related utilities for LLM service error handling.
 */

/**
 * Detects CORS-related errors from both the error message and the underlying cause.
 * The OpenAI SDK wraps fetch failures in APIConnectionError; the root cause is
 * often a TypeError: Failed to fetch from the browser's CORS preflight block.
 */
export function isCORSError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const isCorsMsg =
      msg.includes('cors') ||
      msg.includes('access-control') ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('connection error');

    if (isCorsMsg) return true;

    // Inspect the underlying cause (OpenAI SDK stores the original fetch error here)
    const cause = (error as Error & { cause?: Error }).cause;
    if (cause instanceof Error) {
      const causeMsg = cause.message.toLowerCase();
      return (
        causeMsg.includes('failed to fetch') ||
        causeMsg.includes('networkerror') ||
        causeMsg.includes('cors')
      );
    }
  }
  return false;
}

export function getCORSHelpMessage(baseUrl: string): string {
  return `CORS Error: The API server at ${baseUrl} is blocking browser requests.\n\nSolutions:\n1. Ask your provider to enable CORS (Access-Control-Allow-Origin: *)\n2. Use a CORS proxy (enter a proxy URL in settings)\n3. Use an API that supports browser access (e.g., OpenAI with proper headers)`;
}
