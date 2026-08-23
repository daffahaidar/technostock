"use server";

import { revalidateTag } from "next/cache";

export async function revalidateServerTag(tag: string) {
  revalidateTag(tag);
}
