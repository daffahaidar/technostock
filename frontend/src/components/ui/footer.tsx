import Link from "next/link";
import {
  GalleryVerticalEnd,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-12 text-gray-400">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <span className="text-lg font-bold">Super Stock</span>
          </div>
          <p className="text-sm">
            Empowering the next generation of investors with education, tools,
            and community.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white">
              <Twitter className="size-5" />
            </Link>
            <Link href="#" className="hover:text-white">
              <Facebook className="size-5" />
            </Link>
            <Link href="#" className="hover:text-white">
              <Instagram className="size-5" />
            </Link>
            <Link href="#" className="hover:text-white">
              <Linkedin className="size-5" />
            </Link>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
            Platform
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="#" className="hover:text-white">
                Courses
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">
                Signals
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">
                Community
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
            Company
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="#" className="hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">
                Careers
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">
                Blog
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
            Legal
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="#" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white">
                Risk Disclaimer
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-12 border-t border-white/10 px-4 pt-8 text-center text-xs">
        &copy; {new Date().getFullYear()} Super Stock. All rights reserved.
      </div>
    </footer>
  );
}
