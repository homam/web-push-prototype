-- Table Definition ----------------------------------------------

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id text NOT NULL,
    user_agent_id uuid NOT NULL,
    user_agent text,
    user_traits jsonb,
    user_ip inet,
    user_opt_in_url text,
    user_opt_in_url_object jsonb,
    sub_object jsonb NOT NULL,
    sub_endpoint text NOT NULL UNIQUE,
    date_created timestamp with time zone NOT NULL DEFAULT now(),
    date_disabled timestamp with time zone
);
COMMENT ON COLUMN subscriptions.sub_object IS 'JSON encoded subscription object';
COMMENT ON COLUMN subscriptions.sub_endpoint IS 'subscription end-point (should be unique)';

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX ON subscriptions(id int4_ops);
CREATE UNIQUE INDEX ON subscriptions(sub_endpoint text_ops);
CREATE UNIQUE INDEX ON subscriptions(user_id text_ops,user_agent_id uuid_ops);


-- Table Definition ----------------------------------------------

CREATE TABLE push_messages (
    id integer DEFAULT nextval('push_history_id_seq'::regclass) PRIMARY KEY,
    date_created timestamp with time zone NOT NULL DEFAULT now(),
    title text NOT NULL,
    payload jsonb,
    subscriptions_id integer NOT NULL REFERENCES subscriptions(id),
    response jsonb,
    response_status_code integer,
    succeed boolean,
    message_uuid uuid,
    date_delivery_notification_received timestamp with time zone,
    date_user_clicked timestamp with time zone,
    user_click_action text,
    date_closed timestamp with time zone
);

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX ON push_messages(id int4_ops);
CREATE UNIQUE INDEX ON push_messages(message_uuid uuid_ops);


---

CREATE OR REPLACE FUNCTION insert_subscription(
      "arg_user_id" text
    , "arg_user_agent_id" uuid
    , "arg_user_agent" text
    , "arg_user_traits" jsonb
    , "arg_user_opt_in_url" text
    , "arg_user_opt_in_url_object" jsonb
    , "arg_user_ip" inet
    , "arg_sub_object" jsonb
    )
  RETURNS setof subscriptions 
  LANGUAGE plpgsql AS
  $$
    BEGIN
      RETURN QUERY
        INSERT INTO "subscriptions" 
        (
            "user_id"
          , "user_agent_id"
          , "user_agent"
          , "user_traits"
          , "user_opt_in_url"
          , "user_opt_in_url_object"
          , "user_ip"
          , "sub_object"
          , "sub_endpoint"
        ) 
        VALUES (
            "arg_user_id"
          , "arg_user_agent_id"
          , "arg_user_agent"
          , "arg_user_traits"
          , "arg_user_opt_in_url"
          , "arg_user_opt_in_url_object"
          , "arg_user_ip"
          , "arg_sub_object"
          , "arg_sub_object"->>'endpoint') 
        ON CONFLICT ("user_id", "user_agent_id")
          DO UPDATE 
            SET 
                  "user_traits" = COALESCE("subscriptions"."user_traits", '{}' :: jsonb) || COALESCE("arg_user_traits" :: jsonb, '{}' :: jsonb)
                , "sub_object" = "arg_sub_object"
                , "sub_endpoint" = "arg_sub_object"->>'endpoint'
        RETURNING *
      ;
  END
  $$
;

---

CREATE OR REPLACE FUNCTION insert_push_message(
    "arg_payload" jsonb
  , "arg_subscriptions_id" integer
  , "arg_message_uuid" uuid
  )
  RETURNS setof push_messages 
  LANGUAGE plpgsql AS
  $$
    BEGIN
      RETURN QUERY
        INSERT INTO "push_messages" 
        (
            "title"
          , "payload"
          , "subscriptions_id"
          , "message_uuid"
        ) 
        VALUES (
            "arg_payload"->>'title'
          , "arg_payload"
          , "arg_subscriptions_id"
          , "arg_message_uuid"
        ) 
        RETURNING *
      ;
  END
  $$
;