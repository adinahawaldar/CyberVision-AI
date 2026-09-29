import React from "react";
import { motion } from "framer-motion";

export const AnimatedText = React.forwardRef(
  ({ text, textClassName = "", className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        className={className}
        {...props}
      >
        <motion.h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            textAlign: 'center',
            margin: 0,
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, #f1f0fa 0%, #a78bfa 50%, #f1f0fa 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          className={textClassName}
          initial={{ y: -16, opacity: 0, backgroundPosition: '0% center' }}
          animate={{ y: 0, opacity: 1, backgroundPosition: '200% center' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], backgroundPosition: { duration: 3, repeat: Infinity, repeatType: 'reverse', ease: 'linear' } }}
        >
          {text}
        </motion.h1>
      </div>
    );
  }
);

AnimatedText.displayName = "AnimatedText";
