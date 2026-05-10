"use client";

import { Card, CardContent } from "@/components/ui/card";
import z from "zod";
import { productCategorySchema } from "../_schema/product-category";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutateData } from "@/hooks/use-mutate";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
import { ENDPOINT } from "@/endpoint";
import { golangBackend } from "@/libs/axios";
import { toast } from "sonner";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export default function AddProductCategoryForm() {
  const router = useRouter();
  const revalidate = useRevalidateQuery();
  const form = useForm<z.infer<typeof productCategorySchema>>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { mutate, isPending } = useMutateData({
    method: "post",
    endpoint: ENDPOINT.GOLANG_API.PRODUCT_CATEGORY,
    schema: productCategorySchema,
    source: golangBackend,
    mutationKey: ["create-product-category"],
    onSuccess: () => {
      toast.success("Product Category created successfully");
      form.reset();
      revalidate(["get-product-categories"]);
      router.push("/management/product/category");
    },
    onError: (error) => {
      toast.error(error?.message);
    },
  });

  return (
    <Form {...form}>
      <Card>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) =>
              mutate({
                body: values,
              }),
            )}
          >
            <FieldGroup>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product Category Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Product Category Description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </Form>
  );
}
