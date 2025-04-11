import ReactDOM from "react-dom/client";
// @ts-ignore
import { BrowserRouter as Router, Route, Routes, RouterProvider, createBrowserRouter } from "react-router-dom";
import Gallery from "./Pages/Galery/gallery.tsx";
import Home from "./Pages/Home/home.tsx";
import Users from "./Pages/Users/users.tsx";

// Mobile optimization
const initMobileOptimizations = () => {
    // Fix viewport height issue
    const setVhProperty = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Prevent double-tap zoom
    const addTouchStartListener = () => {
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    };

    // Handle mobile keyboard
    const handleMobileKeyboard = () => {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });
            
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });
        });
    };

    // Handle orientation changes
    const handleOrientationChange = () => {
        setTimeout(() => {
            setVhProperty();
            window.scrollTo(0, 0);
        }, 100);
    };

    // Handle mobile menu
    const handleMobileMenu = () => {
        const menuButton = document.querySelector('.menu-button');
        const menu = document.querySelector('main nav.main');
        
        if (menuButton && menu) {
            menuButton.addEventListener('click', () => {
                menu.setAttribute('data-visible', 
                    menu.getAttribute('data-visible') === 'true' ? 'false' : 'true'
                );
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (menu.getAttribute('data-visible') === 'true' && 
                    !menu.contains(e.target as Node) && 
                    !menuButton.contains(e.target as Node)) {
                    menu.setAttribute('data-visible', 'false');
                }
            });
        }
    };

    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isMobile) {
        // Add vh variable
        setVhProperty();
        window.addEventListener('resize', setVhProperty);
        window.addEventListener('orientationchange', handleOrientationChange);
        
        // Add touch optimizations
        addTouchStartListener();
        
        // Add keyboard handling
        handleMobileKeyboard();
        
        // Add mobile menu handling
        handleMobileMenu();
        
        // Add device class for specific styling
        document.documentElement.classList.add('mobile-device');
        
        if (isIOS) {
            document.documentElement.classList.add('ios-device');
            
            // iOS specific optimizations
            document.body.style.overscrollBehaviorY = 'none';
            (document.body.style as any).webkitOverflowScrolling = 'touch';
            
            // Prevent pull-to-refresh
            document.body.style.overscrollBehavior = 'none';
            
            // Fix for iOS 100vh issue
            document.documentElement.style.height = '100%';
            document.documentElement.style.minHeight = '100%';
            document.body.style.height = '100%';
            document.body.style.minHeight = '100%';
        }

        // Show mobile menu button
        const menuButton = document.querySelector('.menu-button');
        if (menuButton) {
            (menuButton as HTMLElement).style.display = 'flex';
        }
    }
};

// Initialize optimizations
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initMobileOptimizations);
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

