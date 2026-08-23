"use client";

import { Card, CardContent } from "@/components/ui/card";
import z from "zod";
import { subscriptionPlanSchema } from "../schema/subscription-plan";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
import { toast } from "sonner";
import { createSubscriptionPlan } from "../actions/subscription-plan-actions";
import { getAccountTypes } from "@/modules/account-type/actions/account-type-actions";
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

import { authClient } from "@/app/auth/sign-in/_handlers/client";

export default function AddSubscriptionPlanForm() {
  const router = useRouter();
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  
  const { data: dataAccountType, isLoading: isLoadingAccountTypes } = useQuery({
    queryKey: ["get-account-types", sessionData?.session?.token],
    queryFn: async () => {
      const token = sessionData?.session?.token;
      if (!token) return { results: [] };
      return (await getAccountTypes(token)) as { results: any[] };
    },
    enabled: !!sessionData?.session?.token,
  });

  const form = useForm<z.infer<typeof subscriptionPlanSchema>>({
    resolver: zodResolver(subscriptionPlanSchema) as any,
    defaultValues: {
      account_type_id: "",
      name: "",
      duration_months: 1,
      price: 0,
      description: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof subscriptionPlanSchema>) => {
      const token = sessionData?.session?.token;
      if (!token) throw new Error("Unauthorized");
      return await createSubscriptionPlan(values, token);
    },
    onSuccess: () => {
      toast.success("Subscription Plan created successfully");
      form.reset();
      revalidate(["get-subscription-plans"]);
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create subscription plan");
    },
  });

  return (
    <Form {...form}>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit((values) => mutate(values))}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="account_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>Select Account Type</option>
                        {dataAccountType?.results?.map((at) => (
                          <option key={at.id} value={at.id}>
                            {at.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="1 Month Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Months)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} />
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
                      <Input type="number" placeholder="50000" {...field} />
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
                        placeholder="Plan description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Field>
                <Button type="submit" disabled={isPending || isLoadingAccountTypes}>
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
