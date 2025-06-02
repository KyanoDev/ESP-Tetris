"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBluetoothController } from "@/contexts/bluetooth-controller-context";
import { useGameLogic } from "@/hooks/use-game-logic";
import { useCallback, useEffect } from "react";
import BluetoothStatus from "./bluetooth-status";
import GameBoard from "./game-board";
import GameControls from "./game-controls";
import GameStats from "./game-stats";
import NextPiece from "./next-piece";

export default function TetrisGame() {
	const {
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
	} = useGameLogic();

	const { setOnButtonPress } = useBluetoothController();

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (isGameOver || isPaused) return;

			switch (event.key) {
				case "ArrowLeft":
					moveLeft();
					break;
				case "ArrowRight":
					moveRight();
					break;
				case "ArrowUp":
					rotate();
					break;
				case "ArrowDown":
					softDrop();
					break;
				case " ":
					hardDrop();
					break;
				case "p":
					pauseGame();
					break;
				default:
					break;
			}
		},
		[
			isGameOver,
			isPaused,
			moveLeft,
			moveRight,
			rotate,
			softDrop,
			hardDrop,
			pauseGame,
		],
	);

	// Handle controller button press
	const handleControllerButtonPress = useCallback(
		(button: string) => {
			// Use the same logic as keyboard events
			const event = { key: button } as KeyboardEvent;
			handleKeyDown(event);
		},
		[handleKeyDown],
	);

	// Set up keyboard controls
	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);

	// Set up controller button handler
	useEffect(() => {
		setOnButtonPress(handleControllerButtonPress);
		return () => {
			setOnButtonPress(null);
		};
	}, [handleControllerButtonPress, setOnButtonPress]);

	// Auto-start the game when component mounts
	useEffect(() => {
		startGame();
	}, [startGame]);

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
			<div className="md:col-span-2">
				<Card className="bg-gray-800 border-gray-700 p-2 md:p-4 relative">
					<GameBoard board={board} />
					{(isGameOver || isPaused) && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/70">
							<div className="text-center p-4 bg-gray-800 rounded-lg">
								<h2 className="text-2xl font-bold text-white mb-4">
									{isGameOver ? "Game Over" : "Paused"}
								</h2>
								<Button
									onClick={isGameOver ? resetGame : pauseGame}
									className="bg-primary hover:bg-primary/90"
								>
									{isGameOver ? "Play Again" : "Resume"}
								</Button>
							</div>
						</div>
					)}
				</Card>
			</div>
			<div className="flex flex-col gap-4">
				<Card className="bg-gray-800 border-gray-700 p-4">
					<h2 className="text-xl font-bold text-white mb-4">
						Next Piece
					</h2>
					<NextPiece piece={nextPiece} />
				</Card>
				<Card className="bg-gray-800 border-gray-700 p-4">
					<GameStats score={score} level={level} lines={lines} />
				</Card>
				<Card className="bg-gray-800 border-gray-700 p-4">
					<GameControls
						onStart={startGame}
						onPause={pauseGame}
						onReset={resetGame}
						isPaused={isPaused}
						isGameOver={isGameOver}
					/>
				</Card>
				<Card className="bg-gray-800 border-gray-700 p-4">
					<BluetoothStatus />
				</Card>
			</div>
		</div>
	);
}
