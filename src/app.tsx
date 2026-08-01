import { Button } from "@/components/ui/button"
import { RouterProvider } from 'react-router';
import { router } from './routes';
import "./styles/global.css"
function App() {
    return (
        <div className="min-h-screen">
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <RouterProvider router={router} />
        </div>
    )
}

export default App