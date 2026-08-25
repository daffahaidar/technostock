"use client";

import z from "zod";
import { subscriptionPlanSchema } from "../schema/subscription-plan";
import { useForm, type Resolver } from "react-hook-form";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { authClient } from "@/app/auth/sign-in/_handlers/client";

export default function AddSubscriptionPlanForm({ onSuccessSubmit }: { onSuccessSubmit?: () => void }) {
 
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  
  const { data: dataAccountType, isLoading: isLoadingAccountTypes } = useQuery({
    queryKey: ["get-account-types", sessionData?.session?.token],
    queryFn: async () => {
      const token = sessionData?.session?.token;
      if (!token) return { results: [] };
      return (await getAccountTypes(token)) as { results: { id: string; name: string }[] };
    },
    enabled: !!sessionData?.session?.token,
  });

  const form = useForm<z.infer<typeof subscriptionPlanSchema>>({
    resolver: zodResolver(subscriptionPlanSchema) as unknown as Resolver<z.infer<typeof subscriptionPlanSchema>>,
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
      onSuccessSubmit?.();
    },
    onError: (error: unknown) => {
      toast.error((error as Error)?.message || "Failed to create subscription plan");
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutate(values))} className="grid gap-4 py-4">
        <FieldGroup>
          <FormField
            control={form.control}
            name="account_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Akun</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Tipe Akun" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dataAccountType?.results?.map((at: { id: string; name: string }) => (
                      <SelectItem key={at.id} value={at.id}>
                        {at.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Plan</FormLabel>
                <FormControl>
                  <Input placeholder="Misal: 1 Bulan" {...field} />
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
                <FormLabel>Durasi (Bulan)</FormLabel>
                <FormControl>
                  <div className="flex w-full items-center gap-2">
                    <div className="flex w-full h-10 items-center rounded-md border border-input bg-background ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden">
                      <Input 
                        type={field.value === 0 ? "text" : "number"} 
                        placeholder="1" 
                        value={field.value === 0 ? "Lifetime" : ((field.value as unknown) === "" ? "" : field.value)}
                        disabled={field.value === 0}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                        }}
                        className="border-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-100"
                      />
                      <div className="flex h-full items-center justify-center px-3 text-sm text-muted-foreground border-l border-input bg-muted/50">
                        Bulan
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant={field.value === 0 ? "default" : "outline"} 
                      className={field.value === 0 ? "shrink-0 bg-[#D4AF37] hover:bg-[#F3CA52] text-black font-bold border-none" : "shrink-0"}
                      onClick={() => {
                        if (field.value === 0) {
                          field.onChange(1);
                        } else {
                          field.onChange(0);
                        }
                      }}
                    >
                      Lifetime
                    </Button>
                  </div>
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
                <FormLabel>Harga (Rp)</FormLabel>
                <FormControl>
                  <div className="flex w-full h-10 items-center rounded-md border border-input bg-background ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden">
                    <div className="flex h-full items-center justify-center px-3 text-sm text-muted-foreground border-r border-input bg-muted/50">
                      Rp
                    </div>
                    <Input 
                      type="text" 
                      placeholder="100.000" 
                      value={(field.value as unknown) !== "" && field.value !== undefined ? new Intl.NumberFormat("id-ID").format(Number(field.value)) : ""}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, "");
                        field.onChange(rawValue === "" ? "" : Number(rawValue));
                      }} 
                      className="border-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none bg-transparent"
                    />
                  </div>
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
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Deskripsi singkat plan langganan..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Field className="pt-2">
            <Button 
              type="submit" 
              disabled={isPending || isLoadingAccountTypes}
              className="w-full bg-[#D4AF37] hover:bg-[#F3CA52] text-black font-bold border-none"
            >
              {isPending ? "Menyimpan..." : "Simpan Plan"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  );
}
