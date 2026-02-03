# CLAUDE.md - Image Processing Utilities

## Purpose
This directory (`src/utils`) contains utility functions designed to support image processing operations, specifically focusing on the detection and highlighting of text regions within images. The core functionality provided is the ability to process pairs of original and annotated images to generate a new image where non-text areas are overlaid with a semi-transparent color block, based on predefined or customizable options. This is particularly useful for creating specialized notes or highlighting content.

## Structure
The `src/utils` directory comprises the following files:
- `imageProcessor.ts`: Contains the core logic for image loading, processing, text mask extraction, and color block application. It also manages user-defined presets for processing options.
- `fileUtils.ts`: (Content not provided, but acknowledged as a sibling utility file.)

## Components

### `imageProcessor.ts`

**Interfaces:**
- `ProcessingOptions`: Defines parameters for image processing, including `textThreshold`, `maskExpand`, `blockColor`, and `blockOpacity`.
- `Preset`: Represents a saved set of `ProcessingOptions` with an `id`, `name`, and `description`.

**Constants:**
- `defaultProcessingOptions`: Default values for `ProcessingOptions`.
- `defaultPresets`: An array of predefined `Preset` objects for common highlighting effects (e.g., yellow, green, pink, blue).
- `presets`: Alias for `defaultPresets` for backward compatibility.
- `USER_PRESETS_KEY`: Key used for storing user presets in `localStorage`.
- `MAX_PRESETS`: Maximum number of user-defined presets allowed.

**Core Functions:**

**Preset Management:**
- `loadUserPresets()`: Loads user-defined presets from `localStorage` or returns `defaultPresets` if none are found.
- `saveUserPresets(presets: Preset[])`: Saves a given array of presets to `localStorage`, truncating to `MAX_PRESETS`.
- `addUserPreset(name: string, options: ProcessingOptions, existing: Preset[])`: Adds a new user preset if the `MAX_PRESETS` limit is not reached.
- `removeUserPreset(id: string, existing: Preset[])`: Removes a preset by its `id`.
- `updateUserPreset(id: string, options: ProcessingOptions, existing: Preset[])`: Updates the `options` of an existing preset by `id`.
- `resetToDefaultPresets()`: Resets user presets to the `defaultPresets`.

**Image Utility Functions:**
- `parseColor(color: string)`: Converts CSS hex color strings (`#RGB`, `#RRGGBB`) to an RGB object.
- `getLuminance(r: number, g: number, b: number)`: Calculates the luminance of an RGB color.
- `extractTextMask(imageData: ImageData, textThreshold: number, expandRadius: number)`: Identifies text regions in an image based on luminance thresholding and expands the mask by a given radius.
- `applyColorBlock(originalData: ImageData, annotatedData: ImageData, textMask: boolean[], blockColor: string, blockOpacity: number)`: Applies a color block overlay to non-text regions using a blurred annotated image, while preserving text regions from the original image.
- `generateMaskPreview(originalData: ImageData, textMask: boolean[])`: Generates a preview image showing the detected text mask (semi-transparent red over text).
- `loadImage(file: File)`: Loads an image from a `File` object into an `HTMLImageElement`.
- `getImageData(img: HTMLImageElement)`: Extracts `ImageData` from an `HTMLImageElement` using a canvas.
- `scaleImageData(source: ImageData, targetWidth: number, targetHeight: number)`: Scales `ImageData` to a target width and height.
- `imageDataToBlob(imageData: ImageData, type = 'image/png')`: Converts `ImageData` to a `Blob` (e.g., for saving/uploading).
- `imageDataToDataURL(imageData: ImageData)`: Converts `ImageData` to a Data URL (e.g., for direct image display in `<img>` tags).

**Main Processing Functions:**
- `processImagePair(originalFile: File, annotatedFile: File, options: ProcessingOptions)`: The primary function for processing an original and an annotated image. It loads them, scales the annotated image if necessary, extracts text masks, applies color blocks, and returns the result as a `Blob`.
- `generatePreview(originalFile: File, annotatedFile: File, options: ProcessingOptions)`: Generates multiple Data URLs for preview purposes: original, scaled annotated, annotation layer (mask preview), and the final processed result.

## Dependencies
- Browser APIs: `HTMLImageElement`, `HTMLCanvasElement`, `CanvasRenderingContext2D`, `ImageData`, `localStorage`, `URL.createObjectURL`, `File`, `Blob`.
- No external libraries are explicitly imported in `imageProcessor.ts`.

## Integration
The functions in `imageProcessor.ts` are designed to be integrated into a web-based application (e.g., using React, Vue, Angular) where image manipulation and user interface controls are available.

**Example Usage (Conceptual):**

```typescript
import {
  processImagePair,
  loadImage,
  getImageData,
  defaultProcessingOptions,
  loadUserPresets,
  addUserPreset,
  Preset
} from './imageProcessor';

// Assume originalFile and annotatedFile are obtained from user input (e.g., <input type="file">)

async function handleImageProcessing(originalFile: File, annotatedFile: File) {
  try {
    // Load options, potentially from user-selected preset or default
    const userPresets: Preset[] = loadUserPresets();
    const currentOptions = userPresets[0]?.options || defaultProcessingOptions;

    // Process the image pair
    const resultBlob = await processImagePair(originalFile, annotatedFile, currentOptions);

    // Do something with the result Blob, e.g., display it or trigger a download
    const imageUrl = URL.createObjectURL(resultBlob);
    console.log('Processed image URL:', imageUrl);

    // Example: Add a new custom preset
    const newPresets = addUserPreset('My Custom Highlight', {
      textThreshold: 180,
      maskExpand: 3,
      blockColor: '#FF00FF',
      blockOpacity: 0.4
    }, userPresets);
    console.log('Updated presets:', newPresets);

  } catch (error) {
    console.error('Error processing images:', error);
  }
}

// To generate previews
async function handlePreviewGeneration(originalFile: File, annotatedFile: File) {
  const previews = await generatePreview(originalFile, annotatedFile);
  console.log('Original DataURL:', previews.original);
  console.log('Annotation Layer DataURL:', previews.annotationLayer);
  console.log('Result DataURL:', previews.result);
}
```

## Implementation
The image processing workflow in `imageProcessor.ts` follows these main steps:

1.  **Image Loading:** `loadImage` asynchronously loads `File` objects into `HTMLImageElement`s. `getImageData` then converts these into `ImageData` objects, which are raw pixel arrays suitable for direct manipulation.
2.  **Image Scaling:** Before processing, `processImagePair` ensures that both the original and annotated images have the same dimensions. If not, the `annotatedData` is scaled to match the `originalData` using `scaleImageData` to avoid alignment issues during pixel-level operations.
3.  **Text Mask Extraction:**
    *   `extractTextMask` first iterates through the `originalData` pixels. For each pixel, it calculates its luminance using `getLuminance`.
    *   Pixels with luminance below a specified `textThreshold` are marked as potential text.
    *   To ensure full text coverage, a second pass performs a circular expansion (`maskExpand`) around the detected text pixels, effectively "dilating" the mask.
4.  **Color Block Application:**
    *   `applyColorBlock` takes the `originalData`, the (potentially scaled) `annotatedData`, and the `textMask`.
    *   For each pixel, it checks the `textMask`:
        *   If the pixel is part of the `textMask` (a text region), the corresponding pixel from the `originalData` is used directly in the output, preserving clarity.
        *   If the pixel is *not* part of the `textMask` (a non-text region), a blend operation occurs. The pixel from the `annotatedData` (which is typically a blurred version) is blended with the `blockColor` using the `blockOpacity`. This creates the semi-transparent color block effect on non-text areas.
5.  **Output Generation:** The final `ImageData` is converted into a `Blob` (for file operations) or a Data URL (for immediate display) using `imageDataToBlob` and `imageDataToDataURL` respectively, leveraging a temporary `canvas` element.

Preset management utilizes `localStorage` for persistence, allowing users to save and recall their preferred processing settings. A `MAX_PRESETS` limit is enforced to prevent excessive storage usage.