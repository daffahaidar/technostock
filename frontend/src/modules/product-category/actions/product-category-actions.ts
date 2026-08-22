"use server";

import { getProductCategoryClient } from "@/modules/product-category/grpc/client";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import * as grpc from "@grpc/grpc-js";

export async function createProductCategoryGrpc(data: {
  name: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "Admin") {
    throw new Error("Unauthorized: Only Admin can perform this action");
  }

  return new Promise((resolve, reject) => {
    const client = getProductCategoryClient();
    const meta = new grpc.Metadata();
    meta.add("authorization", `Bearer ${session.session.token}`);

    client.CreateProductCategory(data, meta, (error: any, response: any) => {
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

export async function getProductCategoriesGrpc() {
  return new Promise((resolve, reject) => {
    const client = getProductCategoryClient();
    client.GetProductCategories({}, (error: any, response: any) => {
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
