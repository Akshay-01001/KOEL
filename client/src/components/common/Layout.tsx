import type { ReactNode } from "react";
import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";

type LayoutProps = {
    children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="flex min-h-svh flex-col bg-background text-foreground">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
