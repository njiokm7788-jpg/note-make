# Project Documentation (CLAUDE.md)

## Purpose

This project is a React-based web application designed to process and overlay images, specifically focusing on combining original note images with AI-annotated versions. The application provides both single-image and batch-processing functionalities, allowing users to upload images, adjust processing options, preview results, and download the final combined images. It aims to offer a user-friendly interface for extracting and merging AI annotations with original clear images.

## Structure

The project follows a standard React application structure, generated likely by Vite, with a clear separation of concerns.

```
.
├── public/                 # Static assets (e.g., vite.svg)
├── src/                    # Main application source code
│   ├── App.tsx             # Main application component, orchestrates modes and state
│   ├── main.tsx            # Entry point for React application
│   ├── index.css           # Global CSS styles (likely Tailwind CSS)
│   ├── vite-env.d.ts       # Vite-specific TypeScript declarations
│   ├── components/         # Reusable UI components
│   │   ├── BatchProcessor.tsx
│   │   ├── ImagePreview.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── ProcessingPanel.tsx
│   │   └── CLAUDE.md       # Documentation for components
│   └── utils/              # Utility functions and helpers
│       ├── fileUtils.ts
│       ├── imageProcessor.ts
│       └── CLAUDE.md       # Documentation for utilities
├── .workflow/              # Project workflow and guidelines documentation
│   ├── CLAUDE.md           # Documentation for project structure
│   ├── project-guidelines.json
│   └── project-tech.json
├── package.json            # Project dependencies and scripts
├── package-lock.json       # Exact dependency versions
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
└── CLAUDE.md               # This documentation file
```

The `src` directory contains the core logic:
-   **`App.tsx`**: The root component, managing global state, routing between single and batch modes, and orchestrating interactions.
-   **`components/`**: Houses all reusable UI components. Refer to `src/components/CLAUDE.md` for detailed information on `BatchProcessor`, `ImagePreview`, `ImageUploader`, and `ProcessingPanel`.
-   **`utils/`**: Contains utility functions for file handling (`fileUtils.ts`) and image processing (`imageProcessor.ts`). Refer to `src/utils/CLAUDE.md` for detailed information.

## Components

The application is built using a modular component architecture in React.

-   **`App.tsx`**: This serves as the main application component, handling the overall application flow, managing global state (e.g., processing options, selected files, preview results), and switching between 'single' and 'batch' processing modes. It renders the appropriate UI based on the selected mode.

-   **Reusable UI Components (`src/components/`)**: These components are designed for specific UI functionalities:
    -   **`BatchProcessor.tsx`**: Manages the batch processing of multiple image pairs, including upload, pairing, progress tracking, and download of results.
    -   **`ImagePreview.tsx`**: Displays image previews, supporting transparency visualization with a checkered background.
    -   **`ImageUploader.tsx`**: Provides drag-and-drop image upload functionality with live previews and file selection.
    -   **`ProcessingPanel.tsx`**: Offers controls for image processing options like threshold, annotation opacity, and color inversion, along with process and download triggers.
    For detailed documentation on these components, their props, features, and internal dependencies, please refer to `src/components/CLAUDE.md`.

-   **Utility Functions (`src/utils/`)**: These modules provide core functionalities:
    -   **`fileUtils.ts`**: Contains helper functions for file handling (e.g., `generateId`, `getBaseName`, `downloadSingleResult`, `downloadBatchResults`, `isImageFile`, `formatFileSize`).
    -   **`imageProcessor.ts`**: Encapsulates the core image manipulation logic, including defining `ProcessingOptions` and implementing image processing based on these options.
    For more in-depth information about these utility functions and their usage, refer to `src/utils/CLAUDE.md`.

## Dependencies

The project relies on a mix of external libraries and internal modules to deliver its functionality.

**External Libraries (Inferred from `package.json` and code usage):**
-   **React**: The foundational library for building the user interface.
-   **Vite**: The build tool and development server, indicated by `vite-env.d.ts` and `vite.config.ts`.
-   **Tailwind CSS**: (Implicitly used via `index.css` and `className` attributes in JSX) A utility-first CSS framework for styling.
-   **`jszip`**: Used by `src/utils/fileUtils.ts` for creating zip archives, particularly for batch downloads.
-   **`file-saver`**: Used by `src/utils/fileUtils.ts` for initiating client-side file downloads.
-   **`@types/*`**: TypeScript type definitions for various libraries.

**Internal Modules:**
-   **`./src/components/*`**: UI components are imported and used by `App.tsx`.
-   **`./src/utils/*`**: Utility functions (`fileUtils.ts`, `imageProcessor.ts`) are imported and utilized across `App.tsx` and within various components for core logic.

## Integration

The different parts of the application integrate to form a cohesive system:

1.  **Application Bootstrapping**: `src/main.tsx` serves as the entry point, rendering the `App` component into the DOM.
2.  **Central Orchestration by `App.tsx`**:
    *   `App.tsx` manages the overarching application state, including user input for original and annotated files, current processing options, and the state of processing/download operations.
    *   It dynamically renders either the "single image processing" UI or the "batch processing" UI based on user selection.
    *   It passes state variables and callback functions as props to its child components (e.g., `ImageUploader`, `ProcessingPanel`, `BatchProcessor`), allowing them to update the application state or trigger actions.
3.  **UI Component Interaction**:
    *   `ImageUploader` components handle file selection and notify `App.tsx` (via `onFileSelect` prop) when new files are chosen.
    *   `ProcessingPanel` allows users to adjust `ProcessingOptions` (via `onChange` prop) and initiates processing (`onProcess`) or downloading (`onDownload`) actions managed by `App.tsx`.
    *   `ImagePreview` components receive image data from `App.tsx` to display results.
    *   `BatchProcessor` (when active) takes over specific state management for batch-related uploads and processing, often leveraging utility functions.
4.  **Utility Layer Support**:
    *   Functions from `src/utils/imageProcessor.ts` (e.g., `generatePreview`) are called by `App.tsx` to perform the actual image manipulation.
    *   Functions from `src/utils/fileUtils.ts` (e.g., `downloadSingleResult`, `downloadBatchResults`) are invoked by `App.tsx` or `BatchProcessor` to manage file operations and downloads.

The entire application uses Tailwind CSS for a consistent and responsive design language, ensuring a unified visual experience across all components.

## Implementation

The project adheres to modern web development and React best practices:

-   **React Functional Components and Hooks**: Extensively uses `useState`, `useCallback`, and other React hooks for efficient component state management, performance optimization, and cleaner code.
-   **TypeScript**: The entire codebase is written in TypeScript, providing type safety, improved code maintainability, and early error detection during development. Interfaces (e.g., `ProcessingOptions`) are used to define data structures clearly.
-   **Modular Design**: A clear separation of concerns is maintained, with UI elements encapsulated in `components/` and business logic/helpers in `utils/`. This promotes reusability, testability, and easier maintenance.
-   **Asynchronous Operations**: Image processing, file reading, and downloading are handled asynchronously (`async/await`) to prevent UI freezes and maintain a responsive user experience.
-   **State Management**: Local component state is managed using `useState`, with critical application-wide state often lifted to `App.tsx` and passed down via props.
-   **Error Handling**: Basic error handling is present (e.g., `try-catch` blocks in `handleProcess` in `App.tsx`), ensuring graceful degradation.
-   **User Experience**: Features like drag-and-drop for file uploads, visual feedback (loading indicators, disabled buttons), and detailed descriptions enhance usability.
-   **Accessibility**: Semantic HTML elements are used to improve accessibility.
-   **Styling**: Tailwind CSS is used for a highly customizable and efficient styling approach, ensuring consistent visual language and responsiveness.
