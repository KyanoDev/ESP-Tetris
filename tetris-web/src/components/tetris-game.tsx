"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBLEController } from "@/hooks/use-ble-controller";
import { useGameLogic } from "@/hooks/use-game-logic";
import { useCallback, useEffect } from "react";
import BLEConnection from "./ble-connection";
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

	const handleBLECommand = useCallback(
		(command: string) => {
			if (isGameOver) return;

			console.log(`Received command: ${command}`);
			switch (command) {
				case "moveLeft":
					moveLeft();
					break;
				case "moveRight":
					moveRight();
					break;
				case "rotate":
					rotate();
					break;
				case "softDrop":
					softDrop();
					break;
				case "hardDrop":
					hardDrop();
					break;
				case "pause":
					pauseGame();
					break;
				default:
					break;
			}
		},
		[
			isGameOver,
			moveLeft,
			moveRight,
			rotate,
			softDrop,
			hardDrop,
			pauseGame,
		],
	);

	const { isConnected, isConnecting, connect, disconnect, sendGameState } =
		useBLEController(handleBLECommand);

	// Send game state to ESP32 when it changes
	useEffect(() => {
		if (isConnected) {
			sendGameState({
				score,
				level,
				lines,
				isGameOver,
				isPaused,
			});
		}
	}, [isConnected, score, level, lines, isGameOver, isPaused, sendGameState]);

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

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);

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
				<BLEConnection
					isConnected={isConnected}
					isConnecting={isConnecting}
					onConnect={connect}
					onDisconnect={disconnect}
				/>
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
					<h2 className="text-xl font-bold text-white mb-2">
						Controls
					</h2>
					<div className="text-gray-300 text-sm space-y-1">
						<p>← → : Move</p>
						<p>↑ : Rotate</p>
						<p>↓ : Soft Drop</p>
						<p>Space : Hard Drop</p>
						<p>P : Pause</p>
						<p className="text-blue-400 mt-2">
							Or use ESP32 controller!
						</p>
					</div>
				</Card>
			</div>
		</div>
	);
}
