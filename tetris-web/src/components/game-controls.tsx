"use client";

import { Button } from "@/components/ui/button";
import { Pause, Play, RotateCcw } from "lucide-react";

interface GameControlsProps {
	onStart: () => void;
	onPause: () => void;
	onReset: () => void;
	isPaused: boolean;
	isGameOver: boolean;
}

export default function GameControls({
	onPause,
	onReset,
	isPaused,
	isGameOver,
}: GameControlsProps) {
	return (
		<div className="space-y-3">
			<h2 className="text-xl font-bold text-white mb-2">Game</h2>
			<div className="flex flex-col gap-2">
				{isGameOver ? (
					<Button onClick={onReset} className="w-full">
						<Play className="mr-2 h-4 w-4" />
						New Game
					</Button>
				) : isPaused ? (
					<Button onClick={onPause} className="w-full">
						<Play className="mr-2 h-4 w-4" />
						Resume
					</Button>
				) : (
					<Button onClick={onPause} className="w-full">
						<Pause className="mr-2 h-4 w-4" />
						Pause
					</Button>
				)}
				<Button onClick={onReset} variant="outline" className="w-full">
					<RotateCcw className="mr-2 h-4 w-4" />
					Reset
				</Button>
			</div>
		</div>
	);
}
