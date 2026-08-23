"use client";

import { Card, CardContent } from "@/components/ui/card";
import z from "zod";
import { accountTypeSchema } from "../schema/account-type";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
import { toast } from "sonner";
import { createAccountType } from "../actions/account-type-actions";
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

export default function AddAccountTypeForm() {
  const router = useRouter();
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  
  const form = useForm<z.infer<typeof accountTypeSchema>>({
    resolver: zodResolver(accountTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      benefits: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof accountTypeSchema>) => {
      const token = sessionData?.session?.token;
      if (!token) throw new Error("Unauthorized");
      return await createAccountType(values, token);
    },
    onSuccess: () => {
      toast.success("Account Type created successfully");
      form.reset();
      revalidate(["get-account-types"]);
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create account type");
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Basic" {...field} />
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
                        placeholder="Basic Plan for regular users"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Access to basic forum, standard support"
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
