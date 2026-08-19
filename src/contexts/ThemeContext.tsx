import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark'
type TransitionPhase = 'idle' | 'entering' | 'exiting'

interface ThemeContextValue {
    theme: Theme
    targetTheme: Theme
    isTransitioning: boolean
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

const STORAGE_KEY = 'refe-theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'dark'
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored === 'light' || stored === 'dark') return stored
    } catch {
        // Storage may be unavailable in privacy-restricted environments.
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
    const root = document.documentElement
    root.dataset.theme = theme
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setCurrentTheme] = useState<Theme>(getInitialTheme)
    const [targetTheme, setTargetTheme] = useState<Theme>(theme)
    const [phase, setPhase] = useState<TransitionPhase>('idle')
    const transitionLock = useRef(false)

    const commitTheme = useCallback((nextTheme: Theme) => {
        applyTheme(nextTheme)
        setCurrentTheme(nextTheme)
        try {
            window.localStorage.setItem(STORAGE_KEY, nextTheme)
        } catch {
            // Keep the in-memory theme functional.
        }
    }, [])

    useLayoutEffect(() => {
        commitTheme(theme)
    }, [commitTheme, theme])

    const requestTheme = useCallback((nextTheme: Theme) => {
        if (transitionLock.current || nextTheme === theme) return
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            commitTheme(nextTheme)
            setTargetTheme(nextTheme)
            return
        }
        transitionLock.current = true
        setTargetTheme(nextTheme)
        setPhase('entering')
    }, [commitTheme, theme])

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        targetTheme,
        isTransitioning: phase !== 'idle',
        setTheme: requestTheme,
        toggleTheme: () => requestTheme(theme === 'dark' ? 'light' : 'dark'),
    }), [phase, requestTheme, targetTheme, theme])

    return (
        <ThemeContext.Provider value={value}>
            {children}
            <ThemeWave
                phase={phase}
                targetTheme={targetTheme}
                onCovered={() => {
                    commitTheme(targetTheme)
                    setPhase('exiting')
                }}
                onComplete={() => {
                    transitionLock.current = false
                    setPhase('idle')
                }}
            />
        </ThemeContext.Provider>
    )
}

function ThemeWave({
    phase,
    targetTheme,
    onCovered,
    onComplete,
}: {
    phase: TransitionPhase
    targetTheme: Theme
    onCovered: () => void
    onComplete: () => void
}) {
    useEffect(() => {
        if (phase === 'idle') return
        const timer = window.setTimeout(
            phase === 'entering' ? onCovered : onComplete,
            phase === 'entering' ? 850 : 680,
        )
        return () => window.clearTimeout(timer)
    }, [onComplete, onCovered, phase])

    if (phase === 'idle') return null
    return (
        <div className={`theme-wave theme-wave--${phase}`} data-target-theme={targetTheme} aria-hidden="true">
            <div className="theme-wave__layer theme-wave__layer--back" />
            <div className="theme-wave__layer theme-wave__layer--middle" />
            <div className="theme-wave__layer theme-wave__layer--front" />
            <div className="theme-wave__sheen" />
        </div>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error('useTheme must be used within ThemeProvider')
    return context
}
