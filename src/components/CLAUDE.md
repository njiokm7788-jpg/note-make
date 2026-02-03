# CLAUDE.md for `components` Directory

## Purpose
The `components` directory houses reusable UI components for the image processing application. These components are designed to handle specific functionalities such as image uploading, batch processing, image preview, and user interaction for processing settings, promoting modularity and reusability across the application.

## Structure
The directory contains individual React TypeScript (`.tsx`) files, each defining a distinct functional component. This structure keeps related logic and UI for each component encapsulated.

- `BatchProcessor.tsx`: Handles the batch uploading, pairing, and processing of multiple image files.
- `ImagePreview.tsx`: Displays a single image with an optional title and subtitle, featuring a checkered background for transparency visualization.
- `ImageUploader.tsx`: Provides a UI for uploading a single image file, including drag-and-drop functionality and a preview.
- `ProcessingPanel.tsx`: Offers controls and options for image processing, such as threshold, opacity, and inversion, along with action buttons.

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
    - Controls for `threshold` and `annotationOpacity`.
    - Toggle for `invertAnnotation`.
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

## Dependencies
The components primarily depend on React for their foundational structure and state management. They also rely on utility functions defined in parent directories for specific tasks:
- `../utils/fileUtils`: Provides functions like `generateId`, `getBaseName`, `isImageFile`, `downloadBatchResults`, and type definitions like `ImagePair`.
- `../utils/imageProcessor`: Provides type definitions like `ProcessingOptions`.

Styling is handled using Tailwind CSS classes, indicated by the extensive use of `className` attributes.

## Integration
These components are designed to be integrated into a larger application, likely within a main application component that manages the overall state, orchestrates file uploads, processing logic, and display of results. For instance:
- `ImageUploader` instances would provide individual files to the main state.
- `BatchProcessor` would handle multiple files and manage its internal pairing and processing state.
- `ProcessingPanel` would control the parameters for processing and trigger actions that affect `ImagePreview` or initiate batch processes.
- `ImagePreview` would be used to display the various stages of images (original, annotated, processed results).

The communication between these components and their parent would typically be through props (passing data down) and callbacks (passing events/data up), following React's unidirectional data flow.

## Implementation
The components are implemented as React functional components leveraging hooks like `useState` for managing internal state (e.g., `isDragging`, `pairs`, `preview`) and `useCallback` for memoizing event handlers to optimize performance and prevent unnecessary re-renders. TypeScript is used throughout to ensure type safety and improve code maintainability. Styling is applied using Tailwind CSS utility classes, contributing to a consistent and responsive UI. SVG icons are embedded directly within the JSX for visual elements.