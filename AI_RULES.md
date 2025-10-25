# AI Development Rules

This document outlines the technology stack and provides clear guidelines for developing this application. Following these rules ensures consistency, maintainability, and leverages the strengths of our chosen libraries.

## Tech Stack

This project is built with a modern, component-based architecture. The key technologies are:

-   **Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/) for a fast development experience.
-   **Language**: [TypeScript](https://www.typescriptlang.org/) for static typing and improved code quality.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a utility-first CSS workflow.
-   **UI Components**: [shadcn/ui](https://ui.shadcn.com/) for a pre-built, accessible, and customizable component library.
-   **Icons**: [Lucide React](https://lucide.dev/) for a comprehensive and consistent set of icons.
-   **Routing**: [React Router](https://reactrouter.com/) for declarative, client-side routing.
-   **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest) (formerly React Query) for managing server state, including caching, refetching, and synchronization.
-   **Forms**: [React Hook Form](https://react-hook-form.com/) for performant and flexible form state management, paired with [Zod](https://zod.dev/) for schema validation.

## Library Usage Rules

To maintain consistency, please adhere to the following rules when adding or modifying features:

-   **UI Components**:
    -   **ALWAYS** use components from the `shadcn/ui` library (`@/components/ui/*`) when a suitable component exists.
    -   Do not create custom components for common UI elements like buttons, inputs, dialogs, etc.
    -   If you need to customize a `shadcn/ui` component, extend it using composition rather than modifying the base component file.

-   **Styling**:
    -   **ALL** styling must be done with Tailwind CSS utility classes.
    -   Avoid writing custom CSS in `.css` files unless absolutely necessary for complex animations or global base styles.
    -   Use the `cn` utility function from `@/lib/utils.ts` to conditionally apply classes.

-   **Icons**:
    -   Use icons exclusively from the `lucide-react` package. This ensures visual consistency across the application.

-   **Routing**:
    -   All page routes should be defined in `src/App.tsx` using `react-router-dom`.
    -   Create new page components inside the `src/pages/` directory.

-   **State Management**:
    -   For **server state** (data fetched from an API), use `TanStack Query`. This includes handling loading, error, and cached states.
    -   For **client state** (UI state like toggles, modals, etc.), use React's built-in hooks (`useState`, `useReducer`, `useContext`).

-   **Forms**:
    -   Use `react-hook-form` for all forms to manage state, validation, and submissions.
    -   Define validation schemas using `zod` and connect them using `@hookform/resolvers`.

-   **Notifications**:
    -   Use `sonner` for simple, non-blocking notifications (toasts).
    -   Use the custom `useToast` hook for more complex or interactive toast messages.

-   **File Structure**:
    -   **Pages**: `src/pages/`
    -   **Reusable Components**: `src/components/`
    -   **Custom Hooks**: `src/hooks/`
    -   **Utility Functions**: `src/lib/`