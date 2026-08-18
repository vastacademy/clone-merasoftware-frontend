import React from 'react';
import { motion } from 'framer-motion';

const pageEase = [0.22, 1, 0.36, 1];

export const PageTransition = ({ children, pageKey }) => (
  <motion.div
    key={pageKey}
    initial={{ opacity: 0, y: 18, scale: 0.992 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.48, ease: pageEase }}
    className="min-h-full will-change-transform"
  >
    {children}
  </motion.div>
);

export const AnimatedSection = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.56, delay, ease: pageEase }}
    className={className}
  >
    {children}
  </motion.div>
);

export const getStaggerDelay = (index, step = 0.08) => index * step;
