import { useEffect, useState } from "react";

export default function WordByWordTyping({ sentence }) {
  const words = sentence.split(" ");
  const [displayedWords, setDisplayedWords] = useState([]);
  const speed = 40;
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedWords((prev) => [...prev, words[index]]);
      index++;
      if (index === words.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <span>{displayedWords.join(" ")}</span>;
}
