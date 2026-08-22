import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

let clientInstance: any = null;

export const getProductPlanClient = () => {
  if (clientInstance) return clientInstance;

  const PROTO_PATH = path.resolve(
    process.cwd(),
    "src/modules/product-plan/grpc/proto/product_plan.proto",
  );

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const productPlanProto = (protoDescriptor as any).product_plan;

  const GOLANG_GRPC_URL = process.env.GOLANG_GRPC_URL || "localhost:50052";

  clientInstance = new productPlanProto.ProductPlanService(
    GOLANG_GRPC_URL,
    grpc.credentials.createInsecure(),
  );

  return clientInstance;
};
