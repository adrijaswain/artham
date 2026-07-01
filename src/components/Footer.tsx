export default function Footer() {
  return (
    <footer className="w-full py-md bg-surface border-t border-outline-variant">
      <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center px-md gap-sm">
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-sm md:mb-0">
          © 2026 Artham. All rights reserved.
        </p>
        <nav className="flex gap-md">
          <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Support</a>
          <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Insurance Partners</a>
        </nav>
      </div>
    </footer>
  );
}
