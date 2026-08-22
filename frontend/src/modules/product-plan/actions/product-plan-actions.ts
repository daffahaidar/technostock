"use server";

import { getProductPlanClient } from "@/modules/product-plan/grpc/client";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import * as grpc from "@grpc/grpc-js";

export async function createProductPlanGrpc(data: {
  category_id: string;
  name: string;
  description?: string;
  price: number;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "Admin") {
    throw new Error("Unauthorized: Only Admin can perform this action");
  }

  return new Promise((resolve, reject) => {
    const client = getProductPlanClient();
    const meta = new grpc.Metadata();
    meta.add("authorization", `Bearer ${session.session.token}`);

    client.CreateProductPlan(data, meta, (error: any, response: any) => {
      if (error) {
        console.error("gRPC Error:", error);
        reject(
          new Error(error.details || error.message || "Unknown gRPC error"),
        );
      } else {
        resolve(JSON.parse(JSON.stringify(response)));
      }
    });
  });
}

export async function getProductPlansByCategoryIdGrpc(category_id: string) {
  return new Promise((resolve, reject) => {
    const client = getProductPlanClient();
    client.GetProductPlansByCategoryId({ category_id }, (error: any, response: any) => {
      if (error) {
        console.error("gRPC Error:", error);
        reject(
          new Error(error.details || error.message || "Unknown gRPC error"),
        );
      } else {
        resolve({ results: JSON.parse(JSON.stringify(response.data || [])) });
      }
    });
  });
}
