import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import "./styles/global.css"
function App() {
    return (
        <ThemeProvider>
            <div className="theme-root min-h-screen">
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <RouterProvider router={router} />
            </div>
        </ThemeProvider>
    )
}

export default App