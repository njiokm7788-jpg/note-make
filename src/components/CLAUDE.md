# CLAUDE.md for `components` Directory

## Purpose
The `components` directory houses reusable UI components for the image processing application. These components are designed to handle specific functionalities such as image uploading, batch processing, image preview, user interaction for processing settings, and status display, promoting modularity and reusability across the application.

## Structure
The directory contains individual React TypeScript (`.tsx`) files, each defining a distinct functional component. This structure keeps related logic and UI for each component encapsulated.

- `BatchProcessor.tsx`: Handles the batch uploading, pairing, and processing of multiple image files.
- `FloatingUploadButton.tsx`: A draggable floating button for quick access to upload functionalities.
- `ImagePreview.tsx`: Displays a single image with an optional title and subtitle, featuring a checkered background for transparency visualization.
- `ImageUploader.tsx`: Provides a UI for uploading a single image file, including drag-and-drop functionality and a preview.
- `ProcessingPanel.tsx`: Offers controls and options for image processing, such as threshold, opacity, and inversion, along with action buttons.
- `Sidebar.tsx`: The main sidebar for controlling processing options, presets, and other application settings.
- `UploadDrawer.tsx`: A bottom-slide-up drawer for uploading original and annotated image pairs.
- `UploadModal.tsx`: A modal dialog for uploading original and annotated image pairs.
- `UploadStatusBar.tsx`: Displays the current upload status of image pairs, including progress and errors.

## Components

### `BatchProcessor.tsx`
- **Purpose**: Facilitates the batch processing of image pairs (original and annotated). It allows users to drag and drop multiple image files, automatically pairs them based on filename similarity, and orchestrates their processing and download.
- **Key Features**:
    - Drag-and-drop file upload.
    - Automatic pairing of original and annotated images based on naming conventions (`_annotated`, `_marked`, `_标注`).
    - Displays a list of image pairs.
    - Progress indication during batch processing.
    - Integrates with `../utils/fileUtils` for file handling and batch downloads.
- **Props**:
    - `options: ProcessingOptions`: Configuration options for image processing.

### `FloatingUploadButton.tsx`
- **Purpose**: Provides a persistent, draggable button for initiating image uploads and clearing existing selections.
- **Key Features**:
    - Draggable positioning, remembering its last location.
    - Visual status indicator for upload state (empty, partial, complete).
    - Clear button to remove selected files.
- **Props**:
    - `originalFile: File | null`: The currently selected original file.
    - `annotatedFile: File | null`: The currently selected annotated file.
    - `onClick: () => void`: Callback triggered when the main button is clicked (usually to open an upload interface).
    - `onClear: () => void`: Callback triggered when the clear button is clicked.

### `ImagePreview.tsx`
- **Purpose**: A presentational component for displaying an image, typically used to show original, annotated, or processed images.
- **Key Features**:
    - Displays an image from a given source (`src`).
    - Includes a title and an optional subtitle.
    - Features a transparent checkered background.
- **Props**:
    - `src: string`: The source URL or data URL of the image to display.
    - `title: string`: The main title for the image preview.
    - `subtitle?: string`: An optional subtitle for the image preview.

### `ImageUploader.tsx`
- **Purpose**: Provides a user-friendly interface for uploading a single image file. It supports drag-and-drop and conventional file input, along with a visual preview of the selected image.
- **Key Features**:
    - Customizable label and description.
    - Drag-and-drop file upload.
    - Image preview once a file is selected.
    - Clear/remove selected file functionality.
    - File type acceptance filtering.
- **Props**:
    - `label: string`: The label displayed above the uploader.
    - `description: string`: A descriptive text for the uploader.
    - `onFileSelect: (file: File | null) => void`: Callback function triggered when a file is selected or cleared.
    - `accept?: string`: Specifies accepted file types (default: `'image/*'`).
    - `file?: File | null`: The currently selected file (for external control/display).

### `ProcessingPanel.tsx`
- **Purpose**: Manages the user interface for configuring image processing options and initiating the processing and download actions.
- **Key Features**:
    - Controls for `textThreshold`, `maskExpand`, `blockColor`, and `blockOpacity`.
    - Buttons to trigger `onProcess` (preview) and `onDownload` actions.
    - Disables buttons based on processing state and availability of images.
- **Props**:
    - `options: ProcessingOptions`: Current processing options.
    - `onChange: (options: ProcessingOptions) => void`: Callback to update processing options.
    - `onProcess: () => void`: Callback to initiate image processing.
    - `onDownload: () => void`: Callback to initiate result download.
    - `canProcess: boolean`: Indicates if processing can be initiated.
    - `canDownload: boolean`: Indicates if results can be downloaded.
    - `isProcessing: boolean`: Indicates if an image processing operation is currently underway.

### `Sidebar.tsx`
- **Purpose**: Serves as the primary control panel for the application, allowing users to configure image processing options, manage presets, and trigger actions.
- **Key Features**:
    - Collapsible design with keyboard shortcut (Ctrl+B).
    - Toggle for "Auto Preview".
    - "Quick Presets" section for saving and loading processing configurations.
    - Advanced settings for `textThreshold`, `maskExpand`, `blockColor`, and `blockOpacity`.
    - Buttons for "Preview Processing Effect" and "Download Result".
    - Responsive overlay mode for smaller screens.
- **Props**:
    - `options: ProcessingOptions`: Current processing options.
    - `onChange: (options: ProcessingOptions) => void`: Callback to update processing options.
    - `onDownload: () => void`: Callback to initiate result download.
    - `canDownload: boolean`: Indicates if results can be downloaded.
    - `isProcessing: boolean`: Indicates if an image processing operation is currently underway.
    - `collapsed: boolean`: Controls the collapsed state of the sidebar.
    - `onCollapsedChange: (collapsed: boolean) => void`: Callback to toggle the collapsed state.
    - `selectedPreset: string | null`: ID of the currently selected preset.
    - `onPresetChange: (preset: string | null) => void`: Callback to change the selected preset.
    - `autoPreview: boolean`: Controls whether preview updates automatically.
    - `onAutoPreviewChange: (auto: boolean) => void`: Callback to toggle auto preview.
    - `onProcess: () => void`: Callback to initiate image processing.
    - `canProcess: boolean`: Indicates if processing can be initiated.
    - `overlayMode?: boolean`: Adjusts styling for overlay display.
    - `userPresets: Preset[]`: Array of user-defined presets.
    - `onAddPreset: (name: string) => void`: Callback to add a new preset.
    - `onRemovePreset: (id: string) => void`: Callback to remove a preset.
    - `onUpdatePreset: (id: string, options: ProcessingOptions) => void`: Callback to update an existing preset.
    - `onResetPresets: () => void`: Callback to reset presets to default.

### `UploadDrawer.tsx`
- **Purpose**: A full-width drawer component that slides up from the bottom of the screen, providing an interface for users to upload original and annotated image files.
- **Key Features**:
    - Separate drop zones for original and annotated images with drag-and-drop support.
    - Real-time preview of selected image files.
    - Displays file names and upload instructions.
    - Closes on Escape key press.
    - Locks body scroll when open.
- **Props**:
    - `isOpen: boolean`: Controls the visibility of the drawer.
    - `onClose: () => void`: Callback to close the drawer.
    - `originalFile: File | null`: The currently selected original file.
    - `annotatedFile: File | null`: The currently selected annotated file.
    - `onOriginalSelect: (file: File) => void`: Callback when an original file is selected.
    - `onAnnotatedSelect: (file: File) => void`: Callback when an annotated file is selected.

### `UploadModal.tsx`
- **Purpose**: A modal dialog component centered on the screen, offering an interface for users to upload original and annotated image files.
- **Key Features**:
    - Separate drop zones for original and annotated images with drag-and-drop support.
    - Real-time preview of selected image files.
    - Displays file names and upload instructions.
    - Closes on Escape key press or backdrop click.
    - Implements focus trapping for accessibility.
    - Locks body scroll when open.
- **Props**:
    - `isOpen: boolean`: Controls the visibility of the modal.
    - `onClose: () => void`: Callback to close the modal.
    - `originalFile: File | null`: The currently selected original file.
    - `annotatedFile: File | null`: The currently selected annotated file.
    - `onOriginalSelect: (file: File) => void`: Callback when an original file is selected.
    - `onAnnotatedSelect: (file: File) => void`: Callback when an annotated file is selected.

### `UploadStatusBar.tsx`
- **Purpose**: Displays a concise summary of the current image upload status and provides quick actions like opening the upload interface or clearing files.
- **Key Features**:
    - Visual status indicator (empty, partial, complete, uploading, error).
    - Displays file thumbnails and names for original and annotated images.
    - Progress bar for ongoing uploads.
    - "Clear" button to reset selected files.
    - Supports drag-and-drop to open the upload interface.
- **Props**:
    - `originalFile: File | null`: The currently selected original file.
    - `annotatedFile: File | null`: The currently selected annotated file.
    - `onOpenDrawer: () => void`: Callback to open the upload drawer/modal.
    - `onClear: () => void`: Callback to clear selected files.
    - `uploadProgress?: number`: Optional, current upload progress (0-100).
    - `error?: string`: Optional, error message if an upload failed.

## Dependencies
The components primarily depend on React for their foundational structure and state management. They also rely on utility functions defined in parent directories for specific tasks:
- `../utils/fileUtils`: Provides functions like `isImageFile`, and potentially `generateId`, `getBaseName`, `downloadBatchResults`, and type definitions like `ImagePair`. (Used by `UploadDrawer.tsx`, `UploadModal.tsx`, `BatchProcessor.tsx`)
- `../utils/imageProcessor`: Provides type definitions like `ProcessingOptions` and `Preset`. (Used by `ProcessingPanel.tsx`, `Sidebar.tsx`)

Styling is handled using Tailwind CSS classes, indicated by the extensive use of `className` attributes. Hooks like `useState`, `useEffect`, `useCallback`, `useRef`, and `useId` are heavily utilized for managing state, side effects, and performance.

## Integration
These components are designed to be integrated into a larger application, likely within a main application component that manages the overall state, orchestrates file uploads, processing logic, and display of results. For instance:
- `FloatingUploadButton` and `UploadStatusBar` provide entry points and status feedback for file uploads, often triggering `UploadDrawer` or `UploadModal`.
- `UploadDrawer` or `UploadModal` would handle the selection of original and annotated image files.
- `BatchProcessor` would handle multiple files and manage its internal pairing and processing state.
- `Sidebar` (which internally uses `ProcessingPanel`'s logic) would control the parameters for processing and trigger actions that affect `ImagePreview` or initiate batch processes.
- `ImagePreview` would be used to display the various stages of images (original, annotated, processed results).

The communication between these components and their parent would typically be through props (passing data down) and callbacks (passing events/data up), following React's unidirectional data flow. Global state management (e.g., React Context or a library like Zustand/Redux) might be used for application-wide data like `ProcessingOptions` and file states.

## Implementation
The components are implemented as React functional components leveraging hooks like `useState` for managing internal state (e.g., `isDragging`, `pairs`, `preview`), `useEffect` for handling side effects (e.g., opening/closing animations, keyboard events, body scroll locking, file previews), and `useCallback` for memoizing event handlers to optimize performance and prevent unnecessary re-renders. TypeScript is used throughout to ensure type safety and improve code maintainability. Styling is applied using Tailwind CSS utility classes, contributing to a consistent and responsive UI. SVG icons are embedded directly within the JSX for visual elements. Some components utilize `useRef` for direct DOM manipulation (e.g., `FloatingUploadButton` for dragging, `UploadModal` for focus trapping). Local storage is used by `FloatingUploadButton` to persist its position.
