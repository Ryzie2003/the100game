import { useState, useEffect, useRef } from 'react';

function useInView(options) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return [ref, inView];
}



export default function FlipCard({
    index,
    song,
    isGuessed,
    isRevealed,
    itemHeight,
    pendingFlip,
    setPendingFlip,
    flipping,
    setFlipping,
  }) {
    // Use the custom hook with a threshold to detect when the card is at least half visible.
    const [cardRef, inView] = useInView({ threshold: 0.5 });
  
    useEffect(() => {
        if (pendingFlip && inView) {
          // Wait 1 second after the card is in view before flipping
          const timer = setTimeout(() => {
            setFlipping((prev) => ({ ...prev, [index]: true }));
            setPendingFlip((prev) => {
              const updated = { ...prev };
              delete updated[index];
              return updated;
            });
            // Reset the flip after another second
            const flipTimer = setTimeout(() => {
              setFlipping((prev) => ({ ...prev, [index]: false }));
            }, 1500);
            return () => clearTimeout(flipTimer);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }, [pendingFlip, inView, index, setFlipping, setPendingFlip]);
      
  
    return (
      <li
        ref={cardRef}
        key={index}
        style={{ height: itemHeight }}
        className={`group text-lg p-1.5 relative ${
          isRevealed ? (isGuessed ? 'bg-green-400 font-bold' : 'bg-white') : 'bg-white blurred'
        }`}
      >
        {isRevealed ? (
          <div className="flip-card w-full h-full">
            <div className={`flip-card-inner w-full h-full ${flipping ? 'flipped' : ''}`}>
              <div className="flip-card-front">
                {`${index + 1}. ${song.song_title}`}
              </div>
              <div className="flip-card-back">
                {`Streams: ${song.streams}`}
              </div>
            </div>
          </div>
        ) : (
          `${index + 1}. ???`
        )}
      </li>
    );
  }
  