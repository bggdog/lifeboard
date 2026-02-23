'use client';

import React from 'react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

interface AnimateStaggerProps {
  children: React.ReactNode;
  className?: string;
}

export default function AnimateStagger({ children, className = '' }: AnimateStaggerProps) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {items.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
