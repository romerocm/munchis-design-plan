import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full bg-forest rounded-2xl py-12 px-12 flex flex-col items-center gap-3">
      <Image
        src="/images/logo-wordmark-white.svg"
        alt="munchis"
        width={455}
        height={100}
        className="opacity-90 mb-2"
      />
      <p className="text-sm" style={{ color: "#E1CDE4" }}>One flavor. Handmade. Every Sunday.</p>
      <div className="flex gap-5 items-center pt-2">
        {([
          ["instagram", "https://instagram.com/eatmunchis"],
          ["youtube", "https://youtube.com/@eatmunchis"],
          ["tiktok", "https://tiktok.com/@eatmunchis"],
          ["facebook", "https://facebook.com/eatmunchis"],
        ] as const).map(([name, url]) => (
          <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-80 transition-opacity">
            <Image src={`/icons/${name}.svg`} alt={name} width={20} height={20} className="invert" />
          </a>
        ))}
      </div>
      <p className="text-[11px] text-white/15 pt-3">© 2026 munchis · San Salvador, El Salvador</p>
    </footer>
  );
}
