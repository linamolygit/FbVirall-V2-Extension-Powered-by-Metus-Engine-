// content.js - LinkPika

console.log("[LinkPika Extension] loaded");

// Tell frontend extension is ready
window.postMessage({ type: "FBVIRALL_EXTENSION_INSTALLED" }, "*");

window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  const data = event.data || {};

  if (data.type === "FBVIRALL_PING") {
    window.postMessage({ type: "FBVIRALL_EXTENSION_INSTALLED" }, "*");
  }

  if (data.type === "FBVIRALL_FETCH_TOKEN" || data.type === "GET_FB_COOKIE") {
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_COOKIE" });
      window.postMessage({
        type: "FBVIRALL_EXTENSION_RESPONSE",
        data: {
          cookieString: res.cookie || "",
          accessToken: null // backend resolve karega
        },
        requestId: data.requestId
      }, "*");
    } catch (err) {
      window.postMessage({
        type: "FBVIRALL_EXTENSION_RESPONSE",
        error: err.message,
        requestId: data.requestId
      }, "*");
    }
  }

  // Advanced: frontend se direct EX_FETCH
  if (data.type === "EX_FETCH") {
    chrome.runtime.sendMessage(data, (response) => {
      window.postMessage({
        type: "EX_FETCH_RESPONSE",
        requestId: data.requestId,
        data: response?.data,
        error: response?.error,
        status: response?.status
      }, "*");
    });
  }
});
