import React, { useState, useEffect } from "react";

const AnimatedNumber = ({ index, value, data }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(String(value).replace(/,/g, "")) || 0;
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

  const formatted = `${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(display / 10000000)} Cr`;

  return (
    <div>
      {index >= data.length - 1 ? formatted : display?.toLocaleString("en-IN")}
    </div>
  );
};

export default AnimatedNumber;
