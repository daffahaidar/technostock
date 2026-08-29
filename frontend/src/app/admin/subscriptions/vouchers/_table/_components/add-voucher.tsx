"use client";

import z from "zod";
import { VoucherSchema } from "../../_schemas/voucher";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateVoucher } from "../../_mutations/voucher";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
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
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from "@/components/ui/input-group";
import { authClient } from "@/app/auth/sign-in/_handlers/client";

export default function AddVoucherForm({ onSuccessSubmit }: { onSuccessSubmit?: () => void }) {
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();

  const form = useForm<z.infer<typeof VoucherSchema>>({
    resolver: zodResolver(VoucherSchema) as unknown as Resolver<z.infer<typeof VoucherSchema>>,
    defaultValues: {
      code: "",
      discount_percentage: 0,
      max_discount_amount: 0,
      quota: undefined,
    },
  });

  const token = sessionData?.session?.token || "";

  const { mutate, isPending } = useCreateVoucher({
    accessToken: token,
    onSuccess: () => {
      toast.success("Voucher berhasil dibuat");
      form.reset();
      revalidate(["get-vouchers"]);
      onSuccessSubmit?.();
    },
    onError: (error: unknown) => {
      toast.error((error as Error)?.message || "Gagal membuat voucher");
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutate(values))} className="grid gap-4 py-4">
        <FieldGroup>
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Voucher</FormLabel>
                <FormControl>
                  <Input placeholder="PROMO2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Field className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="discount_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diskon (%)</FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>%</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        placeholder="10"
                        min={0}
                        max={100}
                        className="hide-arrow"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_discount_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maks. Potongan (Rp)</FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>Rp</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        placeholder="10000"
                        min={0}
                        className="hide-arrow"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Field>

          <Field className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kedaluwarsa (Tanggal & Jam)</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      onChange={(e) => {
                        if (e.target.value) {
                          field.onChange(new Date(e.target.value));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kuota (Biarkan kosong jika Unlimited)</FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>Akun</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        placeholder="10"
                        min={1}
                        className="hide-arrow"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? parseInt(val) : null);
                        }}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Field>
        </FieldGroup>
        
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Voucher"}
        </Button>
      </form>
    </Form>
  );
}
