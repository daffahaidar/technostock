"use client";


import { Plus, Trash } from "lucide-react";
import z from "zod";
import { accountTypeSchema } from "../schema/account-type";
import { useForm, useFieldArray } from "react-hook-form";
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

export default function AddAccountTypeForm({ onSuccessSubmit }: { onSuccessSubmit?: () => void }) {
  const router = useRouter();
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  
  const form = useForm<z.infer<typeof accountTypeSchema>>({
    resolver: zodResolver(accountTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      benefits: [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "benefits",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof accountTypeSchema>) => {
      const token = sessionData?.session?.token;
      if (!token) throw new Error("Unauthorized");
      
      const benefitsArray = values.benefits?.map(b => b.value).filter(Boolean) || [];
      const payload = {
        name: values.name,
        description: values.description,
        benefits: benefitsArray.length > 0 ? JSON.stringify(benefitsArray) : undefined,
      };

      return await createAccountType(payload, token);
    },
    onSuccess: () => {
      toast.success("Account Type created successfully");
      form.reset();
      revalidate(["get-account-types"]);
      router.refresh();
      if (onSuccessSubmit) {
        onSuccessSubmit();
      }
    },
    onError: (error: unknown) => {
      toast.error((error as Error)?.message || "Failed to create account type");
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutate(values))} className="pt-2">
            <FieldGroup className="max-h-[60vh] overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
              <div className="space-y-2">
                <FormLabel>Benefits</FormLabel>
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`benefits.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input placeholder="e.g. Access to basic forum" {...field} />
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-950/20"
                                onClick={() => remove(index)}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => append({ value: "" })}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Benefit
                </Button>
              </div>
              <Field>
                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full bg-[#D4AF37] hover:bg-[#F3CA52] text-black font-bold"
                >
                  {isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </Field>
            </FieldGroup>
      </form>
    </Form>
  );
}
