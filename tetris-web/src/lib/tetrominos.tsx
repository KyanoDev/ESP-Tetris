export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z"

export interface Tetromino {
    id: number
    type: TetrominoType
    shapes: number[][][]
    color: string
}

// Tetromino shapes in all rotations
export const TETROMINOS: Record<TetrominoType, Tetromino> = {
    I: {
        id: 1,
        type: "I",
        color: "bg-cyan-500",
        shapes: [
            [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0],
            ],
            [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
            ],
        ],
    },
    J: {
        id: 2,
        type: "J",
        color: "bg-blue-500",
        shapes: [
            [
                [2, 0, 0],
                [2, 2, 2],
                [0, 0, 0],
            ],
            [
                [0, 2, 2],
                [0, 2, 0],
                [0, 2, 0],
            ],
            [
                [0, 0, 0],
                [2, 2, 2],
                [0, 0, 2],
            ],
            [
                [0, 2, 0],
                [0, 2, 0],
                [2, 2, 0],
            ],
        ],
    },
    L: {
        id: 3,
        type: "L",
        color: "bg-orange-500",
        shapes: [
            [
                [0, 0, 3],
                [3, 3, 3],
                [0, 0, 0],
            ],
            [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3],
            ],
            [
                [0, 0, 0],
                [3, 3, 3],
                [3, 0, 0],
            ],
            [
                [3, 3, 0],
                [0, 3, 0],
                [0, 3, 0],
            ],
        ],
    },
    O: {
        id: 4,
        type: "O",
        color: "bg-yellow-500",
        shapes: [
            [
                [4, 4],
                [4, 4],
            ],
            [
                [4, 4],
                [4, 4],
            ],
            [
                [4, 4],
                [4, 4],
            ],
            [
                [4, 4],
                [4, 4],
            ],
        ],
    },
    S: {
        id: 5,
        type: "S",
        color: "bg-green-500",
        shapes: [
            [
                [0, 5, 5],
                [5, 5, 0],
                [0, 0, 0],
            ],
            [
                [0, 5, 0],
                [0, 5, 5],
                [0, 0, 5],
            ],
            [
                [0, 0, 0],
                [0, 5, 5],
                [5, 5, 0],
            ],
            [
                [5, 0, 0],
                [5, 5, 0],
                [0, 5, 0],
            ],
        ],
    },
    T: {
        id: 6,
        type: "T",
        color: "bg-purple-500",
        shapes: [
            [
                [0, 6, 0],
                [6, 6, 6],
                [0, 0, 0],
            ],
            [
                [0, 6, 0],
                [0, 6, 6],
                [0, 6, 0],
            ],
            [
                [0, 0, 0],
                [6, 6, 6],
                [0, 6, 0],
            ],
            [
                [0, 6, 0],
                [6, 6, 0],
                [0, 6, 0],
            ],
        ],
    },
    Z: {
        id: 7,
        type: "Z",
        color: "bg-red-500",
        shapes: [
            [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ],
            [
                [0, 0, 7],
                [0, 7, 7],
                [0, 7, 0],
            ],
            [
                [0, 0, 0],
                [7, 7, 0],
                [0, 7, 7],
            ],
            [
                [0, 7, 0],
                [7, 7, 0],
                [7, 0, 0],
            ],
        ],
    },
}

export const getRandomTetromino = (): Tetromino => {
    const tetrominoTypes = Object.keys(TETROMINOS) as TetrominoType[]
    const randomType = tetrominoTypes[Math.floor(Math.random() * tetrominoTypes.length)]
    return TETROMINOS[randomType]
}
