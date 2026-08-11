// bg.js - LinkPika adapted from Metus logic

const INITIATOR_DOMAINS = ["fbvirall.vercel.app", "localhost", "vercel.app"];

const baseRules = [
  // 1. business.facebook.com / upload-business
  {
    id: 1,
    priority: 1,
    condition: {
      initiatorDomains: INITIATOR_DOMAINS,
      resourceTypes: ["xmlhttprequest"],
      regexFilter: "upload-business\\.facebook\\.com|business\\.facebook\\.com"
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        { header: "Origin", operation: "set", value: "https://business.facebook.com" },
        { header: "Referer", operation: "set", value: "https://business.facebook.com/" }
      ],
      responseHeaders: [
        { header: "Access-Control-Allow-Origin", operation: "set", value: "https://fbvirall.vercel.app" },
        { header: "Access-Control-Allow-Credentials", operation: "set", value: "true" },
        { header: "Access-Control-Allow-Methods", operation: "set", value: "*" },
        { header: "Access-Control-Expose-Headers", operation: "set", value: "*" }
      ]
    }
  },
  // 2. adsmanager
  {
    id: 2,
    priority: 1,
    condition: {
      initiatorDomains: INITIATOR_DOMAINS,
      resourceTypes: ["xmlhttprequest"],
      urlFilter: "adsmanager.facebook.com"
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        { header: "Origin", operation: "set", value: "https://adsmanager.facebook.com" },
        { header: "Referer", operation: "set", value: "https://adsmanager.facebook.com/" }
      ]
    }
  },
  // 3. General Facebook
  {
    id: 3,
    priority: 1,
    condition: {
      initiatorDomains: INITIATOR_DOMAINS,
      resourceTypes: ["xmlhttprequest"],
      regexFilter: "^https://(\\w+\\.)?(facebook|fb)\\.com/"
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        { header: "Sec-Fetch-Site", operation: "set", value: "same-origin" }
      ],
      responseHeaders: [
        { header: "Access-Control-Allow-Origin", operation: "set", value: "https://fbvirall.vercel.app" },
        { header: "Access-Control-Allow-Credentials", operation: "set", value: "true" },
        { header: "Access-Control-Allow-Methods", operation: "set", value: "*" }
      ]
    }
  },
  // 4. www.facebook.com
  {
    id: 4,
    priority: 1,
    condition: {
      initiatorDomains: INITIATOR_DOMAINS,
      resourceTypes: ["xmlhttprequest"],
      urlFilter: "www.facebook.com"
    },
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        { header: "Origin", operation: "set", value: "https://www.facebook.com" },
        { header: "Referer", operation: "set", value: "https://www.facebook.com/" }
      ]
    }
  }
];

async function applyRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(r => r.id),
    addRules: baseRules
  });
}

chrome.runtime.onInstalled.addListener(() => applyRules());
chrome.runtime.onStartup.addListener(() => applyRules());

// Cookie helper
function getAllFbCookies() {
  return new Promise(resolve => {
    chrome.cookies.getAll({ domain: "facebook.com" }, cookies => {
      const str = cookies.map(c => `${c.name}=${c.value}`).join("; ");
      resolve(str);
    });
  });
}

// Message handler
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
        const res = await fetch(url, {
          method,
          headers,
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
          status: res.status
        });
        return;
      }

      sendResponse({ error: "Unknown type: " + msg.type });
    } catch (err) {
      sendResponse({ error: err.message });
    }
  })();
  return true; // async
});
