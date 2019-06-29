import PG from "pg";
import { Optional } from 'utility-types';
import { SubscriptionDBInsert, Subscription } from "./types/Subscription";
import { InsertPayload } from "./types/PushMessage";
import { SendResult } from "web-push";

export async function run(pool : PG.Pool, query: string, params?: any[]) {
  const client = await pool.connect()

  try {

    const result = await client.query(query, params);

    return result;
  }
  catch (error) {
    console.error("ERROR", error);
    throw error
  }
  finally {
    await client.release();
  }
}

export function mkPool(connectionString: string, configOptions?: Optional<PG.PoolConfig>) {
  const config = {
    ...(configOptions || {}),
    connectionString
  };
  const pool = new PG.Pool(config);

  pool.on("error", (err, client) => {
    console.error("[PG Pool] Unexpected error on idle client", err);
    client.release();
  });

  function cleanup() {
    pool
      .end()
      .then(result => {
        console.log("[PG Pool] Cleaned up, bye!", result);
        process.exit(2);
      })
      .catch(error => {
        console.error(error);
        process.exit(2);
      });
  }

  process.on("SIGINT", function () {
    console.info("[PG Pool] Handling Ctrl-C...");
    cleanup();
  });

  process.on("SIGTERM", function () {
    console.info("[PG Pool] Handling SIGTERM...");
    cleanup();
  });

  process.on("uncaughtException", function (args) {
    console.warn(args)
    console.info("[PG Pool] Handling uncaughtException...");
    cleanup();
  });

  return pool;
}

export async function subscribe(pool: PG.Pool, 
  { 
    user_id
  , user_agent_id
  , user_agent
  , user_traits
  , user_opt_in_url
  , user_opt_in_url_object
  , user_ip
  , sub_object 
  }: SubscriptionDBInsert) {
  return run(pool, `
    select * from insert_subscription(
      $1
    , $2
    , $3
    , $4
    , $5
    , $6
    , $7
    , $8
    );
  `
    , [
        user_id
      , user_agent_id
      , user_agent
      , user_traits
      , user_opt_in_url
      , user_opt_in_url_object
      , user_ip
      , sub_object
    ]
  )
  .then(x => x.rows[0])
}

export async function getSubscriptions(pool: PG.Pool, user_id: string) : Promise<Subscription[]> {
  return run(pool, `
    SELECT "id", "user_id", "sub_object", "date_created"
    FROM "subscriptions"
    WHERE "user_id" = $1 and "date_disabled" is null
  `, [user_id]
  )
  .then(x => x.rows)
}

export async function logSendNotification(pool: PG.Pool, subscriptions_id: number, payload: InsertPayload) {
  return run(pool, `
    select * from insert_push_message(
      $1
    , $2
    , $3
    );
  `
    , [
        payload
      , subscriptions_id
      , payload.message_uuid
    ]
  )
  .then(x => x.rows[0])
}

export async function logSendNotificationResponse(pool: PG.Pool, push_message_id: number, succeed: boolean, response: SendResult) {
  return (await run(pool, `
    UPDATE "push_messages" 
    SET "response" = $3
    ,   "response_status_code" = $2
    ,   "succeed" = $4
    WHERE id = $1
    RETURNING *;
  `
    , [push_message_id, response.statusCode, JSON.stringify(response), succeed])).rows[0]
}

export async function logAnalyticsDeliveryNotificationReceived(pool: PG.Pool, message_uuid: string) {
  return await run(pool, `
    UPDATE "push_messages" 
    SET "date_delivery_notification_received" = now()
    WHERE message_uuid = $1
    RETURNING *;
  `, [message_uuid])
}

export async function logAnalyticsUserClicked(pool: PG.Pool, message_uuid: string, action: string) {
  return await run(pool, `
    UPDATE "push_messages" 
    SET "date_user_clicked" = now()
    ,   "user_click_action" = $2
    WHERE message_uuid = $1
    RETURNING *;
  `, [message_uuid, action])
}

export async function logAnalyticsClosed(pool: PG.Pool, message_uuid: string) {
  return await run(pool, `
    UPDATE "push_messages" 
    SET "date_closed" = now()
    WHERE message_uuid = $1
    RETURNING *;
  `, [message_uuid])
} 