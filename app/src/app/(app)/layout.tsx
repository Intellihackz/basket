import NavBar from "@/components/NavBar";
import KineticGrid from "@/components/ui/kinetic-grid";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <KineticGrid />
      <div className="relative z-10 flex flex-1 flex-col">
        <NavBar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
