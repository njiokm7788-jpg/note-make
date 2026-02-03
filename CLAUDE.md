# Project Documentation (CLAUDE.md)

## Purpose

This project is a React-based web application designed to process and overlay images, specifically focusing on combining original note images with AI-annotated versions. The application provides both single-image and batch-processing functionalities, allowing users to upload images, adjust processing options, preview results, and download the final combined images. It aims to offer a user-friendly interface for enhancing notes by highlighting specific content through AI annotations.

## Structure

The project follows a standard React application structure, likely initialized with Vite, and adheres to a clear separation of concerns.

```
.
├── public/                 # Static assets (e.g., vite.svg)
├── src/                    # Main application source code
│   ├── App.tsx             # Main application component, orchestrates modes and state
│   ├── main.tsx            # Entry point for React application
│   ├── index.css           # Global CSS styles (likely Tailwind CSS)
│   ├── vite-env.d.ts       # Vite-specific TypeScript declarations
│   ├── components/         # Reusable UI components
│   │   └── CLAUDE.md       # Documentation for components
│   └── utils/              # Utility functions and helpers
│       ├── fileUtils.ts
│       ├── imageProcessor.ts
│       └── CLAUDE.md       # Documentation for utilities
├── .workflow/              # Project workflow and guidelines documentation
│   ├── CCW-WORKFLOW-GUIDE.md
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
-   **`main.tsx`**: The entry point for the React application, responsible for rendering the `App` component into the DOM.
-   **`index.css`**: Global CSS styles, primarily leveraging Tailwind CSS for a utility-first approach.
-   **`vite-env.d.ts`**: TypeScript declaration file for Vite-specific environment variables.
-   **`components/`**: Houses all reusable UI components. Refer to `src/components/CLAUDE.md` for detailed information on components like `BatchProcessor`, `ImagePreview`, `ImageUploader`, `ProcessingPanel`, `Sidebar`, `FloatingUploadButton`, `UploadModal`, `UploadDrawer`, and `UploadStatusBar`.
-   **`utils/`**: Contains utility functions for file handling (`fileUtils.ts`) and image processing (`imageProcessor.ts`). Refer to `src/utils/CLAUDE.md` for detailed information.

## Components

The application is built using a modular component architecture in React.

-   **`App.tsx`**: This serves as the main application component, handling the overall application flow, managing global state (e.g., processing options, selected files, preview results), and switching between 'single' and 'batch' processing modes. It renders the appropriate UI based on the selected mode and integrates various sub-components.

-   **Reusable UI Components (`src/components/`)**: These components are designed for specific UI functionalities, including:
    -   `BatchProcessor`: Manages the batch processing workflow.
    -   `FloatingUploadButton`: Provides a persistent upload interface.
    -   `ImagePreview`: Displays various stages of image processing.
    -   `ImageUploader`: Handles single image file uploads.
    -   `ProcessingPanel`: Offers controls for image processing options.
    -   `Sidebar`: The main control panel for options and presets.
    -   `UploadDrawer`: A drawer for image uploads.
    -   `UploadModal`: A modal for image uploads.
    -   `UploadStatusBar`: Displays upload progress and status.
    For detailed documentation on these components, their props, features, and internal dependencies, please refer to `src/components/CLAUDE.md`.

-   **Utility Functions (`src/utils/`)**: These modules provide core functionalities:
    -   **`fileUtils.ts`**: Contains helper functions for file operations such as downloading results and handling image file types.
    -   **`imageProcessor.ts`**: Encapsulates the core image manipulation logic, including text mask extraction, color block application, and preset management.
    For more in-depth information about these utility functions and their usage, refer to `src/utils/CLAUDE.md`.

## Dependencies

The project relies on a mix of external libraries and internal modules to deliver its functionality.

### External Libraries/Frameworks:
-   **React (v19.0.0)**: The foundational library for building user interfaces. Utilizes hooks like `useState`, `useEffect`, `useCallback`, and `useRef` for state management, side effects, and performance optimization.
-   **Vite (v6.0.5)**: The build tool and development server, as indicated by `vite.config.ts`, `vite-env.d.ts`, and `package.json` scripts.
-   **Tailwind CSS (v4.0.0)**: A utility-first CSS framework used for styling the application's UI, providing a responsive and modern aesthetic. Integrated via `@tailwindcss/vite` plugin.
-   **`jszip` (v3.10.1)**: Used for creating zip archives, particularly for batch downloads in `fileUtils.ts`.
-   **`file-saver` (v2.0.5)**: Used for initiating client-side file downloads in `fileUtils.ts`.
-   **`oh-my-opencode-windows-x64` (v3.1.10)**: (Specific purpose not detailed in provided context, but listed as a dependency.)
-   **`@types/*` packages**: TypeScript type definitions for various libraries (e.g., `@types/react`, `@types/react-dom`, `@types/file-saver`).
-   **ESLint and TypeScript ESLint**: For code linting and ensuring code quality (`eslint.config.js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `typescript-eslint`).

### Internal Dependencies:
-   **`./src/components/*`**: All UI components are imported and used by `App.tsx` and other components.
-   **`./src/utils/imageProcessor.ts`**: Provides core image manipulation functions, preset management, and the main `generatePreview` and `processImagePair` logic.
-   **`./src/utils/fileUtils.ts`**: Offers utilities for file operations, such as downloading single or batch results, and image file type checks.

### Browser APIs:
-   `localStorage`: Used for persisting user preferences like sidebar collapse state and selected presets.
-   `window.matchMedia`: Employed for responsive screen size detection.
-   `ClipboardEvent` / `document.addEventListener('paste')`: For handling image pasting functionality.
-   Standard DOM APIs (`HTMLImageElement`, `HTMLCanvasElement`, `ImageData`, `File`, `Blob`, `URL.createObjectURL`, etc.) are heavily utilized by the `imageProcessor` and `fileUtils` utilities for image manipulation and file handling.

## Integration

The `App.tsx` component acts as the central orchestrator, integrating various UI components and utility functions to provide a cohesive user experience.

-   **State Management**: `App.tsx` manages crucial application states, including the current mode (`single` or `batch`), uploaded `originalFile` and `annotatedFile`, processing `options`, user `presets`, UI states (e.g., `isDrawerOpen`, `sidebarCollapsed`, `showComparison`, `isProcessing`), and feedback mechanisms (`toast`).
-   **Component Interaction**: It passes down relevant states as props to child components (e.g., `options` to `Sidebar`, `originalFile` to `FloatingUploadButton`) and receives updates via callback functions (e.g., `onChange` from `Sidebar`, `onOriginalSelect` from `UploadModal`).
-   **Utility Integration**: It invokes functions from `utils/imageProcessor.ts` (e.g., `generatePreview`, `loadUserPresets`, `addUserPreset`) and `utils/fileUtils.ts` (`downloadSingleResult`) to perform core application logic.
-   **Event Handling**: Global event listeners for `paste` and `keydown` are set up in `App.tsx` to enable features like pasting images directly and keyboard shortcuts (e.g., Ctrl+S for download, Space for comparison view, Escape for closing overlays).
-   **Responsive Design**: The `useScreenSize` hook dynamically adjusts UI behavior, such as sidebar auto-collapse on smaller screens, enhancing adaptability across devices.
-   **Mode Switching**: The header provides a toggle to switch between 'single' and 'batch' processing modes, altering the main content area accordingly.

## Implementation

The application is implemented using React functional components and hooks, following a modern front-end development approach.

-   **Application Flow**:
    1.  **Initialization**: Upon loading, `App.tsx` initializes state, including loading user presets and sidebar collapse status from `localStorage`.
    2.  **Mode Selection**: Users can switch between 'single' and 'batch' processing modes via a toggle in the header.
    3.  **Image Upload (Single Mode)**: Users can upload `originalFile` and `annotatedFile` via `FloatingUploadButton` and `UploadModal` (or by pasting images).
    4.  **Option Configuration**: In 'single' mode, the `Sidebar` allows users to adjust `ProcessingOptions` and manage `Preset`s. In 'batch' mode, a simplified `ProcessingPanel` (within `App.tsx`'s batch section) handles preset/option changes, which are automatically saved to the selected preset.
    5.  **Real-time Preview**: When `autoPreview` is enabled, changes to `originalFile`, `annotatedFile`, or `options` trigger a debounced call to `generatePreview` from `imageProcessor.ts`, updating the `ImagePreview` component. Manual processing is also available.
    6.  **Comparison View**: In 'single' mode, users can toggle between a simplified view (final result only) and a comparison view (showing original, annotated, annotation layer, and final result).
    7.  **Download**: Users can download the processed image in single mode, or a batch of processed images in batch mode.
-   **Core Logic**:
    -   **Image Processing**: The heavy lifting of image manipulation (scaling, text mask extraction, color block application) is delegated to functions in `src/utils/imageProcessor.ts`.
    -   **Preset Management**: User-defined presets are stored and retrieved from `localStorage`, with functions for adding, removing, updating, and resetting them.
    -   **Debouncing**: The `useDebounce` hook is used to optimize the real-time preview, preventing excessive processing calls when options are rapidly changed.
    -   **Persistence**: User preferences like `sidebarCollapsed` and `selectedPreset` are saved in `localStorage` to maintain state across sessions.
    -   **Accessibility & UX**: Keyboard shortcuts (e.g., Ctrl+S, Space, Escape) are implemented for improved usability, and a custom `Toast` component provides non-intrusive feedback.
    -   **Responsiveness**: The `useScreenSize` hook dynamically adapts the layout and behavior, notably the sidebar's display, for mobile, tablet, and desktop views.

The comprehensive functionality of the application, combining robust image processing utilities with a responsive and interactive React front-end, enables efficient and flexible image annotation and overlay capabilities.

For deeper insights into the specific implementations of image processing and file utilities, refer to `src/utils/CLAUDE.md`.
For a detailed breakdown of each UI component, refer to `src/components/CLAUDE.md`.