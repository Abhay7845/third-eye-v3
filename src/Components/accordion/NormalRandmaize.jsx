import React, { useState, useEffect } from "react";

const NormalRandmaize = ({ value }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let target = parseFloat(value);
    let current = 0;
    const step = Math.max(0.1, target / 10);

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

  return <div>{display.toFixed(2)} %</div>;
};

export default NormalRandmaize;
