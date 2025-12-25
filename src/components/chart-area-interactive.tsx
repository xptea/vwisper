"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { useHistory } from "@/lib/history-context"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const chartConfig = {
  words: {
    label: "Words",
    color: "var(--primary)",
  },
  transcriptions: {
    label: "Transcriptions",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today to include today

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(formatLocalDate(date));
  }

  return dates;
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const { entries, isLoading } = useHistory()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [metric, setMetric] = React.useState<"words" | "transcriptions">("words")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Generate chart data from history entries
  const chartData = React.useMemo(() => {
    let days = 30;
    if (timeRange === "90d") days = 90;
    if (timeRange === "7d") days = 7;

    const dateRange = generateDateRange(days);

    // Create a map for each date
    const dateMap: Record<string, { words: number; transcriptions: number }> = {};
    dateRange.forEach(date => {
      dateMap[date] = { words: 0, transcriptions: 0 };
    });

    // Aggregate entries by date (using local timezone)
    entries.forEach(entry => {
      const entryDate = formatLocalDate(new Date(entry.timestamp));
      if (dateMap[entryDate]) {
        dateMap[entryDate].words += entry.word_count;
        dateMap[entryDate].transcriptions += 1;
      }
    });

    // Convert to array
    return dateRange.map(date => ({
      date,
      words: dateMap[date].words,
      transcriptions: dateMap[date].transcriptions,
    }));
  }, [entries, timeRange]);

  // Calculate totals for the selected period
  const totalWords = chartData.reduce((sum, d) => sum + d.words, 0);
  const totalTranscriptions = chartData.reduce((sum, d) => sum + d.transcriptions, 0);

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "90d": return "Last 3 months";
      case "30d": return "Last 30 days";
      case "7d": return "Last 7 days";
      default: return "Last 30 days";
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="@container/card animate-pulse">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]" />
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>
            {metric === "words" ? "Words Transcribed" : "Transcriptions"}
          </CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              {metric === "words"
                ? `${totalWords.toLocaleString()} words in ${getTimeRangeLabel().toLowerCase()}`
                : `${totalTranscriptions.toLocaleString()} transcriptions in ${getTimeRangeLabel().toLowerCase()}`
              }
            </span>
            <span className="@[540px]/card:hidden">{getTimeRangeLabel()}</span>
          </CardDescription>
          <CardAction>
            <div className="flex gap-2">
              {/* Metric Toggle */}
              <ToggleGroup
                type="single"
                value={metric}
                onValueChange={(v) => v && setMetric(v as "words" | "transcriptions")}
                variant="outline"
                className="hidden *:data-[slot=toggle-group-item]:!px-3 @[540px]/card:flex"
              >
                <ToggleGroupItem value="words">Words</ToggleGroupItem>
                <ToggleGroupItem value="transcriptions">Count</ToggleGroupItem>
              </ToggleGroup>

              {/* Time Range Toggle */}
              <ToggleGroup
                type="single"
                value={timeRange}
                onValueChange={(v) => v && setTimeRange(v)}
                variant="outline"
                className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
              >
                <ToggleGroupItem value="90d">3 months</ToggleGroupItem>
                <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
                <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
              </ToggleGroup>

              {/* Mobile Select */}
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger
                  className="flex w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                  size="sm"
                  aria-label="Select time range"
                >
                  <SelectValue placeholder="30 days" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="90d" className="rounded-lg">
                    3 months
                  </SelectItem>
                  <SelectItem value="30d" className="rounded-lg">
                    30 days
                  </SelectItem>
                  <SelectItem value="7d" className="rounded-lg">
                    7 days
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillWords" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-words)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-words)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillTranscriptions" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-transcriptions)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-transcriptions)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={50}
                tickFormatter={(value) => {
                  if (value >= 1000) {
                    return (value / 1000).toFixed(0) + 'k';
                  }
                  return value.toString();
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              {metric === "words" ? (
                <Area
                  dataKey="words"
                  type="monotone"
                  fill="url(#fillWords)"
                  stroke="var(--color-words)"
                  strokeWidth={2}
                  baseValue={0}
                />
              ) : (
                <Area
                  dataKey="transcriptions"
                  type="monotone"
                  fill="url(#fillTranscriptions)"
                  stroke="var(--color-transcriptions)"
                  strokeWidth={2}
                  baseValue={0}
                />
              )}
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
