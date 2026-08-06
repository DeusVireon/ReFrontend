import { createBrowserRouter, redirect } from "react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: DashboardLayout,
        children: [
            {
                index: true,
                lazy: async () => {
                    const { DashboardView } = await import("./views/Dashboard/Dashboard");
                    return { Component: DashboardView };
                },
            },
            {
                path: "analyze",
                lazy: async () => {
                    const { DataAnalyze } = await import("./views/DataAnalyze/DataAnalyze");
                    return { Component: DataAnalyze };
                },
            },
            {
                path: "*",
                lazy: async () => {
                    const { NotFoundView } = await import("./views/ErrorPage/NotFound");
                    return { Component: NotFoundView };
                },
            },
        ],
    },
]);