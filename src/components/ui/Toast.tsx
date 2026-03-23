import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  visible: boolean;
  duration?: number; // ms, default 4000
  onDismiss: () => void;
}

export function Toast({ message, visible, duration = 4000, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9000,
            background: "rgba(15, 15, 35, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 240, 255, 0.2)",
            borderRadius: 12,
            padding: "12px 24px",
            color: "#e0e0ff",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 0 20px rgba(0, 240, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.4)",
            pointerEvents: "none",
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
