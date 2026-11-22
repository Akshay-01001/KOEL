import { cn } from "@/lib/utils";

type KoelLogoProps = {
    className?: string;
};

export default function KoelLogo({ className }: KoelLogoProps) {
    return (
        <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className={cn("size-8 shrink-0 select-none", className)}
            draggable={false}
        />
    );
}
