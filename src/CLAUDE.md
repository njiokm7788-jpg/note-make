# CLAUDE.md - Image Overlay Tool Application (`src` directory)

## Purpose
This application is a web-based image processing tool designed to overlay annotated images onto original images, primarily for enhancing notes or highlighting specific content. It allows users to upload pairs of images (original and AI-annotated), configure various processing options (e.g., text detection threshold, mask expansion, block color/opacity), preview the results in real-time, and download the final processed images. The tool supports both single-image processing and batch processing of multiple image pairs, along with a robust preset management system for quick configuration.

## Structure
The `src` directory serves as the root for the main application logic and UI components.

-   `App.tsx`: The main application component that orchestrates state, manages application flow, and renders the primary UI.
-   `main.tsx`: Entry point for the React application, responsible for rendering the `App` component into the DOM.
-   `index.css`: Global CSS styles, likely including Tailwind CSS directives and custom styles.
-   `vite-env.d.ts`: TypeScript declaration file for Vite-specific environment variables.
-   `components/`: Contains reusable React UI components. (Refer to `src/components/CLAUDE.md` for details)
-   `utils/`: Houses utility functions for file handling and core image processing logic. (Refer to `src/utils/CLAUDE.md` for details)

## Components
The application's user interface is built using a set of modular React components located in the `src/components` directory. These include:
-   `ImagePreview`: For displaying various image stages (original, annotated, result).
-   `Sidebar`: The primary control panel for processing options, preset management, and action triggers.
-   `FloatingUploadButton`: A persistent button for quick upload access and status.
-   `UploadModal` / `UploadDrawer`: Interfaces for uploading original and annotated image pairs.
-   `BatchProcessor`: Manages the workflow for processing multiple image pairs.
-   Other components like `ImageUploader`, `ProcessingPanel`, and `UploadStatusBar` support specific UI functionalities.

For a detailed description of each component, their purpose, structure, and integration, please refer to: `src/components/CLAUDE.md`

## Dependencies
### Internal Dependencies:
-   `./utils/imageProcessor.ts`: Provides core image manipulation functions, preset management, and the main `generatePreview` and `processImagePair` logic.
-   `./utils/fileUtils.ts`: Offers utilities for file operations, such as downloading single or batch results, and image file type checks.

### External Libraries/Frameworks:
-   **React**: The core JavaScript library for building user interfaces. Utilizes hooks like `useState`, `useEffect`, `useCallback`, and `useRef` for state management, side effects, and performance optimization.
-   **Tailwind CSS**: A utility-first CSS framework used for styling the application's UI, providing a responsive and modern aesthetic.

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

The comprehensive functionality of the `src` directory, combining robust image processing utilities with a responsive and interactive React front-end, enables efficient and flexible image annotation and overlay capabilities.

For deeper insights into the specific implementations of image processing and file utilities, refer to `src/utils/CLAUDE.md`.
