import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export type ImageSpec = string | {
  src: string;
  width?: string;
  maxWidth?: string;
  height?: string;
};

interface ImageListProps {
  images: ImageSpec[];
  title: string;
}

const ImageList: React.FC<ImageListProps> = ({ images, title }) => {
  const { ref, inView } = useInView({ threshold: 0.9 });
  const isMulti = images.length > 1;

  return (
    <div ref={ref} style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
      {images.map((item, index) => {
        const isObj = typeof item === 'object';
        const src = typeof item === 'string' ? item : item.src;
        let width = isObj ? (item as any).width as string | undefined : undefined;
        let maxWidth = isObj ? (item as any).maxWidth as string | undefined : undefined;
        const height = isObj ? (item as any).height as string | undefined : undefined;

        // 우선순위: 명시적 지정 > 멀티 동일화 > 파일명 규칙
        if (!width && !maxWidth) {
          if (isMulti) {
            width = "48%";
            maxWidth = "520px";
          } else if (src.endsWith(".gif")) {
            width = "120%";      // 기존 40% -> 120%로 확대
            maxWidth = "1000px"; // 기존 300px -> 1000px로 확대
          } else if (src.endsWith("/register.png") || src.endsWith("register.png")) {
            width = "90%";
            maxWidth = "900px";
          } else if (src.endsWith("/listsPage.png") || src.endsWith("listsPage.png")) {
            width = "68%";
            maxWidth = "680px";
          }else if (/2\.png$|3\.png$|4\.png$/.test(src)) {
            width = "115%";
            maxWidth = "1150px";
          } else {
            width = "75%";
            maxWidth = "700px";
          }
        }

        return (
          <motion.img
            key={index}
            src={src}
            alt={title}
            initial={{ opacity: 0.1 }}
            animate={inView ? { opacity: 1 } : { opacity: 0.1 }}
            transition={{ duration: 0.8 }}
            style={{
              width,
              maxWidth,
              height,
              borderRadius: 20,
              margin: "0 25px",
            }}
          />
        );
      })}
    </div>
  );
};

export default ImageList;
