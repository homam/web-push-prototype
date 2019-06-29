import { subscribe, getSubscriptions, logSendNotification, logSendNotificationResponse, mkPool, logAnalyticsDeliveryNotificationReceived, logAnalyticsUserClicked, logAnalyticsClosed } from './db';
import uuid from "uuid/v1"
import { RequestHandler } from 'express';
import { SubscriptionInsertFromClient } from './types/Subscription';
import parseUrl from './parseUrl';
import webpush from "web-push";
import { PushMessageInsertFromUser, PushMessageFromUser, UserPayload, InsertPayload, insertPayloadToAPIPayload } from './types/PushMessage';
const path = require("path");
const envfile = require("envfile");
const { PRIVATE_VAPID_KEY, PUBLIC_VAPID_KEY, DB_CONNECTION_STRING} = envfile.parseFileSync(path.resolve("../", ".env"));
webpush.setVapidDetails(
  "mailto:support@sam-media.com",
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

const pool = mkPool(DB_CONNECTION_STRING);

export const subscribeToPush: RequestHandler = async (req, res) => {
  const user_ip = req.ip
  const { user_id, user_agent_id, user_agent, user_traits, user_opt_in_url, sub_object } = req.body as SubscriptionInsertFromClient;
  const user_opt_in_url_object = !!user_opt_in_url ? parseUrl(user_opt_in_url) : null
  try {
    await subscribe(pool, 
      {
          user_id
        , user_agent_id
        , user_agent
        , user_traits
        , user_opt_in_url
        , user_opt_in_url_object
        , user_ip
        , sub_object
      }  
    )
    res.status(201).json({});

    sendPushMessage({
      to: user_id,
      payload: {
        title: "Thank you for Subscribing!",
        body: "Stay tuned for more features",
        actions: [{
          action: {type: "openWindow", url: "https://www.google.com/"},
          title: "GO!"
        }]
      }
    }).catch(e => console.error(e))

    // webpush
    //   .sendNotification(sub_object, JSON.stringify({
    //     title: "Thank you for Subscribing!",
    //     body: "More advanced features will be coming."
    //   }))

  } catch (ex) {
    res.status(500).json({ error: ex.toString() })
  }
}

export const sendPush : RequestHandler = async (req, res) => {
  try {
    const body = req.body as PushMessageFromUser
    const results = await sendPushMessage(body);

    res.send(results)
  } catch (ex) {
    console.error(ex)
    res.status(500).send({ error: ex.toString() })
  }
}

export const analyticsDeliveryNotification = async (req, res) => {
  try {
    await logAnalyticsDeliveryNotificationReceived(pool, req.body.message_uuid)
    res.send({})
  } catch (ex) {
    console.error(ex)
    res.status(500).send({})
  }
}

export const analyticsClicked = async (req, res) => {
  try {
    await logAnalyticsUserClicked(pool, req.body.message_uuid, req.body.action)
    res.send({})
  } catch (ex) {
    console.error(ex)
    res.status(500).send({})
  }
}

export const analyticsClosed = async (req, res) => {
  try {
    await logAnalyticsClosed(pool, req.body.message_uuid)
    res.send({})
  } catch (ex) {
    console.error(ex)
    res.status(500).send({})
  }
}

async function sendPushMessage(body: PushMessageFromUser) {
  const subscriptions = await getSubscriptions(pool, body.to);

  //TODO: smarter than Promise.all
  const results = await Promise.all(subscriptions.map(async (subscription) => {
    const title = body.payload.title;
    const message_uuid = uuid();
    const insert_payload: InsertPayload = { ...body.payload, message_uuid };
    const api_payload = insertPayloadToAPIPayload(insert_payload);
    // Pass object into sendNotification
    const { id } = (await logSendNotification(pool, subscription.id, insert_payload));
    return webpush
      .sendNotification(subscription.sub_object, JSON.stringify(api_payload))
      .then(async (response) => {
        await logSendNotificationResponse(pool, id, true, response);
        return { to: body.to, success: true, response };
      })
      .catch(async (error) => {
        await logSendNotificationResponse(pool, id, false, error);
        return { to: body.to, success: false, error };
      });
  }));
  return results;
}
