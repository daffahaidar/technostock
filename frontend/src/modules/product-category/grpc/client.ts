import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

let clientInstance: any = null;

export const getProductCategoryClient = () => {
  if (clientInstance) return clientInstance;

  const PROTO_PATH = path.resolve(
    process.cwd(),
    "src/modules/product-category/grpc/proto/product_category.proto",
  );

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const productCategoryProto = (protoDescriptor as any).product_category;

  const GOLANG_GRPC_URL = process.env.GOLANG_GRPC_URL || "localhost:50052";

  clientInstance = new productCategoryProto.ProductCategoryService(
    GOLANG_GRPC_URL,
    grpc.credentials.createInsecure(),
  );

  return clientInstance;
};
