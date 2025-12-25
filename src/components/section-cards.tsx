import { IconTrendingDown, IconTrendingUp, IconMinus } from "@tabler/icons-react"
import { useHistory } from "@/lib/history-context"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function SectionCards() {
  const { entries, isLoading } = useHistory();

  // Calculate statistics
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Total stats
  const totalTranscriptions = entries.length;
  const totalWords = entries.reduce((sum, e) => sum + e.word_count, 0);
  const totalCharacters = entries.reduce((sum, e) => sum + e.char_count, 0);
  const totalDuration = entries.reduce((sum, e) => sum + e.duration_ms, 0);

  // This week stats
  const thisWeekEntries = entries.filter(e => e.timestamp >= sevenDaysAgo);
  const lastWeekEntries = entries.filter(e => e.timestamp >= sevenDaysAgo - 7 * 24 * 60 * 60 * 1000 && e.timestamp < sevenDaysAgo);

  const thisWeekWords = thisWeekEntries.reduce((sum, e) => sum + e.word_count, 0);
  const lastWeekWords = lastWeekEntries.reduce((sum, e) => sum + e.word_count, 0);

  // Today stats
  const todayEntries = entries.filter(e => e.timestamp >= oneDayAgo);
  const todayWords = todayEntries.reduce((sum, e) => sum + e.word_count, 0);

  // Last 30 days stats
  const last30DaysEntries = entries.filter(e => e.timestamp >= thirtyDaysAgo);
  const last30DaysWords = last30DaysEntries.reduce((sum, e) => sum + e.word_count, 0);
  const previous30DaysEntries = entries.filter(e => e.timestamp >= thirtyDaysAgo - 30 * 24 * 60 * 60 * 1000 && e.timestamp < thirtyDaysAgo);
  const previous30DaysWords = previous30DaysEntries.reduce((sum, e) => sum + e.word_count, 0);

  // Calculate percentage changes
  const weekOverWeekChange = lastWeekWords > 0
    ? ((thisWeekWords - lastWeekWords) / lastWeekWords * 100).toFixed(0)
    : thisWeekWords > 0 ? '100' : '0';

  const monthOverMonthChange = previous30DaysWords > 0
    ? ((last30DaysWords - previous30DaysWords) / previous30DaysWords * 100).toFixed(0)
    : last30DaysWords > 0 ? '100' : '0';

  // Average words per transcription
  const avgWordsPerTranscription = totalTranscriptions > 0
    ? Math.round(totalWords / totalTranscriptions)
    : 0;

  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader>
              <CardDescription>Loading...</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">-</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Transcriptions */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Transcriptions</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(totalTranscriptions)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {todayEntries.length > 0 ? (
                <>
                  <IconTrendingUp />
                  +{todayEntries.length} today
                </>
              ) : (
                <>
                  <IconMinus />
                  0 today
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {totalDuration > 0 ? formatDuration(totalDuration) + ' total recording time' : 'Start transcribing to see stats'}
          </div>
          <div className="text-muted-foreground">
            All time transcription count
          </div>
        </CardFooter>
      </Card>

      {/* Words This Week */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Words This Week</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(thisWeekWords)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {Number(weekOverWeekChange) >= 0 ? (
                <>
                  <IconTrendingUp />
                  +{weekOverWeekChange}%
                </>
              ) : (
                <>
                  <IconTrendingDown />
                  {weekOverWeekChange}%
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {Number(weekOverWeekChange) >= 0 ? (
              <>Trending up vs last week <IconTrendingUp className="size-4" /></>
            ) : (
              <>Down from last week <IconTrendingDown className="size-4" /></>
            )}
          </div>
          <div className="text-muted-foreground">
            Last week: {formatNumber(lastWeekWords)} words
          </div>
        </CardFooter>
      </Card>

      {/* Total Words */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Words</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(totalWords)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {Number(monthOverMonthChange) >= 0 ? (
                <>
                  <IconTrendingUp />
                  +{monthOverMonthChange}%
                </>
              ) : (
                <>
                  <IconTrendingDown />
                  {monthOverMonthChange}%
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {formatNumber(totalCharacters)} total characters
          </div>
          <div className="text-muted-foreground">
            Last 30 days: {formatNumber(last30DaysWords)} words
          </div>
        </CardFooter>
      </Card>

      {/* Average Words */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Avg Words per Session</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgWordsPerTranscription}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {todayWords} today
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Today: {todayEntries.length} transcriptions
          </div>
          <div className="text-muted-foreground">
            Average across all sessions
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
