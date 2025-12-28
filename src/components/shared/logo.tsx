import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
        <Image
            src="/logo.png"
            alt="Dự án nuôi bơ Logo"
            fill
            className="object-cover rounded-full"
            sizes="4rem"
        />
    </div>
  );
}
