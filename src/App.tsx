import { useState, useRef, useEffect, useId } from 'react';
import './App.css';
import axios from 'axios';


function App() {
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [dataSet, setDataSet] = useState([]);
  // Controls whether the reveal animation has been triggered
  const [revealAnswers, setRevealAnswers] = useState(false);
  // An array to track which country indexes have been revealed
  const [revealed, setRevealed] = useState<boolean[]>([]);
  // guess history toggle
  const [showHistory, setShowHistory] = useState(false);
  // user feedback
  const [message, setMessage] = useState('');
  const listRef = useRef(null);
  const maxAttempts = 5;
  const itemHeight = 40;

  const revealDelay = 100;

  // message stays for 2 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    // Fetch population data from the Flask API
    fetch('http://localhost:8040/api/population')
      .then((response) => response.json())
      .then((data) => {setDataSet(data)})  // Store the data in the `countries` state
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleGuess = () => {
    if (attempts >= maxAttempts) return;
    const trimmedGuess = guess.trim().toLowerCase();

    // 1) Prevent empty or whitespace-only guesses
    if (!trimmedGuess) {
      setMessage("Please enter a valid country name.");
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
      (item) => item.country.toLowerCase() === trimmedGuess
    );
    const points = index !== -1 ? index + 1 : 0;

    // 4) Update guesses, score, attempts
    setGuesses([...guesses, { name: guess, points, index }]);
    if (points) {
      setScore(score + points);
    } else {
      setMessage(`"${guess}" is not in the Top 100. 0 points.`);
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
    setRevealAnswers(true);
    const revealCount = Math.min(10, dataSet.length);
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


  const handleShareScore = () => {
    // For example, copy the score to clipboard or invoke social sharing
    console.log("Share Score clicked!");
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen text-center">
      <h1 className='text-[3.5em] mb-4 font-bold'>The 100 Game</h1>
      <p className='text-lg'>Topic: Most Populated Countries</p>
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
          {message}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:gap-8 md:mt-8">
      <div className= "relative w-64 h-100 border rounded mt-1 overflow-y-auto hide-scrollbar" ref={listRef}>
        <ul className= "h-[full] relative" >
          {dataSet.map((name, index) => {
            const isGuessed = guesses.some((g) => g.index === index);
            const isRevealed = isGuessed || (revealAnswers && revealed[index]);
            return (
              <li
                key={index}
                style={{ height: itemHeight }}
                className={`group text-lg p-1.5 relative ${
                  isRevealed ? (isGuessed ? 'bg-green-400 font-bold' : 'bg-white') : 'bg-white blurred'
                }`}
              >{isRevealed ? <div className="flip-card w-full h-full">
                <div className="flip-card-inner w-full h-full">
                  <div className="flip-card-front">
                    {`${index + 1}. ${name.country}`}
                  </div>
                  <div className="flip-card-back">
                    {`Population: ${name.population}`}
                  </div>
                </div>
              </div>
                : `${index + 1}. ???`}</li>
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
            className="border-2 p-2 text-xl rounded mt-3"
            placeholder="Enter country"
          />
          <button onClick={handleGuess} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Guess</button>
        </>
      ) : (
        <>
        <h2 className="text-2xl mt-4">Game Over! Final Score: {score}</h2>
        <div className="flex flex-col gap-4 mt-6">
          <button
            onClick={handleRevealAnswers}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Reveal Answers
          </button>
          <button
            onClick={handleShareScore}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
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

