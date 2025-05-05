import { memo } from "react"
import { cn } from "@/lib/utils"

const CELL_COLORS = {
    0: "bg-transparent",
    1: "bg-cyan-500", // I
    2: "bg-blue-500", // J
    3: "bg-orange-500", // L
    4: "bg-yellow-500", // O
    5: "bg-green-500", // S
    6: "bg-purple-500", // T
    7: "bg-red-500", // Z
    8: "bg-gray-700", // Ghost piece
}

interface GameBoardProps {
    board: number[][]
}

function GameBoard({ board }: GameBoardProps) {
    return (
        <div className="relative w-full aspect-[1/2] max-w-[320px] mx-auto">
            <div className="grid grid-cols-10 grid-rows-20 h-full w-full border-2 border-gray-700 bg-gray-900">
                {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={cn(
                                "border border-gray-800/30",
                                cell > 0 ? CELL_COLORS[cell as keyof typeof CELL_COLORS] : "bg-transparent",
                            )}
                            data-value={cell} // For debugging
                        />
                    )),
                )}
            </div>
        </div>
    )
}

export default memo(GameBoard)
