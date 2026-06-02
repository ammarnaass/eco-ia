import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransition({ children }) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('enter')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('exit')
    }
  }, [location, displayLocation])

  return (
    <div
      key={displayLocation.pathname}
      className={`w-full ${transitionStage === 'enter' ? 'animate-slide-in' : ''}`}
      onAnimationEnd={() => setTransitionStage('enter')}
    >
      {children}
    </div>
  )
}
