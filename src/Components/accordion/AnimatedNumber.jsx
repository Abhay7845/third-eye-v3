import React, { useState, useEffect } from "react";

const AnimatedNumber = ({ index, value, data }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let target = parseInt(value, 10);
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));

    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setDisplay(current);
    }, 20);

    return () => clearInterval(interval);
  }, [value]);

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(display);

  return (
    <div>
      {index >= data.length - 2 ? formatted : display.toLocaleString("en-IN")}
    </div>
  );
};

export default AnimatedNumber;
