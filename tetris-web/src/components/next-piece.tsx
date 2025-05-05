import { memo } from "react"
import { cn } from "@/lib/utils"
import type { Tetromino } from "@/lib/tetrominos"

const CELL_COLORS = {
    0: "bg-transparent",
    1: "bg-cyan-500", // I
    2: "bg-blue-500", // J
    3: "bg-orange-500", // L
    4: "bg-yellow-500", // O
    5: "bg-green-500", // S
    6: "bg-purple-500", // T
    7: "bg-red-500", // Z
}

interface NextPieceProps {
    piece: Tetromino | null
}

function NextPiece({ piece }: NextPieceProps) {
    if (!piece) {
        return <div className="w-full aspect-square max-w-[120px] mx-auto bg-gray-900 border border-gray-700" />
    }

    // Get the shape matrix
    const shape = piece.shapes[0]
    const height = shape.length
    const width = shape[0].length

    // Create a 4x4 display grid
    const displayGrid = Array(4)
        .fill(0)
        .map(() => Array(4).fill(0))

    // Center the piece in the display grid
    const offsetY = Math.floor((4 - height) / 2)
    const offsetX = Math.floor((4 - width) / 2)

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (shape[y][x]) {
                displayGrid[y + offsetY][x + offsetX] = piece.id
            }
        }
    }

    return (
        <div className="w-full aspect-square max-w-[120px] mx-auto">
            <div className="grid grid-cols-4 grid-rows-4 h-full w-full border border-gray-700 bg-gray-900">
                {displayGrid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <div
                            key={`next-${rowIndex}-${colIndex}`}
                            className={cn(
                                "border border-gray-800/30",
                                CELL_COLORS[cell as keyof typeof CELL_COLORS] || "bg-transparent",
                            )}
                        />
                    )),
                )}
            </div>
        </div>
    )
}

export default memo(NextPiece)
