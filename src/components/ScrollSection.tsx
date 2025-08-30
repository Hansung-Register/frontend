import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import ImageList, { type ImageSpec } from "./ImageList";

interface ScrollSectionProps {
  title: string;
  description: string;
  images: ImageSpec[];
  setContainerRef?: (el: HTMLDivElement | null) => void;
}

const ScrollSection: React.FC<ScrollSectionProps> = ({ title, description, images, setContainerRef }) => {
  const { ref: inViewRef, inView } = useInView({ threshold: 0.9 });

  return (
    <div
      ref={(el) => {
        inViewRef(el);
        if (setContainerRef) setContainerRef(el);
      }}
      style={{
        height: "100vh",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        padding: "24px 16px",
      }}
    >
      <motion.span
        initial={{ opacity: 0.1 }}
        animate={inView ? { opacity: 1 } : { opacity: 0.1 }}
        transition={{ duration: 0.6 }}
        style={{
          fontSize: "2.2rem",
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        {title}
      </motion.span>
      <motion.p
        initial={{ opacity: 0.1 }}
        animate={inView ? { opacity: 1 } : { opacity: 0.1 }}
        transition={{ duration: 0.6 }}
        style={{
          fontSize: "1.15rem",
          color: "#475569",
          textAlign: "center",
          maxWidth: 720,
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        {description}
      </motion.p>
      <ImageList images={images} title={title} />
    </div>
  );
};

export default ScrollSection;
