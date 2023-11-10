import { useEffect, useState } from "react";
import "./App.css";
import data from "./data.json";

const urlParams = new URLSearchParams(window.location.search);
const DEBUG = !!urlParams.get("debug");

const EMOJI_SETS = Object.keys(data);

const resetTiles = (emojis) => {
  const initialTiles = [
    ...data[emojis],
    ...data[emojis],
    { id: "bomb", content: "🔥", bombed: true },
  ];
  return initialTiles
    .sort((x) => Math.random() - 0.5)
    .map((x, index) => ({ ...x, key: index /* guessed: true */ }));
};

const GAME_STATUS = {
  start: "Start clicking tiles to match pairs!",
  matched: "Wow! You found a pair. Continue playing.",
  bombed: "Boom! You lost all your matched pairs. Continue playing.",
  over: "Game ended! You found all matching tiles. Click to restart.",
  reloading: "reloading",
};

const TIMEOUT = 600;

// let scoreTimeoutId;
function App() {
  const [emojiSet, setEmojiSet] = useState(EMOJI_SETS[0]);
  const [tiles, setTiles] = useState(() => resetTiles(emojiSet));
  const [firstGuess, setFirstGuess] = useState(null);
  const [secondGuess, setSecondGuess] = useState(null);
  const [bombed, setBombed] = useState();
  const [gameStatus, setGameStatus] = useState(GAME_STATUS.start);
  const [totalScore, setTotalScore] = useState(0);
  const [openDropdown, setOpenDropdown] = useState();

  // Reset entire game and game stats
  const resetGame = (newEmojiSet) => {
    setFirstGuess(null);
    setSecondGuess(null);
    setBombed(null);
    setTotalScore(0);
    setTiles(resetTiles(newEmojiSet));
    setGameStatus(GAME_STATUS.start);
  };

  const handleReset = () => {
    setGameStatus(GAME_STATUS.reloading);
  };

  const resetGuesses = () => {
    setFirstGuess(null);
    setSecondGuess(null);
  };

  // reset game on emoji set change
  useEffect(() => {
    setGameStatus(GAME_STATUS.reloading);
  }, [emojiSet]);

  //update tiles based on game status
  useEffect(() => {
    let timeoutId;
    // reset the game with some delay
    if (gameStatus === GAME_STATUS.reloading) {
      timeoutId = setTimeout(() => {
        resetGame(emojiSet);
      }, TIMEOUT * 0.5);
    } else if (gameStatus === GAME_STATUS.bombed) {
      timeoutId = setTimeout(() => {
        setTiles((prevTiles) => {
          return prevTiles.map((x) => ({
            ...x,
            guessed: x.guessed || x.bombed,
            bombed: x.guessed || x.bombed,
          }));
        });
        resetGuesses();
      }, TIMEOUT);
    } else if (gameStatus === GAME_STATUS.over) {
      setTiles((prevTiles) => prevTiles.map((x) => ({ ...x, guessed: true })));
    }
    return () => clearTimeout(timeoutId);
  }, [gameStatus, emojiSet]);

  const handleClick = (guess) => {
    // clicking same tile just ignore
    if (firstGuess?.key === guess.key || secondGuess?.key === guess.key) return;

    // lock clicks when both guesses are different until the guesses are cleared
    if (firstGuess && secondGuess && firstGuess.id !== secondGuess.id) return;

    // bombed and guessed already, ignore
    if (guess.bombed && guess.guessed) {
      return;
    }
    //clicked on bomb first time
    if (guess.bombed) {
      setBombed(true);
      setGameStatus(GAME_STATUS.bombed);
    }
    firstGuess ? setSecondGuess(guess) : setFirstGuess(guess);
  };

  useEffect(() => {
    let timeoutId;
    if (firstGuess && secondGuess) {
      if (firstGuess.id !== secondGuess.id) {
        timeoutId = setTimeout(() => {
          resetGuesses();
        }, TIMEOUT);
      } else {
        timeoutId = setTimeout(() => {
          setTiles((prevTiles) => {
            return prevTiles.map((x) => ({
              ...x,
              guessed: x.guessed || x.id === firstGuess.id,
            }));
          });
          setGameStatus(GAME_STATUS.matched);
          resetGuesses();
        }, TIMEOUT);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [firstGuess, secondGuess]);

  // update score based on tiles
  useEffect(() => {
    setTotalScore(
      tiles.reduce((prev, curr) => {
        if (curr.guessed) prev += 10;
        if (curr.guessed && curr.bombed && bombed) prev -= 10;
        return prev;
      }, 0)
    );
    if (tiles.filter((x) => x.bombed || x.guessed).length === tiles.length) {
      setGameStatus(GAME_STATUS.over);
    }
  }, [tiles, bombed]);

  return (
    <div className="App">
      <header className="App-header">
        <span className="logo" aria-label="memory logo">
          <span>mem</span>
          <span>🔥 ry</span>
        </span>
        <div className="dropdown">
          <button className="dropbtn" onClick={() => setOpenDropdown(true)}>
            {data[emojiSet]?.map((y) => y.content + " ")} <span>▼</span>
          </button>
          <div className={`dropdown-content ${openDropdown ? "" : "hidden"}`}>
            {EMOJI_SETS.map((x) => (
              <button
                key={x}
                onClick={() => {
                  setEmojiSet(x);
                  setOpenDropdown(false);
                }}
              >
                {data[x].map((y) => y.content + " ")}
              </button>
            ))}
          </div>
        </div>
      </header>
      <>
        <div className="game-screen-wrapper">
          {gameStatus !== GAME_STATUS.reloading && (
            <div className="game-screen">
              {tiles?.map((x) => (
                <div
                  key={x.key}
                  className={`flip-card ${
                    x.guessed ||
                    x.key === firstGuess?.key ||
                    x.key === secondGuess?.key
                      ? "flipped"
                      : ""
                  } ${x.guessed ? "guessed" : ""} ${
                    x.bombed && bombed ? "bombed" : ""
                  }`}
                  onClick={() => handleClick(x)}
                  role="button"
                  aria-label={x.id}
                  aria-disabled={x.guessed || x.bombed}
                >
                  <div className="card-inner">
                    <div className="card-front">{DEBUG ? x.content : "❓"}</div>
                    <div className="card-back">
                      <span>{x.bombed ? "🔥" : x.content}</span>
                      <span className={`card-score`}>
                        {bombed && x.bombed
                          ? "0"
                          : !bombed && x.bombed
                          ? "+10"
                          : x.guessed
                          ? "+10"
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {gameStatus !== GAME_STATUS.reloading && (
          <div className="scoreboard">
            <h2 className="game-status">
              {gameStatus}
              {gameStatus === GAME_STATUS.over && (
                <button className="btn-reset" onClick={handleReset}>
                  🔄
                </button>
              )}
            </h2>
            <div className="score">{totalScore}</div>
          </div>
        )}
      </>
    </div>
  );
}

export default App;
