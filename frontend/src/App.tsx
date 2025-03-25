import { useState, useRef, useEffect } from 'react';
import './App.css';
import FlipCard from './components/FlipCard';

// geography, entertainment, sports, history, science + nature, miscellaneous
const dailyTopic = "Most Common Girl Names - U.S.";

interface GirlNames {
  name: string;
  count: number;
}

interface Guess {
  name: string;
  points: number;
  index: number;
}


function App() {
  const [guess, setGuess] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [dataSet, setDataSet] = useState<GirlNames[]>([]);
  // Controls whether the reveal animation has been triggered
  const [revealAnswers, setRevealAnswers] = useState<boolean>(false);
  // An array to track which country indexes have been revealed
  const [revealed, setRevealed] = useState<boolean[]>([]);

  // user feedback
  const [message, setMessage] = useState<string>('');

  // instructions modal
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  
  // initial flip after user guesses correctly
  const [flipping, setFlipping] = useState<Record<number, boolean>>({});
  const [pendingFlip, setPendingFlip] = useState<Record<number, boolean>>({});

  const [shakeInput, setShakeInput] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);
  const maxAttempts = 6;
  const itemHeight = 40;

  const revealDelay = 100;

  // message stays for 2 second
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  //https://the-100-backend-009dc87480ee.herokuapp.com/api/female-names
  useEffect(() => {
    // Fetch population data from the Flask API
    fetch('https://the-100-backend-009dc87480ee.herokuapp.com/api/female-names')
      .then((response) => response.json())
      .then((data) => {console.log(data);setDataSet(data)})  // Store the data in the `countries` state
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

 

  function normalize(str: string) {
    return str
      .toLowerCase()
      .replace(/[^\w\s]|_/g, "") // remove punctuation and underscores
      .replace(/\s+/g, " ")      // collapse multiple spaces
      .trim();
  }
  

  const handleGuess = () => {
    if (attempts >= maxAttempts) return;
    const trimmedGuess = normalize(guess);

    // 1) Prevent empty or whitespace-only guesses
    if (!trimmedGuess) {
      setMessage("Please enter a valid song name.");
      return;
    }

    // 2) Prevent duplicate guesses
    const alreadyGuessed = guesses.some(
      (g) => g.name.toLowerCase() === trimmedGuess
    );
    if (alreadyGuessed) {
      setMessage(`${guess} already guessed!`);
      return; // Do not increment attempts or add guess
    }

    // 3) Check if guess is in data set
    const index = dataSet.findIndex(
      (item) => normalize(item.name) === trimmedGuess
    );
    const points = index !== -1 ? index + 1 : 0;

    // 4) Update guesses, score, attempts
    setGuesses([...guesses, { name: guess, points, index }]);
    if (points) {
      setScore(score + points);

      // triggering flip animation
      setPendingFlip((prev) => ({ ...prev, [index]: true }));

      if (points > 60) {
        setMessage('Great guess!');
      }
    } else {
      setMessage(`"${guess}" is not in the Top 100. 0 points.`);

      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
    }
    setAttempts(attempts + 1);
    setGuess('');
  };

  useEffect(() => {
    if (guesses.length > 0 && listRef.current) {
      const lastGuess = guesses[guesses.length - 1];
      const itemPosition = lastGuess.index * itemHeight;
      const listEl = listRef.current;
      
      if (lastGuess.points == 0) {
        return;
      }
      // The max scroll offset for the container
      const maxScroll = listEl.scrollHeight - listEl.clientHeight;
  
      // To center the item: subtract half the container height
      // and add half the item height (so the item itself is centered)
      const desiredCenter = itemPosition - listEl.clientHeight / 2 + itemHeight / 2;
  
      // Clamp so we don't scroll beyond the top or bottom
      const clamped = Math.min(Math.max(desiredCenter, 0), maxScroll);
  
      listEl.scrollTo({ top: clamped, behavior: 'smooth' });
    }
  }, [guesses]);

  const handleRevealAnswers = () => {
    setRevealAnswers(prev => !prev);
    for (let i = 100; i >= 0; i--) {
      setTimeout(() => {
        setRevealed((prev) => {
          const updated = [...prev];
          updated[i] = true;
          return updated;
        });
      }, revealDelay * (10 - i));
    }
  };


  const handleCopyScore = () => {
    const shareMessage = `Play The 100 Game! I scored ${score} points in The 100 Game: ${dailyTopic}! Check it out at ${window.location.href}. Can you beat my score?`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareMessage)
        .then(() => {
          setMessage("Score copied to clipboard!");
        })
        .catch((err) => {
          console.error("Error copying score to clipboard:", err);
          setMessage("Failed to copy score.");
        });
    } else {
      setMessage("Clipboard not supported in this browser.");
    }
  };
  

  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center">
      <h1 className='text-[3.5em] mt-[-0.5em] xs:mt-5 font-bold'>The 100 Game</h1>
      <p className='text-lg mb-2 md:mb-4'><p className='text-blue-500 inline font-bold'>Today's Topic</p>: {dailyTopic}</p>
      <p className='mb-6'>Guess the Top 100 - the closer you are to #100, the better!</p>
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
          {message}
        </div>
      )}
      {/* How to Play Button */}
      <button
        onClick={() => setShowInstructions(true)}
        className="fixed bottom-4 right-4 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600"
        title="How to Play"
      >
        ?
      </button>
       {/* Instructions Modal */}
       {showInstructions && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">How to Play</h2>
            <p className="text-left">
              <strong>Objective:</strong> Total the most points by guessing items in the top 100 list.
            </p>
            <p className="mt-2 text-left">
              <strong>Scoring:</strong> Points are based on the ranking of your correct guess. Higher ranks earn more points (i.e. rank 99 earns 99 points). 
              
              <em> If your guess is invalid or not in the top 100, you get 0 points.</em>
            </p>
            <p className="mt-2 text-left">
              <strong>Gameplay:</strong> You have 6 attempts. When items are revealed, hover over them for additional details.
            </p>

            <button
              onClick={() => setShowInstructions(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:gap-8 md:mt-5 lg:gap-14 lg:mt-8">
      <div className= "relative min-w-[250px] w-66 h-80 md:h-100 border rounded mt-1 overflow-y-auto hide-scrollbar" ref={listRef}>
        <ul className= "h-[full] relative" >
          {dataSet.map((name, index) => {
            console.log(name);
            const isGuessed = guesses.some((g) => g.index === index);
            const isRevealed = isGuessed || (revealAnswers && revealed[index]);
            return (
              <FlipCard
                key={index}
                index={index}
                girlNames={name}
                isGuessed={isGuessed}
                isRevealed={isRevealed}
                itemHeight={itemHeight}
                pendingFlip={pendingFlip[index]}
                setPendingFlip={setPendingFlip}
                flipping={flipping[index]}
                setFlipping={setFlipping}
              />    
              )})}
        </ul>
      </div>
      <div className="md:w-1/2 lg:w-2/5 flex flex-col items-center justify-center">
      {attempts < maxAttempts ? 
      <div className="flex flex-col justify-center items-center">
        <p className='text-[1.1em] font-light mt-2'>Total Points</p>
        <p className='text-4xl font-bold mb-2 md:mb-4 lg:mb-7'>{score}</p> 
      </div>
      : " " }
      {attempts < maxAttempts ? (
        <>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
            className={`max-w-[200px] bg-white border-2 p-2 text-lg rounded md:mt-3 ${shakeInput ? "shake border-red-500" : "border-black"}`}
            placeholder="Enter name"
          />
          <button onClick={handleGuess} className="mt-4 px-8 py-2 bg-black font-semibold text-white rounded">Guess</button>
        </>
      ) : (
        <div className='flex flex-col items-center justify-center'>
        {/* <h2 className="text-2xl">Game Over! Final Score: {score}</h2> */}
        <div className="flex flex-col items-center justify-center min-h-[40px] mt-2 mb-[-0.2em]">
          <h2 className="text-xl">Game Over! Final Score: {score}</h2>
        </div>

        <div className="flex flex-col gap-y-3 mt-6">
          <button
            onClick={handleRevealAnswers}
            className="w-36 h-11 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            {revealAnswers ? 'Hide Answers' : 'Reveal Answers' }
          </button>
          <button
            onClick={handleCopyScore}
            className="w-36 h-11 bg-green-600 text-white rounded hover:bg-green-500"
          >
            Share Score
          </button>
        </div>
      </div>
      )}

          {/* ATTEMPTS INDICATOR */}
          {attempts < maxAttempts && 
           <div className="flex flex-row-reverse gap-2 mt-3 md:mt-8">
            {Array.from({ length: maxAttempts }).map((_, idx) => {
              // If idx < attempts, that means the rightmost circles get filled first
              const usedAttempt = idx < attempts;
              return (
                <div
                  key={idx}
                  className={`w-5 h-5 rounded-full border-2 ${
                    usedAttempt
                      ? 'border-gray-300 bg-gray-200'
                      : 'border-green-500 bg-green-500'
                  }`}
                ></div>
              );
            })}
          </div>}
        </div>
      </div>
    </div>
  );
}

export default App;

