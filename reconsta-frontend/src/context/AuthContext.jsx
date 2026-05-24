import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react'
import {
    getCurrentUser,
    loginUser,
    logoutUser
} from '../services/authApi'

const AuthContext = createContext(null)

const extractUserFromResponse = (response) => {
    return (
        response?.data?.user ||
        response?.data?.currentUser ||
        response?.data?.loggedInUser ||
        response?.user ||
        null
    )
}

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    const refreshUser = useCallback(async () => {
        try {
            const response = await getCurrentUser()
            const currentUser = extractUserFromResponse(response)

            setUser(currentUser)
            return currentUser
        } catch {
            setUser(null)
            return null
        } finally {
            setIsCheckingAuth(false)
        }
    }, [])

    useEffect(() => {
        refreshUser()
    }, [refreshUser])

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null)
            setIsCheckingAuth(false)
        }

        window.addEventListener('reconsta:unauthorized', handleUnauthorized)

        return () => {
            window.removeEventListener('reconsta:unauthorized', handleUnauthorized)
        }
    }, [])

    const login = useCallback(
        async ({ email, password }) => {
            const response = await loginUser({
                email,
                password
            })

            if (!response?.success) {
                throw new Error(response?.message || 'Login failed')
            }

            const loggedInUser = extractUserFromResponse(response)

            if (loggedInUser) {
                setUser(loggedInUser)
                return loggedInUser
            }

            const currentUser = await refreshUser()

            if (!currentUser) {
                throw new Error('Login failed. User session was not created.')
            }

            return currentUser
        },
        [refreshUser]
    )

    const logout = useCallback(async () => {
        try {
            await logoutUser()
        } finally {
            setUser(null)
            setIsCheckingAuth(false)
        }
    }, [])

    const value = useMemo(() => {
        return {
            user,
            isAuthenticated: Boolean(user),
            isCheckingAuth,
            login,
            logout,
            refreshUser
        }
    }, [user, isCheckingAuth, login, logout, refreshUser])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

const useAuth = () => {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider')
    }

    return context
}

export {
    AuthProvider,
    useAuth
}