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
        >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
            {/* <span>{isDark ? 'Light' : 'Dark'}</span> */}
        </button>
    )
}

export default ThemeToggle