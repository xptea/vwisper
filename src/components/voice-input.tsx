import React from "react"
import { Mic } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

interface VoiceInputProps {
  onStart?: () => void
  onStop?: () => void
  listening?: boolean
}

export function VoiceInput({
  className,
  onStart,
  onStop,
  listening: externalListening,
}: React.ComponentProps<"div"> & VoiceInputProps) {
  const [internalListening, setInternalListening] = React.useState<boolean>(false)
  const [time, setTime] = React.useState<number>(0)

  const listening = externalListening !== undefined ? externalListening : internalListening

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (listening) {
      onStart?.()
      intervalId = setInterval(() => {
        setTime((t) => t + 1)
      }, 1000)
    } else {
      onStop?.()
      setTime(0)
    }

    return () => clearInterval(intervalId)
  }, [listening, onStart, onStop])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const onClickHandler = () => {
    if (externalListening === undefined) {
      setInternalListening(!internalListening)
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <motion.div
        className="flex p-2 border border-black/20 bg-white items-center justify-center rounded-full cursor-pointer"
        layout
        transition={{
          layout: {
            duration: 0.4,
          },
        }}
        onClick={onClickHandler}
      >
        <div className="h-6 w-6 items-center justify-center flex text-black">
          {listening ? (
            <motion.div
              className="w-4 h-4 bg-black rounded-sm"
              animate={{
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ) : (
            <Mic className="text-black" />
          )}
        </div>
        <AnimatePresence mode="wait">
          {listening && (
            <motion.div
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{
                duration: 0.4,
              }}
              className="overflow-hidden flex gap-2 items-center justify-center"
            >
              {/* Frequency Animation */}
              <div className="flex gap-0.5 items-center justify-center">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-black rounded-full"
                    initial={{ height: 2 }}
                    animate={{
                      height: listening
                        ? [2, 3 + Math.random() * 10, 3 + Math.random() * 5, 2]
                        : 2,
                    }}
                    transition={{
                      duration: listening ? 1 : 0.3,
                      repeat: listening ? Infinity : 0,
                      delay: listening ? i * 0.05 : 0,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              {/* Timer */}
              <div className="text-xs text-black w-10 text-center">
                {formatTime(time)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
