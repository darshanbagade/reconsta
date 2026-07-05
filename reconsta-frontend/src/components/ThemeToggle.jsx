import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme()

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="rc-btn-secondary h-9 px-3 text-sm"
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {/* <span>{isDark ? 'Light' : 'Dark'}</span> */}
        </button>
    )
}

export default ThemeToggle