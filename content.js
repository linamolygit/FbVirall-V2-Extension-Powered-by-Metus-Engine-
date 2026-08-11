console.log("[LinkPika] Extension content script loaded");

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
        data: { cookieString: res?.cookie || "" },
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

  if (data.type === "EX_FETCH") {
    chrome.runtime.sendMessage(data, (response) => {
      window.postMessage({
        type: "EX_FETCH_RESPONSE",
        requestId: data.requestId,
        data: response?.data,
        error: response?.error,
        status: response?.status,
        ok: response?.ok
      }, "*");
    });
  }
});
