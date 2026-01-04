/**
 * Up Bank Webhook Signature Verification
 *
 * Verifies HMAC-SHA256 signatures on incoming webhook requests.
 */

/**
 * Verify Up Bank webhook signature
 *
 * Up Bank signs webhook payloads with HMAC-SHA256 using the shared secret key.
 * The signature is sent in the X-Up-Authenticity-Signature header.
 *
 * @param body - Raw request body (must be unparsed string)
 * @param signature - Value from X-Up-Authenticity-Signature header
 * @param secretKey - Webhook secret key (from webhook creation response)
 * @returns true if signature is valid
 */
export async function verifyUpWebhookSignature(
  body: string,
  signature: string,
  secretKey: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();

    // Import the secret key for HMAC
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Compute the signature
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body)
    );

    // Convert to hex string
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison (lowercase both for consistency)
    return computedSignature === signature.toLowerCase();
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}
