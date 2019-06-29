import 'whatwg-fetch'
import generateUUID from './uuid'

const { API_ROOT, PUBLIC_VAPID_KEY} = process.env
const LOCAL_STORAGE_USER_AGENT_ID_KEY = 'push:user_agent_id'
const LOCAL_STORAGE_USER_ID_KEY = 'push:user_id'

async function post({url, body}) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then(res => res.json())
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js", {
    scope: "/"
  }).catch(console.error)

  navigator.serviceWorker.ready.then(() => {
    setTimeout(() => {
      navigator.serviceWorker.controller.postMessage(JSON.stringify({ type: 'retrieve-client-id' }))
      navigator.serviceWorker.onmessage = function (e) {
        // messages from service worker.
        console.log('>>> e.data', e.data);
      };
    }, 250);
  })
}
else {
  console.warn("Your browser does not support service workers")
}

export default async function register({ user_id, user_traits}) {

  if ("serviceWorker" in navigator) {

    const user_agent_id = window.localStorage.getItem(LOCAL_STORAGE_USER_AGENT_ID_KEY) || (() => {
      const uuid = generateUUID()
      window.localStorage.setItem(LOCAL_STORAGE_USER_AGENT_ID_KEY, uuid);
      return uuid
    })()
    localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, user_id)

    const registration = await navigator.serviceWorker.ready

    // Register Push
    console.log("Registering for Push...");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });
    console.log("Push Registered.");

    // Send Push Notification
    console.log("Subscribing for Push...");
    const subscriptionData = {
      user_agent: navigator.userAgent,
      user_opt_in_url: window.location.href,
      user_id,
      user_agent_id,
      user_traits,
      sub_object: subscription
    }
    await post({ url: API_ROOT + "/api/v1/subscribe", body: subscriptionData})
    console.log("Subscribed to Push.");

    return true

  } else {

    console.warn("serviceWorker is not supported")
    return false

  }
}

export async function getSubscription() {

  if ("serviceWorker" in navigator) {

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      return { 
          subscription
        , user_id: localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY)
        , user_agent_id: localStorage.getItem(LOCAL_STORAGE_USER_AGENT_ID_KEY) 
      }
    } else {
      return null
    }

  } else {

    console.warn("serviceWorker is not supported")
    return null

  }
}

export async function unsubscribe() {

  if ("serviceWorker" in navigator) {

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      return subscription.unsubscribe()
    }

  } else {
    return false;
  }
}


function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

window['push_service'] = {
  register,
  getSubscription,
  unsubscribe
}
