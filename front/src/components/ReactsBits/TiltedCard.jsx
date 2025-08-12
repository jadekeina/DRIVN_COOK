import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

export default function FranchiseCard({ title, description, image }) {
  const ref = useRef(null);
  const rotateX = useSpring(0, springValues);
  const rotateY = useSpring(0, springValues);
  const scale = useSpring(1, springValues);

  function handleMouse(e) {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    rotateX.set((-y / rect.height) * 10);
    rotateY.set((x / rect.width) * 10);
  }

  return (
    <motion.div
      ref={ref}
      className="bg-white rounded-2xl shadow-xl overflow-hidden p-6 flex flex-col items-center justify-between text-center transition-all"
      style={{ rotateX, rotateY, scale }}
      onMouseMove={handleMouse}
      onMouseEnter={() => scale.set(1.05)}
      onMouseLeave={() => {
        scale.set(1);
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      <img src={image} alt={title} className="w-24 h-24 mb-4" />
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </motion.div>
  );
}
