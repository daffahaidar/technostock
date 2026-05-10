"use client";

import { Card, CardContent } from "@/components/ui/card";
import z from "zod";
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
import { productPlanSchema } from "../_schema/product-plan";

export default function AddProductPlanForm({
  categoryId,
}: {
  categoryId: string;
}) {
  const router = useRouter();
  const revalidate = useRevalidateQuery();
  const form = useForm<z.infer<typeof productPlanSchema>>({
    resolver: zodResolver(productPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_id: categoryId,
    },
  });

  const { mutate, isPending } = useMutateData({
    method: "post",
    endpoint: ENDPOINT.GOLANG_API.PRODUCT_PLAN,
    schema: productPlanSchema,
    source: golangBackend,
    mutationKey: ["create-product-plan"],
    onSuccess: () => {
      toast.success("Product Plan created successfully");
      form.reset();
      revalidate(["get-product-plan"]);
      router.push(`/management/product/category/${categoryId}/plan`);
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
                      <Input placeholder="Product Plan Name" {...field} />
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
                        placeholder="Product Plan Description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Product Plan Price"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
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
