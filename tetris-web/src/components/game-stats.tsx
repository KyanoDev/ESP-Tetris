interface GameStatsProps {
    score: number
    level: number
    lines: number
}

export default function GameStats({ score, level, lines }: GameStatsProps) {
    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold text-white mb-2">Stats</h2>
            <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-300">Score:</div>
                <div className="text-white font-mono text-right">{score}</div>

                <div className="text-gray-300">Level:</div>
                <div className="text-white font-mono text-right">{level}</div>

                <div className="text-gray-300">Lines:</div>
                <div className="text-white font-mono text-right">{lines}</div>
            </div>
        </div>
    )
}
