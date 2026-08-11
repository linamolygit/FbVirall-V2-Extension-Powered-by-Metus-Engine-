const INITIATOR_DOMAINS = ["fbvirall.vercel.app", "localhost", "vercel.app"];

const rules = [
  {
    id: 1,
    priority: 1,
    condition: {
      initiatorDomains: INITIATOR_DOMAINS,
      resourceTypes: ["xmlhttprequest"],
      regexFilter: "graph\\.facebook\\.com|business\\.facebook\\.com|adsmanager\\.facebook\\.com|upload-business\\.facebook\\.com"
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        { header: "Origin", operation: "set", value: "https://business.facebook.com" },
        { header: "Referer", operation: "set", value: "https://business.facebook.com/" }
      ],
      responseHeaders: [
        { header: "Access-Control-Allow-Origin", operation: "set", value: "*" },
        { header: "Access-Control-Allow-Credentials", operation: "set", value: "true" },
        { header: "Access-Control-Allow-Methods", operation: "set", value: "*" },
        { header: "Access-Control-Expose-Headers", operation: "set", value: "*" }
      ]
    }
  }
];

async function applyRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(r => r.id),
    addRules: rules
  });
}

chrome.runtime.onInstalled.addListener(applyRules);
chrome.runtime.onStartup.addListener(applyRules);

function getAllFbCookies() {
  return new Promise(resolve => {
    chrome.cookies.getAll({ domain: "facebook.com" }, cookies => {
      resolve(cookies.map(c => `${c.name}=${c.value}`).join("; "));
    });
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === "PING") {
        sendResponse({ pong: true });
        return;
      }

      if (msg.type === "GET_COOKIE") {
        const cookie = await getAllFbCookies();
        sendResponse({ cookie });
        return;
      }

      if (msg.type === "EX_FETCH") {
        const { url, method = "GET", headers = {}, body, requestId } = msg;

        const finalHeaders = {
          ...headers,
          "Origin": "https://business.facebook.com",
          "Referer": "https://business.facebook.com/",
        };

        const res = await fetch(url, {
          method,
          headers: finalHeaders,
          body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
          credentials: "include"
        });

        let data;
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          data = await res.json();
        } else {
          data = await res.text();
        }

        sendResponse({
          type: "EX_FETCH_RESPONSE",
          requestId,
          data,
          status: res.status,
          ok: res.ok
        });
        return;
      }

      sendResponse({ error: "Unknown type" });
    } catch (err) {
      sendResponse({ error: err.message });
    }
  })();
  return true;
});
