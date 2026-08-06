document.getElementById("syncBtn").addEventListener("click", async () => {
  const statusDiv = document.getElementById("status");
  const btn = document.getElementById("syncBtn");
  btn.disabled = true;
  statusDiv.className = "";
  statusDiv.innerText = "Extracting cookies...";

  try {
    const cUser = await getCookie("c_user");
    const xs = await getCookie("xs");

    if (!cUser || !xs) {
      statusDiv.className = "error";
      statusDiv.innerText = "❌ Please log in to Facebook.com first in this browser!";
      btn.disabled = false;
      return;
    }

    statusDiv.innerText = "Syncing with FbVirall SaaS...";

    // Determine target API URL
    const targetApi = "https://fbvirall.vercel.app/api/auth/fb-cookie";

    const response = await fetch(targetApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ c_user: cUser, xs: xs }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      statusDiv.className = "success";
      statusDiv.innerText = `✅ Connected as ${data.fbUser?.name || "FB Account"}! Token Saved.`;
      
      // Save token locally in chrome storage so user page can read it if needed
      chrome.storage.local.set({ fb_access_token: data.access_token });
    } else {
      throw new Error(data.error || "Failed to convert cookie to Access Token");
    }
  } catch (err) {
    statusDiv.className = "error";
    statusDiv.innerText = "❌ " + err.message;
  } finally {
    btn.disabled = false;
  }
});

function getCookie(name) {
  return new Promise((resolve) => {
    chrome.cookies.get({ url: "https://www.facebook.com", name: name }, (cookie) => {
      resolve(cookie ? cookie.value : null);
    });
  });
}
