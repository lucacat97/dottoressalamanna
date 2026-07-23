const WHATSAPP_NUMBER = "393332635804"; // +39 333 263 5804
const DEFAULT_MSG = "Salve Dott.ssa Lamanna, vorrei alcune informazioni.";

const WhatsAppFab = () => {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MSG)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Scrivi su WhatsApp"
      className="fixed bottom-6 right-6 z-50 group flex items-center"
    >
      <span className="relative inline-flex">
        <span className="absolute inset-0 rounded-full bg-[#25D366]/40 blur-md group-hover:bg-[#25D366]/60 transition-all" />
        <span className="relative w-14 h-14 rounded-full bg-[#25D366] shadow-elevated flex items-center justify-center hover:scale-105 transition-transform">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="white" aria-hidden="true">
            <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.383.696 4.61 1.895 6.484L4 29l7.719-1.855A11.94 11.94 0 0 0 16.001 27C22.629 27 28 21.627 28 15S22.629 3 16.001 3zm0 21.6a9.55 9.55 0 0 1-4.87-1.332l-.349-.208-4.579 1.1 1.117-4.462-.227-.36A9.55 9.55 0 0 1 6.4 15c0-5.293 4.308-9.6 9.601-9.6 5.293 0 9.6 4.307 9.6 9.6 0 5.293-4.307 9.6-9.6 9.6zm5.507-7.185c-.302-.151-1.786-.881-2.063-.981-.277-.101-.478-.151-.68.151-.201.302-.78.981-.956 1.183-.176.201-.352.226-.654.075-.302-.151-1.275-.47-2.428-1.498-.898-.801-1.503-1.79-1.679-2.092-.176-.302-.019-.465.132-.616.135-.135.302-.352.453-.528.151-.176.201-.302.302-.503.101-.201.05-.377-.025-.528-.075-.151-.68-1.638-.931-2.243-.245-.588-.494-.509-.68-.518l-.578-.011a1.114 1.114 0 0 0-.805.377c-.277.302-1.057 1.033-1.057 2.52 0 1.487 1.082 2.923 1.233 3.124.151.201 2.129 3.252 5.161 4.562.722.312 1.285.499 1.724.638.724.23 1.383.198 1.905.12.581-.087 1.786-.729 2.04-1.435.252-.706.252-1.31.176-1.435-.075-.126-.276-.201-.578-.352z"/>
          </svg>
        </span>
      </span>
    </a>
  );
};

export default WhatsAppFab;
