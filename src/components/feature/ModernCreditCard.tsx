
import { motion } from 'framer-motion';
import RiIcon from '../ui/RiIcon';

export type CardStyle = 'luxury' | 'digital' | 'lifestyle';

interface ModernCreditCardProps {
  name: string;
  number: string;
  holder: string;
  expiry: string;
  balance?: number;
  limit?: number;
  isFrozen?: boolean;
  style?: CardStyle;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function getCardStyle(name: string): CardStyle {
  const n = name.toLowerCase();
  if (n.includes('gold') || n.includes('platinum') || n.includes('black') || n.includes('onyx')) return 'luxury';
  if (n.includes('digital') || n.includes('tech') || n.includes('cyber') || n.includes('virtual')) return 'digital';
  if (n.includes('life') || n.includes('green') || n.includes('travel') || n.includes('eco')) return 'lifestyle';
  return 'luxury'; // Default
}

export default function ModernCreditCard({
  name,
  number,
  holder,
  expiry,
  isFrozen = false,
  style = 'luxury',
  className = '',
  onClick,
  selected = false,
}: ModernCreditCardProps) {
  // Style configurations
  const styles = {
    luxury: {
      container: "bg-neutral-900 border-white/10",
      gradient: "from-neutral-900 via-neutral-800 to-black",
      blob1: "bg-primary/20 top-[-20%] right-[-10%] w-[60%] h-[60%]",
      blob2: "bg-amber-600/10 bottom-[-10%] left-[-10%] w-[50%] h-[50%]",
      blob3: "bg-yellow-500/10 top-[40%] left-[30%] w-[30%] h-[30%]",
      text: "text-white",
      label: "text-primary",
      chip: "from-yellow-200 to-yellow-500",
      border: "group-hover:border-primary/50",
    },
    digital: {
      container: "bg-slate-900 border-white/10",
      gradient: "from-blue-900 via-indigo-900 to-slate-900",
      blob1: "bg-cyan-500/20 top-[-20%] left-[-10%] w-[60%] h-[60%]",
      blob2: "bg-purple-500/20 bottom-[-20%] right-[-10%] w-[60%] h-[60%]",
      blob3: "bg-blue-400/10 top-[30%] right-[20%] w-[40%] h-[40%]",
      text: "text-white",
      label: "text-cyan-300",
      chip: "from-cyan-200 to-blue-500",
      border: "group-hover:border-cyan-500/50",
    },
    lifestyle: {
      container: "bg-teal-950 border-white/10",
      gradient: "from-emerald-900 via-teal-900 to-cyan-950",
      blob1: "bg-emerald-400/20 top-[-10%] right-[-20%] w-[70%] h-[70%]",
      blob2: "bg-teal-400/10 bottom-[-10%] left-[-10%] w-[50%] h-[50%]",
      blob3: "bg-lime-300/10 top-[20%] left-[10%] w-[30%] h-[30%]",
      text: "text-white",
      label: "text-emerald-300",
      chip: "from-emerald-200 to-teal-500",
      border: "group-hover:border-emerald-500/50",
    }
  };
  const currentStyle = styles[style];

  const formatCardNumber = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    if (cleanNum.length === 16) {
      // "shorten it by removint the first 8 numbers and replace with 4 asteriks"
      // Assuming intent is: **** **** **** 1234  OR  **** 1234 5678 (User's prompt is a bit specific: "first 8 numbers ... 4 asteriks")
      // Let's assume standard masking for safety unless specifically forced otherwise:
      // Prompt: "removint the first 8 numbers and replace with 4 asteriks" -> Remove 8 digits. Add 4 asterisks.
      // Input: 1234567890123456 (16)
      // Remove first 8: 90123456 (8 remain)
      // Prepend 4 asterisks: **** 90123456
      // Let's format nicely: **** 9012 3456
      const last8 = cleanNum.slice(8);
      return `**** ${last8.slice(0, 4)} ${last8.slice(4)}`;
    }
    return num;
  };

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer transition-all duration-300 transform ${
        selected ? 'scale-100 ring-1 ring-offset-2 rounded-xl ring-offset-white ring-primary/50' : 'hover:scale-[1.02]'
      } ${className}`}
    >
      {/* Glassmorphism Card Container */}
      <div className={`relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden border backdrop-blur-xl shadow-2xl transition-colors duration-300 ${currentStyle.container} ${currentStyle.border}`}>
        
        {/* Animated Gradient Background */}
        <div className={`absolute inset-0 bg-linear-to-br ${currentStyle.gradient} opacity-90`} />

        {/* Blurred Gradient Blobs */}
        <div className={`absolute rounded-full blur-[60px] pointer-events-none mix-blend-screen ${currentStyle.blob1}`} />
        <div className={`absolute rounded-full blur-[50px] pointer-events-none mix-blend-screen ${currentStyle.blob2}`} />
        <div className={`absolute rounded-full blur-2xl pointer-events-none mix-blend-overlay ${currentStyle.blob3}`} />

        {/* Noise Texture Overlay (Optional for realism) */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

        {/* Shine/Reflection Effect */}
        <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* Content Layer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 h-full p-4 md:p-6 flex flex-col justify-between"
        >
          {/* Top Row: Logo & Contactless */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase tracking-[0.2em] opacity-70 ${currentStyle.text}`}>{name}</span>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <RiIcon className={`ri-rfid-line text-2xl opacity-60 ${currentStyle.text}`} />
            </motion.div>
          </div>

          {/* Middle Row: Chip & Number */}
          <motion.div
            className="space-y-3 md:space-y-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="font-mono text-lg md:text-2xl tracking-[0.15em] drop-shadow-md text-white/90 truncate">
              {formatCardNumber(number)}
            </div>
          </motion.div>

          {/* Bottom Row: Holder & Expiry */}
          <motion.div
            className="flex justify-between items-end"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div>
              <div className={`text-[8px] md:text-[9px] uppercase tracking-wider mb-1 opacity-70 ${currentStyle.label}`}>Card Holder</div>
              <div className={`font-medium tracking-wide uppercase text-xs md:text-sm ${currentStyle.text}`}>{holder}</div>
            </div>
            <div className="text-right">
              <div className={`text-[8px] md:text-[9px] uppercase tracking-wider mb-1 opacity-70 ${currentStyle.label}`}>Expires</div>
              <div className={`font-medium tracking-wide font-mono text-xs md:text-sm ${currentStyle.text}`}>{expiry}</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Frozen Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-white">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-2 border border-red-500/50">
              <RiIcon className="ri-lock-fill text-2xl text-red-500" />
            </div>
            <span className="font-bold tracking-widest uppercase text-sm">Card Frozen</span>
          </div>
        )}
      </div>
    </div>
  );
}
