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
import AddSubscriptionPlanForm from "./add-subscription-plan";

export function ButtonAddSubscriptionPlan() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#D4AF37] hover:bg-[#F3CA52] text-black font-bold border-none shadow-[0_0_15px_rgba(212,175,55,0.2)]">
          Tambah Plan Langganan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Plan Langganan</DialogTitle>
          <DialogDescription>
            Masukkan detail plan langganan yang baru di sini.
          </DialogDescription>
        </DialogHeader>
        <AddSubscriptionPlanForm onSuccessSubmit={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
