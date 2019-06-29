import { PushSubscription } from "web-push"
import { ParsedUrl } from "../parseUrl";

type Hash<T> = {
  [key: string]: T;
}
type SubscriptionDBAuto = {
  id: number;
  date_created: Date;
}
export type SubscriptionInsertFromClient = {
  user_id: string;
  user_agent_id: string;
  user_agent: string | null;
  user_traits: Hash<any> | null;
  user_opt_in_url: string | null;
  sub_object: PushSubscription;
}
export type SubscriptionDBInsert = SubscriptionInsertFromClient & {    
  user_ip: string | null;
  user_opt_in_url_object: ParsedUrl | null;
}
export type Subscription = SubscriptionDBAuto & SubscriptionDBInsert & {
  sub_endpoint: string;
  date_disabled: Date | null;
}