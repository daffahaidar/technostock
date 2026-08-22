"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { User, LogOut, LayoutDashboard } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/auth/sign-in/_handlers/server";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Products", href: "#products" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

const getDashboardUrl = (role: string) => {
  switch (role) {
    case "Maintainer":
      return "/maintainer/dashboard";
    case "Admin":
      return "/admin/dashboard";
    case "Member":
      return "/forum/dashboard";
    default:
      return "/";
  }
};

export default function LandingNavbar({ user }: { user?: { name: string; role: string; avatar_url?: string | null } | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a0a0a]/60 backdrop-blur-2xl border-b border-[#D4AF37]/20 shadow-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-gold rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-black fill-current"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-[#D4AF37] font-semibold text-lg tracking-tight">
              Technostock
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/70 hover:text-[#D4AF37] text-sm font-medium transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="#contact"
              className="text-white/80 hover:text-[#D4AF37] text-sm font-medium transition-colors duration-200"
            >
              Contact Us
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="bg-[#121212] text-[#F9E596] border border-[#D4AF37]/30 text-sm font-semibold pr-4 pl-2 py-2 rounded-full flex items-center gap-2 hover:border-[#D4AF37]/60 hover:bg-[#1a1a1a] transition-all duration-200 outline-none">
                  {user.avatar_url ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="text-black text-xs">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center">
                      <User size={14} className="text-[#D4AF37]" />
                    </div>
                  )}
                  <span>{user.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#121212] border-[#D4AF37]/30 text-[#F9E596] min-w-[200px]">
                  <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer">
                    <Link href={getDashboardUrl(user.role)} className="flex items-center gap-2 w-full">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="hover:bg-red-500/20 focus:bg-red-500/20 text-red-400 focus:text-red-400 cursor-pointer">
                    <form action={logout}>
                      <button type="submit" className="flex items-center gap-2 w-full">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="#services"
                className="bg-gradient-gold text-black text-sm font-bold px-5 py-2.5 rounded-full hover:brightness-110 transition-all duration-200 hover:scale-105 active:scale-95 gold-glow"
              >
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="bg-[#0a0a0a]/70 backdrop-blur-2xl border-t border-[#D4AF37]/20 px-6 py-6 flex flex-col gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-white/80 hover:text-[#D4AF37] text-base font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="bg-[#121212] text-[#F9E596] border border-[#D4AF37]/30 text-sm font-semibold px-4 py-3 rounded-full text-center mt-2 flex items-center justify-center gap-2 hover:border-[#D4AF37]/60 hover:bg-[#1a1a1a] transition-all outline-none">
                  {user.avatar_url ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="text-black text-xs">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center">
                      <User size={14} className="text-[#D4AF37]" />
                    </div>
                  )}
                  <span>{user.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#121212] border-[#D4AF37]/30 text-[#F9E596] min-w-[200px]">
                  <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer">
                    <Link href={getDashboardUrl(user.role)} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 w-full">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="hover:bg-red-500/20 focus:bg-red-500/20 text-red-400 focus:text-red-400 cursor-pointer">
                    <form action={logout} onSubmit={() => setMenuOpen(false)}>
                      <button type="submit" className="flex items-center gap-2 w-full">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          ) : (
            <Link
              href="#services"
              onClick={() => setMenuOpen(false)}
              className="bg-gradient-gold text-black text-sm font-bold px-5 py-3 rounded-full text-center mt-2 hover:brightness-110 gold-glow transition-all"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
