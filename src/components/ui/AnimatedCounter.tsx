// src/components/ui/AnimatedCounter.tsx
import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedCounterProps {
  to: number;
  prefix?: string;
  postfix?: string;
  className?: string;
  decimals?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  to, 
  prefix = '', 
  postfix = '', 
  className,
  decimals = 0 
}) => {
  const count = useMotionValue(0);
  
  const rounded = useTransform(count, latest => {
    const fixed = latest.toFixed(decimals);
    return `${prefix}${new Intl.NumberFormat('en-IN').format(parseFloat(fixed))}${postfix}`;
  });

  useEffect(() => {
    const controls = animate(count, to, {
      duration: 1.5,
      ease: "easeOut"
    });
    return controls.stop;
  }, [to, count, decimals]);

  return (
    <motion.span className={className}>
      {rounded}
    </motion.span>
  );
};

export default AnimatedCounter;
