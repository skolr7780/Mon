import ReactDOM from "react-dom/client";
// @ts-ignore
import { BrowserRouter as Router, Route, Routes, RouterProvider, createBrowserRouter } from "react-router-dom";
import Gallery from "./Pages/Galery/gallery.tsx";
import Home from "./Pages/Home/home.tsx";
import Users from "./Pages/Users/users.tsx";

// iOS optimization
const initIOSOptimizations = () => {
    // Fix iOS height issue (100vh)
    const setVhProperty = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Fix iOS double-tap zoom
    const addTouchStartListener = () => {
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    };

    // Fix iOS keyboard behavior
    const handleIOSKeyboard = () => {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                window.scrollTo(0, 0);
            });
        });
    };

    // Detect iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
        // Add vh variable for iOS
        setVhProperty();
        window.addEventListener('resize', setVhProperty);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVhProperty, 100);
        });
        
        // Add touch optimizations
        addTouchStartListener();
        
        // Add keyboard handling
        handleIOSKeyboard();
        
        // Add iOS class for specific styling
        document.documentElement.classList.add('ios-device');
    }
};

// Initialize optimizations
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initIOSOptimizations);
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />,
    },
    {
        path: "/gallery",
        element: <Gallery />,
    },
    {
        path: "/users",
        element: <Users />,
    },
], {
    basename: "/Mon"
});

function App() {
    return <RouterProvider router={router} />;
}

document.title = "Monopoly";
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);

