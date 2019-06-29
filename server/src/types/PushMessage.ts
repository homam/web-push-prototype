type Hash<T> = {
  [key: string]: T;
}

export type Payload<A> = {
  title: string;
  body: string;
  icon?: string | null;
  actions: Array<{action: A, title: string}>;
}

export type OpenUrlAction = { type: "openWindow"; url: string, id: string }
export type UserPayload = Payload<OpenUrlAction>
export type InsertPayload = UserPayload & { message_uuid: string; }
export type APIPayload = Payload<string> & { message_uuid: string; }

export function insertPayloadToAPIPayload(payload: InsertPayload) : APIPayload {
  return {
      ...payload
    , actions: payload.actions.map(
      ({ action, title }) => ({ action: JSON.stringify(action), title})
      ) 
  }
}

type PushMessageDBAuto = {
  id: number;
  date_created: Date;
}

export type PushMessageFromUser = {
  to: string;
  payload: UserPayload;
}

export type PushMessageInsertFromUser = {
  to: string;
  payload: InsertPayload;
  message_uuid: string;
}

export type PushMessage = PushMessageDBAuto & {
  title: string;
  payload: UserPayload;
  subscriptions_id: number;
  response: Hash<any>;
  response_status_code: number | null;
  succeed: boolean | null;
  date_delivery_notification_received: Date | null;
  date_user_clicked: Date | null;
  user_click_action: string | null;
  date_closed: Date | null;
}