import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-lighter via-white to-surface px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
          <span className="text-white font-bold text-2xl">P</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">{APP_NAME}</h1>
      </div>
      {children}
    </div>
  );
}
