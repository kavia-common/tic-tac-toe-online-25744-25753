import React, { useMemo, useState } from 'react';
import './App.css';

/**
 * Ocean Professional Themed Tic Tac Toe
 * - Local multiplayer and vs AI
 * - Centered board, status above, controls below
 * - Minimalist modern design with blue & amber accents
 */

// Helpers
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(squares) {
  for (const [a, b, c] of LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[b] === squares[c]) {
      return { player: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

function getAvailableMoves(squares) {
  return squares.reduce((acc, val, idx) => {
    if (!val) acc.push(idx);
    return acc;
  }, []);
}

function isBoardFull(squares) {
  return getAvailableMoves(squares).length === 0;
}

function evaluateBoard(squares, ai, human) {
  const winner = calculateWinner(squares);
  if (winner?.player === ai) return 10;
  if (winner?.player === human) return -10;
  return 0;
}

function minimax(squares, depth, isMaximizing, ai, human) {
  const score = evaluateBoard(squares, ai, human);
  if (score === 10 || score === -10) return score - depth * Math.sign(score); // prefer quicker wins / slower losses
  if (isBoardFull(squares)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of getAvailableMoves(squares)) {
      squares[move] = ai;
      best = Math.max(best, minimax(squares, depth + 1, false, ai, human));
      squares[move] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of getAvailableMoves(squares)) {
      squares[move] = human;
      best = Math.min(best, minimax(squares, depth + 1, true, ai, human));
      squares[move] = null;
    }
    return best;
  }
}

function findBestMove(squares, ai, human) {
  let bestVal = -Infinity;
  let bestMove = null;
  for (const move of getAvailableMoves(squares)) {
    squares[move] = ai;
    const moveVal = minimax(squares, 0, false, ai, human);
    squares[move] = null;
    if (moveVal > bestVal) {
      bestVal = moveVal;
      bestMove = move;
    }
  }
  return bestMove;
}

// PUBLIC_INTERFACE
export default function App() {
  /**
   * App: root component
   * Provides the Ocean Professional layout and routes the Game component.
   */
  return (
    <div className="ocean-app">
      <div className="ocean-container">
        <header className="ocean-header">
          <h1 className="ocean-title">Tic Tac Toe</h1>
          <p className="ocean-subtitle">Play locally or challenge an AI</p>
        </header>
        <main className="ocean-main">
          <Game />
        </main>
        <footer className="ocean-footer">
          <span className="ocean-brand">Ocean Professional</span>
        </footer>
      </div>
    </div>
  );
}

function Game() {
  const [mode, setMode] = useState('ai'); // 'ai' or 'local'
  const [xIsNext, setXIsNext] = useState(true);
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [startingPlayer, setStartingPlayer] = useState('X'); // who starts each new game

  const winnerInfo = useMemo(() => calculateWinner(squares), [squares]);
  const winner = winnerInfo?.player || null;
  const draw = !winner && isBoardFull(squares);
  const currentPlayer = xIsNext ? 'X' : 'O';

  const aiPlayer = 'O';
  const humanPlayer = 'X';

  const statusText = useMemo(() => {
    if (winner) return `Winner: ${winner}`;
    if (draw) return "It's a draw!";
    return `Turn: ${currentPlayer}`;
  }, [winner, draw, currentPlayer]);

  const isAIMove = mode === 'ai' && currentPlayer === aiPlayer && !winner && !draw;

  // Make AI move when it's AI's turn
  React.useEffect(() => {
    if (!isAIMove) return;
    const timer = setTimeout(() => {
      const nextSquares = squares.slice();
      const move = findBestMove(nextSquares, aiPlayer, humanPlayer);
      const selected = move != null ? move : getAvailableMoves(nextSquares)[0];
      if (selected != null) {
        nextSquares[selected] = aiPlayer;
        setSquares(nextSquares);
        setXIsNext((prev) => !prev);
      }
    }, 350); // slight delay for better UX
    return () => clearTimeout(timer);
  }, [isAIMove, squares]);

  function handleClick(i) {
    if (winner || squares[i] || (mode === 'ai' && currentPlayer === aiPlayer)) {
      return;
    }
    const next = squares.slice();
    next[i] = currentPlayer;
    setSquares(next);
    setXIsNext(!xIsNext);
  }

  // PUBLIC_INTERFACE
  function restart() {
    /**
     * Restart the game preserving mode and starting player selection.
     */
    setSquares(Array(9).fill(null));
    setXIsNext(startingPlayer === 'X');
  }

  // PUBLIC_INTERFACE
  function changeMode(newMode) {
    /**
     * Change game mode between 'ai' and 'local' and reset the game.
     */
    setMode(newMode);
    setSquares(Array(9).fill(null));
    setXIsNext(startingPlayer === 'X');
  }

  // PUBLIC_INTERFACE
  function toggleStartingPlayer() {
    /**
     * Toggle starting player for new games and restart immediately.
     */
    const nextStarter = startingPlayer === 'X' ? 'O' : 'X';
    setStartingPlayer(nextStarter);
    setSquares(Array(9).fill(null));
    setXIsNext(nextStarter === 'X');
  }

  return (
    <section className="game-card">
      <div className="controls-row">
        <ModeToggle mode={mode} onChange={changeMode} />
        <StartingPlayerToggle
          startingPlayer={startingPlayer}
          onToggle={toggleStartingPlayer}
        />
      </div>

      <StatusBanner status={statusText} winnerLine={winnerInfo?.line} />

      <Board
        squares={squares}
        onClick={handleClick}
        winnerLine={winnerInfo?.line}
        currentPlayer={currentPlayer}
      />

      <div className="actions-row">
        <button className="btn primary" onClick={restart} aria-label="Restart game">
          Restart
        </button>
        <button
          className="btn surface"
          onClick={() => setSquares(Array(9).fill(null))}
          aria-label="Clear board"
        >
          Clear Board
        </button>
      </div>
    </section>
  );
}

function ModeToggle({ mode, onChange }) {
  return (
    <div className="segment">
      <button
        className={`seg-btn ${mode === 'ai' ? 'active' : ''}`}
        onClick={() => onChange('ai')}
        aria-pressed={mode === 'ai'}
      >
        vs AI
      </button>
      <button
        className={`seg-btn ${mode === 'local' ? 'active' : ''}`}
        onClick={() => onChange('local')}
        aria-pressed={mode === 'local'}
      >
        Local 2P
      </button>
    </div>
  );
}

function StartingPlayerToggle({ startingPlayer, onToggle }) {
  return (
    <button className="btn outline" onClick={onToggle} aria-label="Toggle starting player">
      Starts: {startingPlayer}
    </button>
  );
}

function StatusBanner({ status }) {
  return (
    <div className="status-banner" role="status" aria-live="polite">
      {status}
    </div>
  );
}

function Square({ value, onClick, isWinning, canHover }) {
  return (
    <button
      className={`square ${isWinning ? 'winning' : ''} ${canHover ? 'hoverable' : ''}`}
      onClick={onClick}
      aria-label={`Square ${value ? value : 'empty'}`}
    >
      {value}
    </button>
  );
}

function Board({ squares, onClick, winnerLine, currentPlayer }) {
  const renderSquare = (i) => {
    const isWinning = winnerLine?.includes(i);
    const canHover = !squares[i] && !winnerLine;
    return (
      <Square
        key={i}
        value={squares[i]}
        onClick={() => onClick(i)}
        isWinning={isWinning}
        canHover={canHover}
      />
    );
  };

  return (
    <div className="board-wrapper">
      <div className="board" data-player={currentPlayer}>
        {squares.map((_, idx) => renderSquare(idx))}
      </div>
    </div>
  );
}
