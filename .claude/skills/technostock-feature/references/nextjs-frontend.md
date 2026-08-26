# Resep: frontend Next.js 16

Stack: Next.js 16 (App Router, `output: "standalone"`, `cacheComponents: true`),
React 19, TypeScript strict, Tailwind v4 (tanpa `tailwind.config`), shadcn/ui
(new-york, zinc, lucide), TanStack Query v5, AG Grid, react-hook-form + zod,
sonner, zustand.

Alias: `@/*` → `./src/*`. Middleware bernama **`src/proxy.ts`** (konvensi
Next 16), bukan `middleware.ts`.

## Dua pola, pilih yang sesuai

| Pola | Untuk | Lokasi |
|---|---|---|
| **A. Module** | Fitur CRUD admin dengan tabel | `src/modules/<domain>/` |
| **B. Route-scoped** | Halaman dengan komponen/hook khususnya sendiri | `src/app/<route>/_components` dll. |

Modul yang ada: `account-type`, `subscription-plan`, `member`, `voucher`.
**Template terbaik: `voucher`** (paling ringkas & lengkap) — tapi perbaiki dua
penyimpangannya: URL-nya hard-code (seharusnya lewat `src/endpoint/index.ts`)
dan tidak pakai try/catch. Untuk form dengan dropdown relasi tiru
`subscription-plan`; untuk PATCH + field array tiru `account-type`. `member`
**bukan** template CRUD (tidak punya create).

---

## Pola A — Modul CRUD baru (contoh: `coupon`)

Konvensi turunan nama: entity kebab `coupon`, plural `coupons`, PascalCase
`Coupon`, query key `"get-coupons"`.

### 1. `src/endpoint/index.ts`

```ts
COUPON: `${GOLANG_PREFIX}/coupons`,   // GOLANG_PREFIX = "/api/v1/main"
```

### 2. `src/modules/coupon/schema/coupon.ts`

Tanpa directive.

```ts
import { z } from "zod";

export const CouponSchema = z.object({
  code: z.string().min(1, { message: "Kode kupon harus diisi" }),
  discount_percentage: z.number().min(0).max(100, { message: "Diskon maksimal 100%" }),
  quota: z.number().nullable().optional(),
});

export type CouponType = z.infer<typeof CouponSchema> & {
  id: string;
  created_at: string;
  updated_at: string;
};
```

Pesan error **bahasa Indonesia**. Butuh coercion dari input string →
`z.coerce.number()`. Validasi lintas-field → `.refine(..., { path: ["field"] })`.

### 3. `src/modules/coupon/actions/coupon-actions.ts`

**Tanpa directive** — jalan di browser, dipanggil dari komponen `"use client"`.

```ts
import { ENDPOINT } from "@/endpoint";
import { z } from "zod";
import { CouponSchema, CouponType } from "../schema/coupon";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const getCoupons = async (token: string): Promise<CouponType[]> => {
  const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.COUPON}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch coupons");
  const data = await res.json();
  return data.results || [];
};

export const createCoupon = async (data: z.infer<typeof CouponSchema>, token: string) => {
  const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.COUPON}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create coupon");
  const responseData = await res.json();
  return responseData.results;
};

export const deleteCoupon = async (id: string, token: string) => {
  const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.COUPON}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete coupon");
  return await res.json();
};
```

Aturan:
- `fetch` global — **bukan** axios. Instance `externalBackend` di
  `libs/axios.ts` adalah dead code.
- `token: string` selalu argumen **terakhir**.
- List selalu `cache: "no-store"`.
- Unwrap `data.results`. **Cek dulu** bentuk response backend-nya: endpoint
  `admin/members` mengembalikan `data.data`, bukan `data.results`.
- Selalu `if (!res.ok) throw new Error(...)`.

### 4. `src/modules/coupon/column/coupon.tsx`

```tsx
import { ColDef, ValueFormatterParams } from "ag-grid-community";

export const CouponColumn: ColDef[] = [
  { field: "code", headerName: "Kode Kupon" },
  {
    field: "discount_percentage",
    headerName: "Diskon (%)",
    valueFormatter: (p: ValueFormatterParams) => `${p.value}%`,
  },
  {
    field: "quota",
    headerName: "Kuota",
    valueFormatter: (p: ValueFormatterParams) => (p.value != null ? p.value.toString() : "∞"),
  },
  { headerName: "Aksi", field: "id", cellRenderer: "actionRenderer", width: 120, sortable: false, filter: false },
];
```

- `defaultColDef` global sudah diset di `@/components/ui/ag-table`:
  `{ filter: true, sortable: true, resizable: true, minWidth: 150, flex: 1 }`.
- Kolom terakhir selalu `headerName: "Aksi"`.
- Format IDR:
  `new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v)`
- Format tanggal: `format(new Date(v), "dd MMM yyyy, HH:mm", { locale: id })` (date-fns).
- Tiga cara mendaftar cell renderer di repo ini — pilih **satu**:
  1. String + `gridOptions.components` (voucher) — file column tidak perlu `"use client"`
  2. Komponen di file column itu sendiri (account-type, subscription-plan) — **wajib** `"use client"`
  3. Import komponen dari `components/` (member)

### 5. `src/modules/coupon/components/add-coupon.tsx`

`"use client"`, **default export**. Urutan boilerplate persis:

```tsx
"use client";

export default function AddCouponForm({ onSuccessSubmit }: { onSuccessSubmit?: () => void }) {
  const revalidate = useRevalidateQuery();                 // @/hooks/use-revalidate
  const { data: sessionData } = authClient.useSession();   // @/app/auth/sign-in/_handlers/client

  const form = useForm<z.infer<typeof CouponSchema>>({
    resolver: zodResolver(CouponSchema) as unknown as Resolver<z.infer<typeof CouponSchema>>,
    defaultValues: { code: "", discount_percentage: 0, quota: null },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof CouponSchema>) => {
      const token = sessionData?.session?.token;
      if (!token) throw new Error("Unauthorized");
      return await createCoupon(values, token);
    },
    onSuccess: () => {
      toast.success("Kupon berhasil dibuat");
      form.reset();
      revalidate(["get-coupons"]);
      onSuccessSubmit?.();
    },
    onError: (error: unknown) => {
      toast.error((error as Error)?.message || "Gagal membuat kupon");
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutate(values))} className="grid gap-4 py-4">
        <FieldGroup>
          <FormField control={form.control} name="code" render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Kupon</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FieldGroup>
        <Button type="submit" disabled={isPending}>{isPending ? "Menyimpan..." : "Simpan"}</Button>
      </form>
    </Form>
  );
}
```

- Cast `as unknown as Resolver<...>` dipakai voucher & subscription-plan (bukan
  account-type). Pakai bila TS mengeluh.
- Field numerik: `onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}`.
- Layout 2 kolom: `<Field className="grid grid-cols-2 gap-4">`.

### 6. `src/modules/coupon/components/button-add-coupon.tsx`

`"use client"`, **named export** `ButtonAddCoupon`.

```tsx
const [open, setOpen] = useState(false);
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button className="bg-[#D4AF37] hover:bg-[#F3CA52] text-black font-bold border-none shadow-[0_0_15px_rgba(212,175,55,0.2)]">
      Tambah Kupon
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader><DialogTitle>…</DialogTitle><DialogDescription>…</DialogDescription></DialogHeader>
    <AddCouponForm onSuccessSubmit={() => setOpen(false)} />
  </DialogContent>
</Dialog>
```

`Sheet` tidak dipakai modul mana pun.

### 7. `src/modules/coupon/components/coupon-table.tsx`

`"use client"`, **default export**.

```tsx
const { data: sessionData } = authClient.useSession();
const token = sessionData?.session?.token;

const { data, isPending } = useQuery({
  queryKey: ["get-coupons", token],
  queryFn: async () => (token ? await getCoupons(token) : []),
  enabled: !!token,
});

// delete: useMutation + confirm() bawaan browser + toast + revalidate(["get-coupons"])

if (isPending) return <div className="flex h-64 items-center justify-center">Loading...</div>;

return (
  <div className="size-full">
    <AgTable
      rowData={data || []}
      columnDefs={CouponColumn}
      gridOptions={{ components: { actionRenderer: ActionRenderer } }}
    />
  </div>
);
```

### 8. `src/app/admin/subscriptions/coupons/page.tsx`

Server Component, **tanpa** `"use client"`.

```tsx
export default function CouponsPage() {
  return (
    <SidebarLayout
      title="Daftar Kupon"
      additionalComponents={<ButtonAddCoupon />}
      breadcrumb={[{ name: "Admin" }, { name: "Subscription" }, { name: "Kupon", path: "/admin/subscriptions/coupons" }]}
    >
      <Suspense fallback={<div className="w-full text-white">Loading dashboard...</div>}>
        <div className="flex flex-1 flex-col gap-4 h-[calc(100vh-12rem)] min-h-[500px]">
          <div className="flex-1 w-full"><CouponTable /></div>
        </div>
      </Suspense>
    </SidebarLayout>
  );
}
```

### 9. `src/constants/admin-menu.ts`

Tambah `{ title: "Kupon", url: "/admin/subscriptions/coupons", icon: <LucideIcon>, isActive: false }`
ke group yang sesuai.

### Tidak perlu disentuh

`proxy.ts` (prefix `/admin` sudah role-gated `Admin`), `admin/layout.tsx`,
`app/layout.tsx`, barrel `index.ts`, folder `types/`/`hooks/` di modul.

---

## Pola B — Halaman route-scoped

| Folder | Isi |
|---|---|
| `_components/` | Komponen milik route itu saja |
| `_handlers/` | Adapter auth (`client.ts` = `createAuthClient`, `server.ts` = `getSession`/`logout`) |
| `_mutations/` | Hook `useMutation` khusus route, nama `useXxx` |
| `_queries/` | Export `queryXxx()` (objek opsi) + `useGetXxx()` (wrapper) |
| `types/` | Interface TS lokal |
| `schema.ts` | Zod schema level route |
| `action.ts` / `actions.ts` | Server action lokal (`"use server"` baris 1) |
| `<route>-client.tsx` | Alternatif `_components` untuk satu komponen client sibling page |

`getSession()` dari `@/app/auth/sign-in/_handlers/server` dipakai lintas app —
di landing, checkout, forum dashboard, dan admin dashboard.

---

## Data fetching: pilih yang mana

| Konteks | Cara |
|---|---|
| Server Component | `await getSession()` + `fetch(...)` langsung. `cache: "no-store"` untuk data user; `next: { revalidate: N, tags: [...] }` untuk data publik |
| Komponen client | TanStack `useQuery` + fungsi dari `modules/*/actions/` |
| Mutasi dari form | `useMutation` + `revalidate([...])` |
| Data publik yang perlu SSR + cache | Server action `"use server"` dengan `next: { tags: [...] }` — tiru `get-public-pricing.ts` |

Base URL:
- Client: `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"`
- Server-side ke gateway: `SERVER_GATEWAY_URL || NEXT_PUBLIC_API_URL || "http://localhost:8080"`
- Server-side ke auth-service: `SERVER_API_URL || NEXT_PUBLIC_API_URL || "http://localhost:8000"`

Invalidasi:
- Client cache → `useRevalidateQuery()` dari `@/hooks/use-revalidate`
- Server cache → `revalidateServerTag("<tag>")` dari `@/app/actions/revalidate`
  (satu-satunya pemakai saat ini: toggle `is_recommended` di
  `modules/account-type/column/account-type.tsx`)

`revalidatePath` tidak dipakai di mana pun.

## Styling

Token emas ada di `src/styles/globals.css`: `--color-gold-300/400/500/600/700`,
utility `.text-gradient-gold`, `.bg-gradient-gold`, `.gold-glow`,
`.bg-luxury-black`, `.glass-card-gold`, `.glass-panel-gold`.

Banyak komponen memakai hex mentah `#D4AF37`. **Pakai token**, jangan menambah
hex baru.

Tailwind v4: tidak ada `tailwind.config.*` — tema seluruhnya di `globals.css`.

## Jangan pakai (dead code)

`src/hooks/use-query.ts`, `src/hooks/use-mutate.ts`,
`src/libs/axios.ts → externalBackend`,
`src/components/layout/sidebar-dispatcher.tsx`,
`getQueryClient` di `src/configs/tanstack-query.ts`.

`messageBackend` di `libs/axios.ts` **dipakai**, tapi hanya oleh chat
(`/maintainer/discussion`) yang statusnya on-hold.

## Verifikasi

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Tidak ada test runner di repo (`jest`/`vitest`/`playwright` tidak terpasang).
`npm run dev` tidak memakai `--turbopack`.
