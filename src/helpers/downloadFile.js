// One way to download a file that sits behind authToken.
//
// Every such download used to be written out by hand at the call site — the same fetch,
// the same blob, the same throwaway anchor, twice in AdminClientWorkspace.js and twice in
// AdminPaymentRecordDetail.js. The uploaded-data zip was the odd one out, written instead
// as a plain <a href> straight to the API.
//
// That difference is what broke it. A plain anchor is a top-level cross-site navigation
// from the frontend origin to the API origin, and Firefox does not attach the session
// cookie to one — its tracking protection classifies the API domain as a bounce tracker
// and purges its state, so the request arrives without a token and authToken answers 401
// "Please Login...!". The browser then renders that JSON instead of downloading anything.
// Chrome still sends the cookie today, which is why the same button worked there; Safari's
// ITP already blocks it, and Chrome is heading the same way.
//
// Fetching instead of navigating is what fixes it: a credentialed XHR is the path the rest
// of the app already uses for every other authenticated call, and the one Firefox honours.
//
// Errors are thrown, not shown — the caller owns its own wording and its own toast, which
// is how the existing three already read.

/**
 * Fetch an authenticated file and hand it to the browser as a download.
 *
 * @param {string} url       endpoint to fetch, same-origin rules do not apply — the session
 *                           cookie travels because of `credentials: "include"`
 * @param {string} filename  name to save as. The server's Content-Disposition is not
 *                           consulted: a blob download cannot read it, so callers pass the
 *                           name the server would have used.
 * @throws {Error} with the server's message when the response is not ok
 */
export const downloadAuthenticatedFile = async (url, filename) => {
  const response = await fetch(url, { credentials: "include" });

  // A failed download answers with the API's usual JSON envelope, so the message the
  // server wrote is the one the caller gets to show.
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || "Failed to download file");
  }

  const objectUrl = window.URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
};
