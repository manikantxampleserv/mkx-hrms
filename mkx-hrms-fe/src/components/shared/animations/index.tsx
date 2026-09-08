import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { forwardRef } from "react";

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const StaggerContainer = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      {...props}
    >
      {children}
    </motion.div>
  ),
);
StaggerContainer.displayName = "StaggerContainer";

export const FadeUpItem = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => (
    <motion.div ref={ref} variants={fadeUpVariants} {...props}>
      {children}
    </motion.div>
  ),
);
FadeUpItem.displayName = "FadeUpItem";
