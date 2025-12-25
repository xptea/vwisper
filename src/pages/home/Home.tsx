import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"

export default function UsageStats() {
  return (
    <div className="h-full overflow-auto">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Usage Statistics</h1>
          <p className="text-muted-foreground">Track your VWisper usage and performance</p>
        </div>
        <SectionCards />
        <ChartAreaInteractive />
      </div>
    </div>
  )
}
