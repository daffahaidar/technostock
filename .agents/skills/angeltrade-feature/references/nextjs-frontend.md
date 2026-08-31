# Resep: frontend Next.js 16

Stack: Next.js 16 (App Router, `output: "standalone"`, `cacheComponents: true`),
React 19, TypeScript strict, Tailwind v4 (tanpa `tailwind.config`), shadcn/ui
(new-york, zinc, lucide), TanStack Query v5, **axios**, AG Grid,
react-hook-form + zod, sonner, zustand.

Alias: `@/*` → `./src/*`. Middleware bernama **`src/proxy.ts`** (konvensi
Next 16), bukan `middleware.ts`.

## Satu pola: route-scoped di `src/app/`

`src/modules/` **sudah dihapus** dari repo — jangan dibuat lagi. Semua fitur
tinggal di folder route-nya sendiri.

| Folder                | Isi                                                                       |
| --------------------- | ------------------------------------------------------------------------- |
| `_queries/`           | `queryXxx(accessToken)` (objek opsi) + `useGetXxx()` (wrapper hook)        |
| `_mutations/`         | `useXxx({ onSuccess, onError, accessToken })` → `useMutation`              |
| `_schemas/`           | Zod schema + type (form), atau type bentuk response                       |
| `_table/_column/`     | `ColDef[]` AG Grid                                                        |
| `_table/_components/` | `"use client"`: `<domain>-table`, `add-<domain>`, `button-add-<domain>`    |
| `_components/`        | Komponen client lain milik route itu                                      |
| `_handlers/`          | Adapter auth — hanya ada di `app/auth/sign-in/` (`client.ts`, `server.ts`) |
| `types/`              | Interface TS lokal (dipakai chat)                                         |

**Template: `src/app/admin/members/`** untuk struktur, dan
`src/app/admin/subscriptions/vouchers/` untuk CRUD lengkap (create + delete).
Form dengan dropdown relasi → tiru `subscriptions/plans`; PATCH + field array →
tiru `subscriptions/account-types`. `members` tidak punya create.

---

## Resep CRUD admin baru (contoh: `coupon`)

Konvensi turunan nama: entity kebab `coupon`, plural `coupons`, PascalCase
`Coupon`, query key `"get-coupons"`, mutation key `"create-coupon"`.

### 1. `src/endpoint/index.ts`

```ts
COUPON: `${MAIN_PREFIX}/coupons`,   // MAIN_PREFIX = "/api/v1/main"
```

URL **tidak pernah** ditulis langsung di query/mutation — selalu lewat sini.

### 2. `_schemas/coupon.ts`

Tanpa directive.

```ts
import { z } from "zod";

export const CouponSchema = z.object({
  code: z.string().min(1, { message: "Kode kupon harus diisi" }),
  discount_percentage: z.coerce
    .number()
    .min(0)
    .max(100, { message: "Diskon maksimal 100%" }),
  quota: z.coerce.number().nullable().optional(),
});
```

Pesan error **bahasa Indonesia**. Input string → `z.coerce.number()`. Validasi
lintas-field → `.refine(..., { path: ["field"] })` (lihat `plans/_schemas/plan.ts`).

### 3. `_queries/coupon.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export function queryCoupons(accessToken: string) {
  return {
    queryKey: ["get-coupons"],
    queryFn: async () => {
      const { data } = await gatewayAPI.get(`${ENDPOINT.MAIN_SERVICE.COUPON}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return data;
    },
  };
}

export const useGetCoupons = (accessToken: string) => {
  const {
    data: couponsData,
    isLoading: isCouponsDataLoading,
    isError: isCouponsDataError,
    refetch: refetchCouponsData,
    error: couponsDataError,
  } = useQuery({
    ...queryCoupons(accessToken),
  });

  return {
    couponsData,
    isCouponsDataLoading,
    isCouponsDataError,
    refetchCouponsData,
    couponsDataError,
  };
};
```

Aturan:

- **Selalu axios `gatewayAPI`** dari `@/libs/axios` — jangan `fetch()` mentah,
  jangan bikin instance axios baru. `messageBackend` khusus chat.
- `queryFn` mengembalikan **envelope apa adanya** (`data`), bukan `data.results`
  — komponen yang unwrap.
- Query key **tanpa token** (`["get-coupons"]`) supaya hasil prefetch di server
  dipakai ulang saat hydrate di client.
- Fungsi `queryXxx()` dipisah dari hook karena `page.tsx` memakainya untuk
  prefetch.
- `enabled: !!accessToken` hanya bila endpoint-nya tidak boleh dipanggil tanpa
  token dan halamannya bisa diakses anonim (contoh: `active-subscription`).

### 4. `_mutations/coupon.ts`

```ts
import { useMutation } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";
import { z } from "zod";
import { CouponSchema } from "../_schemas/coupon";

export const useCreateCoupon = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["create-coupon"],
    mutationFn: async (body: z.infer<typeof CouponSchema>) => {
      const response = await gatewayAPI.post(
        `${ENDPOINT.MAIN_SERVICE.COUPON}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response?.data;
    },
    onSuccess,
    onError,
  });
};
```

`useDeleteCoupon` sama, `gatewayAPI.delete(`${...COUPON}/${id}`)` dengan
`mutationFn: async (id: string)`.

### 5. `_table/_column/coupon.tsx`

```tsx
import { ColDef, ValueFormatterParams } from "ag-grid-community";

export const CouponColumn: ColDef[] = [
  { field: "code", headerName: "Kode Kupon" },
  {
    field: "quota",
    headerName: "Kuota",
    valueFormatter: (p: ValueFormatterParams) =>
      p.value != null ? p.value.toString() : "∞",
  },
  {
    headerName: "Aksi",
    field: "id",
    cellRenderer: "actionRenderer",
    width: 120,
    sortable: false,
    filter: false,
  },
];
```

- `defaultColDef` global sudah diset di `@/components/ui/ag-table`:
  `{ filter: true, sortable: true, resizable: true, minWidth: 150, flex: 1 }`.
  Tema dark + aksen emas juga sudah di sana.
- Kolom terakhir selalu `headerName: "Aksi"`.
- Format IDR:
  `new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v)`
- Format tanggal: `format(new Date(v), "dd MMM yyyy, HH:mm", { locale: id })` (date-fns).
- Tiga cara mendaftar cell renderer — pilih **satu**:
  1. String `"actionRenderer"` + `gridOptions.components` di file table
     (vouchers) — file column tetap tanpa `"use client"`
  2. Komponen didefinisikan di file column itu sendiri (account-types, plans) —
     **wajib** `"use client"` di file column
  3. Import komponen dari `_table/_components/` (members)

### 6. `_table/_components/coupon-table.tsx`

`"use client"`, **default export**.

```tsx
export default function CouponTable() {
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token || "";

  const { couponsData, isCouponsDataLoading } = useGetCoupons(token);

  const { mutate: doDelete, isPending: isDeleting } = useDeleteCoupon({
    accessToken: token,
    onSuccess: () => {
      toast.success("Kupon berhasil dihapus");
      revalidate(["get-coupons"]);
    },
    onError: (error: unknown) => {
      toast.error((error as Error)?.message || "Gagal menghapus kupon");
    },
  });

  const ActionRenderer = (params: ICellRendererParams) => (
    <Button
      variant="destructive"
      size="icon"
      className="h-8 w-8 mt-1"
      disabled={isDeleting}
      onClick={() => {
        if (confirm("Apakah anda yakin ingin menghapus kupon ini?")) {
          doDelete(params.value);
        }
      }}
    >
      <Trash className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="size-full">
      <AgTable
        rowData={couponsData?.results || []}
        columnDefs={CouponColumn}
        loading={isCouponsDataLoading}
        loadingOverlayComponent={() => (
          <div className="flex flex-1 flex-col items-center justify-center">
            <BeatLoader color="var(--primary)" />
          </div>
        )}
        noRowsOverlayComponent={() => (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Folder />
              </EmptyMedia>
              <EmptyTitle>Belum Ada Kupon</EmptyTitle>
              <EmptyDescription>
                Belum ada data kupon yang tersedia saat ini.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        gridOptions={{ components: { actionRenderer: ActionRenderer } }}
      />
    </div>
  );
}
```

**Cek bentuk response backend-nya**: `couponsData?.results` untuk mayoritas
endpoint main-service, tapi `admin/members` mengembalikan `data` →
`membersData?.data`. Jangan asal salin.

### 7. `_table/_components/add-coupon.tsx`

`"use client"`, **default export**, props `{ onSuccessSubmit?: () => void }`.

```tsx
const revalidate = useRevalidateQuery();
const { data: sessionData } = authClient.useSession();
const token = sessionData?.session?.token || "";

const form = useForm<z.infer<typeof CouponSchema>>({
  resolver: zodResolver(CouponSchema) as unknown as Resolver<
    z.infer<typeof CouponSchema>
  >,
  defaultValues: { code: "", discount_percentage: 0, quota: undefined },
});

const { mutate, isPending } = useCreateCoupon({
  accessToken: token,
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

// <Form {...form}><form onSubmit={form.handleSubmit((values) => mutate(values))}
//   className="grid gap-4 py-4"><FieldGroup><FormField … /></FieldGroup>
//   <Button type="submit" disabled={isPending}>{isPending ? "Menyimpan..." : "Simpan"}</Button>
```

- Cast `as unknown as Resolver<...>` dipakai bila TS mengeluh soal resolver.
- Field numerik: `onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}`.
- Layout 2 kolom: `<Field className="grid grid-cols-2 gap-4">`.

### 8. `_table/_components/button-add-coupon.tsx`

`"use client"`, **named export** `ButtonAddCoupon`: `Dialog` + `DialogTrigger`
tombol emas + `<AddCouponForm onSuccessSubmit={() => setOpen(false)} />`.
`Sheet` tidak dipakai di mana pun.

### 9. `src/app/admin/subscriptions/coupons/page.tsx`

Server Component, **tanpa** `"use client"`. Prefetch di server lalu hydrate:

```tsx
async function ServerSideData() {
  const session = await getSession();
  const token = session?.session?.token || "";

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(queryCoupons(token));

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="flex h-[calc(100vh-12rem)] min-h-[500px] flex-1 flex-col gap-4">
        <div className="w-full flex-1">
          <CouponTable />
        </div>
      </div>
    </HydrationBoundary>
  );
}

export default function CouponsPage() {
  return (
    <SidebarLayout
      title="Daftar Kupon"
      additionalComponents={<ButtonAddCoupon />}
      breadcrumb={[
        { name: "Admin" },
        { name: "Subscription" },
        { name: "Kupon", path: "/admin/subscriptions/coupons" },
      ]}
    >
      <Suspense
        fallback={<div className="w-full text-white">Loading dashboard...</div>}
      >
        <ServerSideData />
      </Suspense>
    </SidebarLayout>
  );
}
```

`getQueryClient` dari `@/configs/tanstack-query` — dibungkus `cache()`, jadi satu
instance per request (tidak bocor antar user). Beberapa query sekaligus →
`await Promise.all([...])` seperti di `admin/members/page.tsx`.

### 10. `src/constants/admin-menu.ts`

Tambah `{ title: "Kupon", url: "/admin/subscriptions/coupons", icon: <LucideIcon>, isActive: false }`
ke group yang sesuai.

### Tidak perlu disentuh

`proxy.ts` (prefix `/admin` sudah role-gated), `admin/layout.tsx`,
`app/layout.tsx`, barrel `index.ts`.

---

## Data fetching: aturannya satu

**Semua data lewat TanStack Query + axios.** Tidak ada `fetch()` mentah dan
tidak ada server action untuk ambil/kirim data.

| Konteks                                | Cara                                                                 |
| -------------------------------------- | -------------------------------------------------------------------- |
| Server Component                       | `getSession()` + `getQueryClient().prefetchQuery(queryXxx(token))` + `<HydrationBoundary>` |
| Server Component yang harus `redirect()` bila data kosong | `fetchQuery` (melempar error, tidak ditelan) — lihat `app/checkout/page.tsx` |
| Komponen client                        | hook `useGetXxx(token)` dari `_queries/`                             |
| Mutasi / aksi imperatif (termasuk GET yang dipicu tombol) | hook dari `_mutations/` + `revalidate([...])` |

Pengecualian yang boleh tetap `fetch()`: BFF auth (`src/app/api/auth/**`),
`src/proxy.ts`, ping ketersediaan backend `mode: "no-cors"` di
`_mutations/sign-in.ts` & `sign-up.ts`, dan server action yang memang harus
menyentuh cookie httpOnly (`checkout/status/actions.ts`, `_handlers/server.ts`).

Token **selalu di-drill**, tidak diambil interceptor: client
`authClient.useSession()`, server `getSession()`, lalu dikirim sebagai header
`Authorization` di `queryXxx(token)` / `useXxx({ accessToken })`.

Base URL — jangan menyusun URL absolut sendiri:

- `gatewayAPI` (`@/libs/axios`) sudah memilih sendiri: `SERVER_GATEWAY_URL` saat
  jalan di server (di container `localhost:8080` menunjuk ke frontend sendiri),
  `NEXT_PUBLIC_API_URL` di browser.
- `messageBackend` → `NEXT_PUBLIC_MESSAGE_API_URL` / `NEXT_PUBLIC_WS_API_URL`.
- Route handler auth memakai `SERVER_API_URL || NEXT_PUBLIC_API_URL` langsung
  (bukan axios).

Error backend: `getErrorMessage(error, "pesan default")` dari `@/libs/axios`
membaca `meta.message` / `error` dari response — pakai ini di `onError` bila
pesan dari backend perlu sampai ke user (alur bayar, voucher, registrasi).

## Revalidasi

Satu-satunya mekanisme: `useRevalidateQuery()` dari `@/hooks/use-revalidate`,
dipanggil di `onSuccess` dengan query key yang datanya jadi basi —
`revalidate(["get-a"], ["get-b"])`. `revalidateTag`/`revalidatePath`/server
action dan `router.refresh()` **tidak** dipakai untuk data
(`src/actions/revalidate.ts` sudah dihapus).

Efek lintas fitur yang wajib diingat:

| Aksi                                    | Key yang ikut di-invalidate                                      |
| --------------------------------------- | ---------------------------------------------------------------- |
| CRUD account type                       | `get-account-types` + `get-public-pricing`                       |
| CRUD plan                                | `get-subscription-plans` + `get-public-pricing`                  |
| Promote / extend / revoke member         | `get-members` + `get-subscription-plans` + `get-public-pricing`  |
| Pembayaran settled (`checkout/status`)   | `get-active-subscription` + `get-public-pricing`                 |

Logout wajib memanggil `useClearQueryCache()` dari hook yang sama **sebelum**
redirect — cache TanStack hidup di browser dan terbawa ke sesi user berikutnya
kalau tidak dibuang.

## Styling

Token emas ada di `src/styles/globals.css`: `--color-gold-300/400/500/600/700`,
utility `.text-gradient-gold`, `.bg-gradient-gold`, `.gold-glow`,
`.bg-luxury-black`, `.glass-card-gold`, `.glass-panel-gold`.

Banyak komponen masih memakai hex mentah `#D4AF37`. **Pakai token**, jangan
menambah hex baru.

Tailwind v4: tidak ada `tailwind.config.*` — tema seluruhnya di `globals.css`.

## Catatan

Dead code lama (`use-query.ts`, `use-mutate.ts`, `externalBackend`,
`sidebar-dispatcher.tsx`, `src/modules/`, `src/actions/revalidate.ts`) sudah
**dihapus** dari repo — jangan menghidupkannya kembali.

`messageBackend` di `libs/axios.ts` dipakai, tapi hanya oleh chat
(`/maintainer/discussion`) yang statusnya on-hold.

## Verifikasi

```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

`npm run build` sekalian menangkap pelanggaran batas Server/Client Component
yang lolos dari `tsc`. Tidak ada test runner di repo (`jest`/`vitest`/
`playwright` tidak terpasang). `npm run dev` tidak memakai `--turbopack`.
