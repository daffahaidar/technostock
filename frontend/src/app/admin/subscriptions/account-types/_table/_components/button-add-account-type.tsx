"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddAccountTypeForm from "./add-account-type";

export function ButtonAddAccountType() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#D4AF37] hover:bg-[#F3CA52] text-black font-bold border-none shadow-[0_0_15px_rgba(212,175,55,0.2)]">
          Tambah Tipe Akun
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Tipe Akun</DialogTitle>
          <DialogDescription>
            Masukkan detail tipe akun yang baru di sini.
          </DialogDescription>
        </DialogHeader>
        <AddAccountTypeForm onSuccessSubmit={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
