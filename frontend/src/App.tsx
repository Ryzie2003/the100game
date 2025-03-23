import { useState, useRef, useEffect } from 'react';
import './App.css';
import FlipCard from './components/FlipCard';

// geography, entertainment, sports, history, science + nature, miscellaneous
const dailyTopic = "Most Streamed Songs on Spotify";

interface Song {
  song_title: string;
  streams: number;
  song_and_artist: string;
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
  const [dataSet, setDataSet] = useState<Song[]>([]);
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
  const maxAttempts = 5;
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

  useEffect(() => {
    // Fetch population data from the Flask API
    fetch('http://localhost:8040/api/songs')
      .then((response) => response.json())
      .then((data) => {setDataSet(data)})  // Store the data in the `countries` state
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
      (item) => normalize(item.song_title) === trimmedGuess
    );
    const points = index !== -1 ? index + 1 : 0;

    // 4) Update guesses, score, attempts
    setGuesses([...guesses, { name: guess, points, index }]);
    if (points) {
      setScore(score + points);

      // triggering flip animation
      setPendingFlip((prev) => ({ ...prev, [index]: true }));
    } else {
      setMessage(`"${guess}" is not in the Top 100. 0 points.`);

      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
    }
    setAttempts(attempts + 1);
    setGuess('');
  };

  useEffect(() => {
    if (guesses.length > 0) {
      const lastGuess = guesses[guesses.length - 1];
      const startIndex = Math.floor(lastGuess.index / 10) * 10;
      if (lastGuess.index !== -1 && listRef.current) {
        const scrollPosition = startIndex * itemHeight;
        listRef.current.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      }
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
    <div className="flex flex-col justify-center items-center h-screen text-center">
      <h1 className='text-[3.5em] mb-[-5px] font-bold'>The 100 Game</h1>
      <p className='text-lg mb-4'>Topic: {dailyTopic}</p>
      <p>Guess songs in the Top 100 - closer to 100th song is better!</p>
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
              <strong>Gameplay:</strong> You have 5 attempts. When items are revealed, hover over them for additional details.
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
      <div className= "relative w-64 h-100 border rounded mt-1 overflow-y-auto hide-scrollbar" ref={listRef}>
        <ul className= "h-[full] relative" >
          {dataSet.map((name, index) => {
            console.log(name);
            const isGuessed = guesses.some((g) => g.index === index);
            const isRevealed = isGuessed || (revealAnswers && revealed[index]);
            return (
              <FlipCard
                key={index}
                index={index}
                song={name}
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
      {attempts < maxAttempts ? <p className='text-xl font-bold mb-5'>Total Points: {score}</p> : " " }
      {attempts < maxAttempts ? (
        <>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
            className={`border-2 p-2 text-xl rounded mt-3 ${shakeInput ? "shake border-red-500" : "border-black"}`}
            placeholder="Enter song name"
          />
          <button onClick={handleGuess} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Guess</button>
        </>
      ) : (
        <>
        <h2 className="text-2xl mt-4">Game Over! Final Score: {score}</h2>
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={handleRevealAnswers}
            className="w-35 h-11 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            {revealAnswers ? 'Hide Answers' : 'Reveal Answers' }
          </button>
          <button
            onClick={handleCopyScore}
            className="w-35 h-11 bg-green-600 text-white rounded hover:bg-green-500"
          >
            Share Score
          </button>
        </div>
      </>
      )}

          {/* ATTEMPTS INDICATOR */}
          {attempts < maxAttempts && 
           <div className="flex flex-row-reverse gap-2 mt-8">
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

