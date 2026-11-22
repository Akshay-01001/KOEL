import LoginHeader from "@/components/Login/LoginHeader";
import LoginLeftSection from "@/components/Login/LoginLeftSection";
import RegisterRightSection from "@/components/Register/RegisterRightSection";

// Same layout as Login: reuses its header and brand panel, swaps in the sign-up form.
export default function Register() {
    return (
        <div className="mx-auto flex min-h-svh w-full max-w-[1200px] flex-col px-4 sm:px-6 lg:px-0">
            <LoginHeader
                prompt="Already have an account?"
                actionLabel="Sign in"
                actionTo="/login"
            />

            <main className="grid flex-1 pb-8 lg:grid-cols-2">
                <LoginLeftSection />
                <section className="flex items-center justify-center py-10 lg:px-12">
                    <RegisterRightSection />
                </section>
            </main>
        </div>
    );
}
