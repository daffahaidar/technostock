"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GalleryVerticalEnd } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md supports-[backdrop-filter]:bg-black/20">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Super Stock
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            Features
          </Link>
          <Link
            href="#courses"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            Courses
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            Stories
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/sign-in"
            className="hidden text-sm font-medium text-gray-300 transition-colors hover:text-white sm:block"
          >
            Log in
          </Link>
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105 active:scale-95"
          >
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
