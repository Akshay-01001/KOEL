// Bottom bar for signed-in pages.
export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border">
            <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-10">
                <p>&copy; {year} Koel</p>
                <p>Video meetings, simply.</p>
            </div>
        </footer>
    );
}
