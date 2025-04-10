import ReactDOM from "react-dom/client";
// @ts-ignore
import { BrowserRouter as Router, Route, Routes, RouterProvider, createBrowserRouter } from "react-router-dom";
import Gallery from "./Pages/Galery/gallery.tsx";
import Home from "./Pages/Home/home.tsx";
import Users from "./Pages/Users/users.tsx";

const router = createBrowserRouter([
    {
        path: "/Mon",
        element: <Home />,
    },
    {
        path: "/Mon/gallery",
        element: <Gallery />,
    },
    {
        path: "/Mon/users",
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

