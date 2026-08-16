import Image from "next/image";

export function EgsLogoHeader() {
  return (
    <div className="mb-6 flex justify-center">
      <Image src="/brand/egs-logo-horizontal.png" alt="EGS Marketing Solutions" width={200} height={58} className="h-auto w-40" priority />
    </div>
  );
}
