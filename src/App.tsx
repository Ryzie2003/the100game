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
  const listRef = useRef(null);
  const maxAttempts = 6;
  const itemHeight = 40;

  const revealDelay = 50;

  useEffect(() => {
    // Fetch population data from the Flask API
    fetch('http://localhost:8040/api/population')
      .then((response) => response.json())
      .then((data) => {setDataSet(data)})  // Store the data in the `countries` state
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleGuess = () => {
    if (attempts >= maxAttempts) return;

    const index = dataSet.findIndex(name => name.country.toLowerCase() === guess.toLowerCase());
    let points = index !== -1 ? index + 1 : 0;

    if (index !== -1) {
      setGuesses([...guesses, { name: guess, points, index }]);
      setScore(score + points);
    } else {
      setGuesses([...guesses, { name: guess, points: 0, index: -1 }]);
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
    for (let i = dataSet.length - 1; i >= 0; i--) {
      setTimeout(() => {
        setRevealed((prev) => {
          const updated = [...prev];
          updated[i] = true;
          return updated;
        });
        // Scroll the list to make the current revealed item visible
        if (listRef.current) {
          const scrollPosition = i * itemHeight;
          listRef.current.scrollTo({ top: scrollPosition, behavior: 'smooth' });
        }
      }, revealDelay * (dataSet.length - i));
    }
  };


  const handleShareScore = () => {
    // For example, copy the score to clipboard or invoke social sharing
    console.log("Share Score clicked!");
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen text-center bg-[#EBE2D2]">
      <h1 className='text-5xl mb-4 font-bold'>The 100 Game</h1>
      <p className='text-lg'>Topic: Most Populated Countries</p>
      <div className="flex flex-col md:flex-row md:gap-8 md:mt-8">
      <div className="relative w-64 h-100 overflow-hidden border rounded mt-1" ref={listRef}>
        <ul className= "h-[full] relative" >
          {dataSet.map((name, index) => {
            const isGuessed = guesses.some((g) => g.index === index);
            const isRevealed = isGuessed || (revealAnswers && revealed[index]);
            return (
              <li
                key={index}
                style={{ height: itemHeight }}
                className={`group text-lg p-1.5 relative ${
                  isRevealed ? (isGuessed ? 'bg-green-300 font-bold' : 'bg-white') : 'bg-white blurred'
                }`}
              >{`${index + 1}. ${name.country}`}</li>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

