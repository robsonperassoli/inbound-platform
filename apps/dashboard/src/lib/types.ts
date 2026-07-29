import type { InferResponseType } from "hono/client"
import type { client } from "@/api/client"

export type Session = InferResponseType<typeof client.me.$get, 200>

export type SessionUser = Session["user"]

export type Profile = InferResponseType<
  typeof client.profiles.$get,
  200
>["profiles"][number]

export type Link = InferResponseType<
  (typeof client.profiles)[":id"]["$get"],
  200
>["links"][number]

export type Form = InferResponseType<
  typeof client.forms.$get,
  200
>["forms"][number]
