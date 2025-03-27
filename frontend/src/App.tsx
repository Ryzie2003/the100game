import { useState, useRef, useEffect } from 'react';
import './App.css';
import FlipCard from './components/FlipCard';
import ReactGA from "react-ga4";
import { Info } from 'lucide-react';

// geography, entertainment, sports, history, science + nature, miscellaneous

interface TopicOfTheDay {
  name: string;
  count: string;
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
  const [dataSet, setDataSet] = useState<TopicOfTheDay[]>([]);
  const [dailyTopic, setDailyTopic] = useState<string>("Most Populated Countries");
  
  
  const [archiveTopics] = useState<string[]>([
    "Highest Grossing Films - All Time",
    "Most Popular Girl Names",
    "Most Streamed Songs on Spotify - All Time"
  ]);

  // State for showing the archive modal
  const [showArchive, setShowArchive] = useState<boolean>(false);
  
  // Controls whether the reveal animation has been triggered
  const [revealAnswers, setRevealAnswers] = useState<boolean>(false);
  // An array to track which country indexes have been revealed
  const [revealed, setRevealed] = useState<boolean[]>([]);

  // user feedback
  const [message, setMessage] = useState<string>('');

  // instructions modal
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  
  // initial flip after user guesses correctly
  const [flipping, setFlipping] = useState<Record<number, boolean>>({});
  const [pendingFlip, setPendingFlip] = useState<Record<number, boolean>>({});

  const [shakeInput, setShakeInput] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);
  // New state for countdown timer
  const [countdown, setCountdown] = useState<string>('');
  const maxAttempts = 6;
  const itemHeight = 48;

  const revealDelay = 100;

  const gameOver = attempts >= maxAttempts;

  useEffect(() => {
    ReactGA.initialize("G-Z30NM4H9VP");

    ReactGA.send({ hitType: "pageview", page: "/main-page", title: "Main Page" });
  }, [])

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
    fetch('https://the-100-backend-009dc87480ee.herokuapp.com/api/top-countries')
      .then((response) => response.json())
      .then((data) => {setDataSet(data)})  // Store the data in the `countries` state
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

 

  function normalize(str: string) {
    return str
      .toLowerCase()
      .replace(/[^\w\s]|_/g, "") // remove punctuation and underscores
      .replace(/\s+/g, "")      // collapse multiple spaces
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
        setMessage(`Great guess! +${points} points.`);
      } else {
        setMessage(`+${points} points`)
      }
    } else {
      setMessage(`"${guess}" is not in the Top 100. 0 points.`);

      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
    }
    setAttempts(attempts + 1);
    setGuess('');
  };

   // Countdown timer update: calculates time until next 7am
    useEffect(() => {
      const updateCountdown = () => {
        const now = new Date();
        const next7am = new Date();
        next7am.setHours(7, 0, 0, 0);
        // If it's already past 7am today, target tomorrow at 7am
        if (now >= next7am) {
          next7am.setDate(next7am.getDate() + 1);
        }
        const diff = next7am.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(
          `${hours.toString().padStart(2, '0')}:` +
          `${minutes.toString().padStart(2, '0')}:` +
          `${seconds.toString().padStart(2, '0')}`
        );
      };
      
      const interval = setInterval(updateCountdown, 1000);
      updateCountdown();
      return () => clearInterval(interval);
    }, []);


  useEffect(() => {
    if (guesses.length > 0 && listRef.current) {
      const lastGuess = guesses[guesses.length - 1];
      const itemPosition = lastGuess.index * 60;
      const listEl = listRef.current;
      
      if (lastGuess.points == 0) {
        return;
      }
      // The max scroll offset for the container
      const maxScroll = listEl.scrollHeight - listEl.clientHeight;
  
      // To center the item: subtract half the container height
      // and add half the item height (so the item itself is centered)
      const desiredCenter = itemPosition - listEl.clientHeight / 2 + 60 / 2;
  
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
    // Extract rankings for only valid guesses (where points > 0)
    const allGuesses = guesses
      .filter(g => g.points >= 0)
      .map(g => `#${g.points}`);
  
    const shareMessage = `The 100 Game: I scored ${score} points in ${dailyTopic}!
  My guesses: ${allGuesses.join(', ')}
  Can you beat my score? Check it out: ${window.location.href}`;
  
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

  const handleSelectTopic = (topic: string) => {
    setDailyTopic(topic);
    setAttempts(0);
    setScore(0);
    setGuesses([]);
    setRevealAnswers(false);
    setRevealed([]);
    setShowArchive(false);
  };
  

  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center">
      <h1 className='text-[2.5em] mt-[-0.5em] md:text-[3em] xs:mt-5 font-bold'>The 100 Game</h1>
      <p className='text-lg mb-1 md:mb-2'><p className='text-blue-500 inline font-bold'>{showArchive ? 'Archived Topic' : "Today's Topic"}</p>: {dailyTopic}</p>
      <p className='mb-2'> Guess the Top 100 - the closer you are to #100, the better!</p>
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
          {message}
        </div>
      )}
      {/* How to Play Button */}
      <button
        onClick={() => setShowInstructions(true)}
        className="px-3 py-2 bg-[#EBE2D2] text-black border bg-opacity-50 cursor-pointer rounded flex items-center justify-center hover:bg-[#f3eee4]"
        title="How to Play"
      >
        <Info size={18} className='mr-1'/> How to Play
      </button>
      {/* Archive Button */}
      <p
        onClick={() => setShowArchive(true)}
        className="fixed bottom-4 left-4 text-gray-600 text-lg flex items-center justify-center cursor-pointer hover:text-black"
        title="Archive"
      >
        {/* Archive */}
      </p>
      {/* Archive Modal */}
      {showArchive && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Select an Archived Topic</h2>
            <ul>
              {archiveTopics.map((topic, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleSelectTopic(topic)}
                    className="w-full text-left p-2 hover:bg-gray-200 rounded"
                  >
                    {topic}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowArchive(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
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
      <div className="flex flex-col md:flex-row md:gap-8 md:mt-3 lg:gap-14 lg:mt-6">
      <div className= "relative min-w-[250px] w-66 h-75 md:h-100 border rounded mt-1 overflow-y-auto hide-scrollbar" ref={listRef}>
        <ul className= "h-[full] relative flex flex-col justify-center items-center bg-[#FCFCF4]" >
          {dataSet.map((name, index) => {
            console.log(name);
            const isGuessed = guesses.some((g) => g.index === index);
            const isRevealed = isGuessed || (revealAnswers && revealed[index]);
            return (
              <FlipCard
                key={index}
                index={index}
                topicOfTheDay={name}
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
      {attempts < maxAttempts && (
        <div className='flex flex-row gap-1 md:flex-col md:gap-3'>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
            className={`max-w-[160px] bg-white border-2 p-2 text-lg rounded ${shakeInput ? "shake border-red-500" : "border-black"} md:max-w-[200px]`}
            placeholder="Enter name"
          />
          <button onClick={handleGuess} className="px-4 py-2 bg-black font-semibold text-white rounded md:px-6">Guess</button>
        </div>
      ) }
       {gameOver && (
            <div className='flex flex-col items-center justify-center p-4 border-t mt-4'>
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Final Score: {score}</p>
              {/* New Countdown Timer Section */}
              <div className="mb-4">
                <p className="text-lg">Next game starts in:</p>
                <p className="text-2xl font-mono">{countdown}</p>
              </div>
              <div className="flex flex-col gap-y-3">
                <button
                  onClick={handleRevealAnswers}
                  className="w-36 h-11 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                  {revealAnswers ? 'Hide Answers' : 'Reveal Answers'}
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
                  className={`w-5 h-5 rounded-full ${
                    usedAttempt
                      ? 'bg-white'
                      : 'border-blue-400 bg-blue-400 border-2'
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

