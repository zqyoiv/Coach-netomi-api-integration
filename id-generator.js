/**
 * Chat pre-request: per-message messageId, timestamp,
 * token safety, and FORCE-INJECT values into request JSON body.
 */

const now = Date.now();
const uuid = () => crypto.randomUUID();

// helpers
const setVar = (k, v) => {
  if (v === undefined || v === null || v === "") return;
  pm.environment.set(k, String(v));
  pm.collectionVariables.set(k, String(v));
};
const getVar = (k) =>
  pm.environment.get(k) ??
  pm.collectionVariables.get(k) ??
  pm.globals.get(k);

// ---------- per-message values ----------
const msgId = uuid();
setVar("timestamp", now);
pm.environment.set("messageId", msgId);

// ---------- FORCE-INJECT into body so {{vars}} cannot leak ----------
try {
  if (pm.request.body && pm.request.body.mode === "raw") {
    const raw = pm.request.body.raw || "";
    // First resolve any other {{vars}}, then inject our authoritative values:
    const resolved = pm.variables.replaceIn(raw);
    const obj = JSON.parse(resolved);

    obj.messagePayload = obj.messagePayload || {};
    obj.messagePayload.messageId = msgId;
    obj.messagePayload.timestamp = now;

    // normalize booleans often typed as strings
    if (typeof obj.messagePayload.hideMessage === "string") {
      obj.messagePayload.hideMessage = obj.messagePayload.hideMessage === "true";
    }

    pm.request.body.update(JSON.stringify(obj, null, 2));
  }
} catch (e) {
  console.warn("[chat] Could not inject body values:", e);
}

// ---------- token safety ----------
if (!getVar("token")) {
  console.warn("[chat] No token found — jumping to Refresh Token.");
  postman.setNextRequest("Refresh Token");
}