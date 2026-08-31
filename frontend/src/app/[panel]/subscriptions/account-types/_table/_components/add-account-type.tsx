"use client";

import { Plus, Trash } from "lucide-react";
import z from "zod";
import { accountTypeSchema } from "../../_schemas/account-type";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useRevalidateQuery } from "@/hooks/use-revalidate";
import { toast } from "sonner";
import { useCreateAccountType } from "../../_mutations/account-type";
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
import { authClient } from "@/app/auth/sign-in/_handlers/client";

export default function AddAccountTypeForm({
  onSuccessSubmit,
}: {
  onSuccessSubmit?: () => void;
}) {
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

  const token = sessionData?.session?.token || "";

  const { mutate, isPending } = useCreateAccountType({
    accessToken: token,
    onSuccess: () => {
      toast.success("Account Type created successfully");
      form.reset();
      revalidate(["get-account-types"], ["get-public-pricing"]);
      if (onSuccessSubmit) {
        onSuccessSubmit();
      }
    },
    onError: (error: unknown) => {
      toast.error((error as Error)?.message || "Failed to create account type");
    },
  });

  const onSubmit = (values: z.infer<typeof accountTypeSchema>) => {
    const benefitsArray =
      values.benefits?.map((b) => b.value).filter(Boolean) || [];
    const payload = {
      name: values.name,
      description: values.description,
      benefits:
        benefitsArray.length > 0 ? JSON.stringify(benefitsArray) : undefined,
    };
    mutate(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="pt-2">
        <FieldGroup className="max-h-[60vh] overflow-y-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                        <Input
                          placeholder="e.g. Access to basic forum"
                          {...field}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-red-500 hover:bg-red-950/20 hover:text-red-700"
                            onClick={() => remove(index)}
                          >
                            <Trash className="h-4 w-4" />
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
              className="mt-2 w-full text-xs"
              onClick={() => append({ value: "" })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Tambah Benefit
            </Button>
          </div>
          <Field>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#D4AF37] font-bold text-black hover:bg-[#F3CA52]"
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  );
}
