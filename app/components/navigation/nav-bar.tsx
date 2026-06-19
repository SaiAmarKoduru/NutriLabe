"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

const routes = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Label Generator",
    href: "/generator",
  },
  {
    label: "Ingredient Builder",
    href: "/ingredient-builder",
  },
];

export function NavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">23 E2</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.href
                    ? "text-black dark:text-white"
                    : "text-muted-foreground"
                )}
              >
                {route.label}
              </Link>
            ))}
            {/* <Button asChild>
              <Link href="/generator">
                Create Label
              </Link>
            </Button> */}
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      pathname === route.href
                        ? "text-black dark:text-white"
                        : "text-muted-foreground"
                    )}
                  >
                    {route.label}
                  </Link>
                ))}
                {/* <Button asChild className="mt-2">
                  <Link href="/generator" onClick={() => setIsOpen(false)}>
                    Create Label
                  </Link>
                </Button> */}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
