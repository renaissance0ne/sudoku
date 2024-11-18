import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Timer, Undo, Check, RotateCcw, Trophy, AlertCircle, Skull } from 'lucide-react';

const SudokuGame = () => {
    const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
    const [selected, setSelected] = useState(null);
    const [initialBoard, setInitialBoard] = useState(Array(9).fill().map(() => Array(9).fill(false)));
    const [difficulty, setDifficulty] = useState('medium');
    const [moveHistory, setMoveHistory] = useState([]);
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [mistakes, setMistakes] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [gigaChadTimer, setGigaChadTimer] = useState(null);

    const difficultySettings = {
        easy: { cells: 38, points: 100 },
        medium: { cells: 30, points: 200 },
        hard: { cells: 25, points: 300 },
        gigachad: { cells: 20, points: 1000 }
    };

    // Timer
    useEffect(() => {
        let interval;
        if (isActive) {
            interval = setInterval(() => {
                setTimer(timer => timer + 1);

                // Giga Chad special timer logic
                if (difficulty === 'gigachad' && gigaChadTimer !== null) {
                    setGigaChadTimer(time => {
                        if (time <= 0) {
                            handlePuzzleComplete();
                            return null;
                        }
                        return time - 1;
                    });
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, difficulty, gigaChadTimer]);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const generatePuzzle = () => {
        const solved = [
            [5,3,4,6,7,8,9,1,2],
            [6,7,2,1,9,5,3,4,8],
            [1,9,8,3,4,2,5,6,7],
            [8,5,9,7,6,1,4,2,3],
            [4,2,6,8,5,3,7,9,1],
            [7,1,3,9,2,4,8,5,6],
            [9,6,1,5,3,7,2,8,4],
            [2,8,7,4,1,9,6,3,5],
            [3,4,5,2,8,6,1,7,9]
        ];

        const newBoard = solved.map(row => [...row]);
        const cellsToRemove = difficultySettings[difficulty].cells;

        let removed = 0;
        while (removed < cellsToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (newBoard[row][col] !== 0) {
                newBoard[row][col] = 0;
                removed++;
            }
        }

        setBoard(newBoard);
        const initial = newBoard.map(row =>
            row.map(cell => cell !== 0)
        );
        setInitialBoard(initial);
        setMoveHistory([]);
        setScore(0);
        setTimer(0);
        setIsActive(true);
        setMistakes(0);

        // Giga Chad special rules
        if (difficulty === 'gigachad') {
            setGigaChadTimer(300); // 5 minutes time limit
        } else {
            setGigaChadTimer(null);
        }
    };

    useEffect(() => {
        generatePuzzle();
    }, [difficulty]);

    const isValid = (row, col, num) => {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }

        // Check 3x3 box
        let boxRow = Math.floor(row / 3) * 3;
        let boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    };

    const handleCellClick = (row, col) => {
        if (!initialBoard[row][col]) {
            setSelected({ row, col });
            setShowHint(false);
        }
    };

    const handleNumberInput = (num) => {
        if (selected && !initialBoard[selected.row][selected.col]) {
            const newBoard = [...board];
            const oldValue = newBoard[selected.row][selected.col];

            if (isValid(selected.row, selected.col, num)) {
                newBoard[selected.row][selected.col] = num;
                setBoard(newBoard);
                setMoveHistory([...moveHistory, {
                    row: selected.row,
                    col: selected.col,
                    oldValue,
                    newValue: num
                }]);

                setScore(prev => prev + 10);

                gsap.from(`#cell-${selected.row}-${selected.col}`, {
                    scale: 0,
                    duration: 0.3,
                    ease: "back.out"
                });

                if (isBoardFull(newBoard) && isBoardValid(newBoard)) {
                    handlePuzzleComplete();
                }
            } else {
                setMistakes(prev => prev + 1);
                setScore(prev => Math.max(0, prev - 5));

                gsap.to(`#cell-${selected.row}-${selected.col}`, {
                    x: [-5, 5, -5, 5, 0],
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        }
    };

    const handleUndo = () => {
        if (moveHistory.length > 0) {
            const lastMove = moveHistory[moveHistory.length - 1];
            const newBoard = [...board];
            newBoard[lastMove.row][lastMove.col] = lastMove.oldValue;
            setBoard(newBoard);
            setMoveHistory(moveHistory.slice(0, -1));
            setScore(prev => Math.max(0, prev - 5));
        }
    };

    const isBoardFull = (board) => {
        return board.every(row => row.every(cell => cell !== 0));
    };

    const isBoardValid = (board) => {
        // Check rows
        for (let i = 0; i < 9; i++) {
            const row = new Set(board[i].filter(x => x !== 0));
            if (row.size !== 9) return false;
        }

        // Check columns
        for (let i = 0; i < 9; i++) {
            const col = new Set(board.map(row => row[i]).filter(x => x !== 0));
            if (col.size !== 9) return false;
        }

        // Check boxes
        for (let box = 0; box < 9; box++) {
            const boxRow = Math.floor(box / 3) * 3;
            const boxCol = (box % 3) * 3;
            const boxNums = new Set();
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const num = board[boxRow + i][boxCol + j];
                    if (num !== 0) boxNums.add(num);
                }
            }
            if (boxNums.size !== 9) return false;
        }

        return true;
    };

    const handlePuzzleComplete = () => {
        setIsActive(false);
        const timeBonus = Math.max(0, 1000 - timer);
        const difficultyBonus = difficultySettings[difficulty].points;
        const mistakePenalty = mistakes * 50;

        // Special scoring for Giga Chad mode
        let gigaChadBonus = 0;
        if (difficulty === 'gigachad') {
            if (gigaChadTimer > 0) {
                gigaChadBonus = gigaChadTimer * 10; // Bonus points for remaining time
            } else {
                setScore(0);
                return;
            }
        }

        const finalScore = score + timeBonus + difficultyBonus - mistakePenalty + gigaChadBonus;
        setScore(finalScore);

        gsap.to(".sudoku-board", {
            scale: 1.02,
            duration: 0.3,
            yoyo: true,
            repeat: 1
        });
    };

    const getHint = () => {
        if (selected) {
            setShowHint(true);
            setScore(prev => Math.max(0, prev - 20));
        }
    };

    const validNumbers = () => {
        if (!selected) return [];
        const valid = [];
        for (let num = 1; num <= 9; num++) {
            if (isValid(selected.row, selected.col, num)) {
                valid.push(num);
            }
        }
        return valid;
    };

    return (
        <div className="container flex flex-col items-center gap-8 py-12">
            <h1 className="h3 text-p4 mb-8">Sudoku Game</h1>

            {/* Game Stats */}
            <div className="flex gap-8 items-center mb-4">
                <div className="flex items-center gap-2 text-p4">
                    <Timer size={20} />
                    <span className="base-bold">{formatTime(timer)}</span>
                </div>
                {difficulty === 'gigachad' && gigaChadTimer !== null && (
                    <div className="flex items-center gap-2 text-red-500">
                        <Skull size={20} />
                        <span className="base-bold">{formatTime(gigaChadTimer)}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-p3">
                    <Trophy size={20} />
                    <span className="base-bold">{score}</span>
                </div>
                <div className="flex items-center gap-2 text-p1">
                    <AlertCircle size={20} />
                    <span className="base-bold">{mistakes}</span>
                </div>
            </div>

            {/* Difficulty Selector */}
            <div className="flex gap-4 mb-4">
                {Object.keys(difficultySettings).map((level) => (
                    <button
                        key={level}
                        className={`
                            px-6 py-2 base-bold uppercase rounded-14 transition-all duration-500
                            ${difficulty === level ? 'bg-s4 text-p1' : 'bg-s2 text-p4'}
                            ${level === 'gigachad' ? 'bg-gradient-to-r from-purple-500 to-red-500 text-white' : ''}
                            border-2 border-s4/25 hover:border-s4
                        `}
                        onClick={() => setDifficulty(level)}
                    >
                        {level === 'gigachad' ? 'GIGA CHAD' : level}
                    </button>
                ))}
            </div>

            {/* Game Board */}
            <div className="relative sudoku-board">
                <div className="absolute inset-0 bg-s4/25 blur-xl"></div>
                <div className="relative grid grid-cols-9 gap-px bg-s3 p-px rounded-14 overflow-hidden shadow-100">
                    {board.map((row, rowIndex) => (
                        row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                id={`cell-${rowIndex}-${colIndex}`}
                                className={`
                                    w-12 h-12 flex items-center justify-center font-inter text-xl font-bold
                                    ${(Math.floor(rowIndex/3) + Math.floor(colIndex/3)) % 2 === 0 ? 'bg-s1' : 'bg-s2'}
                                    ${selected?.row === rowIndex && selected?.col === colIndex ? 'bg-s4/20' : ''}
                                    ${initialBoard[rowIndex][colIndex] ? 'text-p4' : 'text-p1 cursor-pointer'}
                                    hover:bg-s4/10 transition-all duration-500
                                `}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                            >
                                {cell !== 0 ? cell : ''}
                            </div>
                        ))
                    ))}
                </div>
            </div>

            {/* Hint Display */}
            {showHint && selected && (
                <div className="text-p3 base-bold mt-2">
                    Valid numbers: {validNumbers().join(', ')}
                </div>
            )}

            {/* Number Input */}
            <div className="grid grid-cols-9 gap-2 mt-8">
                {[1,2,3,4,5,6,7,8,9].map(num => (
                    <button
                        key={num}
                        className={`
                            w-12 h-12 base-bold bg-s2 text-p4 rounded-14
                            border-2 border-s4/25 hover:border-s4
                            transition-all duration-500 relative inner-before
                            hover:before:opacity-100 hover:text-p1
                        `}
                        onClick={() => handleNumberInput(num)}
                    >
                        <span className="relative z-2">{num}</span>
                    </button>
                ))}
            </div>

            {/* Control Buttons */}
            <div className="flex gap-4 mt-8">
                <button
                    className="group relative px-8 py-3 base-bold uppercase text-p4
                              bg-s2 rounded-14 border-2 border-s4/25 hover:border-s4
                              transition-all duration-500 inner-before
                              hover:text-p1 flex items-center gap-2"
                    onClick={handleUndo}
                    disabled={moveHistory.length === 0}
                >
                    <Undo size={16} />
                    <span className="relative z-2">Undo</span>
                </button>

                <button
                    className="group relative px-8 py-3 base-bold uppercase text-p4
                              bg-s2 rounded-14 border-2 border-s4/25 hover:border-s4
                              transition-all duration-500 inner-before
                              hover:text-p1 flex items-center gap-2"
                    onClick={getHint}
                >
                    <Check size={16} />
                    <span className="relative z-2">Hint</span>
                </button>

                <button
                    className="group relative px-8 py-3 base-bold uppercase text-p4
                              bg-s2 rounded-14 border-2 border-s4/25 hover:border-s4
                              transition-all duration-500 inner-before glow-before glow-after
                              hover:text-p1 flex items-center gap-2"
                    onClick={generatePuzzle}
                >
                    <RotateCcw size={16} />
                    <span className="relative z-2">New Game</span>
                </button>
            </div>

            {/* Giga Chad Mode Warning */}
            {difficulty === 'gigachad' && (
                <div className="mt-4 text-red-500 text-center base-bold">
                    <p>⚠️ GIGA CHAD MODE ACTIVE ⚠️</p>
                    <p>Complete the puzzle in 5 minutes or lose everything!</p>
                </div>
            )}
        </div>
    );
};

export default SudokuGame;