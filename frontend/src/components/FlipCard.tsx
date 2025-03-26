import { useState, useEffect, useRef } from 'react';


interface TopicOfTheDay {
  name: string;
  count: string;
}

interface FlipCardProps {
  index: number;
  topicOfTheDay: TopicOfTheDay;
  isGuessed: boolean;
  isRevealed: boolean;
  itemHeight: number;
  pendingFlip: boolean;
  setPendingFlip: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  flipping: boolean;
  setFlipping: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
}


function useInView(options: IntersectionObserverInit): [React.RefObject<HTMLLIElement | null>, boolean] {
  const ref = useRef<HTMLLIElement | null>(null);
  const [inView, setInView] = useState<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return [ref, inView];
}



export default function FlipCard(props: FlipCardProps) {
    
    const { index, topicOfTheDay, isGuessed, isRevealed, itemHeight, pendingFlip, setPendingFlip, flipping, setFlipping } = props;

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
        className={`text-lg font-semibold flex flex-col justify-center items-center relative w-[90%] border border-black border-double border-2 rounded mt-1.5 mb-1.5 ${
          isRevealed ? (isGuessed ? 'bg-green-400 font-bold' : 'bg-[#FCFCF4]') : 'bg-[#FCFCF4]'
        }`}
      >
        {isRevealed ? (
          <div className="flip-card w-full h-full">
            <div className={`flip-card-inner w-full h-full ${flipping ? 'flipped' : ''}`}>
              <div className={`flip-card-front ${
                topicOfTheDay.name.length > 20 ? 'text-sm' : 'text-[0.85em]'
              }`}>
                {`${index + 1}. ${topicOfTheDay.name}`}
              </div>
              <div className="flip-card-back text-[0.85em]">
                {`Pop.: ${topicOfTheDay.count}`}
              </div>
            </div>
          </div>
        ) : (
          `${index + 1}`
        )}
      </li>
    );
  }
  