import { useEffect, useState, useRef } from 'react'
import { motion, animate } from 'framer-motion'

/**
 * Animated number counter for stat cards. Smoothly counts from previous to new value.
 */
export default function AnimatedCounter({ value, duration = 0.5, className = '' }) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    prevRef.current = displayValue
  }, [displayValue])

  useEffect(() => {
    if (value === prevRef.current) return
    const from = prevRef.current
    const controls = animate(from, value, {
      duration,
      onUpdate: (v) => {
        const rounded = Math.round(v)
        setDisplayValue(rounded)
        prevRef.current = rounded
      },
    })
    return () => controls.stop()
  }, [value, duration])

  return (
    <motion.span
      className={className}
      key={value}
      initial={{ opacity: 0.85, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {displayValue}
    </motion.span>
  )
}
