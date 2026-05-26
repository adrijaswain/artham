import { Link } from "react-router-dom";

export default function TopAppBar() {
  return (
    <header className="flex justify-between items-center px-md py-sm w-full fixed top-0 z-50 bg-surface border-b border-outline-variant shadow-sm h-16">
      <Link to="/" className="flex items-center gap-sm">
        <span className="font-headline-md text-headline-md font-bold text-primary">
          Treatment Navigator
        </span>
      </Link>
      <div className="flex items-center gap-md">
        <div className="relative flex items-center">
          <select className="appearance-none bg-transparent border-none pr-8 pl-2 py-1 text-label-md font-label-md text-on-surface-variant hover:text-primary cursor-pointer outline-none transition-colors">
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="bn">বাঙালি (Bengali)</option>
          </select>
          <span className="material-symbols-outlined absolute right-1 pointer-events-none text-on-surface-variant text-[20px]">
            language
          </span>
        </div>
        <button className="p-2 rounded-full hover:bg-surface-container-low transition-all">
          <span className="material-symbols-outlined text-primary">notifications</span>
        </button>
        <button className="p-2 rounded-full hover:bg-surface-container-low transition-all">
          <span className="material-symbols-outlined text-primary">account_circle</span>
        </button>
      </div>
    </header>
  );
}
