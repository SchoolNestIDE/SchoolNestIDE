import { GridBackground } from "@/app/components/grid-background"

interface BlogHeaderProps {
  title: string
  description: string
}

export default function BlogHeader({
  title = "2030: Maya Louvière on IPOs, The No Code Movement & Offending People With The Future",
  description = 'Turns out, predicting the future can offend people, even if it turn . In 2019, we interviewed Maya Sveltman who predicted, "Learning to code will eventually be as useful as learning Ancient Greek." Today, learning to code is being over-promised as a silver bullet for long-term career success. We chatted to her about her 2030 predictions.',
}: BlogHeaderProps) {
  return (
    <GridBackground className="px-4 py-12 md:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto space-y-6">

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-blue-400">{title}</h1>

        <p className="text-lg md:text-xl text-blue-300/80 leading-relaxed max-w-3xl">{description}</p>
      </div>
    </GridBackground>
  )
}
