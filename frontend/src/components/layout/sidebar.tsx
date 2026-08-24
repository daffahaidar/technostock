"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/libs/shadcn";
import Link from "next/link";
import { Fragment, useState } from "react";
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "../ui/skeleton";
import { Logs, Moon, SearchIcon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { useTheme } from "next-themes";
import useMounted from "@/hooks/use-mounted";

interface NavigationItem {
  name: string;
  path?: string;
}

export default function SidebarLayout({
  children,
  title,
  breadcrumb,
  additionalComponents,
  className,
  headerShown = true,
  isLoading = false,
  subSidebar,
}: {
  children?: React.ReactNode;
  title?: string;
  breadcrumb?: NavigationItem[];
  additionalComponents?: React.ReactNode;
  className?: string;
  headerShown?: boolean;
  isLoading?: boolean;
  subSidebar?: NavigationItem[];
}) {
  const pathName = usePathname();
  const { isMobile } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const { isMounted } = useMounted();

  return (
    <SidebarInset>
      {headerShown && (
        <header className="bg-sidebar sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              {isLoading ? (
                <Skeleton className="bg-accent h-4 w-28 rounded-md" />
              ) : (
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumb?.map((item, index) => (
                      <Fragment key={index}>
                        {item.path ? (
                          <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink asChild>
                              <Link
                                href={item.path}
                                className="hover:text-primary"
                              >
                                {item.name}
                              </Link>
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        ) : (
                          <BreadcrumbItem>
                            <BreadcrumbPage>{item.name}</BreadcrumbPage>
                          </BreadcrumbItem>
                        )}

                        {index < breadcrumb.length - 1 && (
                          <BreadcrumbSeparator className="hidden md:block" />
                        )}
                      </Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isMobile ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size={"sm"} variant={"ghost"}>
                      <SearchIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <InputGroup>
                      <InputGroupInput placeholder="Search..." />
                      <InputGroupAddon>
                        <SearchIcon />
                      </InputGroupAddon>
                    </InputGroup>
                  </PopoverContent>
                </Popover>
              ) : (
                <InputGroup>
                  <InputGroupInput placeholder="Search..." />
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                </InputGroup>
              )}
              {isMounted && (
                <Button
                  size={"sm"}
                  variant={"ghost"}
                  onClick={() =>
                    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                  }
                >
                  {theme === "dark" ? <Sun /> : <Moon />}
                </Button>
              )}

              {subSidebar && (
                <Button
                  className="xl:hidden"
                  size={"sm"}
                  variant={"ghost"}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <Logs />
                </Button>
              )}
            </div>
          </div>
        </header>
      )}
      <section className="flex flex-1 flex-col gap-2 p-4 pt-2 pb-0">
        <div className="flex flex-col justify-between gap-2 sm:flex-row">
          {title && <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>}
          {additionalComponents && additionalComponents}
        </div>
        <div className="flex flex-1 gap-4">
          <div className={cn("flex-1 pb-4", className)}>
            {isLoading ? <Loader /> : children}
          </div>
          {subSidebar && (
            <aside
              className={cn(
                "sub-sidebar bg-sidebar fixed top-16 right-0 z-40 h-[calc(100dvh-4rem)] w-64 border-l transition-all duration-300 ease-in-out group-has-data-[collapsible=icon]/sidebar-wrapper:top-12 group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100dvh-3rem)] xl:sticky xl:h-auto xl:max-h-[calc(100dvh-4rem)] xl:translate-x-0 xl:bg-transparent xl:group-has-data-[collapsible=icon]/sidebar-wrapper:max-h-[calc(100dvh-3rem)]",
                isOpen ? "translate-x-0" : "translate-x-full",
              )}
            >
              <ul className="h-full overflow-y-auto">
                {subSidebar.map((item, index) =>
                  item.path ? (
                    <li
                      key={index}
                      className={cn(
                        "hover:text-primary",
                        item.path && pathName.startsWith(item.path)
                          ? "border-primary text-primary border-l-2"
                          : "text-muted-foreground border-l-none",
                      )}
                    >
                      <Link
                        href={item.path!}
                        className="block w-full py-2 pl-4 text-sm transition-colors"
                        onClick={() => setIsOpen(false)} // Tutup sidebar setelah klik link
                      >
                        {item.name}
                      </Link>
                    </li>
                  ) : (
                    <li
                      key={index}
                      className="text-foreground border-l border-transparent font-medium"
                    >
                      <span className="block w-full py-2 pl-4 text-sm">
                        {item.name}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </aside>
          )}
        </div>
      </section>
    </SidebarInset>
  );
}
