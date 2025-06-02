"use client";

import { type Tetromino, getRandomTetromino } from "@/lib/tetrominos";
import { useCallback, useEffect, useState } from "react";

// Constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_DROP_SPEED = 1000; // ms
const SPEED_INCREASE_PER_LEVEL = 100; // ms
const MIN_DROP_SPEED = 100; // ms
const POINTS_PER_LINE = 100;
const LINES_PER_LEVEL = 10;

// Create an empty board
const createEmptyBoard = () =>
	Array(BOARD_HEIGHT)
		.fill(0)
		.map(() => Array(BOARD_WIDTH).fill(0));

interface ActivePiece {
	tetromino: Tetromino;
	position: { x: number; y: number };
	rotation: number;
}

export function useGameLogic() {
	// Game state
	const [board, setBoard] = useState(createEmptyBoard());
	const [activePiece, setActivePiece] = useState<ActivePiece | null>(null);
	const [nextPiece, setNextPiece] = useState<Tetromino | null>(null);
	const [score, setScore] = useState(0);
	const [level, setLevel] = useState(1);
	const [lines, setLines] = useState(0);
	const [isGameOver, setIsGameOver] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [dropSpeed, setDropSpeed] = useState(INITIAL_DROP_SPEED);

	// Keep track of locked pieces separately
	const [lockedPieces, setLockedPieces] = useState(createEmptyBoard());

	// Get the current shape of the active piece
	const getCurrentShape = useCallback(() => {
		if (!activePiece) return null;
		return activePiece.tetromino.shapes[activePiece.rotation];
	}, [activePiece]);

	// Check if the position is valid
	const isValidPosition = useCallback(
		(piece: ActivePiece) => {
			const shape = piece.tetromino.shapes[piece.rotation];

			for (let y = 0; y < shape.length; y++) {
				for (let x = 0; x < shape[y].length; x++) {
					if (shape[y][x] !== 0) {
						const boardX = piece.position.x + x;
						const boardY = piece.position.y + y;

						// Check boundaries
						if (
							boardX < 0 ||
							boardX >= BOARD_WIDTH ||
							boardY < 0 ||
							boardY >= BOARD_HEIGHT
						) {
							return false;
						}

						// Check collision with locked pieces
						if (boardY >= 0 && lockedPieces[boardY][boardX] !== 0) {
							return false;
						}
					}
				}
			}

			return true;
		},
		[lockedPieces],
	);

	// Create a new board with the active piece drawn on it
	const getUpdatedBoard = useCallback(() => {
		// Start with a copy of the locked pieces
		const newBoard = lockedPieces.map((row) => [...row]);

		// Draw the active piece if it exists
		if (activePiece) {
			const shape = getCurrentShape();

			if (shape) {
				for (let y = 0; y < shape.length; y++) {
					for (let x = 0; x < shape[y].length; x++) {
						if (shape[y][x] !== 0) {
							const boardX = activePiece.position.x + x;
							const boardY = activePiece.position.y + y;

							if (
								boardY >= 0 &&
								boardY < BOARD_HEIGHT &&
								boardX >= 0 &&
								boardX < BOARD_WIDTH
							) {
								newBoard[boardY][boardX] = shape[y][x];
							}
						}
					}
				}
			}
		}

		return newBoard;
	}, [activePiece, getCurrentShape, lockedPieces]);

	// Generate a new piece
	const generateNewPiece = useCallback(() => {
		const newTetromino = nextPiece || getRandomTetromino();
		const nextRandomPiece = getRandomTetromino();

		const newPiece: ActivePiece = {
			tetromino: newTetromino,
			position: {
				x:
					Math.floor(BOARD_WIDTH / 2) -
					Math.floor(newTetromino.shapes[0][0].length / 2),
				y: 0,
			},
			rotation: 0,
		};

		// Check if the new piece can be placed
		if (!isValidPosition(newPiece)) {
			setIsGameOver(true);
			return;
		}

		setActivePiece(newPiece);
		setNextPiece(nextRandomPiece);
	}, [nextPiece, isValidPosition]);

	// Lock the piece in place and check for completed lines
	const lockPiece = useCallback(() => {
		if (!activePiece) return;

		const shape = getCurrentShape();
		if (!shape) return;

		// Create a new board from the current locked pieces
		const newLockedPieces = lockedPieces.map((row) => [...row]);

		// Lock the active piece
		for (let y = 0; y < shape.length; y++) {
			for (let x = 0; x < shape[y].length; x++) {
				if (shape[y][x] !== 0) {
					const boardX = activePiece.position.x + x;
					const boardY = activePiece.position.y + y;

					if (
						boardY >= 0 &&
						boardY < BOARD_HEIGHT &&
						boardX >= 0 &&
						boardX < BOARD_WIDTH
					) {
						newLockedPieces[boardY][boardX] = shape[y][x];
					}
				}
			}
		}

		// Check for completed lines
		let completedLines = 0;
		for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
			if (newLockedPieces[y].every((cell) => cell !== 0)) {
				// Remove the line
				newLockedPieces.splice(y, 1);
				// Add a new empty line at the top
				newLockedPieces.unshift(Array(BOARD_WIDTH).fill(0));
				completedLines++;
				// Check the same row again since we moved rows down
				y++;
			}
		}

		// Update score and level
		if (completedLines > 0) {
			const newLines = lines + completedLines;
			const newScore = score + completedLines * POINTS_PER_LINE * level;
			const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;

			setLines(newLines);
			setScore(newScore);

			if (newLevel > level) {
				setLevel(newLevel);
				// Increase speed with level
				const newSpeed = Math.max(
					INITIAL_DROP_SPEED -
						(newLevel - 1) * SPEED_INCREASE_PER_LEVEL,
					MIN_DROP_SPEED,
				);
				setDropSpeed(newSpeed);
			}
		}

		setLockedPieces(newLockedPieces);
		generateNewPiece();
	}, [
		activePiece,
		getCurrentShape,
		generateNewPiece,
		level,
		lines,
		lockedPieces,
		score,
	]);

	// Move the piece down
	const moveDown = useCallback(() => {
		if (!activePiece || isGameOver || isPaused) return;

		const newPosition = {
			...activePiece,
			position: {
				...activePiece.position,
				y: activePiece.position.y + 1,
			},
		};

		if (isValidPosition(newPosition)) {
			setActivePiece(newPosition);
		} else {
			lockPiece();
		}
	}, [activePiece, isGameOver, isPaused, isValidPosition, lockPiece]);

	// Move the piece left
	const moveLeft = useCallback(() => {
		if (!activePiece || isGameOver || isPaused) return;

		const newPosition = {
			...activePiece,
			position: {
				...activePiece.position,
				x: activePiece.position.x - 1,
			},
		};

		if (isValidPosition(newPosition)) {
			setActivePiece(newPosition);
		}
	}, [activePiece, isGameOver, isPaused, isValidPosition]);

	// Move the piece right
	const moveRight = useCallback(() => {
		if (!activePiece || isGameOver || isPaused) return;

		const newPosition = {
			...activePiece,
			position: {
				...activePiece.position,
				x: activePiece.position.x + 1,
			},
		};

		if (isValidPosition(newPosition)) {
			setActivePiece(newPosition);
		}
	}, [activePiece, isGameOver, isPaused, isValidPosition]);

	// Rotate the piece
	const rotate = useCallback(() => {
		if (!activePiece || isGameOver || isPaused) return;

		const newRotation =
			(activePiece.rotation + 1) % activePiece.tetromino.shapes.length;

		const newPosition = {
			...activePiece,
			rotation: newRotation,
		};

		// Try normal rotation
		if (isValidPosition(newPosition)) {
			setActivePiece(newPosition);
			return;
		}

		// Try wall kicks (left and right)
		for (const offset of [-1, 1, -2, 2]) {
			const kickedPosition = {
				...newPosition,
				position: {
					...newPosition.position,
					x: newPosition.position.x + offset,
				},
			};

			if (isValidPosition(kickedPosition)) {
				setActivePiece(kickedPosition);
				return;
			}
		}
	}, [activePiece, isGameOver, isPaused, isValidPosition]);

	// Soft drop (move down faster)
	const softDrop = useCallback(() => {
		moveDown();
	}, [moveDown]);

	// Hard drop (move down instantly)
	const hardDrop = useCallback(() => {
		if (!activePiece || isGameOver || isPaused) return;

		let newY = activePiece.position.y;

		// Find the lowest valid position
		while (true) {
			newY++;

			const testPosition = {
				...activePiece,
				position: {
					...activePiece.position,
					y: newY,
				},
			};

			if (!isValidPosition(testPosition)) {
				newY--;
				break;
			}
		}

		// Set the piece to the lowest position
		const newPosition = {
			...activePiece,
			position: {
				...activePiece.position,
				y: newY,
			},
		};

		setActivePiece(newPosition);
		lockPiece();
	}, [activePiece, isGameOver, isPaused, isValidPosition, lockPiece]);

	// Start the game
	const startGame = useCallback(() => {
		// Reset all game state
		setLockedPieces(createEmptyBoard());
		setBoard(createEmptyBoard());
		setScore(0);
		setLevel(1);
		setLines(0);
		setIsGameOver(false);
		setIsPaused(false);
		setDropSpeed(INITIAL_DROP_SPEED);

		// Set next piece first, then generate active piece
		const firstPiece = getRandomTetromino();
		setNextPiece(firstPiece);

		// Generate the first active piece
		const initialPiece = getRandomTetromino();
		const newPiece = {
			tetromino: initialPiece,
			position: {
				x:
					Math.floor(BOARD_WIDTH / 2) -
					Math.floor(initialPiece.shapes[0][0].length / 2),
				y: 0,
			},
			rotation: 0,
		};

		setActivePiece(newPiece);
	}, []);

	// Pause/resume the game
	const pauseGame = useCallback(() => {
		setIsPaused(!isPaused);
	}, [isPaused]);

	// Reset the game
	const resetGame = useCallback(() => {
		startGame();
	}, [startGame]);

	// Game loop
	useEffect(() => {
		if (isGameOver || isPaused) return;

		const gameLoop = setInterval(() => {
			moveDown();
		}, dropSpeed);

		return () => {
			clearInterval(gameLoop);
		};
	}, [isGameOver, isPaused, moveDown, dropSpeed]);

	// Update the board whenever the active piece or locked pieces change
	useEffect(() => {
		const updatedBoard = getUpdatedBoard();
		setBoard(updatedBoard);
	}, [activePiece, lockedPieces, getUpdatedBoard]);

	// Start the game on mount
	useEffect(() => {
		if (!nextPiece) {
			setNextPiece(getRandomTetromino());
		}
	}, [nextPiece]);

	return {
		board,
		score,
		level,
		lines,
		nextPiece,
		isGameOver,
		isPaused,
		moveLeft,
		moveRight,
		rotate,
		softDrop,
		hardDrop,
		startGame,
		pauseGame,
		resetGame,
	};
}
