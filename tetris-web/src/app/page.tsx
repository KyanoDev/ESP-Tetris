import TetrisGame from "@/components/tetris-game"

export default function Home() {
  return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
        <h1 className="text-4xl font-bold text-white mb-8">Tetris</h1>
        <TetrisGame />
      </main>
  )
}

