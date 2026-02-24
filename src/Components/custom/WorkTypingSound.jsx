import { useEffect, useState } from "react";

export default function WorkTypingSound({ sentence, speed }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < sentence.length) {
        setDisplayedText((prev) => prev + sentence.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [sentence, speed]);

  const cursorStyle = {
    display: "inline-block",
    marginLeft: "2px",
    animation: "blink 1s step-start infinite",
    visibility: isTyping ? "visible" : "hidden",
  };

  const containerStyle = {
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    whiteSpace: "pre-wrap",
  };

  return (
    <span style={containerStyle}>
      {displayedText}
      <span style={cursorStyle}>|</span>
    </span>
  );
}
