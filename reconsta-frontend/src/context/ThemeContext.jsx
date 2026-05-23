import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

const getInitialTheme = () => {
    const storedTheme = localStorage.getItem('reconsta-theme')

    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme
    }

    return 'dark'
}

const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme)

    useLayoutEffect(() => {
        const root = document.documentElement

        root.classList.remove('light', 'dark')
        root.classList.add(theme)

        localStorage.setItem('reconsta-theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
    }

    const value = useMemo(() => {
        return {
            theme,
            isDark: theme === 'dark',
            toggleTheme
        }
    }, [theme])

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

const useTheme = () => {
    const context = useContext(ThemeContext)

    if (!context) {
        throw new Error('useTheme must be used inside ThemeProvider')
    }

    return context
}

export {
    ThemeProvider,
    useTheme
}