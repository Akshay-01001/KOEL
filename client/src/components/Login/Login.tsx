import LoginHeader from "@/components/Login/LoginHeader";
import LoginLeftSection from "@/components/Login/LoginLeftSection";
import LoginRightSection from "@/components/Login/LoginRightSection";

export default function Login() {
    return (
        <div className="mx-auto flex min-h-svh w-full max-w-[1200px] flex-col px-4 sm:px-6 lg:px-0">
            <LoginHeader
                prompt="New to Koel?"
                actionLabel="Create account"
                actionTo="/register"
            />

            <main className="grid flex-1 pb-8 lg:grid-cols-2">
                <LoginLeftSection />
                <section className="flex items-center justify-center py-10 lg:px-12">
                    <LoginRightSection />
                </section>
            </main>
        </div>
    );
}
